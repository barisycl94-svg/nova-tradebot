/**
 * TelegramBotService - Telegram Bot Entegrasyonu
 * Trade sinyalleri, uyarılar ve günlük özet gönderimi
 */

class TelegramBotService {
    constructor() {
        this.botToken = localStorage.getItem('telegram_bot_token') || '';
        this.chatId = localStorage.getItem('telegram_chat_id') || '';
        this.enabled = localStorage.getItem('telegram_enabled') === 'true';
        this.lastMessageTime = 0;
        this.rateLimitMs = 1000; // 1 saniye rate limit
    }

    // ==========================================
    // CONFIGURATION
    // ==========================================

    configure(botToken, chatId) {
        this.botToken = botToken;
        this.chatId = chatId;
        localStorage.setItem('telegram_bot_token', botToken);
        localStorage.setItem('telegram_chat_id', chatId);
    }

    enable() {
        this.enabled = true;
        localStorage.setItem('telegram_enabled', 'true');
    }

    disable() {
        this.enabled = false;
        localStorage.setItem('telegram_enabled', 'false');
    }

    isConfigured() {
        return this.botToken && this.chatId;
    }

    // ==========================================
    // CORE MESSAGING
    // ==========================================

    async sendMessage(text, parseMode = 'HTML') {
        if (!this.enabled || !this.isConfigured()) {
            console.log('Telegram not configured or disabled');
            return false;
        }

        // Rate limiting
        const now = Date.now();
        if (now - this.lastMessageTime < this.rateLimitMs) {
            await this.sleep(this.rateLimitMs - (now - this.lastMessageTime));
        }
        this.lastMessageTime = Date.now();

        try {
            const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: text,
                    parse_mode: parseMode,
                    disable_web_page_preview: true
                })
            });

            const data = await response.json();
            if (!data.ok) {
                console.error('Telegram error:', data.description);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Telegram send error:', error);
            return false;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==========================================
    // TRADE NOTIFICATIONS
    // ==========================================

    async sendTradeSignal(signal) {
        const emoji = signal.action === 'BUY' ? '🟢' : signal.action === 'SELL' ? '🔴' : '⚪';
        const arrow = signal.action === 'BUY' ? '📈' : '📉';

        const message = `
${emoji} <b>${signal.action} SİNYALİ</b> ${arrow}

<b>Coin:</b> ${signal.symbol}
<b>Fiyat:</b> $${this.formatPrice(signal.price)}
<b>Güven:</b> %${signal.confidence?.toFixed(1) || 'N/A'}
<b>Skor:</b> ${signal.score?.toFixed(1) || 'N/A'}/100

${signal.stopLoss ? `<b>Stop Loss:</b> $${this.formatPrice(signal.stopLoss)}` : ''}
${signal.takeProfit ? `<b>Take Profit:</b> $${this.formatPrice(signal.takeProfit)}` : ''}

<i>⏰ ${new Date().toLocaleString('tr-TR')}</i>
    `.trim();

        return this.sendMessage(message);
    }

    async sendTradeExecuted(trade) {
        const emoji = trade.side === 'buy' ? '✅' : '💰';

        const message = `
${emoji} <b>İŞLEM GERÇEKLEŞTİ</b>

<b>Tip:</b> ${trade.side.toUpperCase()}
<b>Coin:</b> ${trade.symbol}
<b>Miktar:</b> ${trade.quantity}
<b>Fiyat:</b> $${this.formatPrice(trade.price)}
<b>Toplam:</b> $${this.formatPrice(trade.quantity * trade.price)}

<i>⏰ ${new Date().toLocaleString('tr-TR')}</i>
    `.trim();

        return this.sendMessage(message);
    }

    async sendTradeClosed(trade) {
        const isProft = trade.pnl >= 0;
        const emoji = isProft ? '💚' : '❤️';
        const pnlEmoji = isProft ? '📈' : '📉';

        const message = `
${emoji} <b>POZİSYON KAPANDI</b> ${pnlEmoji}

<b>Coin:</b> ${trade.symbol}
<b>Giriş:</b> $${this.formatPrice(trade.entryPrice)}
<b>Çıkış:</b> $${this.formatPrice(trade.exitPrice)}
<b>P/L:</b> ${isProft ? '+' : ''}$${this.formatPrice(trade.pnl)} (${isProft ? '+' : ''}${trade.pnlPercent?.toFixed(2)}%)

<i>⏰ ${new Date().toLocaleString('tr-TR')}</i>
    `.trim();

        return this.sendMessage(message);
    }

    // ==========================================
    // ALERTS
    // ==========================================

    async sendPriceAlert(alert) {
        const message = `
🔔 <b>FİYAT ALARMI</b>

<b>Coin:</b> ${alert.symbol}
<b>Hedef:</b> $${this.formatPrice(alert.targetPrice)}
<b>Mevcut:</b> $${this.formatPrice(alert.currentPrice)}
<b>Koşul:</b> ${alert.condition === 'above' ? 'Üstüne Çıktı' : 'Altına Düştü'}

<i>⏰ ${new Date().toLocaleString('tr-TR')}</i>
    `.trim();

        return this.sendMessage(message);
    }

    async sendRiskAlert(alert) {
        const message = `
⚠️ <b>RİSK UYARISI</b>

<b>Seviye:</b> ${alert.level}
<b>Mesaj:</b> ${alert.message}

${alert.recommendation ? `<b>Öneri:</b> ${alert.recommendation}` : ''}

<i>⏰ ${new Date().toLocaleString('tr-TR')}</i>
    `.trim();

        return this.sendMessage(message);
    }

    // ==========================================
    // DAILY SUMMARY
    // ==========================================

    async sendDailySummary(summary) {
        const pnlEmoji = summary.dailyPnL >= 0 ? '📈' : '📉';
        const pnlSign = summary.dailyPnL >= 0 ? '+' : '';

        const message = `
📊 <b>GÜNLÜK ÖZET</b> - ${new Date().toLocaleDateString('tr-TR')}

<b>Portföy Değeri:</b> $${this.formatPrice(summary.portfolioValue)}
<b>Günlük P/L:</b> ${pnlSign}$${this.formatPrice(summary.dailyPnL)} (${pnlSign}${summary.dailyPnLPercent?.toFixed(2)}%) ${pnlEmoji}

<b>İşlemler:</b>
• Alım: ${summary.buyCount || 0}
• Satım: ${summary.sellCount || 0}
• Başarı: %${summary.winRate?.toFixed(1) || 0}

<b>En İyi:</b> ${summary.bestTrade?.symbol || 'N/A'} (${summary.bestTrade?.pnlPercent ? '+' + summary.bestTrade.pnlPercent.toFixed(2) + '%' : 'N/A'})
<b>En Kötü:</b> ${summary.worstTrade?.symbol || 'N/A'} (${summary.worstTrade?.pnlPercent?.toFixed(2) || 'N/A'}%)

<b>Aktif Pozisyonlar:</b> ${summary.openPositions || 0}
<b>Nakit:</b> $${this.formatPrice(summary.cash || 0)}

<i>Nova TradeBot 🤖</i>
    `.trim();

        return this.sendMessage(message);
    }

    // ==========================================
    // PORTFOLIO STATUS
    // ==========================================

    async sendPortfolioStatus(portfolio) {
        let positions = '';
        if (portfolio.positions && portfolio.positions.length > 0) {
            positions = portfolio.positions.slice(0, 10).map(p => {
                const pnlSign = p.pnl >= 0 ? '+' : '';
                return `• ${p.symbol}: $${this.formatPrice(p.marketValue)} (${pnlSign}${p.pnlPercent?.toFixed(2)}%)`;
            }).join('\n');
        } else {
            positions = '• Açık pozisyon yok';
        }

        const message = `
💼 <b>PORTFÖY DURUMU</b>

<b>Toplam Değer:</b> $${this.formatPrice(portfolio.totalValue)}
<b>Nakit:</b> $${this.formatPrice(portfolio.cash)} (%${((portfolio.cash / portfolio.totalValue) * 100).toFixed(1)})
<b>Pozisyon:</b> $${this.formatPrice(portfolio.investedValue)}

<b>Açık Pozisyonlar:</b>
${positions}

<i>⏰ ${new Date().toLocaleString('tr-TR')}</i>
    `.trim();

        return this.sendMessage(message);
    }

    // ==========================================
    // MARKET STATUS
    // ==========================================

    async sendMarketStatus(market) {
        const btcEmoji = market.btc24hChange >= 0 ? '🟢' : '🔴';
        const ethEmoji = market.eth24hChange >= 0 ? '🟢' : '🔴';

        const message = `
🌍 <b>PİYASA DURUMU</b>

<b>BTC:</b> $${this.formatPrice(market.btcPrice)} ${btcEmoji} ${market.btc24hChange >= 0 ? '+' : ''}${market.btc24hChange?.toFixed(2)}%
<b>ETH:</b> $${this.formatPrice(market.ethPrice)} ${ethEmoji} ${market.eth24hChange >= 0 ? '+' : ''}${market.eth24hChange?.toFixed(2)}%

<b>Fear & Greed:</b> ${market.fearGreedValue} (${market.fearGreedLabel})
<b>BTC Dominance:</b> %${market.btcDominance?.toFixed(1)}
<b>Toplam Market Cap:</b> $${this.formatMarketCap(market.totalMarketCap)}

<i>⏰ ${new Date().toLocaleString('tr-TR')}</i>
    `.trim();

        return this.sendMessage(message);
    }

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    formatPrice(price) {
        if (!price) return '0.00';
        if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
        if (price >= 1) return price.toFixed(4);
        return price.toFixed(8);
    }

    formatMarketCap(value) {
        if (!value) return 'N/A';
        if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
        if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
        if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
        return value.toLocaleString();
    }

    // ==========================================
    // TEST
    // ==========================================

    async testConnection() {
        const message = `
🤖 <b>Nova TradeBot Bağlantı Testi</b>

✅ Telegram botu başarıyla bağlandı!

<i>⏰ ${new Date().toLocaleString('tr-TR')}</i>
    `.trim();

        return this.sendMessage(message);
    }
}

export const telegramBot = new TelegramBotService();
export default TelegramBotService;
