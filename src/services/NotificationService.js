/**
 * NotificationService.js
 * Nova TradeBot - Tarayıcı ve Uygulama İçi Bildirim Servisi
 */

// toastService sadece tarayıcıda yüklenir (daemon'da .jsx import edilemez)
let toastService = null;
if (typeof window !== 'undefined') {
    import('../components/ToastService.jsx').then(module => {
        toastService = module.toastService;
    }).catch(() => {
        console.log('ToastService yüklenemedi (muhtemelen Node.js ortamı)');
    });
}

class NotificationService {
    constructor() {
        this.hasPermission = false;
        this._requestPermission();
    }

    /**
     * Tarayıcı bildirim izni iste
     */
    async _requestPermission() {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            console.log('⚠️ Bu tarayıcı bildirimleri desteklemiyor');
            return;
        }

        try {
            if (Notification.permission === 'granted') {
                this.hasPermission = true;
                console.log('✅ Bildirim izni mevcut');
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                this.hasPermission = permission === 'granted';
                console.log(this.hasPermission ? '✅ Bildirim izni verildi' : '❌ Bildirim izni reddedildi');
            }
        } catch (error) {
            console.error('Bildirim izni hatası:', error);
        }
    }

    /**
     * Tarayıcı push bildirimi gönder
     * @param {string} title - Bildirim başlığı
     * @param {Object} options - { body, icon, tag, requireInteraction }
     */
    sendBrowserNotification(title, options = {}) {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }

        if (!this.hasPermission) {
            this._requestPermission();
            return;
        }

        try {
            const notification = new Notification(title, {
                body: options.body || '',
                icon: options.icon || '/nova-icon.png',
                badge: '/nova-badge.png',
                tag: options.tag || 'nova-trade',
                requireInteraction: options.requireInteraction || false,
                silent: false
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // 10 saniye sonra otomatik kapat
            setTimeout(() => notification.close(), 10000);

        } catch (error) {
            console.error('Tarayıcı bildirimi hatası:', error);
        }
    }

    /**
     * İşlem açıldığında bildirim
     */
    notifyTradeOpen(trade) {
        const message = `📈 ${trade.symbol} ALINDI @$${trade.entryPrice.toFixed(4)}`;

        // Alım nedeni - trade.rationale veya decisionContext'ten al
        const reason = trade.rationale ||
            (trade.decisionContext?.reason) ||
            `Skor: ${trade.decisionContext?.totalScore?.toFixed(1) || 'N/A'}`;

        // Uygulama içi toast - detay ile (sadece tarayıcıda)
        if (toastService) toastService.show(message, 'success', `💡 Neden: ${reason}`);

        // Tarayıcı bildirimi
        this.sendBrowserNotification(`📈 YENİ POZİSYON: ${trade.symbol}`, {
            body: `@$${trade.entryPrice.toFixed(4)} | $${(trade.entryPrice * trade.quantity).toFixed(2)} yatırıldı`,
            tag: `trade-open-${trade.id}`
        });
    }

    /**
     * İşlem kapandığında bildirim
     */
    notifyTradeClose(trade, profit, profitPercent) {
        const isProfit = profit >= 0;
        const emoji = isProfit ? '💰' : '📉';
        const type = isProfit ? 'success' : 'error';

        const profitStr = isProfit
            ? `+$${profit.toFixed(2)} (+${profitPercent.toFixed(2)}%)`
            : `-$${Math.abs(profit).toFixed(2)} (${profitPercent.toFixed(2)}%)`;

        const message = `${emoji} ${trade.symbol} KAPANDI | ${profitStr}`;

        // Kapanış detayları
        const details = `📍 Giriş: $${trade.entryPrice.toFixed(4)} → Çıkış: $${trade.exitPrice.toFixed(4)}\n🔹 Neden: ${trade.exitReason}`;

        // Uygulama içi toast - detay ile (sadece tarayıcıda)
        if (toastService) toastService.show(message, type, details);

        // Tarayıcı bildirimi
        this.sendBrowserNotification(`${emoji} POZİSYON KAPANDI: ${trade.symbol}`, {
            body: `${profitStr} | Neden: ${trade.exitReason}`,
            tag: `trade-close-${trade.id}`,
            requireInteraction: true
        });
    }

    /**
     * Genel bilgi bildirimi
     */
    notifyInfo(title, message) {
        if (toastService) toastService.show(`${title}: ${message}`, 'info');
    }

    /**
     * Uyarı bildirimi
     */
    notifyWarning(title, message) {
        if (toastService) toastService.show(`⚠️ ${title}: ${message}`, 'warning');
    }
}

// Singleton export
export const notificationService = new NotificationService();
