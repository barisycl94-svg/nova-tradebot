/**
 * Paper Broker - Argus 21_broker_api.md
 * Sanal hesap bakiyesi, order yerleştirme, slippage simülasyonu
 */

class PaperBroker {
    constructor() {
        this.cash = 10000;
        this.positions = {};
        this.orders = [];
        this.trades = [];
        this.settings = {
            slippagePercent: 0.1,  // %0.1 slippage
            commissionPercent: 0.1  // %0.1 komisyon
        };
    }

    get equity() {
        return this.cash + Object.values(this.positions).reduce((acc, p) => acc + p.marketValue, 0);
    }

    get totalPnL() {
        return Object.values(this.positions).reduce((acc, p) => acc + p.pnl, 0);
    }

    async placeOrder({ symbol, side, quantity, type = 'market', limitPrice = null, currentPrice }) {
        const price = currentPrice || limitPrice || 0;
        if (price <= 0) throw new Error('Invalid price');

        // Slippage simülasyonu (market emirler için)
        let executionPrice = price;
        if (type === 'market') {
            const slippage = price * (this.settings.slippagePercent / 100);
            executionPrice = side === 'buy' ? price + slippage : price - slippage;
        } else {
            executionPrice = limitPrice || price;
        }

        // Komisyon
        const commission = executionPrice * quantity * (this.settings.commissionPercent / 100);
        const totalCost = (executionPrice * quantity) + (side === 'buy' ? commission : -commission);

        // Kontroller
        if (side === 'buy') {
            if (this.cash < totalCost) throw new Error('Insufficient funds');
        } else {
            const pos = this.positions[symbol];
            if (!pos || pos.shares < quantity) throw new Error('Insufficient shares');
        }

        // Order oluştur
        const order = {
            id: 'ord_' + Date.now().toString(36),
            symbol, side, type, quantity,
            limitPrice, executionPrice: Math.round(executionPrice * 100000000) / 100000000,
            commission: Math.round(commission * 100) / 100,
            status: 'filled',
            createdAt: new Date().toISOString()
        };
        this.orders.push(order);

        // Trade kaydet
        const trade = {
            id: 'trd_' + Date.now().toString(36),
            symbol, side, quantity,
            price: order.executionPrice,
            commission: order.commission,
            timestamp: new Date().toISOString()
        };
        this.trades.push(trade);

        // Pozisyon güncelle
        if (side === 'buy') {
            this.cash -= totalCost;

            if (this.positions[symbol]) {
                const pos = this.positions[symbol];
                const totalShares = pos.shares + quantity;
                const totalCostBasis = (pos.avgCost * pos.shares) + (executionPrice * quantity);
                pos.avgCost = totalCostBasis / totalShares;
                pos.shares = totalShares;
                pos.currentPrice = executionPrice;
                pos.marketValue = pos.shares * pos.currentPrice;
                pos.pnl = (pos.currentPrice - pos.avgCost) * pos.shares;
            } else {
                this.positions[symbol] = {
                    symbol,
                    shares: quantity,
                    avgCost: executionPrice,
                    currentPrice: executionPrice,
                    marketValue: quantity * executionPrice,
                    pnl: 0
                };
            }
        } else {
            this.cash += (executionPrice * quantity) - commission;

            const pos = this.positions[symbol];
            pos.shares -= quantity;
            if (pos.shares <= 0.0001) {
                delete this.positions[symbol];
            } else {
                pos.marketValue = pos.shares * pos.currentPrice;
                pos.pnl = (pos.currentPrice - pos.avgCost) * pos.shares;
            }
        }

        return order;
    }

    updatePrices(priceMap) {
        for (const [symbol, price] of Object.entries(priceMap)) {
            if (this.positions[symbol]) {
                const pos = this.positions[symbol];
                pos.currentPrice = price;
                pos.marketValue = pos.shares * price;
                pos.pnl = (price - pos.avgCost) * pos.shares;
            }
        }
    }

    getAccountSummary() {
        const positions = Object.values(this.positions);
        const totalValue = this.equity;
        const totalPnL = this.totalPnL;
        const totalPnLPercent = positions.length > 0
            ? positions.reduce((acc, p) => acc + ((p.pnl / (p.avgCost * p.shares)) * 100), 0) / positions.length
            : 0;

        return {
            cash: Math.round(this.cash * 100) / 100,
            equity: Math.round(totalValue * 100) / 100,
            positionCount: positions.length,
            totalPnL: Math.round(totalPnL * 100) / 100,
            totalPnLPercent: Math.round(totalPnLPercent * 100) / 100,
            positions: positions.map(p => ({
                ...p,
                shares: Math.round(p.shares * 10000) / 10000,
                avgCost: Math.round(p.avgCost * 100000000) / 100000000,
                currentPrice: Math.round(p.currentPrice * 100000000) / 100000000,
                marketValue: Math.round(p.marketValue * 100) / 100,
                pnl: Math.round(p.pnl * 100) / 100,
                pnlPercent: Math.round(((p.currentPrice - p.avgCost) / p.avgCost) * 10000) / 100
            }))
        };
    }

    getTradeHistory(limit = 50) {
        return this.trades.slice(-limit).reverse();
    }

    reset(initialCash = 10000) {
        this.cash = initialCash;
        this.positions = {};
        this.orders = [];
        this.trades = [];
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
}

export const paperBroker = new PaperBroker();
export default PaperBroker;
