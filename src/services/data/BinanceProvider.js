/**
 * BinanceProvider.js
 * Nova TradeBot - Binance API Entegrasyonu (Gerçek Fiyatlar)
 */

const BINANCE_API = 'https://api.binance.com/api/v3';

export class BinanceProvider {

    // Popüler kripto listesi
    static CRYPTO_SYMBOLS = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT',
        'SOLUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT', 'AVAXUSDT', 'LINKUSDT',
        'ATOMUSDT', 'UNIUSDT', 'XLMUSDT', 'VETUSDT', 'ICPUSDT', 'FILUSDT',
        'TRXUSDT', 'ETCUSDT', 'NEARUSDT', 'ALGOUSDT', 'XMRUSDT', 'BCHUSDT',
        'AAVEUSDT', 'GRTUSDT', 'FTMUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT'
    ];

    /**
     * Tüm kripto fiyatlarını çeker
     */
    static async fetchAllPrices() {
        try {
            const response = await fetch(`${BINANCE_API}/ticker/price`);
            const data = await response.json();

            // USDT çiftlerini filtrele
            const usdtPairs = data.filter(t => t.symbol.endsWith('USDT'));

            return usdtPairs.map(t => ({
                symbol: t.symbol.replace('USDT', '-USD'),
                price: parseFloat(t.price),
                source: 'binance'
            }));
        } catch (error) {
            console.error('Binance API Error:', error);
            return [];
        }
    }

    /**
     * 24 saatlik değişim ile birlikte fiyat çeker
     */
    static async fetch24hTicker() {
        try {
            const response = await fetch(`${BINANCE_API}/ticker/24hr`);
            const data = await response.json();

            return data
                .filter(t => t.symbol.endsWith('USDT'))
                .map(t => ({
                    symbol: t.symbol.replace('USDT', '-USD'),
                    price: parseFloat(t.lastPrice),
                    changePercent: parseFloat(t.priceChangePercent),
                    volume: parseFloat(t.volume),
                    high24h: parseFloat(t.highPrice),
                    low24h: parseFloat(t.lowPrice),
                    source: 'binance'
                }));
        } catch (error) {
            console.error('Binance 24h Ticker Error:', error);
            return [];
        }
    }

    /**
     * Belirli sembol için mum verisi çeker
     */
    static async fetchCandles(symbol, interval = '1d', limit = 100) {
        const binanceSymbol = symbol.replace('-USD', 'USDT').replace('/', '');
        try {
            const response = await fetch(
                `${BINANCE_API}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`
            );
            const data = await response.json();

            return data.map(k => ({
                id: k[0],
                date: new Date(k[0]),
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5])
            }));
        } catch (error) {
            console.error('Binance Candles Error:', error);
            return [];
        }
    }
}

export default BinanceProvider;
