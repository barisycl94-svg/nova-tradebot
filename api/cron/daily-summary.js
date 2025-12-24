/**
 * Vercel Serverless Function - Daily Summary
 * Her gün 21:00'de çalışır, günlük özet gönderir
 */

export const config = {
    runtime: 'edge',
};

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

const TOP_COINS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];

export default async function handler(request) {
    try {
        // Piyasa verilerini çek
        const marketData = await fetchMarketData();

        // Günlük özet mesajı oluştur
        const summary = generateDailySummary(marketData);

        // Telegram'a gönder
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await sendToTelegram(summary);
        }

        return new Response(JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Daily summary sent'
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

async function fetchMarketData() {
    const tickers = await Promise.all(
        TOP_COINS.map(symbol =>
            fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
                .then(r => r.json())
                .then(data => ({
                    symbol: symbol.replace('USDT', ''),
                    price: parseFloat(data.lastPrice),
                    change24h: parseFloat(data.priceChangePercent),
                    volume: parseFloat(data.quoteVolume),
                    high: parseFloat(data.highPrice),
                    low: parseFloat(data.lowPrice)
                }))
        )
    );

    // Fear & Greed Index
    let fearGreed = { value: 50, classification: 'Neutral' };
    try {
        const fgResponse = await fetch('https://api.alternative.me/fng/?limit=1');
        const fgData = await fgResponse.json();
        if (fgData.data && fgData.data[0]) {
            fearGreed = {
                value: parseInt(fgData.data[0].value),
                classification: fgData.data[0].value_classification
            };
        }
    } catch (e) {
        console.error('Fear & Greed fetch error:', e);
    }

    // Toplam piyasa değişimi
    const avgChange = tickers.reduce((acc, t) => acc + t.change24h, 0) / tickers.length;
    const totalVolume = tickers.reduce((acc, t) => acc + t.volume, 0);

    return {
        coins: tickers,
        fearGreed,
        avgChange,
        totalVolume,
        marketTrend: avgChange > 2 ? 'Bullish' : avgChange < -2 ? 'Bearish' : 'Neutral'
    };
}

function generateDailySummary(data) {
    const date = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const trendEmoji = data.marketTrend === 'Bullish' ? '📈' : data.marketTrend === 'Bearish' ? '📉' : '➡️';
    const fgEmoji = data.fearGreed.value <= 25 ? '😱' :
        data.fearGreed.value <= 45 ? '😨' :
            data.fearGreed.value <= 55 ? '😐' :
                data.fearGreed.value <= 75 ? '😊' : '🤑';

    const coinsText = data.coins.map(c => {
        const changeEmoji = c.change24h >= 0 ? '🟢' : '🔴';
        const changeSign = c.change24h >= 0 ? '+' : '';
        return `${changeEmoji} <b>${c.symbol}</b>: $${c.price.toLocaleString()} (${changeSign}${c.change24h.toFixed(2)}%)`;
    }).join('\n');

    const bestCoin = data.coins.reduce((best, c) => c.change24h > best.change24h ? c : best);
    const worstCoin = data.coins.reduce((worst, c) => c.change24h < worst.change24h ? c : worst);

    return `
📊 <b>NOVA GÜNLÜK ÖZET</b>
${date}

━━━━━━━━━━━━━━━━━━━━

${trendEmoji} <b>Piyasa Trendi:</b> ${data.marketTrend}
${fgEmoji} <b>Fear & Greed:</b> ${data.fearGreed.value} (${data.fearGreed.classification})

━━━━━━━━━━━━━━━━━━━━

<b>📌 Top 5 Coin:</b>

${coinsText}

━━━━━━━━━━━━━━━━━━━━

🏆 <b>Günün En İyisi:</b> ${bestCoin.symbol} (+${bestCoin.change24h.toFixed(2)}%)
💔 <b>Günün En Kötüsü:</b> ${worstCoin.symbol} (${worstCoin.change24h.toFixed(2)}%)

💰 <b>Toplam 24s Hacim:</b> $${(data.totalVolume / 1e9).toFixed(2)}B

━━━━━━━━━━━━━━━━━━━━

<i>🤖 Nova TradeBot - Arka Plan Modu</i>
<i>⏰ Her 15 dakikada analiz yapılıyor</i>
  `.trim();
}

async function sendToTelegram(message) {
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
