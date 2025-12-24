/**
 * YahooFinanceProvider.js
 * Nova TradeBot - Finansal Veri Sağlayıcısı
 * 
 * Yahoo Finance API kullanarak (veya proxy/mock failover ile)
 * piyasa verilerini çeker.
 */

import { Candle, DisplayQuote, SearchResult, AssetType } from '../../models/Models.js';

// Not: Tarayıcı ortamında doğrudan Yahoo Finance API çağrıları CORS hatası verebilir.
// Bu yüzden production ortamında bir proxy sunucusu araya konulmalıdır.
// Bu örnekte, CORS hatası durumunda fallback olarak mock data döneceğiz.
const BASE_URL = 'https://query1.finance.yahoo.com';

export class YahooFinanceProvider {
    /**
     * Belirtilen semboller için güncel fiyat bilgilerini çeker.
     * @param {string[]} symbols - Örn: ['AAPL', 'BTC-USD']
     * @returns {Promise<DisplayQuote[]>}
     */
    async fetchQuotes(symbols) {
        if (!symbols || symbols.length === 0) return [];

        const symbolStr = symbols.join(',');
        const url = `${BASE_URL}/v7/finance/quote?symbols=${symbolStr}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            const results = data.quoteResponse?.result || [];

            return results.map(q => new DisplayQuote(
                q.symbol,
                q.regularMarketPrice,
                q.regularMarketChangePercent,
                q.marketCap
            ));

        } catch (error) {
            console.warn('YahooFinanceProvider fetchQuotes Error (Switching to Mock):', error);
            return this._generateMockQuotes(symbols);
        }
    }

    /**
     * Grafik çizimi için mum (OHLCV) verilerini çeker.
     * @param {string} symbol - Örn: 'AAPL'
     * @param {string} range - '1d', '5d', '1mo', '1y'
     * @param {string} interval - '15m', '1d', '1wk'
     * @returns {Promise<Candle[]>}
     */
    async fetchCandles(symbol, range = '1mo', interval = '1d') {
        const url = `${BASE_URL}/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            const result = data.chart?.result?.[0];

            if (!result) throw new Error('No chart data found');

            const timestamps = result.timestamp || [];
            const quotes = result.indicators?.quote?.[0] || {};

            const candles = [];

            for (let i = 0; i < timestamps.length; i++) {
                // Eksik veri kontrolü
                if (quotes.open[i] === null) continue;

                candles.push(new Candle(
                    timestamps[i] * 1000,
                    quotes.open[i],
                    quotes.high[i],
                    quotes.low[i],
                    quotes.close[i],
                    quotes.volume[i]
                ));
            }

            return candles;

        } catch (error) {
            console.warn('YahooFinanceProvider fetchCandles Error (Switching to Mock):', error);
            return this._generateMockCandles(interval);
        }
    }

    /**
     * Hisse/Kripto arama fonksiyonu.
     * @param {string} query 
     * @returns {Promise<SearchResult[]>}
     */
    async search(query) {
        if (!query) return [];

        // Yahoo search API genelde daha sıkı CORS'a sahiptir.
        // Demo amaçlı mock data dönebiliriz.
        const url = `${BASE_URL}/v1/finance/search?q=${query}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            const quotes = data.quotes || [];

            return quotes.map(q => {
                let type = AssetType.STOCK;
                if (q.quoteType === 'CRYPTOCURRENCY') type = AssetType.CRYPTO;
                else if (q.quoteType === 'ETF') type = AssetType.ETF;
                else if (q.quoteType === 'CURRENCY') type = AssetType.FOREX;

                return new SearchResult(q.symbol, q.shortname || q.longname, type);
            });

        } catch (error) {
            console.warn('YahooFinanceProvider search Error:', error);
            // Basit yerel arama simülasyonu
            return [
                new SearchResult(query.toUpperCase(), `${query.toUpperCase()} Corp`, AssetType.STOCK),
                new SearchResult(`${query.toUpperCase()}-USD`, `${query.toUpperCase()} Token`, AssetType.CRYPTO)
            ];
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                                MOCK HELPERS                                */
    /* -------------------------------------------------------------------------- */

    _generateMockQuotes(symbols) {
        return symbols.map(sym => {
            const basePrice = Math.random() * 1000 + 10;
            const change = (Math.random() * 10) - 5;
            return new DisplayQuote(
                sym,
                parseFloat(basePrice.toFixed(2)),
                parseFloat(change.toFixed(2)),
                basePrice * 1000000
            );
        });
    }

    _generateMockCandles(interval) {
        const candles = [];
        let price = 150.0;
        const now = new Date();
        const count = 30; // 30 mum

        for (let i = count; i > 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            const open = price;
            const close = price * (1 + (Math.random() * 0.04 - 0.02));
            const high = Math.max(open, close) * (1 + Math.random() * 0.01);
            const low = Math.min(open, close) * (1 - Math.random() * 0.01);
            const volume = Math.floor(Math.random() * 1000000);

            candles.push(new Candle(
                date,
                parseFloat(open.toFixed(2)),
                parseFloat(high.toFixed(2)),
                parseFloat(low.toFixed(2)),
                parseFloat(close.toFixed(2)),
                volume
            ));

            price = close;
        }
        return candles;
    }
}
