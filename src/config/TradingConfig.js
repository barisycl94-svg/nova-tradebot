/**
 * TradingConfig.js
 * Nova TradeBot - Trading Modları ve Konfigürasyon
 */

// Trading Modları - İsimler ve Eşik Değerleri
export const TRADING_MODES = {
    CONSERVATIVE: {
        id: 'conservative',
        name: '🛡️ Temkinli',
        description: 'Düşük risk, yüksek güvenilirlik.',
        buyThreshold: 70, sellThreshold: 42,
        trailingStart: 10.0, slPercent: 3.0, tpPercent: 15.0, timeoutHours: 72,
        color: '#4ade80'
    },
    BALANCED: {
        id: 'balanced',
        name: '⚖️ Dengeli',
        description: 'Orta risk ve getiri dengesi.',
        buyThreshold: 65, sellThreshold: 45,
        trailingStart: 5.0, slPercent: 5.0, tpPercent: 20.0, timeoutHours: 48,
        color: '#00f3ff'
    },
    TRADER: {
        id: 'trader',
        name: '📈 Trader',
        description: 'Aktif trading, hızlı hareketler.',
        buyThreshold: 60, sellThreshold: 48,
        trailingStart: 3.5, slPercent: 6.0, tpPercent: 25.0, timeoutHours: 24,
        color: '#f59e0b'
    },
    AGGRESSIVE: {
        id: 'aggressive',
        name: '🔥 Agresif',
        description: 'Yüksek risk, yüksek potansiyel.',
        buyThreshold: 55, sellThreshold: 50,
        trailingStart: 2.5, slPercent: 8.0, tpPercent: 35.0, timeoutHours: 12,
        color: '#ef4444'
    },
    SCALPER: {
        id: 'scalper',
        name: '⚡ Scalper',
        description: 'Ultra agresif, anlık karlar.',
        buyThreshold: 53, sellThreshold: 48,
        trailingStart: 1.5, slPercent: 3.0, tpPercent: 7.0, timeoutHours: 4,
        color: '#a855f7'
    },
    COMMISSION_RATE: 0.001 // %0.1 Binance Standard Komisyonu
};

/**
 * Skorlama Stratejileri (Argus 12_argus.md)
 * CORE: Uzun vadeli yatırım (fundamental ağırlıklı)
 * PULSE: Kısa vadeli trading (teknik ağırlıklı)
 */
export const SCORING_STRATEGY = {
    CORE: {
        id: 'core',
        name: '💎 Core (Yatırım)',
        description: 'Uzun vadeli, fundamental odaklı',
        weights: {
            orion: 0.20,    // Teknik düşük
            atlas: 0.30,    // Fundamental yüksek
            aether: 0.20,   // Makro önemli
            phoenix: 0.10,  // Senaryo düşük
            demeter: 0.08,  // Sektör önemli
            titan: 0.05,
            athena: 0.04,
            hermes: 0.03
        }
    },
    PULSE: {
        id: 'pulse',
        name: '⚡ Pulse (Trading)',
        description: 'Kısa vadeli, teknik odaklı',
        weights: {
            orion: 0.40,    // Teknik çok yüksek
            atlas: 0.10,    // Fundamental düşük
            aether: 0.10,   // Makro orta
            phoenix: 0.15,  // Senaryo önemli
            demeter: 0.05,
            titan: 0.08,
            athena: 0.05,
            hermes: 0.07    // Haberler önemli
        }
    }
};

// Varsayılan mod
export const DEFAULT_MODE = 'balanced';
export const DEFAULT_SCORING = 'pulse'; // Varsayılan olarak trading odaklı

import { persistence } from '../services/PersistenceService.js';

/**
 * Trading Config Singleton
 * Uygulamanın trading modunu ve eşiklerini yönetir
 */
class TradingConfigManager {
    constructor() {
        if (TradingConfigManager.instance) {
            return TradingConfigManager.instance;
        }

        // LocalStorage'dan modu yükle
        const savedMode = persistence.getItem('novaTradeBot_tradingMode');
        this.currentMode = savedMode || DEFAULT_MODE;

        // Skorlama stratejisini yükle
        const savedScoring = persistence.getItem('novaTradeBot_scoringStrategy');
        this.scoringStrategy = savedScoring || DEFAULT_SCORING;

        TradingConfigManager.instance = this;
    }

    /**
     * Mevcut trading modunu al
     */
    getMode() {
        return this.currentMode;
    }

    /**
     * Trading modunu ayarla
     */
    setMode(modeId) {
        const validModes = Object.values(TRADING_MODES).map(m => m.id);
        if (validModes.includes(modeId)) {
            this.currentMode = modeId;
            persistence.setItem('novaTradeBot_tradingMode', modeId);
            console.log(`🎯 Trading modu değişti: ${this.getModeConfig().name}`);
            return true;
        }
        return false;
    }

    /**
     * Mevcut modun konfigürasyonunu al
     */
    getModeConfig() {
        return Object.values(TRADING_MODES).find(m => m.id === this.currentMode) || TRADING_MODES.BALANCED;
    }

    /**
     * Alım eşiğini al
     */
    getBuyThreshold() {
        return this.getModeConfig().buyThreshold;
    }

    /**
     * Satış eşiğini al
     */
    getSellThreshold() {
        return this.getModeConfig().sellThreshold;
    }

    /**
     * Tüm modları listele
     */
    getAllModes() {
        return Object.values(TRADING_MODES);
    }

    // ========== SKORLAMA STRATEJİSİ (Core vs Pulse) ==========

    /**
     * Mevcut skorlama stratejisini al
     */
    getScoringStrategy() {
        return this.scoringStrategy;
    }

    /**
     * Skorlama stratejisini ayarla
     */
    setScoringStrategy(strategyId) {
        const validStrategies = Object.values(SCORING_STRATEGY).map(s => s.id);
        if (validStrategies.includes(strategyId)) {
            this.scoringStrategy = strategyId;
            persistence.setItem('novaTradeBot_scoringStrategy', strategyId);
            console.log(`📊 Skorlama stratejisi değişti: ${this.getScoringConfig().name}`);
            return true;
        }
        return false;
    }

    /**
     * Mevcut skorlama stratejisinin konfigürasyonunu al
     */
    getScoringConfig() {
        return Object.values(SCORING_STRATEGY).find(s => s.id === this.scoringStrategy) || SCORING_STRATEGY.PULSE;
    }

    /**
     * Skorlama ağırlıklarını al
     */
    getScoringWeights() {
        return this.getScoringConfig().weights;
    }

    /**
     * Tüm skorlama stratejilerini listele
     */
    getAllScoringStrategies() {
        return Object.values(SCORING_STRATEGY);
    }
}

// Singleton export
export const tradingConfig = new TradingConfigManager();
