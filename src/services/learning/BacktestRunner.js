/**
 * BacktestRunner.js
 * Nova TradeBot - Arka Plan Backtest Servisi
 * 
 * Bu servis:
 * 1. Arka planda sürekli çalışır
 * 2. Her saat başı yeni backtest yapar
 * 3. Algoritmaların performansını ölçer
 * 4. Sonuçları LearningEngine'e iletir
 */

import { learningEngine } from './LearningEngine.js';
import { realMarketDataService } from '../RealMarketDataProvider.js';
import { NovaDecisionEngine } from '../NovaDecisionEngine.js';
import { AssetType } from '../../models/Models.js';

class BacktestRunner {
    constructor() {
        this.isRunning = false;
        this.lastBacktestTime = this._loadLastBacktestTime();
        this.backtestInterval = null;
        this.BACKTEST_INTERVAL_MS = 60 * 60 * 1000; // 1 saat
        this.MIN_SYMBOLS_FOR_BACKTEST = 20;

        console.log('🔬 BacktestRunner hazır');
    }

    /**
     * Arka plan backtesting'i başlat
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ BacktestRunner zaten çalışıyor');
            return;
        }

        this.isRunning = true;
        console.log('🚀 BacktestRunner başlatıldı');

        // Eğer hiç backtest yapılmadıysa veya 1 saatten fazla olduysa, hemen başlat
        const timeSinceLastBacktest = Date.now() - (this.lastBacktestTime || 0);
        if (timeSinceLastBacktest > this.BACKTEST_INTERVAL_MS) {
            console.log('⏰ Son backtest eski, yeni backtest başlatılıyor...');
            setTimeout(() => this._runBacktest(), 10000); // 10 saniye sonra başla
        }

        // Periyodik backtest
        this.backtestInterval = setInterval(() => {
            this._runBacktest();
        }, this.BACKTEST_INTERVAL_MS);
    }

    /**
     * Arka plan backtesting'i durdur
     */
    stop() {
        if (this.backtestInterval) {
            clearInterval(this.backtestInterval);
            this.backtestInterval = null;
        }
        this.isRunning = false;
        console.log('⏹️ BacktestRunner durduruldu');
    }

    /**
     * Manuel backtest tetikle
     */
    async triggerManualBacktest() {
        return this._runBacktest();
    }

    async _runBacktest() {
        if (learningEngine.isBacktesting) {
            console.log('⚠️ Backtest zaten devam ediyor');
            return null;
        }

        console.log('🔬 Backtest başlatılıyor...');

        try {
            // Sembol listesini al
            const symbols = await this._getSymbolsForBacktest();
            if (symbols.length < this.MIN_SYMBOLS_FOR_BACKTEST) {
                console.log(`⚠️ Yetersiz sembol (${symbols.length}), backtest iptal`);
                return null;
            }

            // Backtest yap
            const results = await learningEngine.startBacktest(
                (symbol, period, limit) => realMarketDataService.getCandles(symbol, period, limit),
                symbols,
                (symbol, candles) => NovaDecisionEngine.makeDecision(symbol, { '1d': candles, '4h': candles, '1h': candles }, AssetType.CRYPTO, true)
            );

            // Zamanı kaydet
            this.lastBacktestTime = Date.now();
            this._saveLastBacktestTime();

            console.log('✅ Backtest tamamlandı');
            console.log(`📊 Test edilen sembol: ${results.symbolsTested}`);
            console.log(`📈 Başarı oranı: ${(results.successRate * 100).toFixed(1)}%`);
            console.log(`💰 Ortalama kâr: ${results.avgProfitPerTrade.toFixed(2)}%`);

            return results;

        } catch (error) {
            console.error('Backtest hatası:', error);
            return null;
        }
    }

    async _getSymbolsForBacktest() {
        if (realMarketDataService.isBlocked) return [];

        // Binance API doğrudan kullanılıyor
        const BINANCE_API = 'https://api.binance.com/api/v3';

        try {
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));

            // Binance'den en yüksek hacimli coinleri al
            const response = await fetch(`${BINANCE_API}/ticker/24hr`);
            if (!response.ok) {
                throw new Error('Binance API hatası');
            }

            const data = await response.json();

            // Harici tutulacak takılar ve coinler
            const EXCLUDED_COINS = [
                'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'GUSD', 'FRAX', 'LUSD', 'USDD', 'FDUSD', 'BFUSD', 'XUSD', 'AEUR', 'USDE', 'PYUSD', 'EUR',
                'PAXG', 'WBTC', 'BTCB', 'USTC', 'UST', 'WETH'
            ];
            const LEVERAGED_SUFFIXES = ['UP', 'DOWN', 'BULL', 'BEAR'];

            // USDT çiftlerini filtrele ve hacme göre sırala
            const symbols = data
                .filter(t => t.symbol.endsWith('USDT'))
                .filter(t => {
                    const baseCoin = t.symbol.replace('USDT', '');
                    // Stablecoin kontrolü (Tam eşleşme)
                    if (EXCLUDED_COINS.includes(baseCoin)) return false;
                    // Kaldıraçlı token kontrolü
                    if (LEVERAGED_SUFFIXES.some(suffix => baseCoin.endsWith(suffix))) return false;

                    return true;
                })
                .filter(t => parseFloat(t.quoteVolume) > 500000) // $500K+ hacim
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, 100) // En yüksek 100
                .map(t => t.symbol);

            return symbols;

        } catch (error) {
            console.error('Sembol listesi alınamadı:', error);
            // Fallback
            return [
                'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
                'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
                'LTCUSDT', 'MATICUSDT', 'UNIUSDT', 'ATOMUSDT', 'APTUSDT',
                'NEARUSDT', 'FILUSDT', 'ARBUSDT', 'OPUSDT', 'INJUSDT'
            ];
        }
    }

    _loadLastBacktestTime() {
        try {
            const saved = localStorage.getItem('novaTradeBot_lastBacktest');
            return saved ? parseInt(saved, 10) : 0;
        } catch {
            return 0;
        }
    }

    _saveLastBacktestTime() {
        try {
            localStorage.setItem('novaTradeBot_lastBacktest', this.lastBacktestTime.toString());
        } catch (error) {
            console.error('Last backtest time kaydedilemedi:', error);
        }
    }

    /**
     * Backtest durumunu al
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isBacktesting: learningEngine.isBacktesting,
            backtestProgress: learningEngine.backtestProgress,
            lastBacktestTime: this.lastBacktestTime,
            nextBacktestTime: this.lastBacktestTime + this.BACKTEST_INTERVAL_MS
        };
    }
}

// Singleton export
export const backtestRunner = new BacktestRunner();
