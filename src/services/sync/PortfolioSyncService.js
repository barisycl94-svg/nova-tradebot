/**
 * PortfolioSyncService - Portföy Senkronizasyon Servisi
 * LocalStorage ve Cloud (GitHub Gist) arasında senkronizasyon
 */

const GIST_ID = '727c474c05630964128a2a9793c65b27';
const STORAGE_KEY = 'novaTradeBot_portfolio';

class PortfolioSyncService {
    constructor() {
        this.lastSyncTime = null;
        this.syncInterval = null;
    }

    // LocalStorage'dan portföy yükle
    loadLocal() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('LocalStorage load error:', e);
        }
        return this.getDefaultPortfolio();
    }

    // LocalStorage'a kaydet
    saveLocal(portfolio) {
        try {
            portfolio.lastUpdated = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
            return true;
        } catch (e) {
            console.error('LocalStorage save error:', e);
            return false;
        }
    }

    // Cloud'dan portföy yükle (GitHub Gist - public read)
    async loadCloud() {
        try {
            const response = await fetch(`https://api.github.com/gists/${GIST_ID}`);
            if (response.ok) {
                const data = await response.json();
                if (data.files && data.files['portfolio.json']) {
                    const portfolio = JSON.parse(data.files['portfolio.json'].content);
                    console.log('☁️ Portfolio loaded from cloud');
                    return portfolio;
                }
            }
        } catch (e) {
            console.error('Cloud load error:', e);
        }
        return null;
    }

    // En güncel portföyü al (local vs cloud karşılaştır)
    async loadBest() {
        const local = this.loadLocal();
        const cloud = await this.loadCloud();

        if (!cloud) {
            console.log('📂 Using local portfolio');
            return local;
        }

        // Hangisi daha güncel?
        const localTime = new Date(local.lastUpdated || 0).getTime();
        const cloudTime = new Date(cloud.lastUpdated || 0).getTime();

        if (cloudTime > localTime) {
            console.log('☁️ Cloud portfolio is newer, using cloud');
            this.saveLocal(cloud); // Sync to local
            return cloud;
        } else {
            console.log('📂 Local portfolio is newer');
            return local;
        }
    }

    // Portföyü kaydet (local + cloud'a push request)
    save(portfolio) {
        this.saveLocal(portfolio);
        // Cloud save will be handled by GitHub Actions
        // We just update local, Actions will sync when it runs
    }

    // Default portföy
    getDefaultPortfolio() {
        return {
            cash: 1000,
            positions: [],
            trades: [],
            stats: {
                totalTrades: 0,
                wins: 0,
                losses: 0,
                totalPnL: 0
            },
            lastUpdated: new Date().toISOString()
        };
    }

    // Trade ekle
    addTrade(portfolio, trade) {
        portfolio.trades.push({
            ...trade,
            timestamp: new Date().toISOString()
        });
        portfolio.stats.totalTrades++;
        if (trade.pnl > 0) portfolio.stats.wins++;
        else if (trade.pnl < 0) portfolio.stats.losses++;
        portfolio.stats.totalPnL += trade.pnl || 0;
        this.save(portfolio);
        return portfolio;
    }

    // Pozisyon aç
    openPosition(portfolio, position) {
        if (portfolio.cash < position.amount) {
            console.error('Yetersiz bakiye');
            return null;
        }

        portfolio.cash -= position.amount;
        portfolio.positions.push({
            ...position,
            openTime: new Date().toISOString()
        });
        this.save(portfolio);
        return portfolio;
    }

    // Pozisyon kapat
    closePosition(portfolio, symbol, exitPrice) {
        const posIndex = portfolio.positions.findIndex(p => p.symbol === symbol);
        if (posIndex === -1) return null;

        const position = portfolio.positions[posIndex];
        const pnl = (exitPrice - position.entryPrice) * position.quantity;
        const pnlPercent = ((exitPrice / position.entryPrice) - 1) * 100;

        // Pozisyonu kaldır
        portfolio.positions.splice(posIndex, 1);

        // Nakite ekle
        portfolio.cash += position.quantity * exitPrice;

        // Trade kaydet
        this.addTrade(portfolio, {
            symbol: position.symbol,
            type: 'SELL',
            entryPrice: position.entryPrice,
            exitPrice: exitPrice,
            quantity: position.quantity,
            pnl: pnl,
            pnlPercent: pnlPercent
        });

        return portfolio;
    }

    // Toplam değer hesapla
    calculateTotalValue(portfolio, currentPrices = {}) {
        let positionValue = 0;
        for (const pos of portfolio.positions) {
            const price = currentPrices[pos.symbol] || pos.entryPrice;
            positionValue += pos.quantity * price;
        }
        return portfolio.cash + positionValue;
    }
}

export const portfolioSync = new PortfolioSyncService();
export default PortfolioSyncService;
