/**
 * ChironRegimeEngine - Argus 05_chiron.md
 * Market Regime Detection ve Dynamic Weight Management
 * LLM olmadan çalışan versiyon - Öğrenme verileriyle ağırlık optimizasyonu
 */

export const MarketRegime = {
    NEUTRAL: 'Neutral',
    TREND: 'Trend',
    CHOP: 'Chop',
    RISK_OFF: 'Risk-Off',
    NEWS_SHOCK: 'News Shock'
};

class ChironRegimeEngine {
    constructor() {
        this.dynamicConfig = null;
        this.persistenceKey = 'chiron_learned_weights';
        this.performanceLogs = [];
        this.loadFromDisk();
    }

    // ==========================================
    // REGIME DETECTION
    // ==========================================

    /**
     * Piyasa rejimini tespit et
     * @param {Object} context - Analiz context'i
     * @returns {string} Market regime
     */
    detectRegime(context) {
        const orion = context.orionScore ?? 50;
        const aether = context.aetherScore ?? 50;
        const chop = context.chopIndex ?? 50;
        const hermes = context.hermesScore ?? 50;

        // Haber şoku kontrolü
        if (hermes < 20 || hermes > 80) {
            return MarketRegime.NEWS_SHOCK;
        }

        // Risk-off (Makro kötü)
        if (aether < 40) {
            return MarketRegime.RISK_OFF;
        }

        // Trend (Güçlü momentum ve düşük chop)
        if (orion >= 60 && chop < 45) {
            return MarketRegime.TREND;
        }

        // Chop (Yüksek kararsızlık)
        if (chop > 60) {
            return MarketRegime.CHOP;
        }

        return MarketRegime.NEUTRAL;
    }

    // ==========================================
    // WEIGHT MANAGEMENT
    // ==========================================

    /**
     * Rejime göre temel ağırlıkları getir
     * @param {string} regime - Market regime
     * @returns {Object} Core ve Pulse ağırlıkları
     */
    getBaseWeights(regime) {
        const weights = {
            [MarketRegime.TREND]: {
                core: { atlas: 0.20, orion: 0.25, aether: 0.20, demeter: 0.10, phoenix: 0.10, hermes: 0.05, athena: 0.05, cronos: 0.05 },
                pulse: { atlas: 0.10, orion: 0.35, aether: 0.15, demeter: 0.05, phoenix: 0.20, hermes: 0.05, athena: 0.05, cronos: 0.05 }
            },
            [MarketRegime.CHOP]: {
                core: { atlas: 0.30, orion: 0.15, aether: 0.25, demeter: 0.10, phoenix: 0.05, hermes: 0.05, athena: 0.05, cronos: 0.05 },
                pulse: { atlas: 0.20, orion: 0.20, aether: 0.20, demeter: 0.10, phoenix: 0.15, hermes: 0.05, athena: 0.05, cronos: 0.05 }
            },
            [MarketRegime.RISK_OFF]: {
                core: { atlas: 0.35, orion: 0.10, aether: 0.30, demeter: 0.10, phoenix: 0.0, hermes: 0.05, athena: 0.05, cronos: 0.05 },
                pulse: { atlas: 0.25, orion: 0.15, aether: 0.30, demeter: 0.10, phoenix: 0.05, hermes: 0.05, athena: 0.05, cronos: 0.05 }
            },
            [MarketRegime.NEWS_SHOCK]: {
                core: { atlas: 0.15, orion: 0.15, aether: 0.20, demeter: 0.05, phoenix: 0.05, hermes: 0.30, athena: 0.05, cronos: 0.05 },
                pulse: { atlas: 0.10, orion: 0.20, aether: 0.15, demeter: 0.05, phoenix: 0.10, hermes: 0.30, athena: 0.05, cronos: 0.05 }
            },
            [MarketRegime.NEUTRAL]: {
                core: { atlas: 0.25, orion: 0.20, aether: 0.20, demeter: 0.10, phoenix: 0.05, hermes: 0.05, athena: 0.10, cronos: 0.05 },
                pulse: { atlas: 0.15, orion: 0.25, aether: 0.20, demeter: 0.05, phoenix: 0.15, hermes: 0.10, athena: 0.05, cronos: 0.05 }
            }
        };

        return weights[regime] || weights[MarketRegime.NEUTRAL];
    }

    /**
     * Normalize edilmiş ağırlıklar
     * @param {Object} weights - Module weights
     * @returns {Object} Normalized weights
     */
    normalizeWeights(weights) {
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        if (sum === 0) return weights;

        const normalized = {};
        for (const [key, value] of Object.entries(weights)) {
            normalized[key] = Math.round((value / sum) * 100) / 100;
        }
        return normalized;
    }

    /**
     * Öğrenilen ağırlıklarla temel ağırlıkları harmanlama
     * @param {Object} base - Base weights
     * @param {Object} learned - Learned weights
     * @param {number} factor - Blend factor (0-1)
     * @returns {Object} Blended weights
     */
    blendWeights(base, learned, factor = 0.6) {
        if (!learned) return base;

        const blended = { core: {}, pulse: {} };

        for (const type of ['core', 'pulse']) {
            for (const module of Object.keys(base[type])) {
                const baseVal = base[type][module] || 0;
                const learnedVal = learned[type]?.[module] || baseVal;
                blended[type][module] = baseVal * (1 - factor) + learnedVal * factor;
            }
            blended[type] = this.normalizeWeights(blended[type]);
        }

        return blended;
    }

    // ==========================================
    // MAIN EVALUATION
    // ==========================================

    /**
     * Context'e göre ağırlıkları değerlendir
     * @param {Object} context - Analysis context
     * @returns {Object} Chiron result
     */
    evaluate(context) {
        const regime = this.detectRegime(context);
        let weights = this.getBaseWeights(regime);

        // Öğrenilmiş ağırlıkları uygula
        if (this.dynamicConfig) {
            weights = this.blendWeights(weights, this.dynamicConfig.weights, 0.6);
        }

        return {
            regime,
            regimeLabel: this.getRegimeLabel(regime),
            coreWeights: this.normalizeWeights(weights.core),
            pulseWeights: this.normalizeWeights(weights.pulse),
            learningNotes: this.dynamicConfig?.learningNotes || null,
            confidence: this.calculateConfidence(context, regime)
        };
    }

    getRegimeLabel(regime) {
        const labels = {
            [MarketRegime.NEUTRAL]: '⚖️ Nötr',
            [MarketRegime.TREND]: '📈 Trend',
            [MarketRegime.CHOP]: '🔀 Choppy',
            [MarketRegime.RISK_OFF]: '🛑 Risk-Off',
            [MarketRegime.NEWS_SHOCK]: '📰 Haber Şoku'
        };
        return labels[regime] || regime;
    }

    calculateConfidence(context, regime) {
        // Rejim tespitinin güvenirliği
        const scores = [
            context.orionScore ?? 50,
            context.aetherScore ?? 50,
            context.atlasScore ?? 50
        ];

        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) / scores.length;
        const consistency = Math.max(0, 100 - Math.sqrt(variance) * 2);

        return Math.round(consistency);
    }

    // ==========================================
    // PERFORMANCE LOGGING & LEARNING
    // ==========================================

    /**
     * İşlem sonucunu logla
     * @param {Object} log - Performance log
     */
    logPerformance(log) {
        this.performanceLogs.push({
            ...log,
            timestamp: new Date().toISOString()
        });

        // Son 100 log tut
        if (this.performanceLogs.length > 100) {
            this.performanceLogs.shift();
        }

        // Her 10 işlemde bir öğren
        if (this.performanceLogs.length % 10 === 0) {
            this.learnFromPerformance();
        }
    }

    /**
     * Performans loglarından öğren (LLM olmadan)
     */
    learnFromPerformance() {
        if (this.performanceLogs.length < 10) return;

        const modulePerformance = {
            atlas: { wins: 0, total: 0 },
            orion: { wins: 0, total: 0 },
            aether: { wins: 0, total: 0 },
            phoenix: { wins: 0, total: 0 },
            hermes: { wins: 0, total: 0 },
            demeter: { wins: 0, total: 0 },
            athena: { wins: 0, total: 0 },
            cronos: { wins: 0, total: 0 }
        };

        // Her log için modül performansını hesapla
        for (const log of this.performanceLogs) {
            const isWin = log.pnlPercent > 0;

            for (const module of Object.keys(modulePerformance)) {
                const moduleScore = log.moduleScores?.[module] ?? 50;
                const predictedBuy = moduleScore > 60;
                const predictedSell = moduleScore < 40;
                const wasCorrect = (isWin && predictedBuy) || (!isWin && predictedSell);

                if (predictedBuy || predictedSell) {
                    modulePerformance[module].total++;
                    if (wasCorrect) modulePerformance[module].wins++;
                }
            }
        }

        // Ağırlıkları performansa göre ayarla
        const learnedWeights = { core: {}, pulse: {} };
        let totalWeight = 0;

        for (const [module, perf] of Object.entries(modulePerformance)) {
            const winRate = perf.total > 0 ? perf.wins / perf.total : 0.5;
            const baseWeight = 0.1;
            const adjustedWeight = baseWeight * (0.5 + winRate); // 0.05 - 0.15 arası
            learnedWeights.core[module] = adjustedWeight;
            learnedWeights.pulse[module] = adjustedWeight * 1.1; // Pulse biraz daha agresif
            totalWeight += adjustedWeight;
        }

        // Normalize
        for (const type of ['core', 'pulse']) {
            learnedWeights[type] = this.normalizeWeights(learnedWeights[type]);
        }

        // Kaydet
        this.dynamicConfig = {
            weights: learnedWeights,
            learningNotes: `${this.performanceLogs.length} işlemden öğrenildi. Son güncelleme: ${new Date().toLocaleString()}`,
            lastUpdated: new Date().toISOString()
        };

        this.saveToDisk();
        console.log('🧠 Chiron: Ağırlıklar performansa göre güncellendi.');
    }

    // ==========================================
    // PERSISTENCE
    // ==========================================

    saveToDisk() {
        try {
            const data = JSON.stringify({
                dynamicConfig: this.dynamicConfig,
                performanceLogs: this.performanceLogs.slice(-50) // Son 50 log
            });
            localStorage.setItem(this.persistenceKey, data);
        } catch (e) {
            console.error('Chiron save error:', e);
        }
    }

    loadFromDisk() {
        try {
            const data = localStorage.getItem(this.persistenceKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.dynamicConfig = parsed.dynamicConfig || null;
                this.performanceLogs = parsed.performanceLogs || [];
                console.log('💾 Chiron: Öğrenilmiş ağırlıklar yüklendi.');
            }
        } catch (e) {
            console.error('Chiron load error:', e);
        }
    }

    reset() {
        this.dynamicConfig = null;
        this.performanceLogs = [];
        localStorage.removeItem(this.persistenceKey);
        console.log('🔄 Chiron: Öğrenme verileri sıfırlandı.');
    }

    // ==========================================
    // STATUS
    // ==========================================

    getStatus() {
        return {
            hasLearnedWeights: !!this.dynamicConfig,
            logCount: this.performanceLogs.length,
            lastUpdated: this.dynamicConfig?.lastUpdated || null,
            learningNotes: this.dynamicConfig?.learningNotes || 'Henüz öğrenme yok'
        };
    }
}

export const chironRegimeEngine = new ChironRegimeEngine();
export default ChironRegimeEngine;
