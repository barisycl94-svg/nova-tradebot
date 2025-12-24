/**
 * PriceAlertService.js
 * Fiyat Uyarı Sistemi (Argus 17_models.md'den uyarlandı)
 * 
 * Kullanıcının belirlediği fiyat seviyelerine ulaşınca bildirim gönderir
 */

import { notificationService } from '../NotificationService.js';
import { persistence } from '../PersistenceService.js';

const STORAGE_KEY = 'nova_price_alerts';

class PriceAlertService {
    constructor() {
        this.alerts = this._loadAlerts();
        this.checkInterval = null;
    }

    _loadAlerts() {
        try {
            const saved = persistence.getItem(STORAGE_KEY);
            return saved ? (typeof saved === 'string' ? JSON.parse(saved) : saved) : [];
        } catch {
            return [];
        }
    }

    _saveAlerts() {
        persistence.setItem(STORAGE_KEY, JSON.stringify(this.alerts));
    }

    /**
     * Yeni fiyat uyarısı oluştur
     * @param {string} symbol - Coin sembolü (BTCUSDT)
     * @param {number} targetPrice - Hedef fiyat
     * @param {string} type - 'above' veya 'below'
     * @param {string} note - Opsiyonel not
     */
    createAlert(symbol, targetPrice, type = 'above', note = '') {
        const alert = {
            id: Date.now().toString(),
            symbol: symbol.toUpperCase(),
            targetPrice,
            type,
            note,
            createdAt: new Date().toISOString(),
            isActive: true,
            triggered: false
        };

        this.alerts.push(alert);
        this._saveAlerts();

        console.log(`🔔 Yeni uyarı oluşturuldu: ${symbol} ${type === 'above' ? '>' : '<'} $${targetPrice}`);

        return alert;
    }

    /**
     * Uyarıyı sil
     */
    deleteAlert(alertId) {
        this.alerts = this.alerts.filter(a => a.id !== alertId);
        this._saveAlerts();
    }

    /**
     * Uyarıyı deaktive et
     */
    deactivateAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.isActive = false;
            this._saveAlerts();
        }
    }

    /**
     * Aktif uyarıları getir
     */
    getActiveAlerts() {
        return this.alerts.filter(a => a.isActive && !a.triggered);
    }

    /**
     * Belirli bir coin için uyarıları getir
     */
    getAlertsForSymbol(symbol) {
        return this.alerts.filter(a => a.symbol === symbol.toUpperCase());
    }

    /**
     * Fiyatları kontrol et ve uyarıları tetikle
     * @param {Object} prices - { BTCUSDT: { price: 50000 }, ... }
     */
    checkAlerts(prices) {
        const activeAlerts = this.getActiveAlerts();

        for (const alert of activeAlerts) {
            const quote = prices[alert.symbol];
            if (!quote || !quote.price) continue;

            const currentPrice = quote.price;
            let triggered = false;

            if (alert.type === 'above' && currentPrice >= alert.targetPrice) {
                triggered = true;
            } else if (alert.type === 'below' && currentPrice <= alert.targetPrice) {
                triggered = true;
            }

            if (triggered) {
                this._triggerAlert(alert, currentPrice);
            }
        }
    }

    /**
     * Uyarıyı tetikle
     */
    _triggerAlert(alert, currentPrice) {
        alert.triggered = true;
        alert.triggeredAt = new Date().toISOString();
        alert.triggeredPrice = currentPrice;
        this._saveAlerts();

        const direction = alert.type === 'above' ? '📈 ÜSTÜNE ÇIKTI' : '📉 ALTINA DÜŞTÜ';
        const message = `${alert.symbol} $${alert.targetPrice} ${direction}!\nMevcut: $${currentPrice.toFixed(4)}`;

        // Bildirim gönder
        notificationService.showNotification('🔔 Fiyat Uyarısı!', message);

        console.log(`🔔 UYARI TETİKLENDİ: ${message}`);
    }

    /**
     * Periyodik kontrol başlat
     */
    startMonitoring(priceProvider, intervalMs = 10000) {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        this.checkInterval = setInterval(() => {
            const prices = priceProvider();
            if (prices && Object.keys(prices).length > 0) {
                this.checkAlerts(prices);
            }
        }, intervalMs);

        console.log('🔔 Fiyat uyarı monitörü başlatıldı');
    }

    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Tüm uyarıları getir (istatistik için)
     */
    getAllAlerts() {
        return [...this.alerts];
    }

    /**
     * Tetiklenen uyarıları temizle
     */
    clearTriggeredAlerts() {
        this.alerts = this.alerts.filter(a => !a.triggered);
        this._saveAlerts();
    }
}

export const priceAlertService = new PriceAlertService();
