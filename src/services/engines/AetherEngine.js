/**
 * AetherEngine.js
 * Nova TradeBot - Makro Piyasa Analiz Motoru
 * 
 * "Piyasa şu an Boğa mı, Ayı mı?" sorusuna (Market Regime) cevap verir.
 * Genel piyasa riskini ölçer ve bir "Risk Çarpanı" üretir.
 */

import { BinanceProvider } from '../data/BinanceProvider.js';

export class AetherEngine {

    /**
     * Piyasa genel trendini analiz eder.
     * @returns {Promise<Object>} { multiplier: number, isBullish: boolean, reason: string }
     */
    static async calculateMarketRiskMultiplier() {
        // Kripto piyasası için BTC ana göstergedir
        const benchmarkSymbol = 'BTCUSDT';

        try {
            // 1. Binance Teknik Verileri (SMA 50/200)
            const candles = await BinanceProvider.fetchCandles(benchmarkSymbol, '1d', 200);
            if (!candles || candles.length < 50) {
                return { multiplier: 1.0, isBullish: true, reason: 'Veri yok, varsayılan iyimser.' };
            }

            const closes = candles.map(c => c.close);
            const currentPrice = closes[closes.length - 1];
            const sma50 = this._calculateSimpleSMA(closes, 50);
            const sma200 = this._calculateSimpleSMA(closes, 200);

            let multiplier = 1.0;
            let isBullish = true;
            let reasons = [];

            // Uzun vadeli trend kontrolü
            if (currentPrice < sma200) {
                multiplier *= 0.85;
                isBullish = false;
                reasons.push('Fiyat 200 SMA altında (Ayı Eğilimi)');
            } else {
                reasons.push('Fiyat 200 SMA üstünde (Boğa Eğilimi)');
            }

            // 2. Global Fear & Greed Index (Duygusallık Analizi) - Smart Cache
            if (!this._fngCache || Date.now() - this._fngCache.time > 3600000) { // 1 Saatlik Önbellek
                try {
                    const fngResponse = await fetch('https://api.alternative.me/fng/');
                    const fngData = await fngResponse.json();
                    if (fngData && fngData.data && fngData.data[0]) {
                        this._fngCache = {
                            time: Date.now(),
                            value: parseInt(fngData.data[0].value),
                            class: fngData.data[0].value_classification
                        };
                    }
                } catch (e) {
                    console.warn('F&G Index Alınamadı:', e.message);
                }
            }

            if (this._fngCache) {
                const fngValue = this._fngCache.value;
                if (fngValue <= 20) { multiplier *= 1.15; reasons.push(`Aşırı Korku (%${fngValue}): Panik alım fırsatı.`); }
                else if (fngValue >= 80) { multiplier *= 0.70; reasons.push(`Aşırı Açgözlülük (%${fngValue}): Balon uyarısı.`); }
                else if (fngValue < 40) { multiplier *= 1.05; reasons.push(`Korku Hakim (%${fngValue})`); }
                else if (fngValue > 65) { multiplier *= 0.90; reasons.push(`Açgözlülük Hakim (%${fngValue})`); }
            }

            // 3. Volatilite Kontrolü
            const volatility = this._calculateVolatility(closes, 14);
            if (volatility > 10.0) {
                multiplier *= 0.90;
                reasons.push('Yüksek Volatilite');
            }

            return { multiplier, isBullish, reason: reasons.join(' | ') };

        } catch (error) {
            console.warn('AetherEngine Error:', error);
            return { multiplier: 1.0, isBullish: true, reason: 'Analiz Hatası (Varsayılan)' };
        }
    }

    static _calculateSimpleSMA(data, period) {
        if (data.length < period) return data[0]; // Yetersiz veride son fiyatı dön
        const slice = data.slice(-period);
        const sum = slice.reduce((a, b) => a + b, 0);
        return sum / period;
    }

    static _calculateVolatility(data, period) {
        if (data.length < period + 1) return 0;
        const slice = data.slice(-period);

        // Yüzdelik değişimlerin standart sapması
        const returns = [];
        for (let i = 1; i < slice.length; i++) {
            returns.push((slice[i] - slice[i - 1]) / slice[i - 1] * 100);
        }

        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;

        return Math.sqrt(variance);
    }
}
