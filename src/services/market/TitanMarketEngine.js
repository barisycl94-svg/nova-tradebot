/**
 * TitanMarketEngine.js
 * Kripto Genel Piyasa Analizi (Argus Titan'dan uyarlandı)
 * 
 * BTC Dominance, Total Market Cap, Altcoin Season Index analizi yapar
 */

import { realMarketDataService } from '../RealMarketDataProvider.js';

export class TitanMarketEngine {

    /**
     * BTC Dominance analizi (BTC'nin toplam piyasadaki ağırlığı)
     * High dominance = Altcoinler zayıf
     * Low dominance = Altseason potansiyeli
     */
    static async analyzeBTCDominance() {
        // BTC ve ETH fiyatlarını al
        const btcQuote = realMarketDataService.getQuote('BTCUSDT');
        const ethQuote = realMarketDataService.getQuote('ETHUSDT');

        if (!btcQuote || !ethQuote) {
            return { score: 50, dominance: null, trend: 'UNKNOWN' };
        }

        // BTC/ETH oranı (proxy olarak dominance'ı takip eder)
        const btcEthRatio = btcQuote.price / ethQuote.price;

        // Tarihsel ortalama yaklaşık 15-20 arası
        let dominanceTrend = 'NEUTRAL';
        let score = 50;

        if (btcEthRatio > 22) {
            dominanceTrend = 'HIGH'; // BTC çok dominant
            score = 35; // Altcoinler için kötü
        } else if (btcEthRatio > 18) {
            dominanceTrend = 'SLIGHTLY_HIGH';
            score = 45;
        } else if (btcEthRatio < 14) {
            dominanceTrend = 'LOW'; // Altseason
            score = 75;
        } else if (btcEthRatio < 16) {
            dominanceTrend = 'SLIGHTLY_LOW';
            score = 65;
        }

        return {
            score,
            btcEthRatio: btcEthRatio.toFixed(2),
            dominanceTrend,
            recommendation: this.getDominanceRecommendation(dominanceTrend)
        };
    }

    static getDominanceRecommendation(trend) {
        switch (trend) {
            case 'HIGH':
                return '⚠️ BTC Dominant - Altcoinlerde dikkatli ol';
            case 'SLIGHTLY_HIGH':
                return '📊 BTC güçlü - Seçici altcoin al';
            case 'LOW':
                return '🚀 Altseason! - Altcoinler parlıyor';
            case 'SLIGHTLY_LOW':
                return '📈 Altcoinler toparlanıyor';
            default:
                return '📊 Dengeli piyasa';
        }
    }

    /**
     * Piyasa momentum analizi
     * Top 10 coin'in ortalama değişimi
     */
    static analyzeMarketMomentum() {
        const topCoins = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT',
            'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'TRXUSDT', 'DOTUSDT'];

        let totalChange = 0;
        let greenCount = 0;
        let validCount = 0;

        for (const coin of topCoins) {
            const quote = realMarketDataService.getQuote(coin);
            if (quote && quote.priceChangePercent !== undefined) {
                totalChange += quote.priceChangePercent;
                if (quote.priceChangePercent > 0) greenCount++;
                validCount++;
            }
        }

        const avgChange = validCount > 0 ? totalChange / validCount : 0;
        const greenRatio = validCount > 0 ? (greenCount / validCount) * 100 : 50;

        let momentum = 'NEUTRAL';
        let score = 50;

        if (avgChange > 5 && greenRatio > 70) {
            momentum = 'STRONG_BULL';
            score = 85;
        } else if (avgChange > 2 && greenRatio > 60) {
            momentum = 'BULL';
            score = 70;
        } else if (avgChange < -5 && greenRatio < 30) {
            momentum = 'STRONG_BEAR';
            score = 15;
        } else if (avgChange < -2 && greenRatio < 40) {
            momentum = 'BEAR';
            score = 30;
        }

        return {
            score,
            avgChange: avgChange.toFixed(2),
            greenRatio: greenRatio.toFixed(0),
            momentum,
            coinCount: validCount
        };
    }

    /**
     * Fear & Greed benzeri basit endeks
     * RSI, Volatilite ve Momentum'a göre
     */
    static calculateMarketSentiment() {
        const momentum = this.analyzeMarketMomentum();

        // Momentum skorunu 0-100 arası sentiment'e dönüştür
        const sentimentScore = momentum.score;

        let sentiment = 'Neutral';
        let emoji = '😐';

        if (sentimentScore >= 75) {
            sentiment = 'Extreme Greed';
            emoji = '🤑';
        } else if (sentimentScore >= 60) {
            sentiment = 'Greed';
            emoji = '😄';
        } else if (sentimentScore >= 45) {
            sentiment = 'Neutral';
            emoji = '😐';
        } else if (sentimentScore >= 30) {
            sentiment = 'Fear';
            emoji = '😨';
        } else {
            sentiment = 'Extreme Fear';
            emoji = '😱';
        }

        return {
            score: sentimentScore,
            sentiment,
            emoji,
            momentum: momentum.momentum
        };
    }

    /**
     * Genel piyasa skoru (tüm analizlerin birleşimi)
     */
    static async getOverallMarketScore() {
        const dominance = await this.analyzeBTCDominance();
        const momentum = this.analyzeMarketMomentum();
        const sentiment = this.calculateMarketSentiment();

        // Ağırlıklı ortalama
        const overallScore = (
            dominance.score * 0.3 +
            momentum.score * 0.4 +
            sentiment.score * 0.3
        );

        let marketPhase = 'CONSOLIDATION';
        if (overallScore >= 70) marketPhase = 'BULL_MARKET';
        else if (overallScore >= 55) marketPhase = 'EARLY_BULL';
        else if (overallScore <= 30) marketPhase = 'BEAR_MARKET';
        else if (overallScore <= 45) marketPhase = 'LATE_BEAR';

        return {
            overallScore: Math.round(overallScore),
            marketPhase,
            dominance,
            momentum,
            sentiment,
            summary: this.getMarketSummary(marketPhase, sentiment.sentiment)
        };
    }

    static getMarketSummary(phase, sentiment) {
        const phases = {
            'BULL_MARKET': '🚀 Boğa Piyasası - Trend takibi yap',
            'EARLY_BULL': '📈 Erken Boğa - Pozisyon biriktir',
            'CONSOLIDATION': '📊 Konsolidasyon - Seçici ol',
            'LATE_BEAR': '🌅 Ayı Sonu - Fırsat yakın',
            'BEAR_MARKET': '🐻 Ayı Piyasası - Savunmacı ol'
        };
        return phases[phase] || '📊 Piyasa Analizi';
    }
}
