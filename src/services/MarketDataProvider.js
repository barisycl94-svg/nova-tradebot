/**
 * MarketDataProvider.js
 * Nova TradeBot - Veri Yönetim Servisi (Singleton)
 * 
 * Uygulamanın tek gerçek veri kaynağı (Single Source of Truth).
 * Binance API kullanarak gerçek zamanlı kripto verileri sağlar.
 */

import { BinanceProvider } from './data/BinanceProvider.js';

class MarketDataProvider {
    constructor() {
        if (MarketDataProvider.instance) {
            return MarketDataProvider.instance;
        }

        // Veri deposu (Sembol -> DisplayQuote)
        this.quotes = {};

        // Aktif izlenen semboller
        this.activeSymbols = new Set();

        // Polling zamanlayıcısı
        this.timer = null;
        this.intervalMs = 10000; // 10 saniye

        // Dinleyiciler (React bileşenleri buraya abone olacak)
        this.listeners = [];

        MarketDataProvider.instance = this;
    }

    /**
     * React hook'larında kullanmak için bir abone ol fonksiyonu.
     * @param {Function} callback - Veri güncellendiğinde çağrılacak fonksiyon
     * @returns {Function} unsubscribe - Abonelikten çıkma fonksiyonu
     */
    subscribe(callback) {
        this.listeners.push(callback);
        // İlk bağlantıda mevcut veriyi gönder
        callback(this.quotes);

        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    _notifyListeners() {
        this.listeners.forEach(listener => listener(this.quotes));
    }

    /**
     * Belirli semboller için veri akışını başlatır/günceller.
     * @param {string[]} symbols 
     */
    startStreaming(symbols) {
        // Yeni sembolleri sete ekle
        symbols.forEach(s => this.activeSymbols.add(s));

        // Hemen güncelleme yap
        this._fetchLatest();

        if (!this.timer) {
            this.timer = setInterval(() => {
                this._fetchLatest();
            }, this.intervalMs);
        }
    }

    stopStreaming() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async _fetchLatest() {
        if (this.activeSymbols.size === 0) return;

        try {
            // Binance'den 24hr ticker verisi al
            const tickerData = await BinanceProvider.fetch24hTicker();

            // İzlenen semboller için filtrele ve map et
            tickerData.forEach(ticker => {
                const symbol = ticker.symbol;
                if (this.activeSymbols.has(symbol) || this.activeSymbols.has(symbol.replace('-USD', 'USDT'))) {
                    this.quotes[symbol] = {
                        symbol: symbol,
                        price: ticker.price,
                        changePercent: ticker.changePercent,
                        volume: ticker.volume,
                        high24h: ticker.high24h,
                        low24h: ticker.low24h
                    };
                }
            });

            this._notifyListeners();
        } catch (error) {
            console.error('MarketDataProvider Stream Error:', error);
        }
    }

    /**
     * Tekil bir arama isteği (Binance'de tüm USDT çiftlerinden arar)
     */
    async searchAssets(query) {
        try {
            const allPrices = await BinanceProvider.fetchAllPrices();
            const upperQuery = query.toUpperCase();
            return allPrices
                .filter(p => p.symbol.includes(upperQuery))
                .slice(0, 20)
                .map(p => ({
                    symbol: p.symbol,
                    name: p.symbol.replace('-USD', ''),
                    type: 'CRYPTO'
                }));
        } catch (error) {
            console.error('Search Error:', error);
            return [];
        }
    }

    /**
     * Grafik verisi isteği
     */
    async getCandles(symbol, interval = '1d', limit = 100) {
        return await BinanceProvider.fetchCandles(symbol, interval, limit);
    }
}

// Singleton örneğini dışa aktar
export const marketDataService = new MarketDataProvider();

