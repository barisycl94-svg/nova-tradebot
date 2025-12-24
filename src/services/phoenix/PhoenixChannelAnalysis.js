/**
 * PhoenixChannelAnalysis.js
 * Linear Regression Channel & Mean Reversion Engine
 * Argus 04_phoenix.md'den uyarlandı
 * 
 * İki modda çalışır:
 * 1. TREND MODE: Yükseliş trendinde pullback fırsatları
 * 2. REVERSION MODE: Aşırı satımdan dönüş (kanal dibinden)
 */

export class PhoenixChannelAnalysis {

    /**
     * Linear Regression Channel hesaplar
     * @param {number[]} closes - Kapanış fiyatları
     * @param {number} multiplier - Kanal genişliği çarpanı (default 2.0)
     * @returns {Object} { slope, mid, upper, lower, sigma }
     */
    static calculateLinRegChannel(closes, multiplier = 2.0) {
        const n = closes.length;
        if (n < 20) return null;

        // Linear Regression: y = mx + b
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += closes[i];
            sumXY += i * closes[i];
            sumX2 += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Standard deviation from the line
        let deviations = [];
        for (let i = 0; i < n; i++) {
            const predicted = intercept + slope * i;
            deviations.push(closes[i] - predicted);
        }

        const variance = deviations.reduce((a, b) => a + b * b, 0) / n;
        const sigma = Math.sqrt(variance);

        // Channel levels at last bar
        const finalX = n - 1;
        const mid = intercept + slope * finalX;
        const upper = mid + (multiplier * sigma);
        const lower = mid - (multiplier * sigma);

        return { slope, intercept, mid, upper, lower, sigma };
    }

    /**
     * RSI hesaplar
     * @param {number[]} closes 
     * @param {number} period 
     * @returns {number[]}
     */
    static calculateRSI(closes, period = 14) {
        if (closes.length < period + 1) return [];

        const rsis = [];
        let gains = 0, losses = 0;

        // İlk periyod için ortalama gain/loss
        for (let i = 1; i <= period; i++) {
            const change = closes[i] - closes[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        for (let i = period; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;

            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;

            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));
            rsis.push(rsi);
        }

        return rsis;
    }

    /**
     * Bullish Divergence kontrolü
     * Fiyat düşük yaparken RSI yükseliyor = Bullish Divergence
     */
    static checkBullishDivergence(candles, rsiValues) {
        if (rsiValues.length < 20) return false;

        const rsiSlice = rsiValues.slice(-20);
        const candleSlice = candles.slice(-20);

        // RSI dip noktalarını bul
        const dips = [];
        for (let i = 1; i < rsiSlice.length - 1; i++) {
            if (rsiSlice[i] < rsiSlice[i - 1] && rsiSlice[i] < rsiSlice[i + 1]) {
                dips.push({ index: i, rsi: rsiSlice[i], price: candleSlice[i].low });
            }
        }

        if (dips.length < 2) return false;

        const lastDip = dips[dips.length - 1];
        const priorDip = dips[dips.length - 2];

        // Fiyat düşük yapıyor (lower low) AMA RSI yüksek yapıyor (higher low)
        return lastDip.price < priorDip.price && lastDip.rsi > priorDip.rsi;
    }

    /**
     * Ana Phoenix analizi
     * @param {Array} candles - { open, high, low, close, volume }
     * @returns {Object} PhoenixAdvice
     */
    static analyze(candles) {
        if (!candles || candles.length < 60) {
            return {
                status: 'INACTIVE',
                mode: 'INSUFFICIENT_DATA',
                score: 0,
                reason: 'Yetersiz veri (min 60 mum gerekli)'
            };
        }

        const closes = candles.map(c => c.close);
        const currentPrice = closes[closes.length - 1];

        // 1. Linear Regression Channel
        const channel = this.calculateLinRegChannel(closes.slice(-50), 2.0);
        if (!channel) {
            return { status: 'INACTIVE', mode: 'CALCULATION_ERROR', score: 0 };
        }

        // 2. RSI
        const rsiValues = this.calculateRSI(closes, 14);
        const currentRSI = rsiValues[rsiValues.length - 1] || 50;
        const prevRSI = rsiValues[rsiValues.length - 2] || 50;

        // 3. Divergence kontrolü
        const hasDivergence = this.checkBullishDivergence(candles, rsiValues);

        // 4. Mod tespiti
        const isUptrend = channel.slope > 0 && currentPrice > channel.mid;
        const isPullback = isUptrend && currentPrice < (channel.mid + 0.3 * channel.sigma) && currentRSI < 60;
        const touchLowerBand = currentPrice <= (channel.lower + 0.1 * channel.sigma);
        const rsiReversal = currentRSI >= 40 && prevRSI < 40 && currentRSI > prevRSI;

        // 5. Hibrit Skorlama
        let score = 50;
        let mode = 'NEUTRAL';
        let reasons = [];

        if (isUptrend) {
            // === TREND MODE ===
            mode = 'TREND';
            score += 10;
            reasons.push('Yükseliş trendi');

            if (isPullback) {
                score += 15;
                reasons.push('Pullback fırsatı');
            }
            if (currentRSI < 50) {
                score += 5;
                reasons.push('RSI aşırı alım değil');
            }
            if (channel.slope > (channel.mid * 0.001)) {
                score += 10;
                reasons.push('Güçlü trend eğimi');
            }
        } else {
            // === MEAN REVERSION MODE ===
            mode = 'REVERSION';

            if (touchLowerBand) {
                score += 15;
                reasons.push('Kanal dibine temas');
            }
            if (rsiReversal) {
                score += 10;
                reasons.push('RSI dönüş sinyali');
            }
            if (hasDivergence) {
                score += 15;
                reasons.push('Bullish divergence');
            }
            if (channel.slope > 0) {
                score += 10;
                reasons.push('Trend hala yukarı');
            }
        }

        // Hacim spike kontrolü
        if (candles.length >= 21) {
            const recentVol = candles.slice(-21, -1).reduce((a, c) => a + c.volume, 0) / 20;
            const currentVol = candles[candles.length - 1].volume;
            if (recentVol > 0 && currentVol > 1.5 * recentVol) {
                score += 5;
                reasons.push('Hacim spike');
            }
        }

        // Cezalar
        if (channel.slope < -(channel.mid * 0.0005)) {
            score -= 15;
            reasons.push('Güçlü düşüş trendi (ceza)');
        }
        if ((channel.sigma / channel.mid) > 0.08) {
            score -= 10;
            reasons.push('Yüksek volatilite (ceza)');
        }

        score = Math.max(0, Math.min(100, score));

        // Hedef fiyatlar
        const t1 = channel.mid;
        const t2 = channel.slope < 0 ? channel.mid + (channel.upper - channel.mid) * 0.5 : channel.upper;

        return {
            status: score > 60 ? 'ACTIVE' : 'INACTIVE',
            mode,
            score,
            channel: {
                upper: channel.upper,
                mid: channel.mid,
                lower: channel.lower,
                slope: channel.slope
            },
            entryZone: {
                low: channel.lower - (0.1 * channel.sigma),
                high: channel.lower + (0.9 * channel.sigma)
            },
            targets: [t1, t2],
            rsi: currentRSI,
            hasDivergence,
            reasons,
            summary: reasons.length > 0 ? reasons.join(' | ') : 'Sinyal yok'
        };
    }
}
