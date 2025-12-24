/**
 * IndicatorLibrary.js - PART 1
 * Nova TradeBot - 100+ Teknik İndikatör Kütüphanesi
 * Trend, Momentum, Volatilite ve Hacim İndikatörleri
 */

// ============ YARDIMCI FONKSİYONLAR ============
export const sum = (arr) => arr.reduce((a, b) => a + b, 0);
export const avg = (arr) => arr.length ? sum(arr) / arr.length : 0;
export const max = (arr) => arr.length ? Math.max(...arr) : 0;
export const min = (arr) => arr.length ? Math.min(...arr) : 0;


// ============ TREND İNDİKATÖRLERİ ============

// 1. SMA - Simple Moving Average
export const SMA = (data, period) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        result.push(avg(data.slice(i - period + 1, i + 1)));
    }
    return result;
};

// 2. EMA - Exponential Moving Average
export const EMA = (data, period) => {
    const k = 2 / (period + 1);
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
        result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
};

// 3. WMA - Weighted Moving Average
export const WMA = (data, period) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        let weighted = 0, divider = 0;
        for (let j = 0; j < period; j++) {
            weighted += data[i - j] * (period - j);
            divider += period - j;
        }
        result.push(weighted / divider);
    }
    return result;
};

// 4. DEMA - Double EMA
export const DEMA = (data, period) => {
    const ema1 = EMA(data, period);
    const ema2 = EMA(ema1, period);
    return ema1.map((v, i) => 2 * v - ema2[i]);
};

// 5. TEMA - Triple EMA
export const TEMA = (data, period) => {
    const ema1 = EMA(data, period);
    const ema2 = EMA(ema1, period);
    const ema3 = EMA(ema2, period);
    return ema1.map((v, i) => 3 * v - 3 * ema2[i] + ema3[i]);
};

// 6. KAMA - Kaufman Adaptive Moving Average
export const KAMA = (data, period = 10) => {
    const result = [data[0]];
    for (let i = period; i < data.length; i++) {
        const change = Math.abs(data[i] - data[i - period]);
        let volatility = 0;
        for (let j = 0; j < period; j++) {
            volatility += Math.abs(data[i - j] - data[i - j - 1]);
        }
        const er = volatility !== 0 ? change / volatility : 0;
        const sc = Math.pow(er * (2 / 3 - 2 / 31) + 2 / 31, 2);
        result.push(result[result.length - 1] + sc * (data[i] - result[result.length - 1]));
    }
    return result;
};

// 7. HMA - Hull Moving Average
export const HMA = (data, period) => {
    const halfPeriod = Math.floor(period / 2);
    const sqrtPeriod = Math.floor(Math.sqrt(period));
    const wma1 = WMA(data, halfPeriod);
    const wma2 = WMA(data, period);
    const diff = wma1.slice(-wma2.length).map((v, i) => 2 * v - wma2[i]);
    return WMA(diff, sqrtPeriod);
};

// 8. VWMA - Volume Weighted Moving Average
export const VWMA = (closes, volumes, period) => {
    const result = [];
    for (let i = period - 1; i < closes.length; i++) {
        let sumPV = 0, sumV = 0;
        for (let j = 0; j < period; j++) {
            sumPV += closes[i - j] * volumes[i - j];
            sumV += volumes[i - j];
        }
        result.push(sumV ? sumPV / sumV : closes[i]);
    }
    return result;
};

// 9. SMMA - Smoothed Moving Average
export const SMMA = (data, period) => {
    const result = [avg(data.slice(0, period))];
    for (let i = period; i < data.length; i++) {
        result.push((result[result.length - 1] * (period - 1) + data[i]) / period);
    }
    return result;
};

// 10. ZLEMA - Zero Lag EMA
export const ZLEMA = (data, period) => {
    const lag = Math.floor((period - 1) / 2);
    const emaData = data.map((v, i) => i >= lag ? 2 * v - data[i - lag] : v);
    return EMA(emaData, period);
};

// ============ MOMENTUM İNDİKATÖRLERİ ============

// 11. RSI - Relative Strength Index
export const RSI = (data, period = 14) => {
    const changes = [];
    for (let i = 1; i < data.length; i++) changes.push(data[i] - data[i - 1]);

    let avgGain = 0, avgLoss = 0;
    for (let i = 0; i < period; i++) {
        if (changes[i] > 0) avgGain += changes[i];
        else avgLoss += Math.abs(changes[i]);
    }
    avgGain /= period; avgLoss /= period;

    const result = [100 - 100 / (1 + avgGain / (avgLoss || 0.0001))];
    for (let i = period; i < changes.length; i++) {
        const gain = changes[i] > 0 ? changes[i] : 0;
        const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        result.push(100 - 100 / (1 + avgGain / (avgLoss || 0.0001)));
    }
    return result;
};

// 12. Stochastic %K ve %D
export const Stochastic = (highs, lows, closes, kPeriod = 14, dPeriod = 3) => {
    const k = [];
    for (let i = kPeriod - 1; i < closes.length; i++) {
        const highestHigh = max(highs.slice(i - kPeriod + 1, i + 1));
        const lowestLow = min(lows.slice(i - kPeriod + 1, i + 1));
        k.push(((closes[i] - lowestLow) / (highestHigh - lowestLow || 1)) * 100);
    }
    const d = SMA(k, dPeriod);
    return { k, d };
};

// 13. MACD
export const MACD = (data, fast = 12, slow = 26, signal = 9) => {
    const emaFast = EMA(data, fast);
    const emaSlow = EMA(data, slow);
    const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
    const signalLine = EMA(macdLine, signal);
    const histogram = macdLine.map((v, i) => v - signalLine[i]);
    return { macdLine, signalLine, histogram };
};

// 14. Williams %R
export const WilliamsR = (highs, lows, closes, period = 14) => {
    const result = [];
    for (let i = period - 1; i < closes.length; i++) {
        const hh = max(highs.slice(i - period + 1, i + 1));
        const ll = min(lows.slice(i - period + 1, i + 1));
        result.push(((hh - closes[i]) / (hh - ll || 1)) * -100);
    }
    return result;
};

// 15. CCI - Commodity Channel Index
export const CCI = (highs, lows, closes, period = 20) => {
    const tp = closes.map((c, i) => (highs[i] + lows[i] + c) / 3);
    const result = [];
    for (let i = period - 1; i < tp.length; i++) {
        const slice = tp.slice(i - period + 1, i + 1);
        const sma = avg(slice);
        const meanDev = avg(slice.map(v => Math.abs(v - sma)));
        result.push((tp[i] - sma) / (0.015 * meanDev || 1));
    }
    return result;
};

// 16. MFI - Money Flow Index
export const MFI = (highs, lows, closes, volumes, period = 14) => {
    const tp = closes.map((c, i) => (highs[i] + lows[i] + c) / 3);
    const mf = tp.map((t, i) => t * volumes[i]);
    const result = [];
    for (let i = period; i < tp.length; i++) {
        let posMF = 0, negMF = 0;
        for (let j = 0; j < period; j++) {
            if (tp[i - j] > tp[i - j - 1]) posMF += mf[i - j];
            else negMF += mf[i - j];
        }
        result.push(100 - 100 / (1 + posMF / (negMF || 1)));
    }
    return result;
};

// 17. ROC - Rate of Change
export const ROC = (data, period = 12) => {
    const result = [];
    for (let i = period; i < data.length; i++) {
        result.push(((data[i] - data[i - period]) / data[i - period]) * 100);
    }
    return result;
};

// 18. Momentum
export const Momentum = (data, period = 10) => {
    return data.slice(period).map((v, i) => v - data[i]);
};

// 19. TSI - True Strength Index
export const TSI = (data, long = 25, short = 13) => {
    const changes = data.slice(1).map((v, i) => v - data[i]);
    const absChanges = changes.map(Math.abs);
    const smoothed1 = EMA(changes, long);
    const smoothed2 = EMA(smoothed1, short);
    const absSmoothed1 = EMA(absChanges, long);
    const absSmoothed2 = EMA(absSmoothed1, short);
    return smoothed2.map((v, i) => (v / (absSmoothed2[i] || 1)) * 100);
};

// 20. UO - Ultimate Oscillator
export const UltimateOscillator = (highs, lows, closes, p1 = 7, p2 = 14, p3 = 28) => {
    const bp = closes.map((c, i) => i > 0 ? c - Math.min(lows[i], closes[i - 1]) : 0);
    const tr = closes.map((c, i) => i > 0 ? Math.max(highs[i], closes[i - 1]) - Math.min(lows[i], closes[i - 1]) : highs[i] - lows[i]);
    const result = [];
    for (let i = p3; i < closes.length; i++) {
        const avg1 = sum(bp.slice(i - p1 + 1, i + 1)) / sum(tr.slice(i - p1 + 1, i + 1));
        const avg2 = sum(bp.slice(i - p2 + 1, i + 1)) / sum(tr.slice(i - p2 + 1, i + 1));
        const avg3 = sum(bp.slice(i - p3 + 1, i + 1)) / sum(tr.slice(i - p3 + 1, i + 1));
        result.push(100 * (4 * avg1 + 2 * avg2 + avg3) / 7);
    }
    return result;
};

export default { SMA, EMA, WMA, DEMA, TEMA, KAMA, HMA, VWMA, SMMA, ZLEMA, RSI, Stochastic, MACD, WilliamsR, CCI, MFI, ROC, Momentum, TSI, UltimateOscillator };
