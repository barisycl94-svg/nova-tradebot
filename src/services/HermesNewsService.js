/**
 * HermesNewsService.js
 * Nova TradeBot - Haber ve Sentiment Analizi (Argus Hermes)
 * 
 * Kripto haberlerini analiz eder ve sentiment skoru hesaplar
 */

class HermesNewsService {
    constructor() {
        this.news = [];
        this.lastFetch = 0;
        this.sentimentCache = {};
    }

    // Kripto için genişletilmiş keyword listesi (Argus'tan)
    static BULLISH_KEYWORDS = [
        // İngilizce
        'bullish', 'rally', 'surge', 'soar', 'moon', 'breakout', 'pump',
        'all-time high', 'ath', 'record', 'adoption', 'institutional',
        'etf', 'approved', 'halving', 'upgrade', 'partnership', 'launch',
        'accumulation', 'whale buy', 'inflow', 'buy signal', 'golden cross',
        // Türkçe
        'yükseliş', 'rekor', 'artış', 'kazanç', 'toparlanma', 'ralli',
        'kurumsal', 'onay', 'girişim', 'alış', 'boğa', 'destek'
    ];

    static BEARISH_KEYWORDS = [
        // İngilizce
        'bearish', 'crash', 'dump', 'plunge', 'collapse', 'selloff', 'sell-off',
        'fud', 'hack', 'exploit', 'rug', 'scam', 'fraud', 'ban', 'lawsuit',
        'regulation', 'sec', 'tax', 'crackdown', 'outflow', 'whale sell',
        'death cross', 'breakdown', 'liquidation', 'fear', 'panic',
        // Türkçe
        'düşüş', 'çöküş', 'satış', 'hack', 'dolandırıcılık', 'ayı',
        'yasaklama', 'dava', 'korku', 'panik', 'tasfiye', 'risk'
    ];

    static NEUTRAL_KEYWORDS = [
        'consolidation', 'sideways', 'range', 'stable', 'mixed',
        'uncertainty', 'wait', 'hold', 'neutral', 'unclear',
        'konsolidasyon', 'yatay', 'karışık', 'belirsiz', 'bekle'
    ];

    async fetchNews() {
        // Rate limit koruması (5 dakikada bir)
        if (Date.now() - this.lastFetch < 300000 && this.news.length > 0) return this.news;

        try {
            // Profesyonel simülasyon (gelecekte CryptoPanic API)
            const marketTrends = [
                'BTC ETF girişleri hızlandı, kurumsal ilgi artıyor.',
                'FED faiz indirimi beklentileri piyasayı hareketlendirdi.',
                'Ethereum "Dencun" güncellemesi sonrası işlem ücretleri düştü.',
                'Solana ağındaki işlem hacmi rekor seviyelere ulaştı.',
                'Balinalar son 24 saatte $500M değerinde BTC biriktirdi.',
                'Global piyasalarda risk iştahı artıyor, altcoin sezonu kapıda.',
                'Kripto para piyasası toplam değeri $2.5T sınırını aştı.',
                'Binance yeni launchpool projelerini duyurdu.',
                'Piyasa duyarlılığı "Aşırı Açgözlülük" bölgesine girdi.',
                'DeFi ekosisteminde kilitli toplam değer (TVL) yükselişte.',
                'Bitcoin dominance yükseliyor, altcoinler baskı altında.',
                'Kripto düzenlemeleri netleşiyor, piyasa olumlu karşıladı.',
                'Büyük borsa hack olayı sonrası güvenlik endişeleri arttı.',
                'Stablecoin piyasası genişliyor, USDT rekor değere ulaştı.'
            ];

            this.news = marketTrends.sort(() => Math.random() - 0.5).slice(0, 6).map((title, index) => ({
                id: Date.now() + index,
                title: title,
                source: 'Nova Intelligence',
                sentiment: this._analyzeSentiment(title),
                url: '#',
                timestamp: new Date()
            }));

            this.lastFetch = Date.now();
            return this.news;
        } catch (e) {
            console.error('Haber çekme hatası:', e);
            return this.news;
        }
    }

    _analyzeSentiment(text) {
        const words = text.toLowerCase();

        let bullishScore = 0;
        let bearishScore = 0;

        for (const keyword of HermesNewsService.BULLISH_KEYWORDS) {
            if (words.includes(keyword)) bullishScore++;
        }

        for (const keyword of HermesNewsService.BEARISH_KEYWORDS) {
            if (words.includes(keyword)) bearishScore++;
        }

        if (bullishScore > bearishScore) return 'bullish';
        if (bearishScore > bullishScore) return 'bearish';
        return 'neutral';
    }

    /**
     * Genel piyasa sentiment analizi
     * @returns {Object} { score: 0-100, sentiment: string, bullishCount, bearishCount }
     */
    async analyzeSentiment() {
        const news = await this.fetchNews();

        let bullishCount = 0;
        let bearishCount = 0;
        let neutralCount = 0;

        for (const item of news) {
            if (item.sentiment === 'bullish') bullishCount++;
            else if (item.sentiment === 'bearish') bearishCount++;
            else neutralCount++;
        }

        const total = news.length || 1;

        // Sentiment skoru hesapla (0-100)
        // Bullish = yüksek skor, Bearish = düşük skor
        let score = 50; // Başlangıç nötr

        score += (bullishCount / total) * 30; // Maks +30
        score -= (bearishCount / total) * 30; // Maks -30

        // Fear & Greed benzeri kategorilendirme
        let sentiment = 'Neutral';
        let emoji = '😐';

        if (score >= 75) {
            sentiment = 'Extreme Greed';
            emoji = '🤑';
        } else if (score >= 60) {
            sentiment = 'Greed';
            emoji = '😄';
        } else if (score >= 45) {
            sentiment = 'Neutral';
            emoji = '😐';
        } else if (score >= 30) {
            sentiment = 'Fear';
            emoji = '😨';
        } else {
            sentiment = 'Extreme Fear';
            emoji = '😱';
        }

        return {
            score: Math.max(0, Math.min(100, score)),
            sentiment,
            emoji,
            bullishCount,
            bearishCount,
            neutralCount,
            totalNews: news.length
        };
    }

    /**
     * Belirli bir coin için sentiment analizi
     * @param {string} symbol - Coin sembolü (BTCUSDT)
     */
    async analyzeForSymbol(symbol) {
        const baseSentiment = await this.analyzeSentiment();

        // Symbol-specific ayarlamalar
        const symbolBase = symbol.replace('USDT', '').toLowerCase();

        let symbolMultiplier = 1.0;

        // BTC ve ETH için haber sentiment'i daha önemli
        if (symbolBase === 'btc' || symbolBase === 'eth') {
            symbolMultiplier = 1.2;
        }
        // Meme coinler için haber volatilitesi yüksek
        else if (['doge', 'shib', 'pepe', 'floki', 'bonk'].includes(symbolBase)) {
            symbolMultiplier = 1.5; // Haberler daha etkili
        }

        return {
            ...baseSentiment,
            score: Math.min(100, baseSentiment.score * symbolMultiplier),
            symbolMultiplier
        };
    }
}

export const hermesService = new HermesNewsService();
