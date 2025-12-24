/**
 * AutoPilot Engine - Argus 20_autopilot.md
 * ATR bazlı Stop Loss/Take Profit, position sizing
 */

class AutoPilotEngine {
    constructor() {
        this.isEnabled = false;
        this.pendingActions = [];
        this.executedActions = [];
        this.settings = {
            atrMultiplierStop: 2.0,
            atrMultiplierTarget: 4.0,
            defaultRiskPercent: 2.0,
            minConfidence: 70
        };
    }

    calculateATR(candles, period = 14) {
        if (!candles || candles.length < period + 1) return 0;
        const recent = candles.slice(-period - 1);
        const trueRanges = [];

        for (let i = 1; i < recent.length; i++) {
            const high = recent[i].high;
            const low = recent[i].low;
            const prevClose = recent[i - 1].close;
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trueRanges.push(tr);
        }
        return trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
    }

    calculateLevels(signal, entryPrice, atr, options = {}) {
        const stopMult = options.stopMultiplier || this.settings.atrMultiplierStop;
        const targetMult = options.targetMultiplier || this.settings.atrMultiplierTarget;
        const isLong = signal === 'BUY' || signal === 'STRONG_BUY';

        const stopLoss = isLong ? entryPrice - (atr * stopMult) : entryPrice + (atr * stopMult);
        const takeProfit = isLong ? entryPrice + (atr * targetMult) : entryPrice - (atr * targetMult);
        const riskAmount = Math.abs(entryPrice - stopLoss);
        const rewardAmount = Math.abs(takeProfit - entryPrice);

        return {
            entryPrice: this.formatPrice(entryPrice),
            stopLoss: this.formatPrice(stopLoss),
            takeProfit: this.formatPrice(takeProfit),
            riskReward: riskAmount > 0 ? Math.round((rewardAmount / riskAmount) * 100) / 100 : 0,
            riskPercent: Math.round((riskAmount / entryPrice) * 10000) / 100,
            atr: this.formatPrice(atr)
        };
    }

    calculatePositionSize(capital, riskPercent, entryPrice, stopLoss) {
        const dollarRisk = capital * (riskPercent / 100);
        const riskPerUnit = Math.abs(entryPrice - stopLoss);
        if (riskPerUnit <= 0) return { units: 0, dollarAmount: 0, dollarRisk: 0 };

        const units = dollarRisk / riskPerUnit;
        return {
            units: Math.floor(units * 10000) / 10000,
            dollarAmount: Math.round(units * entryPrice * 100) / 100,
            dollarRisk: Math.round(dollarRisk * 100) / 100
        };
    }

    evaluateForAction({ symbol, score, signal, price, candles, capital = 10000 }) {
        if (score < this.settings.minConfidence && score > (100 - this.settings.minConfidence)) return null;

        const atr = this.calculateATR(candles);
        if (atr === 0) return null;

        const levels = this.calculateLevels(signal, price, atr);
        if (levels.riskReward < 1.5) return null;

        const position = this.calculatePositionSize(capital, this.settings.defaultRiskPercent, price, parseFloat(levels.stopLoss));

        return {
            id: 'ap_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            symbol, signal, confidence: score,
            timing: levels,
            position,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
    }

    calculateMultipleTargets(entryPrice, atr, signal) {
        const dir = (signal === 'BUY' || signal === 'STRONG_BUY') ? 1 : -1;
        return [
            { level: 1, price: this.formatPrice(entryPrice + (dir * atr * 2)), percentage: 33 },
            { level: 2, price: this.formatPrice(entryPrice + (dir * atr * 4)), percentage: 33 },
            { level: 3, price: this.formatPrice(entryPrice + (dir * atr * 6)), percentage: 34 }
        ];
    }

    formatPrice(price) {
        if (price >= 1000) return Math.round(price * 100) / 100;
        if (price >= 1) return Math.round(price * 1000) / 1000;
        return Math.round(price * 100000000) / 100000000;
    }

    updateSettings(newSettings) { this.settings = { ...this.settings, ...newSettings }; }
    getSettings() { return this.settings; }
    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }
    getStatus() { return { isEnabled: this.isEnabled, pendingCount: this.pendingActions.length }; }
}

export const autoPilotEngine = new AutoPilotEngine();
export default AutoPilotEngine;
