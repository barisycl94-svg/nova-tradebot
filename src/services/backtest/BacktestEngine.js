/**
 * BacktestEngine.js
 * Kripto Backtest Motoru (Argus 13_backtest.md'den uyarlandı)
 * 
 * Geçmiş verilerde strateji test eder
 */

import { OrionEngine } from '../engines/OrionEngine.js';
import { tradingConfig } from '../../config/TradingConfig.js';

export class BacktestEngine {

    /**
     * Backtest çalıştır
     * @param {Object} config - { symbol, strategy, initialCapital, candles }
     * @returns {Object} BacktestResult
     */
    static async runBacktest(config) {
        const {
            symbol,
            strategy = 'ORION',
            initialCapital = 1000,
            candles,
            slPercent = 5,
            tpPercent = 15,
            positionSizePercent = 100
        } = config;

        if (!candles || candles.length < 60) {
            return { error: 'Yetersiz veri (min 60 mum gerekli)', trades: [] };
        }

        const sorted = [...candles].sort((a, b) => new Date(a.time) - new Date(b.time));

        let capital = initialCapital;
        let position = null; // { entryPrice, shares, entryIndex }
        const trades = [];
        const equityCurve = [];
        let peakCapital = capital;
        let maxDrawdown = 0;

        // Analiz için yeterli geçmiş olması lazım
        const startIndex = 50;

        for (let i = startIndex; i < sorted.length; i++) {
            const currentCandle = sorted[i];
            const currentPrice = currentCandle.close;
            const historicalSlice = sorted.slice(0, i + 1);

            // Mevcut equity hesapla
            const equity = capital + (position ? position.shares * currentPrice : 0);
            equityCurve.push({
                time: currentCandle.time,
                equity,
                price: currentPrice
            });

            // Max drawdown takibi
            if (equity > peakCapital) peakCapital = equity;
            const drawdown = ((peakCapital - equity) / peakCapital) * 100;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;

            // Pozisyon varsa SL/TP kontrolü
            if (position) {
                const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

                // Stop Loss
                if (pnlPercent <= -slPercent) {
                    const proceeds = position.shares * currentPrice;
                    const pnl = proceeds - (position.shares * position.entryPrice);

                    trades.push({
                        type: 'SELL',
                        reason: `Stop Loss (${pnlPercent.toFixed(2)}%)`,
                        entryPrice: position.entryPrice,
                        exitPrice: currentPrice,
                        entryTime: sorted[position.entryIndex].time,
                        exitTime: currentCandle.time,
                        shares: position.shares,
                        pnl,
                        pnlPercent
                    });

                    capital += proceeds;
                    position = null;
                    continue;
                }

                // Take Profit
                if (pnlPercent >= tpPercent) {
                    const proceeds = position.shares * currentPrice;
                    const pnl = proceeds - (position.shares * position.entryPrice);

                    trades.push({
                        type: 'SELL',
                        reason: `Take Profit (+${pnlPercent.toFixed(2)}%)`,
                        entryPrice: position.entryPrice,
                        exitPrice: currentPrice,
                        entryTime: sorted[position.entryIndex].time,
                        exitTime: currentCandle.time,
                        shares: position.shares,
                        pnl,
                        pnlPercent
                    });

                    capital += proceeds;
                    position = null;
                    continue;
                }
            }

            // Sinyal üret
            const signal = await this.evaluateStrategy(strategy, historicalSlice);

            // Alım sinyali ve pozisyon yoksa
            if (signal.action === 'BUY' && !position && capital > 0) {
                const positionValue = capital * (positionSizePercent / 100);
                const shares = positionValue / currentPrice;

                position = {
                    entryPrice: currentPrice,
                    shares,
                    entryIndex: i
                };

                capital -= positionValue;

                trades.push({
                    type: 'BUY',
                    reason: signal.reason,
                    entryPrice: currentPrice,
                    entryTime: currentCandle.time,
                    shares,
                    score: signal.score
                });
            }

            // Satım sinyali ve pozisyon varsa
            if (signal.action === 'SELL' && position) {
                const proceeds = position.shares * currentPrice;
                const pnl = proceeds - (position.shares * position.entryPrice);
                const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

                trades.push({
                    type: 'SELL',
                    reason: signal.reason,
                    entryPrice: position.entryPrice,
                    exitPrice: currentPrice,
                    entryTime: sorted[position.entryIndex].time,
                    exitTime: currentCandle.time,
                    shares: position.shares,
                    pnl,
                    pnlPercent
                });

                capital += proceeds;
                position = null;
            }
        }

        // Açık pozisyonu kapat
        if (position) {
            const lastPrice = sorted[sorted.length - 1].close;
            const proceeds = position.shares * lastPrice;
            const pnl = proceeds - (position.shares * position.entryPrice);
            const pnlPercent = ((lastPrice - position.entryPrice) / position.entryPrice) * 100;

            trades.push({
                type: 'SELL',
                reason: 'Test Sonu',
                entryPrice: position.entryPrice,
                exitPrice: lastPrice,
                entryTime: sorted[position.entryIndex].time,
                exitTime: sorted[sorted.length - 1].time,
                shares: position.shares,
                pnl,
                pnlPercent
            });

            capital += proceeds;
        }

        // Metrikler
        const completedTrades = trades.filter(t => t.type === 'SELL' && t.pnl !== undefined);
        const winningTrades = completedTrades.filter(t => t.pnl > 0);
        const losingTrades = completedTrades.filter(t => t.pnl <= 0);

        const totalPnL = completedTrades.reduce((sum, t) => sum + t.pnl, 0);
        const winRate = completedTrades.length > 0
            ? (winningTrades.length / completedTrades.length) * 100
            : 0;

        const avgWin = winningTrades.length > 0
            ? winningTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / winningTrades.length
            : 0;

        const avgLoss = losingTrades.length > 0
            ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / losingTrades.length)
            : 0;

        const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

        // Sharpe Ratio (basitleştirilmiş)
        const returns = equityCurve.slice(1).map((e, i) =>
            (e.equity - equityCurve[i].equity) / equityCurve[i].equity
        );
        const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const stdDev = Math.sqrt(
            returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / Math.max(1, returns.length)
        );
        const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365) : 0;

        return {
            symbol,
            strategy,
            initialCapital,
            finalCapital: capital,
            totalReturn: ((capital - initialCapital) / initialCapital) * 100,
            totalPnL,
            trades,
            tradeCount: completedTrades.length,
            winRate,
            avgWin,
            avgLoss,
            profitFactor,
            maxDrawdown,
            sharpeRatio: sharpeRatio.toFixed(2),
            equityCurve,
            startDate: sorted[startIndex]?.time,
            endDate: sorted[sorted.length - 1]?.time
        };
    }

    /**
     * Strateji değerlendirme
     */
    static async evaluateStrategy(strategy, candles) {
        switch (strategy) {
            case 'ORION':
                return this.evaluateOrion(candles);
            case 'SMA_CROSS':
                return this.evaluateSMACross(candles);
            case 'RSI':
                return this.evaluateRSI(candles);
            default:
                return { action: 'HOLD', reason: 'Bilinmeyen strateji' };
        }
    }

    static async evaluateOrion(candles) {
        try {
            const result = await OrionEngine.analyze(candles);

            if (result.score >= 65) {
                return { action: 'BUY', reason: `Orion Skoru: ${result.score.toFixed(0)}`, score: result.score };
            } else if (result.score <= 35) {
                return { action: 'SELL', reason: `Orion Düşük: ${result.score.toFixed(0)}`, score: result.score };
            }
            return { action: 'HOLD', reason: 'Orion Nötr', score: result.score };
        } catch (e) {
            return { action: 'HOLD', reason: 'Orion Hatası' };
        }
    }

    static evaluateSMACross(candles) {
        if (candles.length < 50) return { action: 'HOLD', reason: 'Yetersiz veri' };

        const closes = candles.map(c => c.close);
        const sma20 = this.sma(closes, 20);
        const sma50 = this.sma(closes, 50);

        if (sma20 > sma50 * 1.01) {
            return { action: 'BUY', reason: 'SMA20 > SMA50 (Golden Cross)' };
        } else if (sma20 < sma50 * 0.99) {
            return { action: 'SELL', reason: 'SMA20 < SMA50 (Death Cross)' };
        }
        return { action: 'HOLD', reason: 'SMA Yakın' };
    }

    static evaluateRSI(candles) {
        if (candles.length < 20) return { action: 'HOLD', reason: 'Yetersiz veri' };

        const rsi = this.calculateRSI(candles.map(c => c.close), 14);

        if (rsi < 30) {
            return { action: 'BUY', reason: `RSI Aşırı Satım (${rsi.toFixed(0)})` };
        } else if (rsi > 70) {
            return { action: 'SELL', reason: `RSI Aşırı Alım (${rsi.toFixed(0)})` };
        }
        return { action: 'HOLD', reason: `RSI Nötr (${rsi.toFixed(0)})` };
    }

    static sma(data, period) {
        if (data.length < period) return 0;
        const slice = data.slice(-period);
        return slice.reduce((a, b) => a + b, 0) / period;
    }

    static calculateRSI(closes, period = 14) {
        if (closes.length < period + 1) return 50;

        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            const change = closes[closes.length - i] - closes[closes.length - i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
}
