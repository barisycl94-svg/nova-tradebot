import { persistence } from './PersistenceService.js';

class TelegramService {
    constructor() {
        this.config = this._loadConfig();
        this.baseUrl = (botToken) => `https://api.telegram.org/bot${botToken}/sendMessage`;
    }

    _loadConfig() {
        const saved = persistence.getItem('novaTradeBot_telegram_config');
        return typeof saved === 'string' ? JSON.parse(saved) : (saved || { enabled: false, botToken: '', chatId: '' });
    }

    saveConfig(config) {
        this.config = { ...config };
        persistence.setItem('novaTradeBot_telegram_config', JSON.stringify(this.config));
    }

    async sendNotification(message) {
        if (!this.config.enabled || !this.config.botToken || !this.config.chatId) {
            return;
        }

        try {
            const response = await fetch(this.baseUrl(this.config.botToken), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.config.chatId,
                    text: `🤖 *NOVA TRADEBOT*\n\n${message}`,
                    parse_mode: 'Markdown'
                })
            });

            if (!response.ok) {
                console.error('Telegram Notification Failed:', await response.text());
            }
        } catch (error) {
            console.error('Telegram Error:', error);
        }
    }

    // Pozisyon Açılış Bildirimi
    sendTradeOpen(trade) {
        const msg = `🚀 *POZİSYON AÇILDI*\n\n` +
            `🔹 *Sembol:* ${trade.symbol.replace('USDT', '/USDT')}\n` +
            `🔹 *Giriş:* $${trade.entryPrice.toFixed(4)}\n` +
            `🔹 *Miktar:* ${trade.quantity.toFixed(2)}\n` +
            `🔹 *Hedef (TP):* %${trade.takeProfitPercent.toFixed(1)}\n` +
            `🔹 *Durdurma (SL):* %${trade.stopLossPercent.toFixed(1)}\n\n` +
            `📝 *Neden:* ${trade.rationale}`;
        this.sendNotification(msg);
    }

    // Pozisyon Kapanış Bildirimi
    sendTradeClose(trade, profit, profitPercent) {
        const icon = profit >= 0 ? '✅' : '⛔';
        const msg = `${icon} *POZİSYON KAPATILDI*\n\n` +
            `🔹 *Sembol:* ${trade.symbol.replace('USDT', '/USDT')}\n` +
            `🔹 *Kâr/Zarar:* $${profit.toFixed(2)} (%${profitPercent.toFixed(2)})\n` +
            `🔹 *Çıkış Fiyatı:* $${trade.exitPrice.toFixed(4)}\n` +
            `🔹 *Neden:* ${trade.exitReason}`;
        this.sendNotification(msg);
    }
}

export const telegramService = new TelegramService();
