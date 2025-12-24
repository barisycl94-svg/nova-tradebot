/**
 * PhoenixScenarioEngine.js
 * Nova TradeBot - Gelecek Senaryoları Motoru
 * 
 * Fiyatın istatistiksel olarak gidebileceği hedefleri (Regresyon) belirler.
 * Lineer Regresyon Kanalı tekniğini kullanır.
 */

import { NovaDecisionResult, DecisionTrace } from '../../models/NovaTypes.js';
import { SignalAction } from '../../models/Models.js';

export class PhoenixScenarioEngine {

    /**
     * Fiyatın regresyon kanalı içindeki konumunu analiz eder.
     * @param {number[]} closes - Kapanış fiyatları (Eskiden yeniye)
     * @returns {Object} { score: number, traces: DecisionTrace[], projection: Object }
     */
    static analyze(closes) {
        if (!closes || closes.length < 30) {
            return { score: 50, traces: [] };
        }

        // Son 30-50 mumu baz alarak regresyon hesapla
        const lookback = Math.min(closes.length, 50);
        const data = closes.slice(-lookback);

        const { slope, intercept, stdDev } = this._calculateLinearRegression(data);

        // Güncel fiyatın kanal içindeki konumu
        const lastIndex = data.length - 1;
        const lastPrice = data[lastIndex];
        const expectedPrice = (slope * lastIndex) + intercept;

        // Standart Sapma kanalları (Bollinger benzeri ama lineer)
        const upperChannel = expectedPrice + (2 * stdDev);
        const lowerChannel = expectedPrice - (2 * stdDev);

        let score = 50;
        const traces = [];

        // Trend Yönü
        const trend = slope > 0 ? "Yükseliş" : "Düşüş";
        const trendScore = slope > 0 ? 65 : 35;
        traces.push(new DecisionTrace('Phoenix-Trend', signalFromSlope(slope), `Trend Eğimi: ${trend} (${slope.toFixed(4)})`, 0.2, trendScore));

        // Kanal Konumu Analizi
        const deviation = lastPrice - expectedPrice;
        const zScore = deviation / stdDev; // Kaç standart sapma uzakta?

        if (zScore < -1.5) {
            // Analitik olarak "Ucuz" bölge (Mean Reversion)
            score += 25;
            traces.push(new DecisionTrace('Phoenix-Channel', SignalAction.BUY, `Fiyat alt kanal bandında (Aşırı Satım) Z: ${zScore.toFixed(2)}`, 0.2, 80));
        } else if (zScore > 1.5) {
            // Analitik olarak "Pahalı" bölge
            score -= 25;
            traces.push(new DecisionTrace('Phoenix-Channel', SignalAction.SELL, `Fiyat üst kanal bandında (Aşırı Alım) Z: ${zScore.toFixed(2)}`, 0.2, 20));
        } else {
            // Ortalama civarı
            const action = Math.abs(zScore) < 0.5 ? SignalAction.WAIT : SignalAction.HOLD;
            traces.push(new DecisionTrace('Phoenix-Channel', action, `Fiyat regresyon merkezine yakın. Z: ${zScore.toFixed(2)}`, 0.2, 50));
        }

        if (slope > 0) score += 10; // Trend bonusu
        else score -= 10;

        score = Math.max(0, Math.min(100, score));

        return {
            score,
            traces,
            projection: { expectedPrice, upperChannel, lowerChannel, slope }
        };
    }

    static _calculateLinearRegression(y) {
        const n = y.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += y[i];
            sumXY += i * y[i];
            sumXX += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Standart Sapma Hesapla
        let sumSquaredResiduals = 0;
        for (let i = 0; i < n; i++) {
            const expected = (slope * i) + intercept;
            const residual = y[i] - expected;
            sumSquaredResiduals += residual * residual;
        }
        const stdDev = Math.sqrt(sumSquaredResiduals / n);

        return { slope, intercept, stdDev };
    }
}

function signalFromSlope(slope) {
    if (slope > 0.05) return SignalAction.BUY;
    if (slope < -0.05) return SignalAction.SELL;
    return SignalAction.HOLD;
}
