
/**
 * TradingViewModel.js
 * Nova TradeBot - Kalıcı Veri + Tam Otomatik Trading
 * 
 * Veriler localStorage'da saklanır, sayfa yenilense de kaybolmaz
 */

import { realMarketDataService } from '../services/RealMarketDataProvider.js';
import { NovaDecisionEngine } from '../services/NovaDecisionEngine.js';
import { ChironRiskManager, AuditStatus } from '../services/risk/ChironRiskManager.js';
import { Trade, TradeSource, SignalAction, AssetType } from '../models/Models.js';

// 🧠 Öğrenme Sistemi - Lazy import to avoid circular dependency
let learningEngine = null;
let backtestRunner = null;

const getLearningEngine = async () => {
    if (!learningEngine) {
        const module = await import('../services/learning/LearningEngine.js');
        learningEngine = module.learningEngine;
    }
    return learningEngine;
};

const getBacktestRunner = async () => {
    if (!backtestRunner) {
        const module = await import('../services/learning/BacktestRunner.js');
        backtestRunner = module.backtestRunner;
    }
    return backtestRunner;
};

// Browser-safe UUID generation
const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

import { tradingConfig } from '../config/TradingConfig.js';
import Indicators2 from '../services/indicators/IndicatorLibrary2.js';
import { telegramService } from '../services/TelegramService.js';
import { notificationService } from '../services/NotificationService.js';
import { persistence } from '../services/PersistenceService.js';

// ⏰ Zamanlama Motoru (Argus Cronos)
import { CronosEngine } from '../services/timing/CronosEngine.js';

// 🔥 Phoenix Channel Analizi (Argus Phoenix)
import { PhoenixChannelAnalysis } from '../services/phoenix/PhoenixChannelAnalysis.js';


const STORAGE_KEY = 'novaTradeBot_state_v2_1000';

class TradingViewModel {
    constructor() {
        // LocalStorage'dan yükle veya varsayılanları kullan
        const savedState = this._loadState();

        // ESKİ VERİYİ TEMİZLE (Hafıza açmak için)
        try { persistence.removeItem('novaTradeBot_state'); } catch (e) { }

        this.portfolio = savedState.portfolio || [];
        this.balance = savedState.balance ?? 1000.0;
        this.logs = savedState.logs || [];
        this.totalPnLRealized = savedState.totalPnLRealized || 0;

        // Watchlist dinamik olarak Binance'den yüklenecek
        this.watchlist = [];
        this.scanResults = []; // Canlı tarama sonuçları (Matrix View için)
        this.isAutoPilotActive = savedState.isAutoPilotActive || false;
        this.timer = null;
        this.scanIndex = 0; // Tarama indeksi

        // Ayarlar
        this.settings = this._loadSettings();
        this.scanIntervalMs = this.settings.scanIntervalSeconds * 1000;
        this.listeners = [];

        console.log('🚀 TradingViewModel başlatıldı');
        console.log(`📊 Yüklenen portföy: ${this.portfolio.length} pozisyon`);
        console.log(`💰 Bakiye: $${this.balance.toFixed(2)}`);

        // Gerçek veri servisi ve kripto listesi başlat
        this._initializeSystem();
    }

    async _initializeSystem() {
        console.log('⏳ Sistem başlatılıyor...');
        this.wakeLock = null;

        await realMarketDataService.requestExchangeInfo();
        const symbols = await this._loadAllCryptos();

        // 🔋 Anti-Sleep: Otopilot başladığında uykuyu engelle
        this.requestWakeLock();

        // WebSocket'i başlat
        realMarketDataService.startStreaming(symbols, (updates) => {
            this._handleMarketUpdates(updates);
        });

        // Otopilotu durumu hatırla ve gerekirse başlat (3 saniye sonra)
        setTimeout(() => {
            if (this.isAutoPilotActive) {
                console.log('🤖 Otopilot hatırlanan durum uyarınca başlatılıyor...');
                this.isAutoPilotActive = false; // toggleAutoPilot tersine çevireceği için
                this.toggleAutoPilot();
            } else {
                console.log('🤖 Otopilot beklendiği gibi kapalı başlatıldı.');
            }
        }, 3000);

        // 🧠 Arka plan backtest servisini şimdilik devre dışı (circular dependency fix pending)
        // TODO: LearningEngine'i NovaDecisionEngine'den ayırdıktan sonra tekrar aktif et
        setTimeout(async () => {
            console.log('🧠 Öğrenme sistemi: Backtest geçici olarak devre dışı.');
            // const runner = await getBacktestRunner();
            // if (runner) runner.start();
        }, 5000);
    }

    /**
     * Binance'den hacmi $100K+ olan tüm coinleri watchlist'e ekle
     * Semboller Binance formatında: BTCUSDT, ETHUSDT vb.
     */
    async _loadAllCryptos() {
        const MIN_VOLUME = 100000; // $100K minimum hacim
        const EXCLUDED_COINS = [
            'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'GUSD', 'FRAX', 'LUSD', 'USDD', 'FDUSD', 'BFUSD', 'XUSD', 'AEUR', 'USDE', 'PYUSD',
            'EUR', 'GBP', 'AUD', 'TRY', 'BRL', 'RUB', 'UAH', 'BIDR', 'IDRT', 'NGN', 'ZAR', 'PLN', 'RON', 'ARS',
            'PAXG', 'WBTC', 'BTCB', 'USTC', 'UST', 'WETH'
        ];
        const LEVERAGED_SUFFIXES = ['UP', 'DOWN', 'BULL', 'BEAR', '2L', '3L', '2S', '3S', '4L', '5L', '4S', '5S'];

        try {
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

            // 1. Önce Binance Spot'ta TRADING olan çiftleri al
            const exchangeInfo = await realMarketDataService._fetchBinance('/exchangeInfo');
            let activeSpotSymbols = new Set();

            if (exchangeInfo && exchangeInfo.symbols) {
                exchangeInfo.symbols
                    .filter(s => s.status === 'TRADING' && s.quoteAsset === 'USDT' && s.isSpotTradingAllowed)
                    .forEach(s => activeSpotSymbols.add(s.symbol));
            }

            await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));

            // 2. 24hr hacim verilerini al
            const data = await realMarketDataService._fetchBinance('/ticker/24hr');

            if (data && Array.isArray(data)) {
                // USDT çiftlerini filtrele, aktif spot olanları al
                this.watchlist = data
                    .filter(t => {
                        if (!t.symbol.endsWith('USDT')) return false;

                        // Aktif spot çifti mi kontrol et
                        if (activeSpotSymbols.size > 0 && !activeSpotSymbols.has(t.symbol)) {
                            return false; // Spot'ta aktif değilse alma
                        }

                        const baseCoin = t.symbol.replace('USDT', '');

                        // Stablecoin/Fiat kontrolü (Tam eşleşme)
                        if (EXCLUDED_COINS.includes(baseCoin)) return false;

                        // Kaldıraçlı token kontrolü (Suffix)
                        if (LEVERAGED_SUFFIXES.some(suffix => baseCoin.endsWith(suffix))) return false;

                        const volume = parseFloat(t.quoteVolume) || 0;
                        return volume >= MIN_VOLUME;
                    })
                    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                    .map(t => t.symbol); // BTCUSDT formatında bırak

                console.log(`📊 ${this.watchlist.length} aktif spot coin yüklendi`);
                this.addLog('Sistem', `📊 ${this.watchlist.length} aktif spot coin hazır`);
                this._notify();
            }
        } catch (error) {
            console.error('Kripto listesi yüklenemedi, fallback devreye giriyor:', error.message);

            // FALLBACK LİSTESİ (En Likit 20 Coin)
            this.watchlist = [
                'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
                'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'TRXUSDT', 'DOTUSDT',
                'LINKUSDT', 'MATICUSDT', 'LTCUSDT', 'SHIBUSDT', 'BCHUSDT',
                'ATOMUSDT', 'UNIUSDT', 'ARBUSDT', 'NEARUSDT', 'OPUSDT'
            ];
            this.addLog('Sistem', `⚠️ API Hatası: Güvenli Mod Devrede (${this.watchlist.length} coin)`);
        }

    }

    _loadState() {
        try {
            const saved = persistence.getItem(STORAGE_KEY);
            if (saved) {
                const state = typeof saved === 'string' ? JSON.parse(saved) : saved;
                console.log('📂 Persistence state yüklendi:', state);

                // Trade objelerini manuel olarak yeniden oluştur
                if (state.portfolio && Array.isArray(state.portfolio)) {
                    state.portfolio = state.portfolio.map(t => {
                        // Tüm özellikleri kopyala
                        const trade = {
                            id: t.id || generateUUID(),
                            symbol: t.symbol,
                            entryPrice: t.entryPrice,
                            quantity: t.quantity,
                            date: new Date(t.date),
                            isOpen: t.isOpen !== false, // varsayılan true
                            source: t.source,
                            rationale: t.rationale,
                            decisionContext: t.decisionContext || {},
                            stopLossPercent: t.stopLossPercent,
                            takeProfitPercent: t.takeProfitPercent,
                            highestPnL: t.highestPnL || 0,
                            exitPrice: t.exitPrice,
                            exitDate: t.exitDate ? new Date(t.exitDate) : null,
                            exitReason: t.exitReason
                        };
                        return trade;
                    });
                }
                return state;
            }
        } catch (error) {
            console.error('State yüklenemedi:', error);
        }
        return {};
    }

    async _saveState() {
        try {
            // Helper: İşlem verilerini küçült (storage limitini aşmamak için)
            const sanitizeTrade = (t, isClosed = false) => {
                // Temel kopyayı al
                const trade = { ...t };

                // Kapalı işlemlerden decisionContext'i tamamen kaldır (daha agresif)
                if (isClosed) {
                    const { decisionContext, ...rest } = trade;
                    return rest;
                }

                // Açık işlemlerden sadece ağır 'traces' dizisini kaldır, özeti tut
                if (trade.decisionContext) {
                    const { traces, ...ctxRest } = trade.decisionContext;
                    trade.decisionContext = ctxRest;
                }
                return trade;
            };

            const activeTrades = this.portfolio.filter(t => t.isOpen).map(t => sanitizeTrade(t, false));
            let closedTrades = this.portfolio.filter(t => !t.isOpen);

            // Sadece son 50 kapalı işlemi tut
            if (closedTrades.length > 50) {
                closedTrades = closedTrades.slice(-50);
            }

            // Kapalı işlemleri sanitize et
            const optimizedClosedTrades = closedTrades.map(t => sanitizeTrade(t, true));

            const stateToSave = {
                portfolio: [...activeTrades, ...optimizedClosedTrades],
                balance: this.balance,
                logs: this.logs.slice(0, 50), // Limit logs to 50 items
                totalPnLRealized: this.totalPnLRealized,
                isAutoPilotActive: this.isAutoPilotActive
            };

            persistence.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
            console.error('State kaydedilemedi:', error);
            if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                this.addLog('Sistem', '⚠️ Tarayıcı hafızası doldu! Acil temizlik yapılıyor...');
                this.logs = []; // Logları sil

                try {
                    // Acil durum: Sadece açık işlemleri ve bakiyeyi (traces olmadan) sakla
                    // sanitizeTrade fonksiyonunu tekrar tanımlamamak için inline yapıyoruz veya yukarıdakini kullanıyoruz (scope?)
                    // Scope catch bloğunda erişilemez olabilir, tekrar yazalım basitçe
                    const emergencyActive = this.portfolio.filter(t => t.isOpen).map(t => {
                        const copy = { ...t };
                        if (copy.decisionContext) {
                            const { traces, ...rest } = copy.decisionContext;
                            copy.decisionContext = rest;
                        }
                        return copy;
                    });

                    const emergencyState = {
                        portfolio: emergencyActive, // Sadece açıklar
                        balance: this.balance,
                        logs: [],
                        totalPnLRealized: this.totalPnLRealized,
                        isAutoPilotActive: this.isAutoPilotActive
                    };
                    persistence.setItem(STORAGE_KEY, JSON.stringify(emergencyState));
                    console.log('✅ Acil durum kaydı başarılı (Traces temizlendi).');
                } catch (retryError) {
                    console.error('BÜYÜK HATA: Acil durum kaydı da başarısız!', retryError);
                    // Artık yapacak bir şey yok, kullanıcıya bildir
                    this.addLog('Sistem', '❌ KRİTİK: Veriler kaydedilemiyor! Sayfayı yenilemeden önce manuel yedek alın.');
                }
            }
        }
    }

    _loadSettings() {
        const defaults = {
            maxPositionPercent: 10,
            maxOpenTrades: 50, // 50 işlem limiti
            scanIntervalSeconds: 30,
        };
        try {
            const saved = persistence.getItem('novaTradeBot_settings');
            if (saved) {
                const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
                // Eski limitleri güncelle (zorla 50 yap)
                if (parsed.maxOpenTrades < 50) {
                    parsed.maxOpenTrades = 50;
                    persistence.setItem('novaTradeBot_settings', this.isNode ? parsed : JSON.stringify(parsed));
                    console.log('📊 İşlem limiti 50\'ye güncellendi');
                }
                return { ...defaults, ...parsed };
            }
            return defaults;
        } catch {
            return defaults;
        }
    }

    applySettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.scanIntervalMs = this.settings.scanIntervalSeconds * 1000;

        if (this.isAutoPilotActive && this.timer) {
            clearInterval(this.timer);
            this.timer = setInterval(() => this.scanMarket(), this.scanIntervalMs);
        }

        this.addLog('Sistem', 'Ayarlar güncellendi');
        this._notify();
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this._getState());
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    // ==================== ANTI-SLEEP (WAKE LOCK) ====================
    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('🔋 Wake Lock Aktif: Bilgisayar uykuya geçmeyecek.');
                this.wakeLock.addEventListener('release', () => {
                    console.log('🪫 Wake Lock Devre Dışı.');
                });
            } catch (err) {
                console.warn(`Wake Lock Hatası: ${err.name}, ${err.message}`);
            }
        }
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
        }
    }

    _notify() {
        const state = this._getState();
        this.listeners.forEach(cb => cb(state));
        this._saveState(); // Her değişiklikte kaydet
    }

    _getState() {
        return {
            portfolio: [...this.portfolio],
            watchlist: [...this.watchlist],
            balance: this.balance,
            logs: [...this.logs],
            isAutoPilotActive: this.isAutoPilotActive,
            settings: this.settings,
            totalPnLRealized: this.totalPnLRealized
        };
    }

    toggleAutoPilot() {
        this.isAutoPilotActive = !this.isAutoPilotActive;

        if (this.isAutoPilotActive) {
            this.addLog('Sistem', '🚀 Otopilot Başlatıldı - 24/7 Aktif');
            console.log('🚀 Otopilot aktif, tarama başlıyor...');

            // İlk taramayı hemen yap
            this.scanMarket();

            // Sonra periyodik tarama
            this.timer = setInterval(() => {
                console.log('⏰ Periyodik tarama tetiklendi');
                this.scanMarket();
            }, this.scanIntervalMs);
        } else {
            this.addLog('Sistem', '⏹️ Otopilot Durduruldu');
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }
        this._notify();
    }

    async scanMarket() {
        if (!this.isAutoPilotActive) return;

        // 🛡️ Watchdog: Tarama 5 dakikadan uzun sürerse kilidi zorla aç
        if (this.isScanning) {
            const now = Date.now();
            if (this.lastScanStartTime && (now - this.lastScanStartTime > 300000)) {
                console.warn('⚡ Tarama asılı kalmış görünüyor, kilit resetlendi.');
                this.isScanning = false;
            } else {
                console.warn('⚠️ Tarama zaten devam ediyor, atlanıyor.');
                return;
            }
        }

        this.isScanning = true;
        this.lastScanStartTime = Date.now();
        // console.log('🔍 Piyasa taraması başlatıldı...');

        // Önce açık pozisyonları kontrol et (SL/TP)
        await this._checkOpenPositions();

        // 🎯 Açık pozisyonların coinleri HER ZAMAN taransın
        const openSymbols = this.portfolio
            .filter(t => t.isOpen)
            .map(t => t.symbol);

        // Kalan coinlerden rastgele seç
        const remainingCoins = this.watchlist.filter(s => !openSymbols.includes(s));
        const shuffled = remainingCoins.sort(() => Math.random() - 0.5);

        try {
            // Sınırlama kaldırıldı: Tüm watchlist tara
            const toScan = [...new Set([...openSymbols, ...remainingCoins])];

            let scannedCount = 0;
            let signalCount = 0;

            console.log(`🚀 TÜM PİYASA ANALİZİ BAŞLADI: ${toScan.length} birim 250+ indikatörle taranıyor...`);

            // Verilerin oturması için kısa ısınma beklemesi
            await new Promise(r => setTimeout(r, 1000));
            console.log('⏳ Veri akışı bekleniyor...');

            // 🎯 ESKİ GÜVENİLİR TARAMA (Küçültülmüş Paketler - Bot Tespiti Koruması)
            const CHUNK_SIZE = 15; // Eskiden 5/8 idi, hızı %200 arttırdık
            for (let i = 0; i < toScan.length; i += CHUNK_SIZE) {
                if (realMarketDataService.isBlocked) break;

                const chunk = toScan.slice(i, i + CHUNK_SIZE);

                await Promise.all(chunk.map(async (symbol) => {
                    try {
                        const quote = realMarketDataService.getQuote(symbol);

                        // Veri yoksa logla ve geç
                        if (!quote || !quote.price) return;

                        // HIZLI TARAMA MODU: Sadece 1d ve 1h (API Yükünü %50 Azalt)
                        const [c1d, c1h] = await Promise.all([
                            realMarketDataService.getCandles(symbol, '1d', 120),
                            realMarketDataService.getCandles(symbol, '1h', 120)
                        ]);

                        if (!c1d || c1d.length < 20) return;

                        const multiCandles = { '15m': [], '1h': c1h, '4h': [], '1d': c1d };
                        const decisionResult = await NovaDecisionEngine.makeDecision(symbol, multiCandles, AssetType.CRYPTO);
                        scannedCount++;

                        if (decisionResult.finalDecision === SignalAction.BUY) {
                            signalCount++;
                            this._handleBuySignal(decisionResult, quote.price, c1d);
                        } else if (decisionResult.finalDecision === SignalAction.SELL) {
                            this._handleSellSignal(decisionResult, quote.price);
                        }

                        // MATRIX MODU
                        const signalIcon = decisionResult.finalDecision === SignalAction.BUY ? '🟢' :
                            decisionResult.finalDecision === SignalAction.SELL ? '🔴' : '⚪';

                        const finalScore = (decisionResult.totalScore !== undefined) ? decisionResult.totalScore : (decisionResult.score || 0);

                        const decisionText = typeof decisionResult.finalDecision === 'object'
                            ? (decisionResult.finalDecision.label || decisionResult.finalDecision.id)
                            : decisionResult.finalDecision;

                        // 🔍 Log ekle (Kullanıcının isteği üzerine geri getirildi)
                        console.log(`${signalIcon} [${symbol}] Puan: ${finalScore.toFixed(1)} | Karar: ${decisionText} | Fiyat: $${quote.price}`);

                        // Canlı Sonuç Listesine Ekle
                        this.scanResults.unshift({
                            symbol: symbol,
                            price: quote.price,
                            score: finalScore.toFixed(0),
                            decision: decisionText,
                            timestamp: Date.now()
                        });

                        if (this.scanResults.length > 200) this.scanResults.pop();

                    } catch (e) {
                        console.error(`❌ Analiz Hatası (${symbol}):`, e.message || e);
                    }
                }));

                // CHUNK ARASI BEKLEME (Bot tespiti ve UI akıcılığı için)
                await new Promise(r => setTimeout(r, 400));

                // CHUNK SONU: Veri aktığı için arayüzü her chunkta güncelle
                this._notify();

                // İlerleme yüzdesi
                const currentIdx = Math.min(toScan.length, i + CHUNK_SIZE);
                if (currentIdx % 10 === 0 || currentIdx === toScan.length) {
                    const progress = Math.min(100, Math.round((currentIdx / toScan.length) * 100));
                    this.addLog('Sistem', `⏳ Analiz: %${progress} tamamlandı`);
                }
            }

            console.log(`✅ TAM TARAMA BİTTİ | Analiz Edilen: ${scannedCount} | Sinyal: ${signalCount} `);
            this._notify();

        } finally {
            this.isScanning = false;
        }
    }

    async _checkOpenPositions() {
        const openTrades = this.portfolio.filter(t => t.isOpen);

        // 🎯 GÜNCEL MOD KONFİGÜRASYONU
        const config = tradingConfig.getModeConfig();

        for (const trade of openTrades) {
            const quote = realMarketDataService.getQuote(trade.symbol);
            if (!quote || !quote.price) continue;

            const currentPrice = quote.price;
            const pnlPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;

            // 🧠 DİNAMİK RİSK GÜNCELLEME (ATR-BASED)
            // Her 5 dakikada bir veya volatilite değiştiğinde SL/TP'yi güncelle
            try {
                const candles = await realMarketDataService.getCandles(trade.symbol, '1h', 30);
                if (candles && candles.length >= 20) {
                    const { stopLoss, takeProfit } = this._calculateDynamicSLTP(candles, currentPrice);

                    // Sadece daha güvenli seviyelere çek (Opsiyonel: Stratagize based on mode)
                    // Mevcut SL'den daha genişse veya trailing stop mantığına uygunsa güncelle
                    trade.stopLossPercent = stopLoss;
                    trade.takeProfitPercent = takeProfit;
                }
            } catch (e) {
                // Hata durumunda config'deki varsayılanı kullanmaya devam et
            }

            // 🛡️ DİNAMİK STOP LOSS
            const slLimit = trade.stopLossPercent || config.slPercent;
            if (pnlPercent <= -slLimit) {
                this.sell(trade, currentPrice, `⛔ DİNAMİK STOP LOSS(${pnlPercent.toFixed(2)} %)`);
                continue;
            }

            // 🎯 DİNAMİK TAKE PROFIT
            const tpLimit = trade.takeProfitPercent || config.tpPercent;
            if (pnlPercent >= tpLimit) {
                this.sell(trade, currentPrice, `✅ DİNAMİK TAKE PROFIT(+${pnlPercent.toFixed(2)} %)`);
                continue;
            }

            // 📉 DİNAMİK TRAILING STOP & BAŞA BAŞ KORUMASI
            if (pnlPercent > config.trailingStart) {
                if (!trade.highestPnL || pnlPercent > trade.highestPnL) {
                    trade.highestPnL = pnlPercent;
                } else {
                    const dropLimit = config.id === 'scalper' ? 0.7 : 2.0;
                    if (pnlPercent < (trade.highestPnL - dropLimit)) {
                        this.sell(trade, currentPrice, `📉 Trailing Stop(Kâr Korundu: +${pnlPercent.toFixed(1)} %)`);
                        continue;
                    }
                }
            }

            // BREAKEVEN - Kârın Zarara Dönmesini Engelle
            if (trade.highestPnL > 2.0 && pnlPercent < 0.5) {
                this.sell(trade, currentPrice, `🛡️ Başa Baş Koruması(+0.5 %)`);
                continue;
            }

            // ⏰ DİNAMİK ZAMAN AŞIMI
            const holdHours = (Date.now() - new Date(trade.date).getTime()) / (1000 * 60 * 60);
            if (holdHours > config.timeoutHours && pnlPercent < -1) {
                this.sell(trade, currentPrice, `⏰ Zaman Aşımı(${holdHours.toFixed(0)} saat, % ${pnlPercent.toFixed(1)})`);
                continue;
            }
        }
    }

    _handleBuySignal(decision, currentPrice, candles) {
        // Toplam Equity Hesapla (Nakit + Açık Pozisyonların Mevcut Değeri)
        const openPortfolioValue = this.portfolio
            .filter(t => t.isOpen)
            .reduce((sum, t) => {
                const quote = realMarketDataService.getQuote(t.symbol);
                return sum + (quote ? quote.price * t.quantity : t.entryPrice * t.quantity);
            }, 0);

        const totalEquity = this.balance + openPortfolioValue;

        const audit = ChironRiskManager.audit(decision, this.portfolio, this.balance, totalEquity, currentPrice);

        if (audit.status === AuditStatus.APPROVED) {
            const { stopLoss, takeProfit } = this._calculateDynamicSLTP(candles, currentPrice);
            this.buy(decision.symbol, currentPrice, audit.adjustedQuantity, decision, TradeSource.AUTOPILOT, stopLoss, takeProfit);
        }
    }

    _calculateDynamicSLTP(candles, entryPrice) {
        if (!candles || candles.length < 15) {
            return { stopLoss: 5, takeProfit: 15 };
        }

        try {
            // IndicatorLibrary2'den ATR'yi kullan
            const highs = candles.map(c => c.high);
            const lows = candles.map(c => c.low);
            const closes = candles.map(c => c.close);

            // Son 14 periyodun ATR'sini hesapla
            const atrValues = Indicators2.ATR(highs, lows, closes, 14);
            const currentATR = atrValues[atrValues.length - 1];

            // Fiyat yüzdesi cinsinden ATR
            const atrPercent = (currentATR / entryPrice) * 100;

            // Çarpanlar (Piyasa koşullarına göre ayarlanabilir)
            // Stop Loss: 2.0x ATR (Daha sıkı koruma, Max %6.5)
            // Take Profit: 3.5x ATR (RR Ratio: 1.6+)
            let stopLossPercent = Math.min(Math.max(atrPercent * 2.0, 2.0), 6.5);

            // TP, SL'in en az 1.6 katı olmalı (Pozitif Beklenti)
            let targetTP = Math.max(atrPercent * 3.5, stopLossPercent * 1.6);
            let takeProfitPercent = Math.min(Math.max(targetTP, 4.0), 50);

            return { stopLoss: stopLossPercent, takeProfit: takeProfitPercent };
        } catch (e) {
            console.error('ATR Hesaplama Hatası:', e);
            return { stopLoss: 5, takeProfit: 15 };
        }
    }

    _handleSellSignal(decision, currentPrice) {
        const existingTrade = this.portfolio.find(t => t.symbol === decision.symbol && t.isOpen);
        if (existingTrade) {
            this.sell(existingTrade, currentPrice, `Nova SAT: ${decision.reason} `);
        }
    }

    buy(symbol, price, quantity, decisionContext, source = TradeSource.USER, stopLoss = 5, takeProfit = 15) {
        const cost = price * quantity;

        if (this.balance < cost) {
            console.warn(`💰 Bakiye yetersiz: ${symbol} için $${cost.toFixed(2)} gerekli, bakiye $${this.balance.toFixed(2)}`);
            return;
        }

        const commission = cost * (tradingConfig.COMMISSION_RATE || 0.001);

        // --- MERGE / PYRAMIDING LOGIC ---
        const existingTrade = this.portfolio.find(t => t.symbol === symbol && t.isOpen);
        if (existingTrade) {
            // Ağırlıklı Ortalama Fiyat Hesabı
            const totalOldCost = existingTrade.quantity * existingTrade.entryPrice;
            const totalNewCost = quantity * price;
            const newTotalQty = existingTrade.quantity + quantity;
            const newAvgPrice = (totalOldCost + totalNewCost) / newTotalQty;

            // Trade'i güncelle
            existingTrade.entryPrice = newAvgPrice;
            existingTrade.quantity = newTotalQty;
            existingTrade.isPyramided = true; // Piramitleme yapıldığını işaretle

            // SL/TP Güncelleme (Yeni ortalamaya göre korunmalı)
            existingTrade.stopLossPercent = stopLoss; // Yeni dinamik SL
            existingTrade.takeProfitPercent = takeProfit;

            this.balance -= (cost + commission);

            this.addLog('İşlem', `🧱 PİRAMİTLEME: ${symbol} ekleme yapıldı. Yeni Ort: $${newAvgPrice.toFixed(4)} (Miktar: +${quantity.toFixed(4)})`);
            telegramService.sendTradeOpen({ ...existingTrade, rationale: "Piramitleme / Pozisyon Ekleme" }); // Bildirim gönder

            this._notify();
            return;
        }

        // Trade objesi oluştur
        const newTrade = {
            id: generateUUID(),
            symbol: symbol,
            entryPrice: price,
            quantity: quantity,
            date: new Date(),
            isOpen: true,
            source: source,
            rationale: decisionContext.reason || '',
            decisionContext: decisionContext,
            stopLossPercent: stopLoss,
            takeProfitPercent: takeProfit,
            highestPnL: 0,
            exitPrice: null,
            exitDate: null,
            exitReason: null
        };

        this.balance -= (cost + commission);
        this.portfolio.push(newTrade);

        this.addLog('İşlem', `₿ ${symbol} ALINDI @$${price.toFixed(4)} (Komisyon: -$${commission.toFixed(2)})`);

        // 📢 Telegram Bildirimi
        telegramService.sendTradeOpen(newTrade);

        // 🔔 Tarayıcı ve Uygulama İçi Bildirimi
        notificationService.notifyTradeOpen(newTrade);

        this._notify();
    }

    sell(trade, price, reason) {
        if (!trade.isOpen) return;

        // Trade'i güncelle
        trade.isOpen = false;
        trade.exitPrice = price;
        trade.exitDate = new Date();
        trade.exitReason = reason;

        const revenue = price * trade.quantity;
        const sellCommission = revenue * (tradingConfig.COMMISSION_RATE || 0.001);
        const netRevenue = revenue - sellCommission;

        // Alış maliyeti = Alış fiyatı × miktar + Alış komisyonu
        const buyCost = trade.entryPrice * trade.quantity;
        const buyCommission = buyCost * (tradingConfig.COMMISSION_RATE || 0.001);
        const totalCost = buyCost + buyCommission;

        // Gerçek kar = Net satış geliri - Toplam maliyet (komisyonlar dahil)
        const profit = netRevenue - totalCost;
        const profitPercent = ((price - trade.entryPrice) / trade.entryPrice) * 100;

        this.balance += netRevenue;
        this.totalPnLRealized += profit;

        // 🧠 ÖĞRENME: Kapanan işlemi öğrenme motoruna bildir
        try {
            if (learningEngine?.evaluateClosedTrade) {
                learningEngine.evaluateClosedTrade(trade);
                console.log(`🧠 İşlem öğrenildi: ${trade.symbol} (${profitPercent.toFixed(2)}%)`);
            }
        } catch (error) {
            console.error('Öğrenme hatası:', error);
        }

        const profitStr = profit >= 0 ? `+ $${profit.toFixed(2)} (+${profitPercent.toFixed(2)}%)` : ` - $${Math.abs(profit).toFixed(2)} (${profitPercent.toFixed(2)}%)`;
        this.addLog('İşlem', `✨ ${trade.symbol} KAPATILDI | Kar / Zarar: ${profitStr} | Neden: ${reason} `);

        // 📢 Telegram Bildirimi
        telegramService.sendTradeClose(trade, profit, profitPercent);

        // 🔔 Tarayıcı ve Uygulama İçi Bildirimi
        notificationService.notifyTradeClose(trade, profit, profitPercent);

        this._notify();
    }

    addLog(source, message) {
        const time = new Date().toLocaleTimeString();
        const logStr = `[${time}][${source}] ${message} `;
        this.logs.unshift(logStr);
        if (this.logs.length > 50) this.logs.pop();
    }

    /**
     * Manuel Alım Fonksiyonu (ManualTradePanel için)
     * @param {string} symbol - Coin sembolü (BTCUSDT formatında)
     * @param {number} amount - USDT cinsinden alım tutarı
     * @param {number} currentPrice - Mevcut fiyat
     * @returns {Object} { success: boolean, error?: string }
     */
    async manualBuy(symbol, amount, currentPrice) {
        try {
            // Bakiye kontrolü
            if (this.balance < amount) {
                return { success: false, error: `Yetersiz bakiye ($${this.balance.toFixed(2)} mevcut)` };
            }

            // Minimum işlem kontrolü
            if (amount < 10) {
                return { success: false, error: 'Minimum işlem tutarı $10' };
            }

            // Cronos zamanlama kontrolü (opsiyonel uyarı)
            const cronosAnalysis = CronosEngine.analyze();
            if (cronosAnalysis.score < 40) {
                console.warn(`⏰ Cronos Uyarısı: ${cronosAnalysis.warnings.join(', ')}`);
                this.addLog('Cronos', `⚠️ Zamanlama riski: ${cronosAnalysis.recommendation}`);
            }

            // Miktar hesapla
            const quantity = amount / currentPrice;

            // Mum verisi al (Dynamic SL/TP için)
            let stopLoss = 5, takeProfit = 15;
            try {
                const candles = await realMarketDataService.getCandles(symbol, '1h', 30);
                if (candles && candles.length >= 15) {
                    const levels = this._calculateDynamicSLTP(candles, currentPrice);
                    stopLoss = levels.stopLoss;
                    takeProfit = levels.takeProfit;

                    // Phoenix Channel analizi (ek bilgi için)
                    const phoenixResult = PhoenixChannelAnalysis.analyze(candles);
                    if (phoenixResult.status === 'ACTIVE') {
                        this.addLog('Phoenix', `📊 ${symbol}: ${phoenixResult.mode} mode, güven: ${phoenixResult.score.toFixed(0)}`);
                    }
                }
            } catch (e) {
                console.warn('Manuel alım için dinamik SL/TP hesaplanamadı, varsayılan kullanılıyor');
            }

            // Alım yap
            const decisionContext = {
                reason: 'Manuel Alım (Kullanıcı)',
                totalScore: 0,
                isManual: true
            };

            this.buy(symbol, currentPrice, quantity, decisionContext, TradeSource.USER, stopLoss, takeProfit);

            return { success: true };
        } catch (error) {
            console.error('Manuel alım hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Portföyü sıfırla (test için)
    resetPortfolio() {
        this.portfolio = [];
        this.balance = 1000.0;
        this.logs = [];
        this.totalPnLRealized = 0;
        persistence.removeItem(STORAGE_KEY);
        this.addLog('Sistem', '🔄 Portföy sıfırlandı');
        this._notify();
    }
}

export const tradingViewModel = new TradingViewModel();
