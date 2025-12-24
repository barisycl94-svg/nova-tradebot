/**
 * IndicatorLibrary4.js - ADVANCED ANALYTICS
 * Nova TradeBot - 250+ İndikatör Genişletme Paketi
 */

// 1. McGinley Dynamic - Hareketli ortalamalardan daha hızlı ve daha az hatalı
export function McGinleyDynamic(data, period) {
    const mg = [data[0]];
    for (let i = 1; i < data.length; i++) {
        const prev = mg[i - 1];
        mg.push(prev + (data[i] - prev) / (period * Math.pow(data[i] / prev, 4)));
    }
    return mg;
}

// 2. Coppock Curve - Uzun vadeli momentum osilatörü
export function CoppockCurve(data) {
    const wma10 = (d) => {
        let sum = 0, weight = 0;
        for (let i = 0; i < d.length; i++) {
            sum += d[i] * (i + 1);
            weight += (i + 1);
        }
        return sum / weight;
    };

    const roc14 = [];
    const roc11 = [];
    for (let i = 14; i < data.length; i++) {
        roc14.push(((data[i] - data[i - 14]) / data[i - 14]) * 100);
    }
    for (let i = 11; i < data.length; i++) {
        roc11.push(((data[i] - data[i - 11]) / data[i - 11]) * 100);
    }

    const combined = [];
    const minLen = Math.min(roc14.length, roc11.length);
    for (let i = 0; i < minLen; i++) {
        combined.push(roc14[roc14.length - minLen + i] + roc11[roc11.length - minLen + i]);
    }

    const result = [];
    for (let i = 10; i <= combined.length; i++) {
        result.push(wma10(combined.slice(i - 10, i)));
    }
    return result;
}

// 3. Fisher Transform - Fiyatları normal dağılıma çevirerek dönüş noktalarını yakalar
export function FisherTransform(highs, lows, period = 10) {
    const fish = [];
    const price = highs.map((h, i) => (h + lows[i]) / 2);
    let prevFish = 0, prevValue = 0;

    for (let i = period; i < price.length; i++) {
        const window = price.slice(i - period, i);
        const maxH = Math.max(...window);
        const minL = Math.min(...window);

        let value = 0.33 * 2 * ((price[i] - minL) / (Math.max(maxH - minL, 0.001)) - 0.5) + 0.67 * prevValue;
        value = Math.max(Math.min(value, 0.999), -0.999);

        const currentFish = 0.5 * Math.log((1 + value) / (1 - value)) + 0.5 * prevFish;
        fish.push(currentFish);

        prevValue = value;
        prevFish = currentFish;
    }
    return fish;
}

// 4. Chande Momentum Oscillator (CMO)
export function CMO(data, period = 14) {
    const results = [];
    for (let i = period; i < data.length; i++) {
        let upSum = 0, downSum = 0;
        for (let j = i - period + 1; j <= i; j++) {
            const diff = data[j] - data[j - 1];
            if (diff > 0) upSum += diff;
            else downSum += Math.abs(diff);
        }
        results.push(100 * (upSum - downSum) / (upSum + downSum));
    }
    return results;
}

// 5. Vortex Indicator
export function Vortex(highs, lows, closes, period = 14) {
    const plusVM = [], minusVM = [], TR = [];
    for (let i = 1; i < highs.length; i++) {
        plusVM.push(Math.abs(highs[i] - lows[i - 1]));
        minusVM.push(Math.abs(lows[i] - highs[i - 1]));
        TR.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
    }

    const viPlus = [], viMinus = [];
    for (let i = period; i <= plusVM.length; i++) {
        const sumTR = TR.slice(i - period, i).reduce((a, b) => a + b, 0);
        viPlus.push(plusVM.slice(i - period, i).reduce((a, b) => a + b, 0) / sumTR);
        viMinus.push(minusVM.slice(i - period, i).reduce((a, b) => a + b, 0) / sumTR);
    }
    return { plus: viPlus, minus: viMinus };
}

// 6. Mass Index - Trend dönüşlerini volatilite üzerinden yakalar
export function MassIndex(highs, lows, period = 25) {
    const range = highs.map((h, i) => h - lows[i]);
    const ema9 = (d) => {
        let val = d[0];
        const res = [val];
        for (let j = 1; j < d.length; j++) { val = 0.2 * d[j] + 0.8 * val; res.push(val); }
        return res;
    };
    const e1 = ema9(range);
    const e2 = ema9(e1);
    const ratio = e1.map((v, i) => v / e2[i]);

    const mass = [];
    for (let i = period; i <= ratio.length; i++) {
        mass.push(ratio.slice(i - period, i).reduce((a, b) => a + b, 0));
    }
    return mass;
}

// 7. Elders Force Index
export function ForceIndex(closes, volumes, period = 13) {
    const fi = [];
    for (let i = 1; i < closes.length; i++) fi.push((closes[i] - closes[i - 1]) * volumes[i]);
    const ema = [fi[0]];
    const alpha = 2 / (period + 1);
    for (let i = 1; i < fi.length; i++) ema.push(fi[i] * alpha + ema[i - 1] * (1 - alpha));
    return ema;
}

// 8. Donchian Channels
export function Donchian(highs, lows, period = 20) {
    const upper = [], lower = [], middle = [];
    for (let i = period; i < highs.length; i++) {
        const h = Math.max(...highs.slice(i - period, i));
        const l = Math.min(...lows.slice(i - period, i));
        upper.push(h);
        lower.push(l);
        middle.push((h + l) / 2);
    }
    return { upper, lower, middle };
}

// 9. Keltner Channels
export function Keltner(highs, lows, closes, period = 20, multiplier = 2) {
    const ema = (d) => {
        let val = d[0];
        const res = [val];
        for (let j = 1; j < d.length; j++) { val = (2 / (period + 1)) * d[j] + (1 - (2 / (period + 1))) * val; res.push(val); }
        return res;
    };
    const tr = [highs[0] - lows[0]];
    for (let i = 1; i < highs.length; i++) tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));

    const middle = ema(closes);
    const atr = ema(tr);
    const upper = middle.map((v, i) => v + (multiplier * atr[i]));
    const lower = middle.map((v, i) => v - (multiplier * atr[i]));
    return { upper, lower, middle };
}

// 10. Efficiency Ratio (ER) - Kaufman
export function EfficiencyRatio(data, period = 10) {
    const er = [];
    for (let i = period; i < data.length; i++) {
        const direction = Math.abs(data[i] - data[i - period]);
        let volatility = 0;
        for (let j = i - period + 1; j <= i; j++) volatility += Math.abs(data[j] - data[j - 1]);
        er.push(direction / (volatility || 0.0001));
    }
    return er;
}
