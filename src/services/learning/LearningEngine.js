/**
 * LearningEngine.js
 * Nova TradeBot - Sürekli Öğrenme Motoru
 * 
 * Bu motor:
 * 1. Her indikatör ve algoritmanın başarı oranını takip eder
 * 2. Geçmiş verilerde backtesting yapar
 * 3. Başarı oranlarına göre ağırlıkları dinamik olarak ayarlar
 * 4. Tüm öğrenilen verileri localStorage'da saklar
 */

import { persistence } from '../PersistenceService.js';

const LEARNING_STORAGE_KEY = 'nova_v2_learning';
const BACKTEST_STORAGE_KEY = 'nova_v2_backtest';

export class LearningEngine {
    constructor() {
        this.indicatorStats = this._loadIndicatorStats();
        this.moduleStats = this._loadModuleStats();
        this.backtestResults = this._loadBacktestResults();
        this.isBacktesting = false;
        this.backtestProgress = 0;
        this.listeners = [];

        console.log('🧠 LearningEngine başlatıldı');
        console.log(`📊 Takip edilen indikatör: ${Object.keys(this.indicatorStats).length}`);
        console.log(`📊 Takip edilen modül: ${Object.keys(this.moduleStats).length}`);
    }

    // ==================== INDICATOR TRACKING ====================

    /**
     * Bir indikatörün sinyal verdiğini kaydet
     * @param {string} indicatorName - İndikatör adı (örn: "RSI", "MACD", "SMA_20_50")
     * @param {string} signal - "BUY" veya "SELL"
     * @param {string} symbol - Sembol
     * @param {number} entryPrice - Giriş fiyatı
     */
    recordSignal(indicatorName, signal, symbol, entryPrice) {
        if (!this.indicatorStats[indicatorName]) {
            this.indicatorStats[indicatorName] = {
                name: indicatorName,
                totalSignals: 0,
                successfulSignals: 0,
                failedSignals: 0,
                pendingSignals: [],
                successRate: 0.5, // Başlangıç: %50
                avgProfit: 0,
                avgLoss: 0,
                lastUpdated: Date.now()
            };
        }

        const stats = this.indicatorStats[indicatorName];
        stats.totalSignals++;
        stats.pendingSignals.push({
            signal,
            symbol,
            entryPrice,
            timestamp: Date.now()
        });

        // Son 100 bekleyen sinyali tut
        if (stats.pendingSignals.length > 100) {
            stats.pendingSignals = stats.pendingSignals.slice(-100);
        }

        this._save();
    }

    /**
     * Bir işlem kapandığında sonucu değerlendir
     * @param {Object} trade - Kapanan işlem
     */
    evaluateClosedTrade(trade) {
        if (!trade.decisionContext || !trade.decisionContext.traces) return;

        const profitPercent = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
        const isSuccess = profitPercent > 0;

        // Her modülü değerlendir
        for (const trace of trade.decisionContext.traces) {
            let moduleId = trace.moduleId || 'Unknown';

            // İsim Normalizasyonu: "Orion (Teknik Uzman)" -> "Orion"
            if (moduleId.includes('Orion')) moduleId = 'Orion';
            else if (moduleId.includes('Atlas')) moduleId = 'Atlas';
            else if (moduleId.includes('Phoenix')) moduleId = 'Phoenix';
            else if (moduleId.includes('Aether')) moduleId = 'Aether';
            else if (moduleId.includes('Nova') || moduleId.includes('Argus')) moduleId = 'Nova';

            const indicatorName = trace.moduleId || moduleId;

            // Modül istatistiklerini güncelle
            this._updateModuleStats(moduleId, isSuccess, profitPercent, trade);

            // İndikatör istatistiklerini güncelle
            this._updateIndicatorStats(indicatorName, trace, isSuccess, profitPercent);
        }

        this._save();
        this._notify();
    }

    _updateModuleStats(moduleId, isSuccess, profitPercent, trade) {
        if (!this.moduleStats[moduleId]) {
            this.moduleStats[moduleId] = {
                name: moduleId,
                totalTrades: 0,
                successfulTrades: 0,
                failedTrades: 0,
                successRate: 0.5,
                totalProfit: 0,
                avgProfit: 0,
                weight: this._getDefaultWeight(moduleId),
                lastUpdated: Date.now()
            };
        }

        const stats = this.moduleStats[moduleId];
        stats.totalTrades++;
        stats.totalProfit += profitPercent;

        if (isSuccess) {
            stats.successfulTrades++;
        } else {
            stats.failedTrades++;
        }

        // Başarı oranını hesapla
        stats.successRate = stats.successfulTrades / stats.totalTrades;
        stats.avgProfit = stats.totalProfit / stats.totalTrades;
        stats.lastUpdated = Date.now();

        // Dinamik ağırlık ayarla (başarı oranına göre)
        stats.weight = this._calculateDynamicWeight(stats);
    }

    _updateIndicatorStats(indicatorName, trace, isSuccess, profitPercent) {
        if (!this.indicatorStats[indicatorName]) {
            this.indicatorStats[indicatorName] = {
                name: indicatorName,
                totalSignals: 0,
                successfulSignals: 0,
                failedSignals: 0,
                pendingSignals: [],
                successRate: 0.5,
                avgProfit: 0,
                avgLoss: 0,
                lastUpdated: Date.now()
            };
        }

        const stats = this.indicatorStats[indicatorName];
        stats.totalSignals++;

        if (isSuccess) {
            stats.successfulSignals++;
            stats.avgProfit = ((stats.avgProfit * (stats.successfulSignals - 1)) + profitPercent) / stats.successfulSignals;
        } else {
            stats.failedSignals++;
            stats.avgLoss = ((stats.avgLoss * (stats.failedSignals - 1)) + Math.abs(profitPercent)) / stats.failedSignals;
        }

        stats.successRate = stats.successfulSignals / stats.totalSignals;
        stats.lastUpdated = Date.now();
    }

    _getDefaultWeight(moduleId) {
        const defaults = {
            'Orion': 0.40,
            'Atlas': 0.25,
            'Phoenix': 0.20,
            'Aether': 0.15
        };
        return defaults[moduleId] || 0.25;
    }

    _calculateDynamicWeight(stats) {
        // Minimum 10 işlem sonrası ağırlığı ayarla
        if (stats.totalTrades < 10) {
            return this._getDefaultWeight(stats.name);
        }

        // Başarı oranına göre ağırlık (0.1 - 0.5 arası)
        // %70+ başarı = 0.5 ağırlık
        // %30- başarı = 0.1 ağırlık
        const minWeight = 0.10;
        const maxWeight = 0.50;

        // Lineer interpolasyon: 0.3 -> 0.1, 0.7 -> 0.5
        let weight = minWeight + (stats.successRate - 0.3) * (maxWeight - minWeight) / 0.4;
        weight = Math.max(minWeight, Math.min(maxWeight, weight));

        return weight;
    }

    // ==================== BACKTESTING ====================

    /**
     * Arka planda backtesting başlat
     * @param {Function} getCandles - Mum verisi çeken fonksiyon
     * @param {Array} symbols - Test edilecek semboller
     * @param {Object} analyzeFunction - Analiz fonksiyonu
     */
    async startBacktest(getCandles, symbols, analyzeFunction) {
        if (this.isBacktesting) {
            console.log('⚠️ Backtest zaten çalışıyor');
            return;
        }

        this.isBacktesting = true;
        this.backtestProgress = 0;
        console.log('🔬 Backtest başlatılıyor...');

        const results = {
            startTime: Date.now(),
            endTime: null,
            symbolsTested: 0,
            totalTrades: 0,
            successfulTrades: 0,
            failedTrades: 0,
            totalProfit: 0,
            modulePerformance: {},
            indicatorPerformance: {},
            tradeHistory: []
        };

        const testSymbols = symbols.slice(0, 100); // Max 100 sembol test et
        let processed = 0;

        for (const symbol of testSymbols) {
            try {
                const candles = await getCandles(symbol, '4h', 1000); // 4 saatlik, yaklaşık 6 aylık veri (1000 mum)
                if (!candles || candles.length < 100) {
                    processed++;
                    continue;
                }

                // Simülasyon: Her 20 mumda bir test et
                const backtestResult = await this._simulateTrades(symbol, candles, analyzeFunction);

                // Sonuçları birleştir
                results.symbolsTested++;
                results.totalTrades += backtestResult.trades.length;
                results.successfulTrades += backtestResult.successfulTrades;
                results.failedTrades += backtestResult.failedTrades;
                results.totalProfit += backtestResult.totalProfit;
                results.tradeHistory.push(...backtestResult.trades.slice(0, 10)); // Her sembolden max 10

                // Modül performansını güncelle
                this._mergeModulePerformance(results.modulePerformance, backtestResult.modulePerformance);

                // İndikatör performansını güncelle
                if (backtestResult.indicatorPerformance) {
                    this._mergeIndicatorPerformance(results.indicatorPerformance, backtestResult.indicatorPerformance);
                }

            } catch (error) {
                console.error(`Backtest hatası (${symbol}):`, error.message);
            }

            processed++;
            this.backtestProgress = Math.round((processed / testSymbols.length) * 100);

            // Her 10 sembolde bir notify
            if (processed % 10 === 0) {
                this._notify();
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, 100));
        }

        results.endTime = Date.now();
        results.successRate = results.totalTrades > 0
            ? results.successfulTrades / results.totalTrades
            : 0;
        results.avgProfitPerTrade = results.totalTrades > 0
            ? results.totalProfit / results.totalTrades
            : 0;

        this.backtestResults = results;
        this.isBacktesting = false;
        this.backtestProgress = 100;

        // Sonuçları kaydet
        this._saveBacktestResults();

        // Öğrenilen verileri modül ağırlıklarına uygula
        this._applyBacktestLearning(results);

        console.log('✅ Backtest tamamlandı:', results);
        this._notify();

        return results;
    }

    async _simulateTrades(symbol, candles, analyzeFunction) {
        const result = {
            symbol,
            trades: [],
            successfulTrades: 0,
            failedTrades: 0,
            totalProfit: 0,
            modulePerformance: {},
            indicatorPerformance: {}
        };

        // Her 20 mumda bir test yap (sliding window)
        for (let i = 50; i < candles.length - 10; i += 20) {
            const historicalCandles = candles.slice(0, i);
            const futureCandles = candles.slice(i, i + 10);

            try {
                // Analiz yap
                const decision = await analyzeFunction(symbol, historicalCandles);

                // SignalAction.BUY kontrolü (obje karşılaştırması)
                const isBuySignal = decision.finalDecision?.id === 'buy' ||
                    decision.finalDecision?.label === 'AL' ||
                    decision.finalDecision?.label === 'GÜÇLÜ AL';

                if (isBuySignal) {
                    const entryPrice = historicalCandles[historicalCandles.length - 1].close;
                    const exitPrice = futureCandles[futureCandles.length - 1].close;
                    const profitPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
                    const isSuccess = profitPercent > 0;

                    result.trades.push({
                        symbol,
                        entryPrice,
                        exitPrice,
                        profitPercent,
                        isSuccess,
                        decision: decision.finalDecision?.label || 'AL',
                        confidence: decision.confidence,
                        totalScore: decision.totalScore,
                        timestamp: Date.now()
                    });

                    result.totalProfit += profitPercent;

                    if (isSuccess) {
                        result.successfulTrades++;
                    } else {
                        result.failedTrades++;
                    }

                    // Modül performansını kaydet
                    if (decision.traces) {
                        for (const trace of decision.traces) {
                            const moduleId = trace.moduleId?.split('-')[0] || 'Unknown';
                            if (!result.modulePerformance[moduleId]) {
                                result.modulePerformance[moduleId] = {
                                    totalSignals: 0,
                                    correctSignals: 0,
                                    totalProfit: 0
                                };
                            }
                            result.modulePerformance[moduleId].totalSignals++;
                            if (isSuccess) {
                                result.modulePerformance[moduleId].correctSignals++;
                            }
                            result.modulePerformance[moduleId].totalProfit += profitPercent;
                        }
                    }

                    // İndikatör performansını kaydet (DETAYLI)
                    if (decision.rawIndicatorResults) {
                        decision.rawIndicatorResults.forEach(ind => {
                            // Sadece alım yönünde sinyal veren indikatörleri değerlendir (value > 0)
                            // Veya nötr olmayanları
                            if (ind.value > 0) { // Alım sinyali verenler
                                if (!result.indicatorPerformance[ind.name]) {
                                    result.indicatorPerformance[ind.name] = {
                                        totalSignals: 0,
                                        correctSignals: 0,
                                        totalProfit: 0
                                    };
                                }
                                result.indicatorPerformance[ind.name].totalSignals++;
                                if (isSuccess) {
                                    result.indicatorPerformance[ind.name].correctSignals++;
                                }
                                result.indicatorPerformance[ind.name].totalProfit += profitPercent;
                            }
                        });
                    }
                }
            } catch (error) {
                console.error(`❌ Backtest Simülasyon Hatası (${symbol}):`, error.message);
            }
        }

        return result;
    }

    _mergeModulePerformance(target, source) {
        for (const [moduleId, perf] of Object.entries(source)) {
            if (!target[moduleId]) {
                target[moduleId] = { totalSignals: 0, correctSignals: 0, totalProfit: 0 };
            }
            target[moduleId].totalSignals += perf.totalSignals;
            target[moduleId].correctSignals += perf.correctSignals;
            target[moduleId].totalProfit += perf.totalProfit;
        }
    }

    _mergeIndicatorPerformance(target, source) {
        for (const [indId, perf] of Object.entries(source)) {
            if (!target[indId]) {
                target[indId] = { totalSignals: 0, correctSignals: 0, totalProfit: 0 };
            }
            target[indId].totalSignals += perf.totalSignals;
            target[indId].correctSignals += perf.correctSignals;
            target[indId].totalProfit += perf.totalProfit;
        }
    }

    _applyBacktestLearning(results) {
        if (results.modulePerformance) {
            // Modül ağırlıklarını öğren ve güncelle
            for (const [moduleId, perf] of Object.entries(results.modulePerformance)) {
                if (perf.totalSignals < 10) continue;

                const successRate = perf.correctSignals / perf.totalSignals;

                if (!this.moduleStats[moduleId]) {
                    this.moduleStats[moduleId] = {
                        name: moduleId,
                        totalTrades: 0,
                        successfulTrades: 0,
                        failedTrades: 0,
                        successRate: 0.5,
                        totalProfit: 0,
                        avgProfit: 0,
                        weight: this._getDefaultWeight(moduleId),
                        lastUpdated: Date.now()
                    };
                }

                const stats = this.moduleStats[moduleId];

                // Backtest sonuçlarını mevcut istatistiklerle birleştir
                // Backtest verisine %30, gerçek işlemlere %70 ağırlık ver
                const backtestWeight = 0.3;
                const realWeight = 0.7;

                if (stats.totalTrades > 0) {
                    stats.successRate = (stats.successRate * realWeight) + (successRate * backtestWeight);
                } else {
                    stats.successRate = successRate;
                }

                stats.weight = this._calculateDynamicWeight(stats);
                stats.lastUpdated = Date.now();
            }
        }

        // İndikatör istatistiklerini de kaydet
        if (results.indicatorPerformance) {
            for (const [indId, perf] of Object.entries(results.indicatorPerformance)) {
                const successRate = perf.totalSignals > 0 ? (perf.correctSignals / perf.totalSignals) : 0;

                this.indicatorStats[indId] = {
                    name: indId,
                    totalSignals: perf.totalSignals,
                    successfulSignals: perf.correctSignals, // Add successfulSignals
                    failedSignals: perf.totalSignals - perf.correctSignals, // Add failedSignals
                    successRate: successRate,
                    avgProfit: perf.totalProfit / perf.correctSignals || 0, // Calculate avgProfit
                    avgLoss: perf.totalProfit < 0 ? Math.abs(perf.totalProfit / (perf.totalSignals - perf.correctSignals)) || 0 : 0, // Calculate avgLoss
                    lastUpdated: Date.now()
                };
            }

        }

        this._save();
    }

    // ==================== DYNAMIC WEIGHTS API ====================

    /**
     * Modül ağırlıklarını al (NovaDecisionEngine tarafından kullanılır)
     */
    getModuleWeights() {
        const weights = {};
        const coreModules = ['Orion', 'Atlas', 'Phoenix', 'Aether'];
        let total = 0;

        for (const moduleId of coreModules) {
            const stats = this.moduleStats[moduleId];
            const weight = stats ? stats.weight : this._getDefaultWeight(moduleId);
            weights[moduleId] = weight;
            total += weight;
        }

        // Normalize et
        if (total > 0) {
            for (const moduleId of coreModules) {
                weights[moduleId] /= total;
            }
        }

        return weights;
    }

    /**
     * Belirli bir modülün güvenilirlik skorunu al
     */
    getModuleReliability(moduleId) {
        const stats = this.moduleStats[moduleId];
        if (!stats || stats.totalTrades < 5) {
            return 0.5; // Varsayılan
        }
        return stats.successRate;
    }

    /**
     * En başarılı indikatörleri al
     */
    getTopIndicators(limit = 10) {
        return Object.values(this.indicatorStats)
            .filter(s => s.totalSignals >= 5)
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, limit);
    }

    /**
     * Öğrenme özetini al
     */
    getSummary() {
        const moduleList = Object.values(this.moduleStats);
        const indicatorList = Object.values(this.indicatorStats);

        // Gerçek işlemlerden gelen veriler
        const realTrades = moduleList.reduce((sum, m) => sum + m.totalTrades, 0);

        // Backtest sonuçları
        const bt = this.backtestResults || {};
        const backtestTrades = bt.totalTrades || 0;
        const backtestSuccessRate = bt.successRate || 0;

        // Toplam analiz edilen işlem (gerçek + backtest)
        const totalTrades = realTrades + backtestTrades;

        // İndikatör sayısı hesaplama
        // 1. Lokal istatistiklerden
        // 2. Backtest modül sayısından (her modül birden fazla indikatör içerir)
        let totalIndicators = indicatorList.length;

        // Eğer canlı listede yoksa backtest sonuçlarına bak
        if (totalIndicators === 0 && bt.indicatorPerformance) {
            totalIndicators = Object.keys(bt.indicatorPerformance).length;
        }

        // Hala 0 ise eski usul tahmin (Fallback)
        if (totalIndicators === 0 && bt.modulePerformance) {
            const moduleCount = Object.keys(bt.modulePerformance).length;
            totalIndicators = moduleCount * 5;
        }

        // Modül sayısı - backtest'ten veya local'den
        let totalModules = moduleList.length;
        if (totalModules === 0 && bt.modulePerformance) {
            totalModules = Object.keys(bt.modulePerformance).length;
        }

        // Başarı oranı hesaplama
        let overallSuccessRate = 0.5; // Varsayılan

        if (backtestTrades > 0 && realTrades === 0) {
            // Sadece backtest varsa
            overallSuccessRate = backtestSuccessRate;
        } else if (realTrades > 0) {
            // Gerçek işlemler varsa, modül ortalamalarını kullan
            overallSuccessRate = moduleList.reduce((sum, m) => sum + m.successRate, 0) / moduleList.length;
        } else if (backtestTrades > 0) {
            overallSuccessRate = backtestSuccessRate;
        }

        // Profit Factor hesaplama (Trade History üzerinden daha hassas hesaplama)
        let grossWin = 0;
        let grossLoss = 0;

        // 1. Backtest İşlemleri
        if (bt.tradeHistory && Array.isArray(bt.tradeHistory)) {
            bt.tradeHistory.forEach(trade => {
                // Yüzdesel veya miktarsal kar/zarar
                // trade.profitPercent genellikle % cinsinden (örn: 5.2 veya -2.1)
                const pnl = trade.profitPercent || 0;
                if (pnl > 0) grossWin += pnl;
                else grossLoss += Math.abs(pnl);
            });
        }

        // 2. Gerçek (Canlı) İşlemler
        // Not: Gerçek işlemleri henüz history array'inde tutmuyorsak moduleList'ten tahminlemeye gerek yok,
        // çünkü modül performansı kümülatiftir. İleride gerçek trade history eklendiğinde buraya dahil edilebilir.
        // Şimdilik sadece backtest verisi yeterince zengin.

        const profitFactor = grossLoss > 0 ? (grossWin / grossLoss) : (grossWin > 0 ? 999 : 0);

        return {
            totalModules: totalModules,
            totalIndicators: totalIndicators,
            totalTradesAnalyzed: totalTrades,
            profitFactor: profitFactor.toFixed(2),
            overallSuccessRate: overallSuccessRate,
            bestModule: moduleList.sort((a, b) => b.successRate - a.successRate)[0] || null,
            worstModule: moduleList.sort((a, b) => a.successRate - b.successRate)[0] || null,
            backtestResults: this.backtestResults,
            isBacktesting: this.isBacktesting,
            backtestProgress: this.backtestProgress
        };
    }

    // ==================== PERSISTENCE ====================

    _loadIndicatorStats() {
        try {
            const saved = persistence.getItem(LEARNING_STORAGE_KEY + '_indicators');
            return typeof saved === 'string' ? JSON.parse(saved) : (saved || {});
        } catch {
            return {};
        }
    }

    _loadModuleStats() {
        try {
            const saved = persistence.getItem(LEARNING_STORAGE_KEY + '_modules');
            return typeof saved === 'string' ? JSON.parse(saved) : (saved || {});
        } catch {
            return {};
        }
    }

    _loadBacktestResults() {
        try {
            const saved = persistence.getItem(BACKTEST_STORAGE_KEY);
            return typeof saved === 'string' ? JSON.parse(saved) : (saved || null);
        } catch {
            return null;
        }
    }

    _save() {
        try {
            persistence.setItem(LEARNING_STORAGE_KEY + '_indicators', this.isNode ? this.indicatorStats : JSON.stringify(this.indicatorStats));
            persistence.setItem(LEARNING_STORAGE_KEY + '_modules', this.isNode ? this.moduleStats : JSON.stringify(this.moduleStats));
        } catch (error) {
            console.error('Learning data kaydedilemedi:', error);
        }
    }

    _saveBacktestResults() {
        try {
            persistence.setItem(BACKTEST_STORAGE_KEY, this.isNode ? this.backtestResults : JSON.stringify(this.backtestResults));
        } catch (error) {
            console.error('Backtest sonuçları kaydedilemedi:', error);
        }
    }

    // ==================== SUBSCRIPTION ====================

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.getSummary());
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    _notify() {
        const summary = this.getSummary();
        this.listeners.forEach(cb => cb(summary));
    }

    /**
     * Verileri persistence katmanından yeniden yükle
     */
    reload() {
        this.indicatorStats = this._loadIndicatorStats();
        this.moduleStats = this._loadModuleStats();
        this.backtestResults = this._loadBacktestResults();
        this._notify();
        console.log('🔄 LearningEngine verileri yenilendi');
    }

    // ==================== RESET ====================

    resetLearning() {
        this.indicatorStats = {};
        this.moduleStats = {};
        this.backtestResults = null;
        persistence.removeItem(LEARNING_STORAGE_KEY + '_indicators');
        persistence.removeItem(LEARNING_STORAGE_KEY + '_modules');
        persistence.removeItem(BACKTEST_STORAGE_KEY);
        console.log('🔄 Öğrenme verileri sıfırlandı');
        this._notify();
    }
}

// Singleton export
export const learningEngine = new LearningEngine();
