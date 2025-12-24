/**
 * AthenaCryptoFactorEngine.js
 * Kripto Faktör Analizi (Argus 09_athena.md'den uyarlandı)
 * 
 * Kripto için uyarlanmış faktörler:
 * - Momentum: Fiyat değişimi ve trend gücü
 * - Quality: Volatilite, likidite, market cap stabilitesi
 * - Value: RSI tabanlı aşırı satım/alım
 * - Growth: Hacim büyümesi, fiyat ivmesi
 */

import { realMarketDataService } from '../RealMarketDataProvider.js';

export class AthenaCryptoFactorEngine {

    /**
     * Momentum Faktörü
     * Son 7, 14, 30 günlük performansa göre skor
     */
    static calculateMomentumFactor(candles) {
        if (!candles || candles.length < 30) {
            return { score: 50, details: 'Yetersiz veri' };
        }

        const closes = candles.map(c => c.close);
        const currentPrice = closes[closes.length - 1];

        // 7 günlük değişim
        const price7d = closes[closes.length - 8] || currentPrice;
        const change7d = ((currentPrice - price7d) / price7d) * 100;

        // 14 günlük değişim
        const price14d = closes[closes.length - 15] || currentPrice;
        const change14d = ((currentPrice - price14d) / price14d) * 100;

        // 30 günlük değişim
        const price30d = closes[closes.length - 31] || currentPrice;
        const change30d = ((currentPrice - price30d) / price30d) * 100;

        // Ağırlıklı momentum skoru
        let score = 50;

        // 7 günlük (en yüksek ağırlık)
        if (change7d > 15) score += 20;
        else if (change7d > 5) score += 12;
        else if (change7d > 0) score += 5;
        else if (change7d > -5) score -= 5;
        else if (change7d > -15) score -= 12;
        else score -= 20;

        // 14 günlük
        if (change14d > 20) score += 15;
        else if (change14d > 10) score += 8;
        else if (change14d > 0) score += 3;
        else score -= 8;

        // 30 günlük (trend doğrulama)
        if (change30d > 30) score += 10;
        else if (change30d > 15) score += 5;
        else if (change30d < -20) score -= 10;

        score = Math.max(0, Math.min(100, score));

        return {
            score,
            change7d: change7d.toFixed(2),
            change14d: change14d.toFixed(2),
            change30d: change30d.toFixed(2),
            details: `7D: ${change7d > 0 ? '+' : ''}${change7d.toFixed(1)}%, 30D: ${change30d > 0 ? '+' : ''}${change30d.toFixed(1)}%`
        };
    }

    /**
     * Quality Faktörü
     * Volatilite, likidite ve istikrar
     */
    static calculateQualityFactor(candles) {
        if (!candles || candles.length < 20) {
            return { score: 50, details: 'Yetersiz veri' };
        }

        // Volatilite (düşük daha iyi)
        const closes = candles.slice(-20).map(c => c.close);
        const returns = [];
        for (let i = 1; i < closes.length; i++) {
            returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
        }
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance) * 100;

        // Hacim tutarlılığı (yüksek daha iyi)
        const volumes = candles.slice(-20).map(c => c.volume || 0);
        const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const volumeStdDev = Math.sqrt(
            volumes.reduce((a, b) => a + Math.pow(b - avgVolume, 2), 0) / volumes.length
        );
        const volumeCV = avgVolume > 0 ? (volumeStdDev / avgVolume) : 1;

        let score = 50;

        // Volatilite skoru (düşük volatilite = yüksek kalite)
        if (volatility < 2) score += 20;
        else if (volatility < 4) score += 12;
        else if (volatility < 6) score += 5;
        else if (volatility > 10) score -= 15;
        else if (volatility > 8) score -= 8;

        // Hacim tutarlılığı skoru
        if (volumeCV < 0.3) score += 15;
        else if (volumeCV < 0.5) score += 8;
        else if (volumeCV > 1) score -= 10;

        score = Math.max(0, Math.min(100, score));

        return {
            score,
            volatility: volatility.toFixed(2),
            volumeConsistency: (1 - volumeCV).toFixed(2),
            details: `Vol: ${volatility.toFixed(1)}%, Hacim Tutarlılık: ${((1 - volumeCV) * 100).toFixed(0)}%`
        };
    }

    /**
     * Value Faktörü
     * RSI bazlı aşırı alım/satım
     */
    static calculateValueFactor(candles) {
        if (!candles || candles.length < 15) {
            return { score: 50, details: 'Yetersiz veri' };
        }

        // RSI hesapla
        const closes = candles.map(c => c.close);
        const rsi = this.calculateRSI(closes, 14);

        let score = 50;
        let status = 'Nötr';

        // Aşırı satım = değerli (alım fırsatı)
        if (rsi < 25) {
            score = 85;
            status = 'Aşırı Satım (Fırsat)';
        } else if (rsi < 35) {
            score = 70;
            status = 'Satım Bölgesi';
        } else if (rsi < 45) {
            score = 60;
            status = 'Düşük';
        } else if (rsi > 75) {
            score = 20;
            status = 'Aşırı Alım (Dikkat)';
        } else if (rsi > 65) {
            score = 35;
            status = 'Yüksek';
        } else {
            score = 50;
            status = 'Nötr Bölge';
        }

        return {
            score,
            rsi: rsi.toFixed(1),
            status,
            details: `RSI: ${rsi.toFixed(0)} - ${status}`
        };
    }

    /**
     * Growth Faktörü
     * Hacim ve fiyat ivmesi
     */
    static calculateGrowthFactor(candles) {
        if (!candles || candles.length < 20) {
            return { score: 50, details: 'Yetersiz veri' };
        }

        // Son 7 gün hacim ortalaması vs önceki 7 gün
        const recentVolumes = candles.slice(-7).map(c => c.volume || 0);
        const previousVolumes = candles.slice(-14, -7).map(c => c.volume || 0);

        const recentAvg = recentVolumes.reduce((a, b) => a + b, 0) / 7;
        const previousAvg = previousVolumes.reduce((a, b) => a + b, 0) / 7;

        const volumeGrowth = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

        // Fiyat ivmesi (momentum of momentum)
        const closes = candles.map(c => c.close);
        const recentChange = ((closes[closes.length - 1] - closes[closes.length - 4]) / closes[closes.length - 4]) * 100;
        const previousChange = ((closes[closes.length - 4] - closes[closes.length - 8]) / closes[closes.length - 8]) * 100;
        const acceleration = recentChange - previousChange;

        let score = 50;

        // Hacim büyümesi
        if (volumeGrowth > 50) score += 20;
        else if (volumeGrowth > 25) score += 12;
        else if (volumeGrowth > 0) score += 5;
        else if (volumeGrowth < -30) score -= 15;
        else if (volumeGrowth < -15) score -= 8;

        // Fiyat ivmesi
        if (acceleration > 5) score += 15;
        else if (acceleration > 2) score += 8;
        else if (acceleration < -5) score -= 12;
        else if (acceleration < -2) score -= 5;

        score = Math.max(0, Math.min(100, score));

        return {
            score,
            volumeGrowth: volumeGrowth.toFixed(1),
            acceleration: acceleration.toFixed(2),
            details: `Hacim: ${volumeGrowth > 0 ? '+' : ''}${volumeGrowth.toFixed(0)}%, İvme: ${acceleration > 0 ? '+' : ''}${acceleration.toFixed(1)}`
        };
    }

    /**
     * Tüm faktörleri birleştir
     */
    static async analyzeAll(candles) {
        const momentum = this.calculateMomentumFactor(candles);
        const quality = this.calculateQualityFactor(candles);
        const value = this.calculateValueFactor(candles);
        const growth = this.calculateGrowthFactor(candles);

        // Ağırlıklı ortalama (Kripto için momentum ağırlıklı)
        const overallScore = (
            momentum.score * 0.35 +
            quality.score * 0.20 +
            value.score * 0.25 +
            growth.score * 0.20
        );

        // En güçlü ve en zayıf faktör
        const factors = [
            { name: 'Momentum', score: momentum.score },
            { name: 'Quality', score: quality.score },
            { name: 'Value', score: value.score },
            { name: 'Growth', score: growth.score }
        ];

        factors.sort((a, b) => b.score - a.score);
        const strongest = factors[0];
        const weakest = factors[factors.length - 1];

        return {
            overallScore: Math.round(overallScore),
            factors: {
                momentum,
                quality,
                value,
                growth
            },
            strongest,
            weakest,
            recommendation: this.getRecommendation(overallScore, strongest, weakest)
        };
    }

    static getRecommendation(score, strongest, weakest) {
        if (score >= 70) {
            return `🚀 Güçlü faktörler! ${strongest.name} özellikle dikkat çekici.`;
        } else if (score >= 55) {
            return `📈 Olumlu görünüm. ${strongest.name} destekliyor.`;
        } else if (score >= 45) {
            return `📊 Nötr faktörler. ${weakest.name} zayıf.`;
        } else {
            return `⚠️ Zayıf faktörler. ${weakest.name} dikkat gerektiriyor.`;
        }
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
