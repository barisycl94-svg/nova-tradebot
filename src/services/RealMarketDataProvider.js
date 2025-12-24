/**
 * RealMarketDataProvider.js
 * Nova TradeBot - Binance API (GERÇEK FİYATLAR)
 * 
 * Semboller Binance formatında: BTCUSDT, ETHUSDT vb.
 * Hacmi $100K+ olan tüm USDT çiftleri
 */

class RealMarketDataProvider {
    constructor() {
        this.quotes = {};
        this.allSymbols = [];
        this.listeners = [];
        this.ws = null;
        this.isConnected = false;
        this.reconnectTimer = null;
        this.httpTimer = null;
        this.minVolume = 100000; // $100K minimum hacim
        this.isNode = typeof window === 'undefined';
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.quotes);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    _notify() {
        this.listeners.forEach(l => l({ ...this.quotes }));
    }

    async startStreaming() {
        console.log('🚀 Binance: Gerçek zamanlı fiyatlar yükleniyor...');

        // İlk yükleme için HTTP
        await this._fetchInitialData();

        // WebSocket bağlantısı
        this._connectWebSocket();

        // Yedek HTTP güncelleme (5 Dakika)
        this.httpTimer = setInterval(() => {
            this._fetchInitialData();
        }, 300000);
    }

    async _fetchBinance(path) {
        if (this.isBlocked && Date.now() < this.blockExpiry) {
            const waitMin = Math.ceil((this.blockExpiry - Date.now()) / 60000);
            throw new Error(`Binance API Blocked (Try again in ${waitMin} min)`);
        }

        const endpoints = this.isNode ?
            ['https://api.binance.com/api/v3', 'https://api1.binance.com/api/v3', 'https://api2.binance.com/api/v3'] :
            ['/binance1', '/binance2', '/binance3'];

        const randomPrefix = endpoints[Math.floor(Math.random() * endpoints.length)];

        try {
            const url = `${randomPrefix}${path}`;
            const response = await fetch(url);

            if (response.status === 418) {
                console.error('🚫 Binance: BOT TESPİT EDİLDİ (418).');
                this.isBlocked = true;
                this.blockExpiry = Date.now() + 15 * 60 * 1000; // 15 Dakika ceza
                throw new Error('418 Teapot: Bot detected');
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            this.isBlocked = false;
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async _fetchInitialData() {
        try {
            const data = await this._fetchBinance('/ticker/24hr');

            this.allSymbols = [];
            data.forEach(ticker => {
                // USDT çiftlerini al
                if (ticker.symbol && ticker.symbol.endsWith('USDT')) {
                    const symbol = ticker.symbol;
                    const baseAsset = symbol.replace('USDT', '');

                    // 🛡️ STABLECOIN & FIAT FİLTRESİ
                    // Bu varlıklar volatilite içermediği için botun vaktini almamalı
                    const blackList = [
                        'FDUSD', 'USDC', 'TUSD', 'USDE', 'DAI', 'BUSD', 'USDP',
                        'TRY', 'EUR', 'GBP', 'JPY', 'PAX', 'AEUR', 'USDT',
                        'WBTC', 'WETH', 'WBNB', 'USDS', 'PYUSD'
                    ];

                    if (blackList.includes(baseAsset)) return;

                    const quoteVolume = parseFloat(ticker.quoteVolume) || 0;

                    // Hacmi $100K+ olanları filtrele
                    if (quoteVolume >= this.minVolume) {
                        // Binance formatını koru: BTCUSDT, ETHUSDT vb.
                        const symbol = ticker.symbol;
                        this.allSymbols.push(symbol);

                        this.quotes[symbol] = {
                            symbol: symbol,
                            displayName: symbol.replace('USDT', '/USDT'),
                            price: parseFloat(ticker.lastPrice),
                            changePercent: parseFloat(ticker.priceChangePercent),
                            change24h: parseFloat(ticker.priceChange),
                            high24h: parseFloat(ticker.highPrice),
                            low24h: parseFloat(ticker.lowPrice),
                            volume: parseFloat(ticker.volume),
                            quoteVolume: quoteVolume,
                            type: 'crypto',
                            source: 'binance',
                            lastUpdate: Date.now()
                        };
                    }
                }
            });

            if (!this.isConnected) {
                console.log(`✅ Binance: ${this.allSymbols.length} coin (Hacim > $100K)`);
                this.isConnected = true;
            }

            this._notify();
        } catch (error) {
            console.error('❌ Binance HTTP Error:', error.message);
        }
    }

    _connectWebSocket() {
        try {
            // Binance mini ticker stream
            const wsUrl = 'wss://stream.binance.com:9443/ws/!miniTicker@arr';

            let WSClass;
            if (typeof WebSocket !== 'undefined') {
                WSClass = WebSocket;
            } else {
                // Node.js ortamında ws kütüphanesini dinamik import et
                // Not: import() asenkron olduğu için burada biraz farklı yaklaşabiliriz 
                // ya da daemon başlatılırken globale atanabilir.
                WSClass = global.WebSocket;
            }

            if (!WSClass) {
                console.warn('⚠️ WebSocket sınıfı bulunamadı, polling modunda devam ediliyor.');
                return;
            }

            this.ws = new WSClass(wsUrl);

            this.ws.onopen = () => {
                console.log('🔌 Binance WebSocket bağlandı');
            };

            this.ws.onmessage = (event) => {
                try {
                    const tickers = JSON.parse(event.data);

                    tickers.forEach(t => {
                        // Binance sembol formatı: BTCUSDT
                        if (t.s && t.s.endsWith('USDT') && this.quotes[t.s]) {
                            const newPrice = parseFloat(t.c);

                            this.quotes[t.s].price = newPrice;
                            this.quotes[t.s].lastUpdate = Date.now();
                            this.quotes[t.s].changePercent =
                                ((newPrice - parseFloat(t.o)) / parseFloat(t.o)) * 100;
                        }
                    });

                    this._notify();
                } catch (e) {
                    // Parse hatası
                }
            };

            this.ws.onerror = () => {
                console.log('⚠️ WebSocket hatası');
            };

            this.ws.onclose = () => {
                console.log('🔌 WebSocket kapandı, yeniden bağlanılıyor...');
                this.reconnectTimer = setTimeout(() => this._connectWebSocket(), 5000);
            };
        } catch (error) {
            console.error('WebSocket hatası:', error);
        }
    }

    stopStreaming() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.httpTimer) {
            clearInterval(this.httpTimer);
            this.httpTimer = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    getQuote(symbol) {
        return this.quotes[symbol] || null;
    }

    getAllSymbols() {
        return this.allSymbols;
    }

    async getCandles(symbol, interval = '1d', limit = 90) {
        const cacheKey = `candles_${symbol}_${interval}_${limit}`;
        const cached = this._getWithExpiry(cacheKey);
        if (cached) return cached;

        // Rastgele gecikme
        await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

        try {
            const data = await this._fetchBinance(`/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
            const candles = data.map(k => ({
                id: k[0],
                date: new Date(k[0]),
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5])
            }));

            // 5 dakika önbelleğe al
            this._setWithExpiry(cacheKey, candles, 5 * 60 * 1000);
            return candles;
        } catch (error) {
            console.error(`Candles Error (${symbol}):`, error.message);
            return [];
        }
    }

    /**
     * Binance Genel Bilgilerini Çeker
     */
    async requestExchangeInfo() {
        return await this._fetchBinance('/exchangeInfo');
    }

    /**
     * Genel İstek Metodu (Dış servisler için)
     */
    async request(path) {
        return await this._fetchBinance(path);
    }

    /**
     * Binance Emir Defteri (Order Book) verisini çeker
     */
    async getOrderBook(symbol) {
        if (this.isBlocked && Date.now() < this.blockExpiry) return null;

        const endpoints = this.isNode ?
            ['https://api.binance.com/api/v3', 'https://api1.binance.com/api/v3', 'https://api2.binance.com/api/v3'] :
            ['/binance1', '/binance2', '/binance3'];

        const getPrefix = () => endpoints[Math.floor(Math.random() * endpoints.length)];

        try {
            const url = `${getPrefix()}/depth?symbol=${symbol}&limit=20`;
            const response = await fetch(url);
            if (response.ok) return await response.json();
        } catch (e) {
            console.error(`OrderBook Error (${symbol}):`, e.message);
        }
        return null;
    }

    _setWithExpiry(key, value, ttl) {
        this[`_cache_${key}`] = {
            value: value,
            expiry: Date.now() + ttl
        };
    }

    _getWithExpiry(key) {
        const item = this[`_cache_${key}`];
        if (!item) return null;
        if (Date.now() > item.expiry) {
            delete this[`_cache_${key}`];
            return null;
        }
        return item.value;
    }

    async searchAssets(query) {
        const q = query.toUpperCase();
        return Object.keys(this.quotes)
            .filter(s => s.includes(q))
            .sort((a, b) => (this.quotes[b]?.quoteVolume || 0) - (this.quotes[a]?.quoteVolume || 0))
            .slice(0, 50)
            .map(s => ({
                symbol: s,
                name: this.quotes[s]?.displayName || s,
                type: 'crypto',
                price: this.quotes[s]?.price,
                volume: this.quotes[s]?.quoteVolume
            }));
    }
}

export const realMarketDataService = new RealMarketDataProvider();
