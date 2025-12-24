/**
 * Vercel Serverless Function - Manual Trigger
 * Manuel olarak analiz tetiklemek için
 */

export const config = {
    runtime: 'edge',
};

const WATCHLIST = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
    'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT'
];

export default async function handler(request) {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');

    try {
        if (symbol) {
            // Tek sembol analizi
            const analysis = await analyzeSymbol(symbol.toUpperCase() + 'USDT');
            return new Response(JSON.stringify(analysis), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else {
            // Tüm watchlist analizi
            const results = await Promise.all(
                WATCHLIST.map(s => analyzeSymbol(s).catch(e => ({ symbol: s, error: e.message })))
            );

            const signals = results.filter(r =>
                r.signal === 'STRONG_BUY' || r.signal === 'STRONG_SELL' ||
                r.signal === 'BUY' || r.signal === 'SELL'
            );

            return new Response(JSON.stringify({
                success: true,
                timestamp: new Date().toISOString(),
                total: results.length,
                signals: signals.length,
                results: results.sort((a, b) => (b.score || 0) - (a.score || 0))
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function analyzeSymbol(symbol) {
    const [ticker, klines] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`).then(r => r.json()),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=4h&limit=50`).then(r => r.json())
    ]);

    const price = parseFloat(ticker.lastPrice);
    const change24h = parseFloat(ticker.priceChangePercent);
    const volume = parseFloat(ticker.quoteVolume);

    const closes = klines.map(k => parseFloat(k[4]));
    const { rsi, sma20, sma50, trend } = calculateIndicators(closes, price);

    let score = 50;

    // RSI scoring
    if (rsi < 30) score += 15;
    else if (rsi < 40) score += 8;
    else if (rsi > 70) score -= 15;
    else if (rsi > 60) score -= 8;

    // Trend scoring
    if (trend === 'bullish') score += 12;
    else if (trend === 'bearish') score -= 12;

    // 24h change
    if (change24h > 5) score += 8;
    else if (change24h > 2) score += 4;
    else if (change24h < -5) score -= 8;
    else if (change24h < -2) score -= 4;

    // Volume momentum
    if (volume > 100000000) score += 5;

    // Determine signal
    let signal = 'HOLD';
    if (score >= 75) signal = 'STRONG_BUY';
    else if (score >= 60) signal = 'BUY';
    else if (score <= 25) signal = 'STRONG_SELL';
    else if (score <= 40) signal = 'SELL';

    return {
        symbol: symbol.replace('USDT', ''),
        price,
        change24h: parseFloat(change24h.toFixed(2)),
        volume: parseFloat((volume / 1e6).toFixed(2)),
        volumeUnit: 'M',
        score: Math.round(score),
        signal,
        indicators: {
            rsi: parseFloat(rsi.toFixed(2)),
            sma20: parseFloat(sma20.toFixed(2)),
            sma50: parseFloat(sma50.toFixed(2)),
            trend
        },
        timestamp: new Date().toISOString()
    };
}

function calculateIndicators(closes, currentPrice) {
    const n = closes.length;

    // RSI
    let gains = 0, losses = 0;
    for (let i = Math.max(1, n - 14); i < n; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
    const rsi = 100 - (100 / (1 + rs));

    // SMAs
    const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const sma50 = closes.reduce((a, b) => a + b, 0) / n;

    // Trend
    let trend = 'neutral';
    if (currentPrice > sma20 && sma20 > sma50) trend = 'bullish';
    else if (currentPrice < sma20 && sma20 < sma50) trend = 'bearish';

    return { rsi, sma20, sma50, trend };
}
