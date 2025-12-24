/**
 * RiskCalculator.js
 * 
 * Implements risk management logic from the Argus 20_autopilot and 22_risk_management modules.
 * Handles ATR calculation, dynamic Stop Loss / Take Profit levels, and Position Sizing.
 */

export class RiskCalculator {

    /**
     * Calculates the Average True Range (ATR)
     * @param {Array} candles - Array of candle objects {high, low, close}
     * @param {number} period - Standard 14
     * @returns {number} ATR value
     */
    static calculateATR(candles, period = 14) {
        if (!candles || candles.length < period + 1) return 0;

        // Get the most recent 'period' candles + 1 for previous close
        const recentCandles = candles.slice(-(period + 1));
        let trs = [];

        for (let i = 1; i < recentCandles.length; i++) {
            const high = recentCandles[i].high;
            const low = recentCandles[i].low;
            const prevClose = recentCandles[i - 1].close;

            const tr = Math.max(
                high - low,
                Math.abs(high - prevClose),
                Math.abs(low - prevClose)
            );
            trs.push(tr);
        }

        const atr = trs.reduce((a, b) => a + b, 0) / trs.length;
        return atr;
    }

    /**
     * Calculates dynamic trade levels based on ATR
     * @param {string} action - 'BUY' or 'SELL'
     * @param {number} currentPrice 
     * @param {number} atr 
     * @returns {Object} { stopLoss, targetPrice, riskRewardRatio }
     */
    static calculateTradeLevels(action, currentPrice, atr) {
        if (!atr || atr === 0) return null;

        // Default: 2 ATR Stop, 4 ATR Target (1:2 Risk/Reward)
        // Adjust based on volatility if needed
        const slMultiplier = 2.0;
        const tpMultiplier = 4.0;

        let stopLoss, targetPrice;

        if (action === 'BUY') {
            stopLoss = currentPrice - (atr * slMultiplier);
            targetPrice = currentPrice + (atr * tpMultiplier);
        } else if (action === 'SELL') {
            stopLoss = currentPrice + (atr * slMultiplier);
            targetPrice = currentPrice - (atr * tpMultiplier);
        } else {
            return null;
        }

        return {
            stopLoss,
            targetPrice,
            riskRewardRatio: tpMultiplier / slMultiplier // Should be 2.0
        };
    }

    /**
     * Calculates position size based on fixed fractional risk
     * @param {number} capital - Total portfolio value (or allocated capital)
     * @param {number} riskPercent - e.g. 2.0 (for 2%)
     * @param {number} entryPrice 
     * @param {number} stopLoss 
     * @returns {Object} { shares, dollarRisk, totalSize }
     */
    static calculatePositionSize(capital, riskPercent, entryPrice, stopLoss) {
        if (entryPrice <= 0 || stopLoss <= 0) return { shares: 0, dollarRisk: 0, totalSize: 0 };

        const riskPerShare = Math.abs(entryPrice - stopLoss);

        if (riskPerShare === 0) return { shares: 0, dollarRisk: 0, totalSize: 0 };

        const dollarRisk = capital * (riskPercent / 100);
        const shares = dollarRisk / riskPerShare;
        const totalSize = shares * entryPrice;

        return {
            shares,
            dollarRisk,
            totalSize
        };
    }
}
