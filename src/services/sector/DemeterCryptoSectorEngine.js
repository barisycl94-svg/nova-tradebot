/**
 * DemeterCryptoSectorEngine.js
 * Kripto Sektör Analizi (Argus Demeter'den uyarlandı)
 * 
 * Kripto kategorileri:
 * - Layer 1 (BTC, ETH, SOL, AVAX, ADA)
 * - Layer 2 (MATIC, ARB, OP)
 * - DeFi (UNI, AAVE, LINK)
 * - Meme (DOGE, SHIB, PEPE)
 * - AI/GameFi (SAND, MANA, FET)
 */

import { realMarketDataService } from '../RealMarketDataProvider.js';

export class DemeterCryptoSectorEngine {

    // Kripto Sektör Tanımları
    static SECTORS = {
        layer1: {
            name: 'Layer 1',
            symbol: 'L1',
            coins: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 'ADAUSDT', 'DOTUSDT'],
            color: '#3b82f6', // Mavi
            description: 'Ana blockchain protokolleri'
        },
        layer2: {
            name: 'Layer 2',
            symbol: 'L2',
            coins: ['MATICUSDT', 'ARBUSDT', 'OPUSDT'],
            color: '#8b5cf6', // Mor
            description: 'Ölçeklendirme çözümleri'
        },
        defi: {
            name: 'DeFi',
            symbol: 'DEFI',
            coins: ['UNIUSDT', 'AAVEUSDT', 'LINKUSDT', 'MKRUSDT', 'CRVUSDT', 'SNXUSDT'],
            color: '#10b981', // Yeşil
            description: 'Merkeziyetsiz finans'
        },
        meme: {
            name: 'Meme',
            symbol: 'MEME',
            coins: ['DOGEUSDT', 'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT'],
            color: '#f59e0b', // Turuncu
            description: 'Topluluk odaklı coinler'
        },
        ai: {
            name: 'AI & Data',
            symbol: 'AI',
            coins: ['FETUSDT', 'RENDERUSDT', 'TAOUSDT', 'GRTUSDT', 'OCEANUSDT'],
            color: '#ec4899', // Pembe
            description: 'Yapay zeka ve veri projeleri'
        },
        gaming: {
            name: 'Gaming/Metaverse',
            symbol: 'GAME',
            coins: ['SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'ENJUSDT', 'IMXUSDT'],
            color: '#14b8a6', // Teal
            description: 'Oyun ve metaverse'
        },
        exchange: {
            name: 'Exchange Tokens',
            symbol: 'CEX',
            coins: ['BNBUSDT', 'OKBUSDT', 'CAKEUSDT'],
            color: '#f97316', // Koyu turuncu
            description: 'Borsa tokenleri'
        }
    };

    /**
     * Belirli bir coin'in hangi sektöre ait olduğunu bulur
     */
    static getSectorForCoin(symbol) {
        for (const [key, sector] of Object.entries(this.SECTORS)) {
            if (sector.coins.includes(symbol)) {
                return { id: key, ...sector };
            }
        }
        return { id: 'other', name: 'Diğer', symbol: 'OTHER', color: '#6b7280' };
    }

    /**
     * Tüm sektörlerin performansını hesaplar
     * @returns {Promise<Object>} Sektör performans verileri
     */
    static async analyzeSectorPerformances() {
        const performances = [];

        for (const [sectorId, sector] of Object.entries(this.SECTORS)) {
            let totalChange = 0;
            let validCoins = 0;

            for (const coin of sector.coins) {
                const quote = realMarketDataService.getQuote(coin);
                if (quote && quote.priceChangePercent !== undefined) {
                    totalChange += quote.priceChangePercent;
                    validCoins++;
                }
            }

            const avgChange = validCoins > 0 ? totalChange / validCoins : 0;

            performances.push({
                id: sectorId,
                name: sector.name,
                symbol: sector.symbol,
                color: sector.color,
                change24h: avgChange,
                coinCount: validCoins,
                description: sector.description
            });
        }

        // En iyi performans gösterenden en kötüye sırala
        performances.sort((a, b) => b.change24h - a.change24h);

        return performances;
    }

    /**
     * Sektör rotasyon analizi yapar
     * @returns {Object} Rotasyon sonucu
     */
    static async analyzeRotation() {
        const performances = await this.analyzeSectorPerformances();

        const topSectors = performances.slice(0, 2);
        const bottomSectors = performances.slice(-2);

        // Risk-On vs Risk-Off belirleme
        const riskOnSectors = ['meme', 'gaming', 'ai'];
        const riskOffSectors = ['layer1', 'exchange'];

        const topIsRiskOn = topSectors.some(s => riskOnSectors.includes(s.id));
        const topIsRiskOff = topSectors.some(s => riskOffSectors.includes(s.id));

        let rotationType = 'NEUTRAL';
        if (topIsRiskOn && !topIsRiskOff) {
            rotationType = 'RISK_ON';
        } else if (topIsRiskOff && !topIsRiskOn) {
            rotationType = 'RISK_OFF';
        }

        // Skor hesapla
        let score = 50;

        // En iyi sektör +%10'dan fazla ise bonus
        if (topSectors[0]?.change24h > 10) score += 15;
        else if (topSectors[0]?.change24h > 5) score += 10;
        else if (topSectors[0]?.change24h > 0) score += 5;

        // En kötü sektör -%10'dan fazla düşmüşse ceza
        if (bottomSectors[1]?.change24h < -10) score -= 15;
        else if (bottomSectors[1]?.change24h < -5) score -= 10;

        // Risk-on ortamda bonus
        if (rotationType === 'RISK_ON') score += 10;

        score = Math.max(0, Math.min(100, score));

        return {
            score,
            rotationType,
            topSectors,
            bottomSectors,
            allSectors: performances,
            recommendation: this.getRecommendation(rotationType, topSectors)
        };
    }

    static getRecommendation(rotationType, topSectors) {
        if (rotationType === 'RISK_ON') {
            return `🚀 Risk-On Ortam: ${topSectors.map(s => s.name).join(', ')} sektörleri lider`;
        } else if (rotationType === 'RISK_OFF') {
            return `🛡️ Risk-Off Ortam: Büyük coinlere yöneliş var`;
        }
        return `📊 Karışık Piyasa: Sektörler arası belirgin fark yok`;
    }

    /**
     * Belirli bir coin için sektör skoru hesaplar
     * @param {string} symbol 
     * @returns {Object}
     */
    static async getScoreForCoin(symbol) {
        const sector = this.getSectorForCoin(symbol);
        const rotationAnalysis = await this.analyzeRotation();

        // Coin'in sektörü en iyi performans gösteren sektörlerden biri mi?
        const sectorPerf = rotationAnalysis.allSectors.find(s => s.id === sector.id);
        const sectorRank = rotationAnalysis.allSectors.findIndex(s => s.id === sector.id) + 1;
        const totalSectors = rotationAnalysis.allSectors.length;

        let score = 50;

        // Top 2 sektördeyse bonus
        if (sectorRank <= 2) score += 20;
        else if (sectorRank <= 4) score += 10;
        // Alt 2 sektördeyse ceza
        else if (sectorRank >= totalSectors - 1) score -= 15;

        // Sektör kendisi yükselişte mi?
        if (sectorPerf && sectorPerf.change24h > 5) score += 10;
        else if (sectorPerf && sectorPerf.change24h < -5) score -= 10;

        return {
            score: Math.max(0, Math.min(100, score)),
            sector,
            sectorRank,
            sectorPerformance: sectorPerf?.change24h || 0,
            rotationType: rotationAnalysis.rotationType,
            recommendation: sectorRank <= 3
                ? `✅ ${sector.name} sektörü güçlü (${sectorRank}. sırada)`
                : `⚠️ ${sector.name} sektörü zayıf (${sectorRank}. sırada)`
        };
    }
}
