/**
 * NovaTypes.js
 * Nova TradeBot - Gelişmiş Tipler ve Analiz Yapıları
 * 
 * Bu dosya, "Nova" karar mekanizması tarafından kullanılan 
 * detaylı analiz sonuçlarını ve karar izleme yapılarını içerir.
 */

import { SignalAction } from './Models.js';

/**
 * Bir varlık için üretilen detaylı puan kartı.
 * 4 Ana Modülden gelen verileri birleştirir:
 * - Atlas (Temel Analiz)
 * - Orion (Teknik Analiz)
 * - Aether (Makroekonomik Analiz)
 * - Hermes (Haber/Sentiment Analizi)
 */
export class NovaDecisionResult {
    /**
     * @param {string} symbol - Analiz edilen sembol
     * @param {number} atlasScore - Temel Analiz Puanı (0-100)
     * @param {number} orionScore - Teknik Analiz Puanı (0-100)
     * @param {number} aetherScore - Makro Analiz Puanı (0-100)
     * @param {number} hermesScore - Haber Analiz Puanı (0-100)
     * @param {string} finalDecision - Nihai Karar (SignalAction enum değeri)
     * @param {number} confidence - Güven Skoru (0-100)
     */
    constructor(symbol, atlasScore, orionScore, aetherScore, hermesScore, finalDecision, confidence) {
        this.symbol = symbol;

        // Modül Puanları
        this.atlasScore = atlasScore;
        this.orionScore = orionScore;
        this.aetherScore = aetherScore;
        this.hermesScore = hermesScore;

        // Sonuç
        this.finalDecision = finalDecision; // Beklenen: SignalAction.BUY/SELL/HOLD/WAIT
        this.confidence = confidence;

        this.timestamp = new Date();
    }

    /**
     * Genel ortalama skoru hesaplar.
     * Ağırlıklı ortalama stratejisi burada uygulanabilir.
     * Şimdilik basit ortalama.
     */
    get averageScore() {
        return (this.atlasScore + this.orionScore + this.aetherScore + this.hermesScore) / 4;
    }
}

/**
 * Karar mekanizmasının tarihçesini tutan yapı.
 * Hangi modülün ne önerdiğini ve nedenini detaylandırır.
 */
export class DecisionTrace {
    /**
     * @param {string} moduleId - Kararı veren modülün adı (örn: 'Orion-MACD', 'Atlas-PE')
     * @param {string} recommendation - Öneri (SignalAction)
     * @param {string} reason - Neden bu kararı verdi?
     * @param {number} weight - Bu kararın nihai sonuçtaki ağırlığı (0-1)
     * @param {number} score - Modülün skoru (0-100)
     */
    constructor(moduleId, recommendation, reason, weight = 1.0, score = 50) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.timestamp = new Date();
        this.moduleId = moduleId;
        this.recommendation = recommendation;
        this.reason = reason;
        this.weight = weight;
        this.score = score; // 0-100 arası skor
        this.confidence = score; // Güven = Skor
    }

    /**
     * İnsan tarafından okunabilir özet.
     */
    toString() {
        return `[${this.moduleId}] -> ${this.recommendation.label}: ${this.reason} (Skor: ${this.score})`;
    }
}
