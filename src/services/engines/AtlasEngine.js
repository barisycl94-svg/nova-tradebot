/**
 * AtlasEngine.js
 * Nova TradeBot - Temel/Kripto Analiz Motoru
 * 
 * Kripto için: Hacim, momentum, volatilite ve piyasa hakimiyeti analizi
 * Hisse için: Finansal rasyolar (P/E, P/B, D/E)
 */

import { NovaDecisionResult, DecisionTrace } from '../../models/NovaTypes.js';
import { SignalAction, AssetType } from '../../models/Models.js';
import { realMarketDataService } from '../RealMarketDataProvider.js';

export class AtlasEngine {

    /**
     * Sembol için temel/kripto analiz puanı üretir.
     * @param {string} symbol
     * @param {string} type - AssetType
     * @returns {Promise<Object>} { score: number, traces: DecisionTrace[] }
     */
    static async analyze(symbol, type = AssetType.STOCK) {
        if (type === AssetType.CRYPTO) {
            return await this._analyzeCrypto(symbol);
        }

        // Hisse için eski mantık
        return this._analyzeStock(symbol);
    }

    /**
     * Kripto için özel analiz - Hacim, Momentum, Volatilite
     */
    static async _analyzeCrypto(symbol) {
        let score = 50;
        const traces = [];

        try {
            // Binance'den veri al
            const quote = realMarketDataService.getQuote(symbol);

            if (quote) {
                // 1. 24 SAAT DEĞİŞİM ANALİZİ (+/- 15 puan)
                const change24h = quote.changePercent || 0;
                if (change24h > 5) {
                    score += 15;
                    traces.push(new DecisionTrace('Atlas-Momentum', SignalAction.BUY,
                        `Güçlü yükseliş: +${change24h.toFixed(2)}% (24s)`, 0.25, 75));
                } else if (change24h > 2) {
                    score += 10;
                    traces.push(new DecisionTrace('Atlas-Momentum', SignalAction.BUY,
                        `Pozitif momentum: +${change24h.toFixed(2)}% (24s)`, 0.25, 65));
                } else if (change24h > 0) {
                    score += 5;
                    traces.push(new DecisionTrace('Atlas-Momentum', SignalAction.HOLD,
                        `Hafif yükseliş: +${change24h.toFixed(2)}% (24s)`, 0.25, 55));
                } else if (change24h > -3) {
                    traces.push(new DecisionTrace('Atlas-Momentum', SignalAction.HOLD,
                        `Nötr hareket: ${change24h.toFixed(2)}% (24s)`, 0.25, 50));
                } else if (change24h > -7) {
                    score -= 10;
                    traces.push(new DecisionTrace('Atlas-Momentum', SignalAction.WAIT,
                        `Düşüş trendi: ${change24h.toFixed(2)}% (24s)`, 0.25, 40));
                } else {
                    score -= 15;
                    traces.push(new DecisionTrace('Atlas-Momentum', SignalAction.SELL,
                        `Sert düşüş: ${change24h.toFixed(2)}% (24s)`, 0.25, 25));
                }

                // 2. HACİM ANALİZİ (+/- 10 puan)
                const volume = quote.quoteVolume || 0;
                if (volume > 100000000) { // 100M+ hacim
                    score += 10;
                    traces.push(new DecisionTrace('Atlas-Volume', SignalAction.BUY,
                        `Yüksek hacim: $${(volume / 1000000).toFixed(0)}M`, 0.2, 70));
                } else if (volume > 10000000) { // 10M+ hacim
                    score += 5;
                    traces.push(new DecisionTrace('Atlas-Volume', SignalAction.HOLD,
                        `Normal hacim: $${(volume / 1000000).toFixed(1)}M`, 0.2, 60));
                } else {
                    traces.push(new DecisionTrace('Atlas-Volume', SignalAction.WAIT,
                        `Düşük hacim: $${(volume / 1000000).toFixed(2)}M`, 0.2, 45));
                }

                // 3. FİYAT RANGE ANALİZİ (high-low arası pozisyon)
                const high = quote.high24h || quote.price;
                const low = quote.low24h || quote.price;
                const price = quote.price;

                if (high > low) {
                    const rangePosition = ((price - low) / (high - low)) * 100;

                    if (rangePosition > 80) {
                        // Günün tepesine yakın - dikkat
                        score -= 5;
                        traces.push(new DecisionTrace('Atlas-Range', SignalAction.WAIT,
                            `Günün tepesinde: %${rangePosition.toFixed(0)} pozisyon`, 0.15, 45));
                    } else if (rangePosition < 30) {
                        // Günün dibine yakın - fırsat olabilir
                        score += 5;
                        traces.push(new DecisionTrace('Atlas-Range', SignalAction.BUY,
                            `Günün dibinde: %${rangePosition.toFixed(0)} pozisyon (Fırsat?)`, 0.15, 70));
                    } else {
                        traces.push(new DecisionTrace('Atlas-Range', SignalAction.HOLD,
                            `Orta bölgede: %${rangePosition.toFixed(0)} pozisyon`, 0.15, 55));
                    }
                }

                // 4. EMİR DEFTERİ (BALİNA) ANALİZİ (+/- 15 puan)
                // Her sinyalde tahtadaki derinliğe ve balina duvarlarına bak
                try {
                    const book = await realMarketDataService.getOrderBook(symbol);
                    if (book && book.bids && book.asks) {
                        const buyPressure = book.bids.reduce((sum, b) => sum + (parseFloat(b[0]) * parseFloat(b[1])), 0);
                        const sellPressure = book.asks.reduce((sum, a) => sum + (parseFloat(a[0]) * parseFloat(a[1])), 0);
                        const totalPressure = buyPressure + sellPressure;
                        const ratio = buyPressure / totalPressure;

                        if (ratio > 0.65) {
                            score += 15;
                            traces.push(new DecisionTrace('Atlas-Whale', SignalAction.BUY,
                                `Güçlü Alış Baskısı: %${(ratio * 100).toFixed(0)} (Balinalar Alıyor)`, 0.15, 85));
                        } else if (ratio < 0.35) {
                            score -= 20; // Duvara çarpmamak için sert ceza
                            traces.push(new DecisionTrace('Atlas-Whale', SignalAction.SELL,
                                `Ağır Satış Duvarı: %${((1 - ratio) * 100).toFixed(0)} (Riskli Bölge)`, 0.15, 20));
                        } else {
                            traces.push(new DecisionTrace('Atlas-Whale', SignalAction.HOLD,
                                `Dengeli Tahta: %${(ratio * 100).toFixed(0)} alış / %${((1 - ratio) * 100).toFixed(0)} satış`, 0.1, 50));
                        }
                    }
                } catch (e) {
                    console.warn(`OrderBook Analysis Failed (${symbol}):`, e.message);
                }
            } else {
                traces.push(new DecisionTrace('Atlas', SignalAction.HOLD,
                    'Veri alınamadı, nötr değerlendirme', 0.25, 50));
            }

        } catch (error) {
            traces.push(new DecisionTrace('Atlas', SignalAction.HOLD,
                'Analiz hatası, nötr', 0.25, 50));
        }

        // Skoru 0-100 arasında tut
        score = Math.max(0, Math.min(100, score));

        return { score, traces };
    }

    /**
     * Küresel piyasa duyarlılığını hesaplar.
     */
    static getGlobalSentiment() {
        const quotes = Object.values(realMarketDataService.quotes);
        if (quotes.length === 0) return { score: 50, mood: 'NÖTR', description: 'Veri bekleniyor...' };

        // BTC'nin durumu (Piyasa lideri)
        const btc = realMarketDataService.getQuote('BTCUSDT');
        const btcChange = btc ? btc.changePercent : 0;

        // Piyasadaki ortalama değişim
        const avgChange = quotes.reduce((sum, q) => sum + (q.changePercent || 0), 0) / quotes.length;

        // Pozitif/Negatif varlık oranı
        const positiveCount = quotes.filter(q => q.changePercent > 0).length;
        const ratio = positiveCount / quotes.length;

        let score = 50;
        let mood = 'NÖTR';
        let description = '';

        score += (btcChange * 5); // BTC etkisi
        score += (avgChange * 3); // Ortalama etki
        score += (ratio - 0.5) * 40; // Dağılım etkisi

        score = Math.max(0, Math.min(100, score));

        if (score > 70) {
            mood = 'BOĞA (BULL)';
            description = 'Piyasada genel bir yükseliş hakim. Risk iştahı yüksek.';
        } else if (score > 55) {
            mood = 'POZİTİF';
            description = 'Piyasa toparlanma eğiliminde. Alım fırsatları değerlendirilebilir.';
        } else if (score < 30) {
            mood = 'AYI (BEAR)';
            description = 'Ağır satış baskısı altında. Portföy korumaya geçilmeli.';
        } else if (score < 45) {
            mood = 'NEGATİF';
            description = 'Düşüş trendi hissediliyor. Dikkatli olunmalı.';
        } else {
            mood = 'YATAY (SIDEWAYS)';
            description = 'Piyasada belirsizlik hakim. Hacimsiz ve yatay seyir.';
        }

        return { score, mood, description, btcChange, avgChange };
    }


    /**
     * Hisse senedi için temel analiz (Mock)
     */
    static _analyzeStock(symbol) {
        const mockFinancials = this._generateMockFinancials(symbol);

        let score = 50;
        const traces = [];

        // F/K Oranı
        if (mockFinancials.peRatio > 0 && mockFinancials.peRatio < 15) {
            score += 20;
            traces.push(new DecisionTrace('Atlas-PE', SignalAction.BUY,
                `Düşük F/K: ${mockFinancials.peRatio.toFixed(2)}`, 0.25, 75));
        } else if (mockFinancials.peRatio > 50) {
            score -= 20;
            traces.push(new DecisionTrace('Atlas-PE', SignalAction.SELL,
                `Yüksek F/K: ${mockFinancials.peRatio.toFixed(2)}`, 0.25, 25));
        } else {
            traces.push(new DecisionTrace('Atlas-PE', SignalAction.HOLD,
                `Makul F/K: ${mockFinancials.peRatio.toFixed(2)}`, 0.25, 50));
        }

        score = Math.max(0, Math.min(100, score));
        return { score, traces };
    }

    static _generateMockFinancials(symbol) {
        let hash = 0;
        for (let i = 0; i < symbol.length; i++) {
            hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
        }

        const seededRandom = (modifier) => {
            const x = Math.sin(hash + modifier) * 10000;
            return x - Math.floor(x);
        };

        return {
            peRatio: 5 + (seededRandom(1) * 60),
            pbRatio: 0.5 + (seededRandom(2) * 5),
            debtToEquity: seededRandom(3) * 3
        };
    }
}

