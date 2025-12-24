/**
 * TitanMarketEngine.js
 * Kripto Genel Piyasa Analizi (Argus Titan'dan uyarlandı)
 * 
 * BTC Dominance, Total Market Cap, Altcoin Season Index analizi yapar
 */

import { realMarketDataService } from '../RealMarketDataProvider.js';

export class TitanMarketEngine {

    /**
     * BTC Analizi - Fiyat ve değişim
     */
    static async analyzeBTC() {
        try {
            const quote = realMarketDataService.getQuote('BTCUSDT');
            if (quote) {
                return {
                    price: quote.price,
                    change24h: quote.priceChangePercent || 0,
                    trend: (quote.priceChangePercent || 0) > 0 ? 'UP' : 'DOWN'
                };
            }
            return { price: 90000, change24h: 0, trend: 'NEUTRAL' };
        } catch (e) {
            return { price: 90000, change24h: 0, trend: 'NEUTRAL' };
        }
    }

    /**
     * ETH Analizi - Fiyat ve değişim
     */
    static async analyzeETH() {
        try {
            const quote = realMarketDataService.getQuote('ETHUSDT');
            if (quote) {
                return {
                    price: quote.price,
                    change24h: quote.priceChangePercent || 0,
                    trend: (quote.priceChangePercent || 0) > 0 ? 'UP' : 'DOWN'
                };
            }
            return { price: 3000, change24h: 0, trend: 'NEUTRAL' };
        } catch (e) {
            return { price: 3000, change24h: 0, trend: 'NEUTRAL' };
        }
    }

    /**
     * BTC Dominance analizi (BTC'nin toplam piyasadaki ağırlığı)
     */
    static async analyzeBTCDominance() {
        const btcQuote = realMarketDataService.getQuote('BTCUSDT');
        const ethQuote = realMarketDataService.getQuote('ETHUSDT');

        if (!btcQuote || !ethQuote) {
            return { score: 50, dominance: null, trend: 'UNKNOWN' };
        }

        const btcEthRatio = btcQuote.price / ethQuote.price;
        let dominanceTrend = 'NEUTRAL';
        let score = 50;

        if (btcEthRatio > 22) {
            dominanceTrend = 'HIGH';
            score = 35;
        } else if (btcEthRatio < 14) {
            dominanceTrend = 'LOW';
            score = 75;
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
            case 'HIGH': return '⚠️ BTC Dominant - Altcoinlerde dikkatli ol';
            case 'LOW': return '🚀 Altseason! - Altcoinler parlıyor';
            default: return '📊 Dengeli piyasa';
        }
    }

    /**
     * Piyasa momentum analizi
     */
    static analyzeMarketMomentum() {
        const topCoins = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'TRXUSDT', 'DOTUSDT'];
        let totalChange = 0;
        let validCount = 0;

        for (const coin of topCoins) {
            const quote = realMarketDataService.getQuote(coin);
            if (quote && quote.priceChangePercent !== undefined) {
                totalChange += quote.priceChangePercent;
                validCount++;
            }
        }

        const avgChange = validCount > 0 ? totalChange / validCount : 0;
        let score = 50 + (avgChange * 5); // Basit momentum skoru
        score = Math.max(0, Math.min(100, score));

        return {
            score: Math.round(score),
            avgChange: avgChange.toFixed(2),
            momentum: avgChange > 1 ? 'BULL' : avgChange < -1 ? 'BEAR' : 'NEUTRAL'
        };
    }

    static getOverallScore() {
        const momentum = this.analyzeMarketMomentum();
        return momentum.score;
    }

    static calculateMarketSentiment() {
        const score = this.getOverallScore();
        if (score >= 75) return { score, sentiment: 'Extreme Greed', emoji: '🤑' };
        if (score >= 60) return { score, sentiment: 'Greed', emoji: '😄' };
        if (score >= 40) return { score, sentiment: 'Neutral', emoji: '😐' };
        if (score >= 25) return { score, sentiment: 'Fear', emoji: '😨' };
        return { score, sentiment: 'Extreme Fear', emoji: '😱' };
    }

    static async getOverallMarketScore() {
        const dominance = await this.analyzeBTCDominance();
        const momentum = this.analyzeMarketMomentum();
        const sentiment = this.calculateMarketSentiment();

        const overallScore = Math.round(dominance.score * 0.4 + momentum.score * 0.6);

        return {
            overallScore,
            marketPhase: overallScore > 60 ? 'BULL_MARKET' : overallScore < 40 ? 'BEAR_MARKET' : 'CONSOLIDATION',
            dominance,
            momentum,
            sentiment,
            summary: overallScore > 60 ? '🚀 Piyasa Pozitif' : overallScore < 40 ? '🐻 Piyasa Negatif' : '📊 Piyasa Yatay'
        };
    }
}
