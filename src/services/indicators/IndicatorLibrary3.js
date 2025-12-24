/**
 * IndicatorLibrary3.js - PART 3
 * Osilatörler ve Ek İndikatörler (41-70)
 */

const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const avg = (arr) => arr.length ? sum(arr) / arr.length : 0;
const max = (arr) => Math.max(...arr);
const min = (arr) => Math.min(...arr);

// 41. PPO - Percentage Price Oscillator
export const PPO = (data, fast = 12, slow = 26, signal = 9) => {
    const emaFast = EMA(data, fast);
    const emaSlow = EMA(data, slow);
    const ppo = emaFast.map((f, i) => ((f - emaSlow[i]) / emaSlow[i]) * 100);
    const signalLine = EMA(ppo, signal);
    return { ppo, signal: signalLine, histogram: ppo.map((p, i) => p - signalLine[i]) };
};

// 42. DPO - Detrended Price Oscillator
export const DPO = (data, period = 20) => {
    const shift = Math.floor(period / 2) + 1;
    const sma = SMA(data, period);
    return data.slice(shift).map((v, i) => v - sma[i]);
};

// 43. Trix
export const TRIX = (data, period = 15) => {
    const ema1 = EMA(data, period);
    const ema2 = EMA(ema1, period);
    const ema3 = EMA(ema2, period);
    return ema3.slice(1).map((v, i) => ((v - ema3[i]) / ema3[i]) * 100);
};

// 44. KST - Know Sure Thing
export const KST = (data) => {
    const roc1 = ROC(data, 10), roc2 = ROC(data, 15), roc3 = ROC(data, 20), roc4 = ROC(data, 30);
    const sma1 = SMA(roc1, 10), sma2 = SMA(roc2, 10), sma3 = SMA(roc3, 10), sma4 = SMA(roc4, 15);
    const minLen = Math.min(sma1.length, sma2.length, sma3.length, sma4.length);
    const kst = [];
    for (let i = 0; i < minLen; i++) {
        kst.push(sma1[sma1.length - minLen + i] + 2 * sma2[sma2.length - minLen + i] + 3 * sma3[sma3.length - minLen + i] + 4 * sma4[sma4.length - minLen + i]);
    }
    return { kst, signal: SMA(kst, 9) };
};

// 45. Coppock Curve
export const CoppockCurve = (data, wma = 10, roc1 = 14, roc2 = 11) => {
    const r1 = ROC(data, roc1), r2 = ROC(data, roc2);
    const minLen = Math.min(r1.length, r2.length);
    const combined = r1.slice(-minLen).map((v, i) => v + r2.slice(-minLen)[i]);
    return WMA(combined, wma);
};

// 46. Elder Ray (Bull/Bear Power)
export const ElderRay = (highs, lows, closes, period = 13) => {
    const ema = EMA(closes, period);
    return {
        bullPower: highs.slice(-ema.length).map((h, i) => h - ema[i]),
        bearPower: lows.slice(-ema.length).map((l, i) => l - ema[i])
    };
};

// 47. Chande Momentum Oscillator
export const CMO = (data, period = 9) => {
    const result = [];
    for (let i = period; i < data.length; i++) {
        let su = 0, sd = 0;
        for (let j = 0; j < period; j++) {
            const diff = data[i - j] - data[i - j - 1];
            if (diff > 0) su += diff;
            else sd += Math.abs(diff);
        }
        result.push(((su - sd) / (su + sd || 1)) * 100);
    }
    return result;
};

// 48. QStick
export const QStick = (opens, closes, period = 8) => {
    const diff = closes.map((c, i) => c - opens[i]);
    return SMA(diff, period);
};

// 49. Mass Index
export const MassIndex = (highs, lows, period = 25) => {
    const hl = highs.map((h, i) => h - lows[i]);
    const ema1 = EMA(hl, 9);
    const ema2 = EMA(ema1, 9);
    const ratio = ema1.map((e, i) => e / (ema2[i] || 1));
    const result = [];
    for (let i = period - 1; i < ratio.length; i++) {
        result.push(sum(ratio.slice(i - period + 1, i + 1)));
    }
    return result;
};

// 50. VROC - Volume Rate of Change
export const VROC = (volumes, period = 14) => {
    return volumes.slice(period).map((v, i) => ((v - volumes[i]) / volumes[i]) * 100);
};

// ============ EK TREND İNDİKATÖRLERİ ============

// 51. VORTEX
export const Vortex = (highs, lows, closes, period = 14) => {
    const tr = [], vmPlus = [], vmMinus = [];
    for (let i = 1; i < highs.length; i++) {
        tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
        vmPlus.push(Math.abs(highs[i] - lows[i - 1]));
        vmMinus.push(Math.abs(lows[i] - highs[i - 1]));
    }
    const viPlus = [], viMinus = [];
    for (let i = period - 1; i < tr.length; i++) {
        const sumTR = sum(tr.slice(i - period + 1, i + 1));
        viPlus.push(sum(vmPlus.slice(i - period + 1, i + 1)) / sumTR);
        viMinus.push(sum(vmMinus.slice(i - period + 1, i + 1)) / sumTR);
    }
    return { viPlus, viMinus };
};

// 52. TWIGGS Money Flow
export const TwiggsMF = (highs, lows, closes, volumes, period = 21) => {
    const trh = highs.map((h, i) => i > 0 ? Math.max(h, closes[i - 1]) : h);
    const trl = lows.map((l, i) => i > 0 ? Math.min(l, closes[i - 1]) : l);
    const adv = closes.map((c, i) => ((c - trl[i]) - (trh[i] - c)) / (trh[i] - trl[i] || 1) * volumes[i]);
    const result = [];
    for (let i = period - 1; i < adv.length; i++) {
        result.push(sum(adv.slice(i - period + 1, i + 1)) / sum(volumes.slice(i - period + 1, i + 1)));
    }
    return result;
};

// 53. Choppiness Index
export const ChoppinessIndex = (highs, lows, closes, period = 14) => {
    const atr = ATR(highs, lows, closes, 1);
    const result = [];
    for (let i = period; i < closes.length; i++) {
        const atrSum = sum(atr.slice(i - period, i));
        const hh = max(highs.slice(i - period, i));
        const ll = min(lows.slice(i - period, i));
        result.push(100 * Math.log10(atrSum / (hh - ll || 1)) / Math.log10(period));
    }
    return result;
};

// 54. McGinley Dynamic
export const McGinleyDynamic = (data, period = 14) => {
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
        const prev = result[i - 1];
        result.push(prev + (data[i] - prev) / (period * Math.pow(data[i] / prev, 4)));
    }
    return result;
};

// 55-70: Daha fazla indikatör
export const RVI = (opens, highs, lows, closes, period = 10) => {
    const num = closes.map((c, i) => (c - opens[i]) + 2 * (closes[i - 1] - opens[i - 1] || 0) + 2 * (closes[i - 2] - opens[i - 2] || 0) + (closes[i - 3] - opens[i - 3] || 0));
    const den = highs.map((h, i) => (h - lows[i]) + 2 * (highs[i - 1] - lows[i - 1] || 0) + 2 * (highs[i - 2] - lows[i - 2] || 0) + (highs[i - 3] - lows[i - 3] || 0));
    return SMA(num.slice(3).map((n, i) => n / (den.slice(3)[i] || 1)), period);
};

export const SMI = (highs, lows, closes, period = 13, smooth = 25) => {
    const result = [];
    for (let i = period - 1; i < closes.length; i++) {
        const hh = max(highs.slice(i - period + 1, i + 1));
        const ll = min(lows.slice(i - period + 1, i + 1));
        const m = (hh + ll) / 2;
        const d = closes[i] - m;
        result.push((d / ((hh - ll) / 2 || 1)) * 100);
    }
    return EMA(EMA(result, smooth), smooth);
};

export const FisherTransform = (highs, lows, period = 10) => {
    const hl2 = highs.map((h, i) => (h + lows[i]) / 2);
    const result = [0];
    for (let i = period; i < hl2.length; i++) {
        const hh = max(hl2.slice(i - period, i));
        const ll = min(hl2.slice(i - period, i));
        let val = 0.33 * 2 * ((hl2[i] - ll) / (hh - ll || 1) - 0.5) + 0.67 * (result[result.length - 1] || 0);
        val = Math.max(-0.999, Math.min(0.999, val));
        result.push(0.5 * Math.log((1 + val) / (1 - val)));
    }
    return result;
};

export const WaveTrend = (highs, lows, closes, n1 = 10, n2 = 21) => {
    const ap = closes.map((c, i) => (highs[i] + lows[i] + c) / 3);
    const esa = EMA(ap, n1);
    const d = ap.map((a, i) => Math.abs(a - (esa[i] || a)));
    const dd = EMA(d, n1);
    const ci = ap.map((a, i) => (a - (esa[i] || a)) / (0.015 * (dd[i] || 1)));
    const tci = EMA(ci, n2);
    return { wt1: tci, wt2: SMA(tci, 4) };
};

export const AwesomeOscillator = (highs, lows) => {
    const mp = highs.map((h, i) => (h + lows[i]) / 2);
    const sma5 = SMA(mp, 5);
    const sma34 = SMA(mp, 34);
    return sma5.slice(-sma34.length).map((s, i) => s - sma34[i]);
};

export const AcceleratorOscillator = (highs, lows) => {
    const ao = AwesomeOscillator(highs, lows);
    const sma5 = SMA(ao, 5);
    return ao.slice(-sma5.length).map((a, i) => a - sma5[i]);
};

export const GatorOscillator = (highs, lows, closes) => {
    const mp = closes.map((c, i) => (highs[i] + lows[i] + c) / 3);
    const jaw = SMMA(mp, 13);
    const teeth = SMMA(mp, 8);
    const lips = SMMA(mp, 5);
    return { upper: jaw.map((j, i) => Math.abs(j - teeth[i])), lower: teeth.map((t, i) => -Math.abs(t - lips[i])) };
};

// Helper imports
function EMA(data, period) {
    const k = 2 / (period + 1);
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) result.push(data[i] * k + result[i - 1] * (1 - k));
    return result;
}
function SMA(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) result.push(avg(data.slice(i - period + 1, i + 1)));
    return result;
}
function WMA(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        let w = 0, d = 0;
        for (let j = 0; j < period; j++) { w += data[i - j] * (period - j); d += period - j; }
        result.push(w / d);
    }
    return result;
}
function SMMA(data, period) {
    const r = [avg(data.slice(0, period))];
    for (let i = period; i < data.length; i++) r.push((r[r.length - 1] * (period - 1) + data[i]) / period);
    return r;
}
function ROC(data, period) { return data.slice(period).map((v, i) => ((v - data[i]) / data[i]) * 100); }
function ATR(h, l, c, p) {
    const tr = h.map((hv, i) => i === 0 ? hv - l[i] : Math.max(hv - l[i], Math.abs(hv - c[i - 1]), Math.abs(l[i] - c[i - 1])));
    const r = [avg(tr.slice(0, p))];
    for (let i = p; i < tr.length; i++) r.push((r[r.length - 1] * (p - 1) + tr[i]) / p);
    return r;
}

export default { PPO, DPO, TRIX, KST, CoppockCurve, ElderRay, CMO, QStick, MassIndex, VROC, Vortex, TwiggsMF, ChoppinessIndex, McGinleyDynamic, RVI, SMI, FisherTransform, WaveTrend, AwesomeOscillator, AcceleratorOscillator, GatorOscillator };
