/**
 * MasterIndicatorAnalyzer.js
 * Nova TradeBot - Gruplandırılmış Uzman Analiz Sistemi (V3)
 */

import * as Lib1 from './IndicatorLibrary.js';
import * as Lib2 from './IndicatorLibrary2.js';
import * as Lib3 from './IndicatorLibrary3.js';
import * as Lib4 from './IndicatorLibrary4.js';
import * as Patterns from './PatternRecognition.js';

export class MasterIndicatorAnalyzer {

    static analyze(candles, learnedStats = {}) {
        if (!candles || candles.length < 50) {
            return { score: 50, signals: [], confidence: 0, details: [], totalIndicators: 0, bullishSignals: 0, bearishSignals: 0, neutralSignals: 0 };
        }

        try {
            const analysisData = candles.slice(-300);
            const closes = analysisData.map(c => c.close);
            const highs = analysisData.map(c => c.high);
            const lows = analysisData.map(c => c.low);
            const volumes = analysisData.map(c => c.volume || 1);
            const curPrice = closes[closes.length - 1];

            const groups = {
                trend: { weightedSum: 0, totalWeight: 0, score: 50, baseWeight: 0.25 },
                momentum: { weightedSum: 0, totalWeight: 0, score: 50, baseWeight: 0.35 },
                volatility: { weightedSum: 0, totalWeight: 0, score: 50, baseWeight: 0.15 },
                volume: { weightedSum: 0, totalWeight: 0, score: 50, baseWeight: 0.25 }
            };

            const allSignals = [];

            // TREND - MA'lar
            [10, 20, 50, 100, 200].forEach(p => {
                try {
                    const sma = Lib1.SMA(closes, p);
                    if (sma && sma.length > 0) {
                        const v = curPrice > sma[sma.length - 1] ? 1 : -1;
                        this._addSignal(groups.trend, `SMA-${p}`, v, 0.5, allSignals);
                    }
                    const ema = Lib1.EMA(closes, p);
                    if (ema && ema.length > 0) {
                        const v = curPrice > ema[ema.length - 1] ? 1 : -1;
                        this._addSignal(groups.trend, `EMA-${p}`, v, 0.5, allSignals);
                    }
                } catch (e) { }
            });

            // MOMENTUM - RSI, MACD, Stoch
            try {
                const rsi = Lib1.RSI(closes, 14);
                if (rsi && rsi.length > 0) {
                    const r = rsi[rsi.length - 1];
                    const v = r < 30 ? 1 : r > 70 ? -1 : 0;
                    this._addSignal(groups.momentum, 'RSI-14', v, 1.5, allSignals);
                }
            } catch (e) { }

            try {
                const macd = Lib1.MACD(closes);
                if (macd && macd.histogram) {
                    const h = macd.histogram[macd.histogram.length - 1];
                    this._addSignal(groups.momentum, 'MACD', h > 0 ? 1 : -1, 1.5, allSignals);
                }
            } catch (e) { }

            try {
                const stoch = Lib1.Stochastic(highs, lows, closes);
                if (stoch && stoch.k) {
                    const k = stoch.k[stoch.k.length - 1];
                    const v = k < 20 ? 1 : k > 80 ? -1 : 0;
                    this._addSignal(groups.momentum, 'Stoch', v, 1.2, allSignals);
                }
            } catch (e) { }

            try {
                const cci = Lib1.CCI(highs, lows, closes, 20);
                if (cci && cci.length > 0) {
                    const c = cci[cci.length - 1];
                    const v = c < -100 ? 1 : c > 100 ? -1 : 0;
                    this._addSignal(groups.momentum, 'CCI', v, 1.0, allSignals);
                }
            } catch (e) { }

            // VOLATILITY - Bollinger
            try {
                const bb = Lib2.BollingerBands(closes, 20, 2);
                if (bb && bb.lower) {
                    const v = curPrice < bb.lower[bb.lower.length - 1] ? 1 : curPrice > bb.upper[bb.upper.length - 1] ? -1 : 0;
                    this._addSignal(groups.volatility, 'BBands', v, 1.5, allSignals);
                }
            } catch (e) { }

            // VOLUME - MFI, OBV
            try {
                const mfi = Lib1.MFI(highs, lows, closes, volumes, 14);
                if (mfi && mfi.length > 0) {
                    const m = mfi[mfi.length - 1];
                    const v = m < 20 ? 1 : m > 80 ? -1 : 0;
                    this._addSignal(groups.volume, 'MFI', v, 1.5, allSignals);
                }
            } catch (e) { }

            // Final score
            let totalScore = 0, totalWeight = 0;
            Object.values(groups).forEach(g => {
                if (g.totalWeight > 0) {
                    g.score = 50 + (g.weightedSum / g.totalWeight) * 50;
                    totalScore += g.score * g.baseWeight;
                    totalWeight += g.baseWeight;
                }
            });

            const finalScore = totalWeight > 0 ? totalScore / totalWeight : 50;
            const bullish = allSignals.filter(s => s.value > 0).length;
            const bearish = allSignals.filter(s => s.value < 0).length;

            return {
                score: Math.round(finalScore),
                signals: allSignals,
                confidence: allSignals.length > 0 ? Math.round((allSignals.filter(s => s.value !== 0).length / allSignals.length) * 100) : 0,
                bullishSignals: bullish,
                bearishSignals: bearish,
                neutralSignals: allSignals.length - bullish - bearish,
                totalIndicators: allSignals.length
            };
        } catch (e) {
            console.error('MasterIndicatorAnalyzer hata:', e);
            return { score: 50, signals: [], confidence: 0, details: [], totalIndicators: 0, bullishSignals: 0, bearishSignals: 0, neutralSignals: 0 };
        }
    }

    static _addSignal(group, name, value, weight, allSignals) {
        group.weightedSum += value * weight;
        group.totalWeight += weight;
        allSignals.push({ name, value, weight });
    }
}

export default MasterIndicatorAnalyzer;
