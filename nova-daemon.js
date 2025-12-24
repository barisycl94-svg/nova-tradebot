/**
 * nova-daemon.js
 * Nova TradeBot - 24/7 Node.js Bağımsız Çalışma Modülü
 */

import WebSocket from 'ws';
import { tradingViewModel } from './src/viewmodels/TradingViewModel.js';
import { realMarketDataService } from './src/services/RealMarketDataProvider.js';
import { persistence } from './src/services/PersistenceService.js';

// 🛠️ Node.js için Global Polifiller
global.WebSocket = WebSocket;

async function startDaemon() {
    console.log('----------------------------------------------------');
    console.log('🚀 NOVA TRADEBOT DAEMON BAŞLATIILIYOR (Node.js)');
    console.log('----------------------------------------------------');

    // 1. Persistence Katmanı Hazırla
    console.log('📂 Veri saklama sistemi: Dosya tabanlı (db.json)');

    // 2. Modu Balanced/Dengeli'ye al (Güvenlik için önerilir)
    // persistence.setItem('novaTradeBot_tradingMode', 'balanced');

    // 3. Botu Başlat
    try {
        // TradingViewModel zaten constructor'da başlatıyor.
        // Otopilotun aktif olup olmadığını kontrol et.

        setTimeout(() => {
            if (!tradingViewModel.isAutoPilotActive) {
                console.log('🤖 Otopilot başlatılıyor...');
                tradingViewModel.toggleAutoPilot();
            } else {
                console.log('🤖 Otopilot zaten aktif.');
            }
        }, 5000);

        console.log('✅ Daemon başarıyla devrede.');
        console.log('📡 Telegram bildirimleri ve loglar buradan izlenebilir.');

        // 💓 Pulse: Her 10 dakikada bir durum özeti
        setInterval(() => {
            const openTrades = tradingViewModel.portfolio.filter(t => t.isOpen).length;
            console.log(`[${new Date().toLocaleTimeString()}] 💓 Pulse: Bot Aktif | Bakiye: $${tradingViewModel.balance.toFixed(2)} | Açık İşlem: ${openTrades}`);
        }, 600000);
    } catch (e) {
        console.error('❌ Başlatma Hatası:', e.message);
    }
}

// Hataları yakala
process.on('uncaughtException', (err) => {
    console.error('💥 BEKLENMEDİK HATA:', err);
});

startDaemon();
