/**
 * MasterIndicatorAnalyzer.js
 * Nova TradeBot - Gruplandırılmış Uzman Analiz Sistemi (V3)
 * 
 * 250+ İndikatörü 5 Ana Uzman Gruba ayırır. Her grup kendi içinde puanlanır,
 * nihai skor bu 5 grubun ağırlıklı ortalamasıyla bulunur. 
 */

// Değişkenleri dinamik yükle (xt/initialization hatasını önlemek için)
let Lib1, Lib2, Lib3, Lib4, Patterns;

const ensureLibsLoaded = async () => {
    try {
        if (!Lib1) {
            const m1 = await import('./IndicatorLibrary.js');
            Lib1 = m1.default || m1;
        }
        if (!Lib2) {
            const m2 = await import('./IndicatorLibrary2.js');
            Lib2 = m2.default || m2;
        }
        if (!Lib3) {
            const m3 = await import('./IndicatorLibrary3.js');
            Lib3 = m3.default || m3;
        }
        if (!Lib4) {
            const m4 = await import('./IndicatorLibrary4.js');
            Lib4 = m4.default || m4;
        }
        if (!Patterns) {
            const mp = await import('./PatternRecognition.js');
            Patterns = mp.default || mp;
        }

        // Güvenlik: Eğer hala yüklenmediyse sahte boş objeler dön (analiz patlamasın)
        Lib1 = Lib1 || {};
        Lib2 = Lib2 || {};
        Lib3 = Lib3 || {};
        Lib4 = Lib4 || {};
        Patterns = Patterns || { analyzePatterns: () => [] };

    } catch (e) {
        console.error('❌ İndikatör kütüphaneleri yüklenirken kritik hata:', e);
    }
};

export class MasterIndicatorAnalyzer {

    static async analyze(candles, learnedStats = {}) {
        await ensureLibsLoaded();

        if (!candles || candles.length < 50) {
            return { score: 50, signals: [], confidence: 0, details: [] };
        }

        const analysisData = candles.slice(-300);
        const closes = analysisData.map(c => c.close);
        const highs = analysisData.map(c => c.high);
        const lows = analysisData.map(c => c.low);
        const opens = analysisData.map(c => c.open);
        const volumes = analysisData.map(c => c.volume || 1);
        const curPrice = closes[closes.length - 1];

        // --- 📊 MARKET REJİMİ TESPİTİ ---
        const adxResult = Lib2.ADX ? Lib2.ADX(highs, lows, closes, 14) : null;
        const chopResult = Lib3.ChoppinessIndex ? Lib3.ChoppinessIndex(highs, lows, closes, 14) : null;

        const adxValue = adxResult?.adx ? adxResult.adx[adxResult.adx.length - 1] : 0;
        const chopValue = chopResult ? chopResult[chopResult.length - 1] : 50;

        const isTrending = adxValue > 25 && chopValue < 50;
        const isRanging = adxValue < 20 || chopValue > 61.8;

        const groups = {
            trend: { name: 'Trend (MA/Trailing)', weightedSum: 0, totalWeight: 0, score: 50, baseWeight: isTrending ? 0.35 : 0.15 },
            momentum: { name: 'Momentum (Oscillators)', weightedSum: 0, totalWeight: 0, score: 50, baseWeight: isRanging ? 0.45 : 0.30 },
            volatility: { name: 'Volatility (Bands/Range)', weightedSum: 0, totalWeight: 0, score: 50, baseWeight: 0.15 },
            volume: { name: 'Volume (Flow/Liquidity)', weightedSum: 0, totalWeight: 0, score: 50, baseWeight: 0.20 },
            patterns: { name: 'Patterns (Price Action)', weightedSum: 0, totalWeight: 0, score: 50, baseWeight: 0.20 }
        };

        const allSignals = [];

        // Trend Grubu
        const maTypes = [
            { fn: Lib1.SMA, name: 'SMA' }, { fn: Lib1.EMA, name: 'EMA' },
            { fn: Lib1.WMA, name: 'WMA' }, { fn: Lib1.DEMA, name: 'DEMA' },
            { fn: Lib1.TEMA, name: 'TEMA' }, { fn: Lib1.HMA, name: 'HMA' },
            { fn: Lib1.ZLEMA, name: 'ZLEMA' }, { fn: Lib1.KAMA, name: 'KAMA' },
            { fn: Lib1.SMMA, name: 'SMMA' }, { fn: Lib3.McGinleyDynamic, name: 'McGen' },
            { fn: Lib1.VWMA ? (d, p) => Lib1.VWMA(d, volumes, p) : null, name: 'VWMA' }
        ];

        const maPeriods = [5, 8, 13, 21, 34, 55, 89, 144, 233];

        maPeriods.forEach(p => {
            maTypes.forEach(type => {
                if (type.fn) {
                    try {
                        const ma = type.fn(closes, p);
                        if (ma && ma.length > 0) {
                            const maVal = ma[ma.length - 1];
                            const v = curPrice > maVal ? 1 : -1;
                            this._addSignalToGroup(groups.trend, `${type.name}-${p}`, v, 0.3, learnedStats, allSignals);
                        }
                    } catch (e) { }
                }
            });
        });

        // Diğer indikatörler (Hata korumalı)
        try {
            if (Lib3.Vortex) {
                const vortex = Lib3.Vortex(highs, lows, closes, 14);
                if (vortex && vortex.viPlus) {
                    const vp = vortex.viPlus[vortex.viPlus.length - 1];
                    const vm = vortex.viMinus[vortex.viMinus.length - 1];
                    this._addSignalToGroup(groups.trend, 'Vortex', vp > vm ? 1 : -1, 1.2, learnedStats, allSignals);
                }
            }

            if (Lib1.RSI) {
                const rsi = Lib1.RSI(closes, 14);
                if (rsi && rsi.length > 0) {
                    const r = rsi[rsi.length - 1];
                    const v = r < 30 ? 1 : r > 70 ? -1 : 0;
                    this._addSignalToGroup(groups.momentum, 'RSI-14', v, 1.5, learnedStats, allSignals);
                }
            }

            if (Lib1.MACD) {
                const m = Lib1.MACD(closes);
                if (m && m.histogram) {
                    const h = m.histogram[m.histogram.length - 1];
                    this._addSignalToGroup(groups.momentum, 'MACD', h > 0 ? 1 : -1, 1.4, learnedStats, allSignals);
                }
            }

            if (Lib2.BollingerBands) {
                const bb = Lib2.BollingerBands(closes, 20, 2);
                if (bb && bb.lower) {
                    const lower = bb.lower[bb.lower.length - 1];
                    const upper = bb.upper[bb.upper.length - 1];
                    const v = curPrice < lower ? 1 : curPrice > upper ? -1 : 0;
                    this._addSignalToGroup(groups.volatility, 'BBands', v, 1.8, learnedStats, allSignals);
                }
            }

            if (Lib1.MFI) {
                const mfi = Lib1.MFI(highs, lows, closes, volumes, 14);
                if (mfi && mfi.length > 0) {
                    const m = mfi[mfi.length - 1];
                    const v = m < 20 ? 1 : m > 80 ? -1 : 0;
                    this._addSignalToGroup(groups.volume, 'MFI', v, 1.8, learnedStats, allSignals);
                }
            }

            if (Patterns.analyzePatterns) {
                const pList = Patterns.analyzePatterns(analysisData);
                pList.forEach(p => {
                    const v = p.signal === 'bullish' ? 1 : p.signal === 'bearish' ? -1 : 0;
                    this._addSignalToGroup(groups.patterns, `Pattern-${p.name}`, v, p.weight * 2, learnedStats, allSignals);
                });
            }
        } catch (e) {
            console.warn('Bazı indikatörler hesaplanamadı:', e.message);
        }

        // --- NİHAİ SKOR ---
        let totalWeightedScore = 0;
        let totalGroupWeight = 0;

        Object.keys(groups).forEach(key => {
            const g = groups[key];
            if (g.totalWeight > 0) {
                const rawRatio = g.weightedSum / g.totalWeight;
                g.score = 50 + (rawRatio * 50);
                totalWeightedScore += g.score * g.baseWeight;
                totalGroupWeight += g.baseWeight;
            }
        });

        const finalScore = totalGroupWeight > 0 ? totalWeightedScore / totalGroupWeight : 50;
        const bullish = allSignals.filter(s => s.value > 0).length;
        const bearish = allSignals.filter(s => s.value < 0).length;

        return {
            score: Math.round(finalScore),
            signals: allSignals,
            confidence: Math.round((allSignals.filter(s => s.value !== 0).length / Math.max(1, allSignals.length)) * 100),
            bullishSignals: bullish,
            bearishSignals: bearish,
            neutralSignals: allSignals.length - bullish - bearish,
            totalIndicators: allSignals.length
        };
    }

    static _addSignalToGroup(group, name, value, weight, learnedStats, allSignals) {
        const adjWeight = this.getAdjustedWeight(name, weight, learnedStats);
        group.weightedSum += value * adjWeight;
        group.totalWeight += adjWeight;
        allSignals.push({ name, value, weight: adjWeight });
    }

    static getAdjustedWeight(name, baseWeight, learnedStats) {
        if (!learnedStats || !learnedStats[name]) return baseWeight;
        const stats = learnedStats[name];
        if (!stats.totalSignals || stats.totalSignals < 5) return baseWeight;
        const successRate = stats.successRate || 0.5;
        let multiplier = 1.0;
        if (successRate > 0.5) multiplier = 1 + (successRate - 0.5) * 2;
        else multiplier = Math.max(0.2, 1 - (0.5 - successRate) * 2);
        return baseWeight * multiplier;
    }
}

export default MasterIndicatorAnalyzer;
