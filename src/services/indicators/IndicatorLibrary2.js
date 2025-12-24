/**
 * IndicatorLibrary2.js - PART 2
 * Volatilite, Hacim ve Band İndikatörleri (21-50)
 */

import { SMA, EMA, avg, max, min } from './IndicatorLibrary.js';

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// ============ VOLATİLİTE İNDİKATÖRLERİ ============

// 21. ATR - Average True Range
export const ATR = (highs, lows, closes, period = 14) => {
    const tr = highs.map((h, i) => {
        if (i === 0) return h - lows[i];
        return Math.max(h - lows[i], Math.abs(h - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
    });
    const result = [avg(tr.slice(0, period))];
    for (let i = period; i < tr.length; i++) {
        result.push((result[result.length - 1] * (period - 1) + tr[i]) / period);
    }
    return result;
};

// 22. Bollinger Bands
export const BollingerBands = (data, period = 20, stdDev = 2) => {
    const middle = [], upper = [], lower = [];
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const sma = avg(slice);
        const std = Math.sqrt(slice.reduce((a, v) => a + Math.pow(v - sma, 2), 0) / period);
        middle.push(sma);
        upper.push(sma + stdDev * std);
        lower.push(sma - stdDev * std);
    }
    return { upper, middle, lower };
};

// 23. Keltner Channels
export const KeltnerChannels = (highs, lows, closes, emaPeriod = 20, atrPeriod = 10, mult = 2) => {
    const ema = EMA(closes, emaPeriod);
    const atr = ATR(highs, lows, closes, atrPeriod);
    const minLen = Math.min(ema.length, atr.length);
    return {
        upper: ema.slice(-minLen).map((e, i) => e + mult * atr.slice(-minLen)[i]),
        middle: ema.slice(-minLen),
        lower: ema.slice(-minLen).map((e, i) => e - mult * atr.slice(-minLen)[i])
    };
};

// 24. Donchian Channels
export const DonchianChannels = (highs, lows, period = 20) => {
    const upper = [], lower = [], middle = [];
    for (let i = period - 1; i < highs.length; i++) {
        const hh = max(highs.slice(i - period + 1, i + 1));
        const ll = min(lows.slice(i - period + 1, i + 1));
        upper.push(hh);
        lower.push(ll);
        middle.push((hh + ll) / 2);
    }
    return { upper, middle, lower };
};

// 25. Standard Deviation
export const StdDev = (data, period = 20) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = avg(slice);
        result.push(Math.sqrt(slice.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / period));
    }
    return result;
};

// 26. Chaikin Volatility
export const ChaikinVolatility = (highs, lows, period = 10) => {
    const hl = highs.map((h, i) => h - lows[i]);
    const ema = EMA(hl, period);
    const result = [];
    for (let i = period; i < ema.length; i++) {
        result.push(((ema[i] - ema[i - period]) / ema[i - period]) * 100);
    }
    return result;
};

// 27. Historical Volatility
export const HistoricalVolatility = (data, period = 20) => {
    const returns = data.slice(1).map((v, i) => Math.log(v / data[i]));
    const result = [];
    for (let i = period - 1; i < returns.length; i++) {
        const slice = returns.slice(i - period + 1, i + 1);
        const mean = avg(slice);
        const variance = slice.reduce((a, r) => a + Math.pow(r - mean, 2), 0) / period;
        result.push(Math.sqrt(variance * 252) * 100);
    }
    return result;
};

// ============ HACİM İNDİKATÖRLERİ ============

// 28. OBV - On Balance Volume
export const OBV = (closes, volumes) => {
    const result = [0];
    for (let i = 1; i < closes.length; i++) {
        if (closes[i] > closes[i - 1]) result.push(result[i - 1] + volumes[i]);
        else if (closes[i] < closes[i - 1]) result.push(result[i - 1] - volumes[i]);
        else result.push(result[i - 1]);
    }
    return result;
};

// 29. AD - Accumulation/Distribution
export const AD = (highs, lows, closes, volumes) => {
    const result = [0];
    for (let i = 0; i < closes.length; i++) {
        const mfm = ((closes[i] - lows[i]) - (highs[i] - closes[i])) / ((highs[i] - lows[i]) || 1);
        const mfv = mfm * volumes[i];
        result.push((result[result.length - 1] || 0) + mfv);
    }
    return result.slice(1);
};

// 30. CMF - Chaikin Money Flow
export const CMF = (highs, lows, closes, volumes, period = 20) => {
    const mfv = closes.map((c, i) => {
        const mfm = ((c - lows[i]) - (highs[i] - c)) / ((highs[i] - lows[i]) || 1);
        return mfm * volumes[i];
    });
    const result = [];
    for (let i = period - 1; i < closes.length; i++) {
        result.push(sum(mfv.slice(i - period + 1, i + 1)) / sum(volumes.slice(i - period + 1, i + 1)));
    }
    return result;
};

// 31. VWAP - Volume Weighted Average Price
export const VWAP = (highs, lows, closes, volumes) => {
    let cumPV = 0, cumV = 0;
    return closes.map((c, i) => {
        const tp = (highs[i] + lows[i] + c) / 3;
        cumPV += tp * volumes[i];
        cumV += volumes[i];
        return cumPV / cumV;
    });
};

// 32. Force Index
export const ForceIndex = (closes, volumes, period = 13) => {
    const fi = closes.slice(1).map((c, i) => (c - closes[i]) * volumes[i + 1]);
    return EMA(fi, period);
};

// 33. EMV - Ease of Movement
export const EMV = (highs, lows, volumes, period = 14) => {
    const emv = highs.slice(1).map((h, i) => {
        const dm = ((h + lows[i + 1]) / 2) - ((highs[i] + lows[i]) / 2);
        const br = (volumes[i + 1] / 1000000) / (h - lows[i + 1] || 1);
        return dm / br;
    });
    return SMA(emv, period);
};

// 34. NVI - Negative Volume Index
export const NVI = (closes, volumes) => {
    const result = [1000];
    for (let i = 1; i < closes.length; i++) {
        if (volumes[i] < volumes[i - 1]) {
            result.push(result[i - 1] * (1 + (closes[i] - closes[i - 1]) / closes[i - 1]));
        } else {
            result.push(result[i - 1]);
        }
    }
    return result;
};

// 35. PVI - Positive Volume Index
export const PVI = (closes, volumes) => {
    const result = [1000];
    for (let i = 1; i < closes.length; i++) {
        if (volumes[i] > volumes[i - 1]) {
            result.push(result[i - 1] * (1 + (closes[i] - closes[i - 1]) / closes[i - 1]));
        } else {
            result.push(result[i - 1]);
        }
    }
    return result;
};

// ============ TREND GÜCÜ İNDİKATÖRLERİ ============

// 36. ADX - Average Directional Index
export const ADX = (highs, lows, closes, period = 14) => {
    const tr = [], plusDM = [], minusDM = [];
    for (let i = 1; i < highs.length; i++) {
        tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
        const upMove = highs[i] - highs[i - 1];
        const downMove = lows[i - 1] - lows[i];
        plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
        minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }
    const smoothTR = EMA(tr, period);
    const smoothPlusDM = EMA(plusDM, period);
    const smoothMinusDM = EMA(minusDM, period);
    const plusDI = smoothPlusDM.map((v, i) => (v / smoothTR[i]) * 100);
    const minusDI = smoothMinusDM.map((v, i) => (v / smoothTR[i]) * 100);
    const dx = plusDI.map((p, i) => (Math.abs(p - minusDI[i]) / (p + minusDI[i] || 1)) * 100);
    return { adx: EMA(dx, period), plusDI, minusDI };
};

// 37. Aroon
export const Aroon = (highs, lows, period = 25) => {
    const up = [], down = [];
    for (let i = period; i < highs.length; i++) {
        const slice = highs.slice(i - period, i + 1);
        const highIdx = slice.indexOf(max(slice));
        up.push((highIdx / period) * 100);
        const lowSlice = lows.slice(i - period, i + 1);
        const lowIdx = lowSlice.indexOf(min(lowSlice));
        down.push((lowIdx / period) * 100);
    }
    return { up, down, oscillator: up.map((u, i) => u - down[i]) };
};

// 38. Parabolic SAR
export const ParabolicSAR = (highs, lows, af = 0.02, maxAF = 0.2) => {
    const result = [lows[0]];
    let isLong = true, ep = highs[0], acceleration = af;
    for (let i = 1; i < highs.length; i++) {
        let sar = result[i - 1] + acceleration * (ep - result[i - 1]);
        if (isLong) {
            sar = Math.min(sar, lows[i - 1], i > 1 ? lows[i - 2] : lows[i - 1]);
            if (lows[i] < sar) { isLong = false; sar = ep; ep = lows[i]; acceleration = af; }
            else { if (highs[i] > ep) { ep = highs[i]; acceleration = Math.min(acceleration + af, maxAF); } }
        } else {
            sar = Math.max(sar, highs[i - 1], i > 1 ? highs[i - 2] : highs[i - 1]);
            if (highs[i] > sar) { isLong = true; sar = ep; ep = highs[i]; acceleration = af; }
            else { if (lows[i] < ep) { ep = lows[i]; acceleration = Math.min(acceleration + af, maxAF); } }
        }
        result.push(sar);
    }
    return result;
};

// 39. Supertrend
export const Supertrend = (highs, lows, closes, period = 10, mult = 3) => {
    const atr = ATR(highs, lows, closes, period);
    const result = [];
    let trend = 1;
    for (let i = 0; i < closes.length; i++) {
        if (i < period) { result.push(closes[i]); continue; }
        const atrVal = atr[i - period] || atr[0];
        const basicUpper = (highs[i] + lows[i]) / 2 + mult * atrVal;
        const basicLower = (highs[i] + lows[i]) / 2 - mult * atrVal;
        if (closes[i] > result[i - 1]) trend = 1;
        else if (closes[i] < result[i - 1]) trend = -1;
        result.push(trend === 1 ? basicLower : basicUpper);
    }
    return result;
};

// 40. Ichimoku Cloud
export const Ichimoku = (highs, lows, closes, tenkan = 9, kijun = 26, senkou = 52) => {
    const hl = (h, l, p, i) => (max(h.slice(Math.max(0, i - p + 1), i + 1)) + min(l.slice(Math.max(0, i - p + 1), i + 1))) / 2;
    const tenkanSen = closes.map((_, i) => hl(highs, lows, tenkan, i));
    const kijunSen = closes.map((_, i) => hl(highs, lows, kijun, i));
    const senkouA = tenkanSen.map((t, i) => (t + kijunSen[i]) / 2);
    const senkouB = closes.map((_, i) => hl(highs, lows, senkou, i));
    const chikou = closes.slice(kijun);
    return { tenkanSen, kijunSen, senkouA, senkouB, chikou };
};

export default { ATR, BollingerBands, KeltnerChannels, DonchianChannels, StdDev, ChaikinVolatility, HistoricalVolatility, OBV, AD, CMF, VWAP, ForceIndex, EMV, NVI, PVI, ADX, Aroon, ParabolicSAR, Supertrend, Ichimoku };
