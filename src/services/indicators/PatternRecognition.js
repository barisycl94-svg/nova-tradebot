/**
 * PatternRecognition.js
 * Nova TradeBot - Mum Formasyonları ve Grafik Desenleri (71-100)
 */

// ============ MUM FORMASYONLARI ============

// 71. Doji
export const isDoji = (o, h, l, c) => {
    const body = Math.abs(c - o);
    const range = h - l;
    return body <= range * 0.1;
};

// 72. Hammer
export const isHammer = (o, h, l, c) => {
    const body = Math.abs(c - o);
    const lowerWick = Math.min(o, c) - l;
    const upperWick = h - Math.max(o, c);
    return lowerWick >= body * 2 && upperWick <= body * 0.5;
};

// 73. Inverted Hammer
export const isInvertedHammer = (o, h, l, c) => {
    const body = Math.abs(c - o);
    const upperWick = h - Math.max(o, c);
    const lowerWick = Math.min(o, c) - l;
    return upperWick >= body * 2 && lowerWick <= body * 0.5;
};

// 74. Bullish Engulfing
export const isBullishEngulfing = (prev, curr) => {
    return prev.close < prev.open && curr.close > curr.open && curr.open < prev.close && curr.close > prev.open;
};

// 75. Bearish Engulfing
export const isBearishEngulfing = (prev, curr) => {
    return prev.close > prev.open && curr.close < curr.open && curr.open > prev.close && curr.close < prev.open;
};

// 76. Morning Star
export const isMorningStar = (c1, c2, c3) => {
    const firstBearish = c1.close < c1.open;
    const smallBody = Math.abs(c2.close - c2.open) < Math.abs(c1.close - c1.open) * 0.3;
    const thirdBullish = c3.close > c3.open && c3.close > (c1.open + c1.close) / 2;
    return firstBearish && smallBody && thirdBullish;
};

// 77. Evening Star
export const isEveningStar = (c1, c2, c3) => {
    const firstBullish = c1.close > c1.open;
    const smallBody = Math.abs(c2.close - c2.open) < Math.abs(c1.close - c1.open) * 0.3;
    const thirdBearish = c3.close < c3.open && c3.close < (c1.open + c1.close) / 2;
    return firstBullish && smallBody && thirdBearish;
};

// 78. Three White Soldiers
export const isThreeWhiteSoldiers = (c1, c2, c3) => {
    return c1.close > c1.open && c2.close > c2.open && c3.close > c3.open &&
        c2.open > c1.open && c2.close > c1.close && c3.open > c2.open && c3.close > c2.close;
};

// 79. Three Black Crows
export const isThreeBlackCrows = (c1, c2, c3) => {
    return c1.close < c1.open && c2.close < c2.open && c3.close < c3.open &&
        c2.open < c1.open && c2.close < c1.close && c3.open < c2.open && c3.close < c2.close;
};

// 80. Shooting Star
export const isShootingStar = (o, h, l, c) => {
    const body = Math.abs(c - o);
    const upperWick = h - Math.max(o, c);
    const lowerWick = Math.min(o, c) - l;
    return upperWick >= body * 2 && lowerWick <= body * 0.3 && c < o;
};

// 81. Hanging Man
export const isHangingMan = (o, h, l, c) => isHammer(o, h, l, c) && c < o;

// 82. Piercing Line
export const isPiercingLine = (prev, curr) => {
    return prev.close < prev.open && curr.close > curr.open &&
        curr.open < prev.low && curr.close > (prev.open + prev.close) / 2;
};

// 83. Dark Cloud Cover
export const isDarkCloudCover = (prev, curr) => {
    return prev.close > prev.open && curr.close < curr.open &&
        curr.open > prev.high && curr.close < (prev.open + prev.close) / 2;
};

// 84. Harami Bullish
export const isBullishHarami = (prev, curr) => {
    return prev.close < prev.open && curr.close > curr.open &&
        curr.open > prev.close && curr.close < prev.open;
};

// 85. Harami Bearish
export const isBearishHarami = (prev, curr) => {
    return prev.close > prev.open && curr.close < curr.open &&
        curr.open < prev.close && curr.close > prev.open;
};

// 86. Spinning Top
export const isSpinningTop = (o, h, l, c) => {
    const body = Math.abs(c - o);
    const range = h - l;
    return body <= range * 0.3 && body > range * 0.1;
};

// 87. Marubozu
export const isMarubozu = (o, h, l, c) => {
    const body = Math.abs(c - o);
    const range = h - l;
    return body >= range * 0.95;
};

// 88. Tweezer Top
export const isTweezerTop = (c1, c2) => Math.abs(c1.high - c2.high) < (c1.high - c1.low) * 0.05;

// 89. Tweezer Bottom
export const isTweezerBottom = (c1, c2) => Math.abs(c1.low - c2.low) < (c1.high - c1.low) * 0.05;

// 90. Dragonfly Doji
export const isDragonflyDoji = (o, h, l, c) => isDoji(o, h, l, c) && (h - Math.max(o, c)) < (h - l) * 0.1;

// 91. Gravestone Doji
export const isGravestoneDoji = (o, h, l, c) => isDoji(o, h, l, c) && (Math.min(o, c) - l) < (h - l) * 0.1;

// ============ GRAFİK DESENLERİ ============

// 92. Double Top
export const isDoubleTop = (highs, tolerance = 0.02) => {
    if (highs.length < 10) return false;
    const peak1 = Math.max(...highs.slice(0, Math.floor(highs.length / 2)));
    const peak2 = Math.max(...highs.slice(Math.floor(highs.length / 2)));
    return Math.abs(peak1 - peak2) / peak1 < tolerance;
};

// 93. Double Bottom
export const isDoubleBottom = (lows, tolerance = 0.02) => {
    if (lows.length < 10) return false;
    const low1 = Math.min(...lows.slice(0, Math.floor(lows.length / 2)));
    const low2 = Math.min(...lows.slice(Math.floor(lows.length / 2)));
    return Math.abs(low1 - low2) / low1 < tolerance;
};

// 94. Head and Shoulders
export const isHeadAndShoulders = (highs) => {
    if (highs.length < 15) return false;
    const third = Math.floor(highs.length / 3);
    const ls = Math.max(...highs.slice(0, third));
    const head = Math.max(...highs.slice(third, third * 2));
    const rs = Math.max(...highs.slice(third * 2));
    return head > ls && head > rs && Math.abs(ls - rs) / ls < 0.1;
};

// 95. Inverse Head and Shoulders
export const isInverseHeadAndShoulders = (lows) => {
    if (lows.length < 15) return false;
    const third = Math.floor(lows.length / 3);
    const ls = Math.min(...lows.slice(0, third));
    const head = Math.min(...lows.slice(third, third * 2));
    const rs = Math.min(...lows.slice(third * 2));
    return head < ls && head < rs && Math.abs(ls - rs) / ls < 0.1;
};

// 96. Ascending Triangle
export const isAscendingTriangle = (highs, lows) => {
    const highFlat = Math.max(...highs) - Math.min(...highs.slice(-5)) < Math.max(...highs) * 0.02;
    const lowsRising = lows.slice(-5).every((l, i, arr) => i === 0 || l >= arr[i - 1] * 0.99);
    return highFlat && lowsRising;
};

// 97. Descending Triangle
export const isDescendingTriangle = (highs, lows) => {
    const lowFlat = Math.max(...lows.slice(-5)) - Math.min(...lows) < Math.min(...lows) * 0.02;
    const highsFalling = highs.slice(-5).every((h, i, arr) => i === 0 || h <= arr[i - 1] * 1.01);
    return lowFlat && highsFalling;
};

// 98. Support Level
export const findSupport = (lows, sensitivity = 0.02) => {
    const levels = [];
    for (let i = 2; i < lows.length - 2; i++) {
        if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] && lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
            levels.push(lows[i]);
        }
    }
    return levels;
};

// 99. Resistance Level
export const findResistance = (highs, sensitivity = 0.02) => {
    const levels = [];
    for (let i = 2; i < highs.length - 2; i++) {
        if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
            levels.push(highs[i]);
        }
    }
    return levels;
};

// 100. Trend Line Breakout
export const isTrendBreakout = (closes, period = 20) => {
    if (closes.length < period) return { up: false, down: false };
    const recent = closes.slice(-period);
    const first = recent[0], last = recent[recent.length - 1];
    const slope = (last - first) / period;
    const expectedNow = first + slope * period;
    const currentPrice = closes[closes.length - 1];
    return {
        up: currentPrice > expectedNow * 1.02,
        down: currentPrice < expectedNow * 0.98
    };
};

// ============ MASTER PATTERN ANALYZER ============
export const analyzePatterns = (candles) => {
    if (candles.length < 3) return [];
    const patterns = [];
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const prev2 = candles[candles.length - 3];

    if (isDoji(last.open, last.high, last.low, last.close)) patterns.push({ name: 'Doji', signal: 'neutral', weight: 0.5 });
    if (isHammer(last.open, last.high, last.low, last.close)) patterns.push({ name: 'Hammer', signal: 'bullish', weight: 0.7 });
    if (isShootingStar(last.open, last.high, last.low, last.close)) patterns.push({ name: 'Shooting Star', signal: 'bearish', weight: 0.7 });
    if (isBullishEngulfing(prev, last)) patterns.push({ name: 'Bullish Engulfing', signal: 'bullish', weight: 0.8 });
    if (isBearishEngulfing(prev, last)) patterns.push({ name: 'Bearish Engulfing', signal: 'bearish', weight: 0.8 });
    if (isMorningStar(prev2, prev, last)) patterns.push({ name: 'Morning Star', signal: 'bullish', weight: 0.85 });
    if (isEveningStar(prev2, prev, last)) patterns.push({ name: 'Evening Star', signal: 'bearish', weight: 0.85 });
    if (isThreeWhiteSoldiers(prev2, prev, last)) patterns.push({ name: 'Three White Soldiers', signal: 'bullish', weight: 0.9 });
    if (isThreeBlackCrows(prev2, prev, last)) patterns.push({ name: 'Three Black Crows', signal: 'bearish', weight: 0.9 });

    return patterns;
};

export default { isDoji, isHammer, isInvertedHammer, isBullishEngulfing, isBearishEngulfing, isMorningStar, isEveningStar, isThreeWhiteSoldiers, isThreeBlackCrows, isShootingStar, isHangingMan, isPiercingLine, isDarkCloudCover, isBullishHarami, isBearishHarami, isSpinningTop, isMarubozu, isTweezerTop, isTweezerBottom, isDragonflyDoji, isGravestoneDoji, isDoubleTop, isDoubleBottom, isHeadAndShoulders, isInverseHeadAndShoulders, isAscendingTriangle, isDescendingTriangle, findSupport, findResistance, isTrendBreakout, analyzePatterns };
