/**
 * Vercel Serverless Function - Cron Analyze
 * Her 15 dakikada bir çalışır, watchlist'teki coinleri analiz eder
 * Sinyal bulursa Telegram'a bildirim gönderir
 */

// Edge runtime for faster cold starts
export const config = {
    runtime: 'edge',
};

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// Watchlist - en popüler coinler
const WATCHLIST = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
    'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT'
];

export default async function handler(request) {
    // Cron işi için secret kontrolü
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Manuel tetikleme için de izin ver
        console.log('Cron job triggered (no auth or manual)');
    }

    const startTime = Date.now();
    const results = [];
    const signals = [];

    try {
        // Her coin için analiz yap
        for (const symbol of WATCHLIST) {
            try {
                const analysis = await analyzeSymbol(symbol);
                results.push(analysis);

                // Güçlü sinyal varsa kaydet
                if (analysis.signal === 'STRONG_BUY' || analysis.signal === 'STRONG_SELL') {
                    signals.push(analysis);
                }
            } catch (e) {
                console.error(`Error analyzing ${symbol}:`, e.message);
            }
        }

        // Sinyalleri Telegram'a gönder
        if (signals.length > 0 && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await sendSignalsToTelegram(signals);
        }

        const duration = Date.now() - startTime;

        return new Response(JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
            analyzed: results.length,
            signals: signals.length,
            signalDetails: signals.map(s => ({
                symbol: s.symbol,
                signal: s.signal,
                score: s.score,
                price: s.price
            }))
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

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
    // Binance'den fiyat ve kline verisi çek
    const [ticker, klines] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`).then(r => r.json()),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=4h&limit=50`).then(r => r.json())
    ]);

    const price = parseFloat(ticker.lastPrice);
    const change24h = parseFloat(ticker.priceChangePercent);
    const volume = parseFloat(ticker.quoteVolume);

    // Basit teknik analiz
    const closes = klines.map(k => parseFloat(k[4]));
    const { rsi, sma20, sma50, macd } = calculateIndicators(closes);

    // Skor hesapla
    let score = 50;

    // RSI
    if (rsi < 30) score += 15;
    else if (rsi < 40) score += 8;
    else if (rsi > 70) score -= 15;
    else if (rsi > 60) score -= 8;

    // SMA trend
    if (price > sma20 && sma20 > sma50) score += 12;
    else if (price < sma20 && sma20 < sma50) score -= 12;

    // MACD
    if (macd.histogram > 0 && macd.signal > 0) score += 10;
    else if (macd.histogram < 0 && macd.signal < 0) score -= 10;

    // 24h değişim
    if (change24h > 5) score += 8;
    else if (change24h > 2) score += 4;
    else if (change24h < -5) score -= 8;
    else if (change24h < -2) score -= 4;

    // Sinyal belirle
    let signal = 'HOLD';
    if (score >= 75) signal = 'STRONG_BUY';
    else if (score >= 60) signal = 'BUY';
    else if (score <= 25) signal = 'STRONG_SELL';
    else if (score <= 40) signal = 'SELL';

    return {
        symbol: symbol.replace('USDT', ''),
        price,
        change24h,
        volume,
        score,
        signal,
        rsi,
        sma20,
        sma50,
        timestamp: new Date().toISOString()
    };
}

function calculateIndicators(closes) {
    const n = closes.length;

    // RSI (14)
    let gains = 0, losses = 0;
    for (let i = n - 14; i < n; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
    const rsi = 100 - (100 / (1 + rs));

    // SMA 20
    const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;

    // SMA 50
    const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, n);

    // MACD (12, 26, 9)
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const macdLine = ema12 - ema26;
    const signalLine = macdLine * 0.9; // Simplified
    const histogram = macdLine - signalLine;

    return {
        rsi,
        sma20,
        sma50,
        macd: {
            line: macdLine,
            signal: signalLine,
            histogram
        }
    };
}

function calculateEMA(data, period) {
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
    }
    return ema;
}

async function sendSignalsToTelegram(signals) {
    const message = `
🤖 <b>NOVA CRON - ${signals.length} SİNYAL</b>

${signals.map(s => {
        const emoji = s.signal === 'STRONG_BUY' ? '🟢' : '🔴';
        return `${emoji} <b>${s.symbol}</b>
   Fiyat: $${s.price.toLocaleString()}
   Sinyal: ${s.signal}
   Skor: ${s.score}/100`;
    }).join('\n\n')}

<i>⏰ ${new Date().toLocaleString('tr-TR')}</i>
  `.trim();

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        console.error('Telegram send error:', e);
    }
}
