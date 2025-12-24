/**
 * MasterIndicatorAnalyzer.js
 * Nova TradeBot - Gruplandırılmış Uzman Analiz Sistemi (V3)
 * 
 * 250+ İndikatörü 5 Ana Uzman Gruba ayırır. Her grup kendi içinde puanlanır,
 * nihai skor bu 5 grubun ağırlıklı ortalamasıyla bulunur. 
 * Bu sayede "Sürü Psikolojisi" (örneğin 100 MA'nın skoru ezmesi) engellenir.
 */

// Değişkenleri dinamik yükle (xt/initialization hatasını önlemek için)
let Lib1, Lib2, Lib3, Lib4, Patterns;

const ensureLibsLoaded = async () => {
    if (!Lib1) Lib1 = await import('./IndicatorLibrary.js');
    if (!Lib2) Lib2 = await import('./IndicatorLibrary2.js');
    if (!Lib3) Lib3 = await import('./IndicatorLibrary3.js');
    if (!Lib4) Lib4 = await import('./IndicatorLibrary4.js');
    if (!Patterns) Patterns = await import('./PatternRecognition.js');
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

        // --- 📊 MARKET REJİMİ TESPİTİ (REGIME DETECTION) ---
        // ADX: Trend Gücü | Choppiness: Piyasa dalgalanması
        const adxResult = Lib2.ADX(highs, lows, closes, 14);
        const chopResult = Lib3.ChoppinessIndex(highs, lows, closes, 14);

        const adxValue = adxResult?.adx[adxResult.adx.length - 1] || 0;
        const chopValue = chopResult[chopResult.length - 1] || 50;

        // Rejim Tanımları:
        // TRENDING: ADX > 25 && CHOP < 50
        // RANGING: ADX < 20 || CHOP > 60
        const isTrending = adxValue > 25 && chopValue < 50;
        const isRanging = adxValue < 20 || chopValue > 61.8;

        // --- 5 ANA UZMAN GRUBU ---
        const groups = {
            trend: { name: 'Trend (MA/Trailing)', weightedSum: 0, totalWeight: 0, score: 50, baseWeight: isTrending ? 0.35 : 0.15 },
            momentum: { name: 'Momentum (Oscillators)', weightedSum: 0, totalWeight: 0, score: 50, baseWeight: isRanging ? 0.45 : 0.30 },
            volatility: { name: 'Volatility (Bands/Range)', weightedSum: 0, totalWeight: 0, score: 50, baseWeight: 0.15 },
            volume: { name: 'Volume (Flow/Liquidity)', weightedSum: 0, totalWeight: 0, score: 50, baseWeight: 0.20 },
            patterns: { name: 'Patterns (Price Action)', weightedSum: 0, totalWeight: 0, score: 50, baseWeight: 0.20 }
        };

        const allSignals = [];

        // 1. TREND GRUBU (350+ MA Varyasyonu, Supertrend, SAR, Vortex, McGinley)
        const maTypes = [
            { fn: Lib1.SMA, name: 'SMA' }, { fn: Lib1.EMA, name: 'EMA' },
            { fn: Lib1.WMA, name: 'WMA' }, { fn: Lib1.DEMA, name: 'DEMA' },
            { fn: Lib1.TEMA, name: 'TEMA' }, { fn: Lib1.HMA, name: 'HMA' },
            { fn: Lib1.ZLEMA, name: 'ZLEMA' }, { fn: Lib1.KAMA, name: 'KAMA' },
            { fn: Lib1.SMMA, name: 'SMMA' }, { fn: Lib3.McGinleyDynamic, name: 'McGen' },
            { fn: (d, p) => Lib1.VWMA(d, volumes, p), name: 'VWMA' }
        ];

        // GÜVENLİK İÇİN ARTIRILMIŞ PERİYOTLAR (36 Periyot x 11 Tip = 396 İndikatör)
        const maPeriods = [
            5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 28, 30,
            32, 35, 40, 45, 50, 60, 70, 80, 90, 100, 120, 150, 200, 250, 300
        ];

        maPeriods.forEach(p => {
            maTypes.forEach(type => {
                const ma = type.fn(closes, p);
                if (ma && ma.length > 0) {
                    const maVal = ma[ma.length - 1];
                    const v = curPrice > maVal ? 1 : -1;
                    this._addSignalToGroup(groups.trend, `${type.name}-${p}`, v, 0.3, learnedStats, allSignals);
                }
            });
        });

        // Vortex & multi-SAR
        const vortex = Lib3.Vortex(highs, lows, closes, 14);
        if (vortex && vortex.viPlus) {
            const vp = vortex.viPlus[vortex.viPlus.length - 1];
            const vm = vortex.viMinus[vortex.viMinus.length - 1];
            this._addSignalToGroup(groups.trend, 'Vortex', vp > vm ? 1 : -1, 1.2, learnedStats, allSignals);
        }

        [0.02, 0.03, 0.04, 0.06].forEach(acc => {
            const sar = Lib2.ParabolicSAR(highs, lows, acc, 0.2);
            if (sar && sar.length > 0) {
                const v = curPrice > sar[sar.length - 1] ? 1 : -1;
                this._addSignalToGroup(groups.trend, `PSAR-${acc}`, v, 1.0, learnedStats, allSignals);
            }
        });

        // 2. MOMENTUM GRUBU (RSI, CCI, ROC, SMI, WaveTrend, AO, PPO, Trix, MACD, Stoch, WilliamsR, TSI)
        const momPeriods = [7, 9, 10, 12, 14, 21, 28, 35, 50]; // Genişletilmiş liste

        momPeriods.forEach(p => {
            const rsi = Lib1.RSI(closes, p);
            if (rsi && rsi.length > 0) {
                const r = rsi[rsi.length - 1];
                const v = r < 30 ? 1 : r > 70 ? -1 : 0;
                this._addSignalToGroup(groups.momentum, `RSI-${p}`, v, 1.5, learnedStats, allSignals);
            }
            const cci = Lib1.CCI(highs, lows, closes, p);
            if (cci && cci.length > 0) {
                const c = cci[cci.length - 1];
                const v = c < -100 ? 1 : c > 100 ? -1 : 0;
                this._addSignalToGroup(groups.momentum, `CCI-${p}`, v, 1.2, learnedStats, allSignals);
            }
            const roc = Lib1.ROC(closes, p);
            if (roc && roc.length > 0) {
                const r = roc[roc.length - 1];
                const v = r > 0 ? 1 : -1;
                this._addSignalToGroup(groups.momentum, `ROC-${p}`, v, 0.8, learnedStats, allSignals);
            }
            const wr = Lib1.WilliamsR(highs, lows, closes, p);
            if (wr && wr.length > 0) {
                const w = wr[wr.length - 1];
                const v = w < -80 ? 1 : w > -20 ? -1 : 0;
                this._addSignalToGroup(groups.momentum, `WilliamsR-${p}`, v, 1.1, learnedStats, allSignals);
            }
        });

        const smi = Lib3.SMI(highs, lows, closes, 13, 25);
        if (smi && smi.length > 0) {
            const s = smi[smi.length - 1];
            const v = s < -40 ? 1 : s > 40 ? -1 : 0;
            this._addSignalToGroup(groups.momentum, 'SMI', v, 1.8, learnedStats, allSignals);
        }

        const wt = Lib3.WaveTrend(highs, lows, closes, 10, 21);
        if (wt && wt.wt1) {
            const w1 = wt.wt1[wt.wt1.length - 1];
            const w2 = wt.wt2[wt.wt2.length - 1];
            const v = w1 < -50 && w1 > w2 ? 1 : w1 > 50 && w1 < w2 ? -1 : 0;
            this._addSignalToGroup(groups.momentum, 'WaveTrend', v, 2.0, learnedStats, allSignals);
        }

        const tsi = Lib1.TSI(closes, 25, 13);
        if (tsi && tsi.length > 0) {
            const t = tsi[tsi.length - 1];
            const v = t > 0 ? 1 : -1;
            this._addSignalToGroup(groups.momentum, 'TSI', v, 1.4, learnedStats, allSignals);
        }

        const uo = Lib1.UltimateOscillator(highs, lows, closes);
        if (uo && uo.length > 0) {
            const u = uo[uo.length - 1];
            const v = u < 30 ? 1 : u > 70 ? -1 : 0;
            this._addSignalToGroup(groups.momentum, 'UO', v, 1.5, learnedStats, allSignals);
        }

        const ppo = Lib3.PPO(closes);
        if (ppo && ppo.histogram) {
            const v = ppo.histogram[ppo.histogram.length - 1] > 0 ? 1 : -1;
            this._addSignalToGroup(groups.momentum, 'PPO', v, 1.3, learnedStats, allSignals);
        }

        const macdConfigs = [[12, 26, 9], [5, 35, 5], [24, 52, 18], [10, 20, 9]];
        macdConfigs.forEach(cfg => {
            const m = Lib1.MACD(closes, cfg[0], cfg[1], cfg[2]);
            if (m && m.histogram) {
                const h = m.histogram[m.histogram.length - 1];
                const v = h > 0 ? 1 : -1;
                this._addSignalToGroup(groups.momentum, `MACD-${cfg[0]}`, v, 1.4, learnedStats, allSignals);
            }
        });

        // 3. VOLATILITY GRUBU (BB, Keltner, Donchian, ATR)
        [1.5, 2.0, 2.5, 3.0].forEach(m => {
            const bb = Lib2.BollingerBands(closes, 20, m);
            if (bb && bb.middle) {
                const lower = bb.lower[bb.lower.length - 1];
                const upper = bb.upper[bb.upper.length - 1];
                const v = curPrice < lower ? 1 : curPrice > upper ? -1 : 0;
                this._addSignalToGroup(groups.volatility, `BB-${m}`, v, 1.8, learnedStats, allSignals);
            }
        });

        const keltner = Lib2.KeltnerChannels(highs, lows, closes, 20, 10, 2);
        if (keltner && keltner.middle) {
            const lower = keltner.lower[keltner.lower.length - 1];
            const upper = keltner.upper[keltner.upper.length - 1];
            const v = curPrice < lower ? 1 : curPrice > upper ? -1 : 0;
            this._addSignalToGroup(groups.volatility, 'Keltner', v, 1.5, learnedStats, allSignals);
        }

        const dc = Lib2.DonchianChannels(highs, lows, 20);
        if (dc && dc.lower) {
            const lower = dc.lower[dc.lower.length - 1];
            const upper = dc.upper[dc.upper.length - 1];
            const v = curPrice <= lower ? 1 : curPrice >= upper ? -1 : 0;
            this._addSignalToGroup(groups.volatility, 'Donchian', v, 1.3, learnedStats, allSignals);
        }

        // 4. VOLUME GRUBU (VWAP, MFI, CMF, Twiggs, OBV, VROC)
        const vwap = Lib2.VWAP(highs, lows, closes, volumes);
        if (vwap && vwap.length > 0) {
            const v = curPrice > vwap[vwap.length - 1] ? 1 : -1;
            this._addSignalToGroup(groups.volume, 'VWAP', v, 2.5, learnedStats, allSignals);
        }

        const mfi = Lib1.MFI(highs, lows, closes, volumes, 14);
        if (mfi && mfi.length > 0) {
            const m = mfi[mfi.length - 1];
            const v = m < 20 ? 1 : m > 80 ? -1 : 0;
            this._addSignalToGroup(groups.volume, 'MFI', v, 1.8, learnedStats, allSignals);
        }

        const cmf = Lib2.CMF(highs, lows, closes, volumes, 20);
        if (cmf && cmf.length > 0) {
            const c = cmf[cmf.length - 1];
            const v = c > 0.1 ? 1 : c < -0.1 ? -1 : 0;
            this._addSignalToGroup(groups.volume, 'CMF', v, 1.6, learnedStats, allSignals);
        }

        const tmf = Lib3.TwiggsMF(highs, lows, closes, volumes, 21);
        if (tmf && tmf.length > 0) {
            const t = tmf[tmf.length - 1];
            const v = t > 0 ? 1 : -1;
            this._addSignalToGroup(groups.volume, 'TwiggsMF', v, 1.5, learnedStats, allSignals);
        }

        const vroc = Lib3.VROC(volumes, 14);
        if (vroc && vroc.length > 0) {
            const v = vroc[vroc.length - 1] > 0 ? 1 : -1;
            this._addSignalToGroup(groups.volume, 'VROC', v, 1.0, learnedStats, allSignals);
        }

        // 5. PATTERNS GRUBU (Candlesticks & Harmonic-like patterns)
        const patterns = Patterns.analyzePatterns(analysisData);
        if (patterns && patterns.length > 0) {
            patterns.forEach(p => {
                const v = p.signal === 'bullish' ? 1 : p.signal === 'bearish' ? -1 : 0;
                this._addSignalToGroup(groups.patterns, `Pattern-${p.name}`, v, p.weight * 2, learnedStats, allSignals);
            });
        }

        // ==========================================
        //         YENI EKLENEN INDIKATORLER
        // ==========================================

        // --- TREND GRUBU GENIŞLETME ---

        // 1. Supertrend
        // Supertrend genellikle trend takibi için çok güçlüdür.
        [10, 11, 12, 14].forEach(p => {
            const st = Lib2.Supertrend(highs, lows, closes, p, 3);
            if (st && st.length > 0) {
                const s = st[st.length - 1];
                const v = curPrice > s ? 1 : -1;
                this._addSignalToGroup(groups.trend, `Supertrend-${p}`, v, 2.0, learnedStats, allSignals);
            }
        });

        // 2. Ichimoku Cloud
        // Fiyat bulutun (Senkou A ve B) üzerindeyse AL, altındaysa SAT.
        const ichi = Lib2.Ichimoku(highs, lows, closes);
        if (ichi && ichi.senkouA) {
            const spanA = ichi.senkouA[ichi.senkouA.length - 1];
            const spanB = ichi.senkouB[ichi.senkouB.length - 1];
            // Kumo Cloud Breakout
            const v = (curPrice > spanA && curPrice > spanB) ? 1 : (curPrice < spanA && curPrice < spanB) ? -1 : 0;
            // TK Cross (Tenkan > Kijun = AL)
            const tenkan = ichi.tenkanSen[ichi.tenkanSen.length - 1];
            const kijun = ichi.kijunSen[ichi.kijunSen.length - 1];
            const v2 = tenkan > kijun ? 1 : -1;

            this._addSignalToGroup(groups.trend, 'Ichimoku-Cloud', v, 1.8, learnedStats, allSignals);
            this._addSignalToGroup(groups.trend, 'Ichimoku-TK', v2, 1.2, learnedStats, allSignals);
        }

        // 3. ADX & DI (Directional Movement)
        // +DI > -DI => AL
        if (adxResult && adxResult.plusDI) {
            const pDI = adxResult.plusDI[adxResult.plusDI.length - 1];
            const mDI = adxResult.minusDI[adxResult.minusDI.length - 1];
            const v = pDI > mDI ? 1 : -1;
            // ADX trend gücünü de hesaba katalım, güçlü trendde sinyali güçlendir
            const strength = adxValue > 25 ? 1.5 : 0.8;
            this._addSignalToGroup(groups.trend, 'DMI-DI', v, 1.2 * strength, learnedStats, allSignals);
        }

        // 4. Aroon
        // Aroon Up > Aroon Down => AL
        const aroon = Lib2.Aroon(highs, lows, 25);
        if (aroon && aroon.up) {
            const up = aroon.up[aroon.up.length - 1];
            const down = aroon.down[aroon.down.length - 1];
            const v = up > down ? 1 : -1;
            // Aroon 70'in üzerindeyse trend güçlüdür
            const weight = (up > 70 || down > 70) ? 1.4 : 1.0;
            this._addSignalToGroup(groups.trend, 'Aroon', v, weight, learnedStats, allSignals);
        }

        // --- MOMENTUM GRUBU GENIŞLETME ---

        // 5. TRIX (Triple Exponential Average)
        // Sıfır çizgisinin üzeri AL
        const trix = Lib3.TRIX(closes, 15);
        if (trix && trix.length > 0) {
            const t = trix[trix.length - 1];
            const prevT = trix[trix.length - 2];
            // Hem seviye (0 üstü) hem de yön (artıyor) önemli
            const v = t > 0 ? (t > prevT ? 1 : 0.5) : (t < prevT ? -1 : -0.5);
            this._addSignalToGroup(groups.momentum, 'TRIX', v, 1.2, learnedStats, allSignals);
        }

        // 6. Awesome Oscillator
        // Sıfırın üzeri AL
        const ao = Lib3.AwesomeOscillator(highs, lows);
        if (ao && ao.length > 0) {
            const a = ao[ao.length - 1];
            const v = a > 0 ? 1 : -1;
            this._addSignalToGroup(groups.momentum, 'AwesomeOsc', v, 1.3, learnedStats, allSignals);
        }

        // 7. Fisher Transform
        // Dönüş noktalarını yakalar. 2.0 üzeri aşırı alım (SAT ihtimali), -2.0 altı aşırı satım (AL ihtimali)
        // Ancak trend takibi için: değer artıyorsa AL denilebilir, fakat Fisher genelde reversal için kullanılır.
        // Biz burada -1.5'u yukarı kestiğinde AL diyelim (Dip dönüşü)
        const fisher = Lib3.FisherTransform(highs, lows, 9);
        if (fisher && fisher.length > 1) {
            const f = fisher[fisher.length - 1];
            const prevF = fisher[fisher.length - 2];
            let v = 0;
            if (f > prevF) v = 0.5; // Yükseliyor
            if (f < prevF) v = -0.5; // Düşüyor

            // Reversal Signal
            if (prevF < -1.5 && f > -1.5) v = 2; // Güçlü dip dönüşü
            else if (prevF > 1.5 && f < 1.5) v = -2; // Güçlü tepe dönüşü

            this._addSignalToGroup(groups.momentum, 'Fisher', v, 1.1, learnedStats, allSignals);
        }

        // 8. KST (Know Sure Thing)
        // Sinyal kesişimi
        const kstRes = Lib3.KST(closes);
        if (kstRes && kstRes.kst && kstRes.signal) {
            const k = kstRes.kst[kstRes.kst.length - 1];
            const s = kstRes.signal[kstRes.signal.length - 1];
            const v = k > s ? 1 : -1;
            this._addSignalToGroup(groups.momentum, 'KST', v, 1.3, learnedStats, allSignals);
        }

        // 9. CMO (Chande Momentum Oscillator)
        // +50 / -50 aşırı bölgeler. 0 üzeri AL.
        const cmo = Lib3.CMO(closes, 14);
        if (cmo && cmo.length > 0) {
            const c = cmo[cmo.length - 1];
            const v = c > 0 ? 1 : -1;
            this._addSignalToGroup(groups.momentum, 'CMO', v, 1.0, learnedStats, allSignals);
        }

        // --- VOLUME GRUBU GENIŞLETME ---

        // 10. Force Index
        // 0 üzeri AL (Boğaların gücü)
        const fi = Lib2.ForceIndex(closes, volumes, 13);
        if (fi && fi.length > 0) {
            const f = fi[fi.length - 1];
            const v = f > 0 ? 1 : -1;
            this._addSignalToGroup(groups.volume, 'ForceIndex', v, 1.2, learnedStats, allSignals);
        }

        // 11. OBV Slope
        // OBV'nin kendi SMA'sının üzerinde olması hacim desteğini gösterir
        const obv = Lib2.OBV(closes, volumes);
        if (obv && obv.length > 20) {
            // OBV üzerine basit bir SMA uygulayalım (son 20 obv ortalaması vb.)
            // Basitçe son 5 bar eğimine bakalım
            const curr = obv[obv.length - 1];
            const prev = obv[obv.length - 5]; // 5 bar önceki
            const v = curr > prev ? 1 : -1;
            this._addSignalToGroup(groups.volume, 'OBV-Trend', v, 1.4, learnedStats, allSignals);
        }

        // 12. Ease of Movement (EMV)
        // 0 üzeri kolay yükseliş
        const emv = Lib2.EMV(highs, lows, volumes, 14);
        if (emv && emv.length > 0) {
            const e = emv[emv.length - 1];
            const v = e > 0 ? 1 : -1;
            this._addSignalToGroup(groups.volume, 'EMV', v, 1.0, learnedStats, allSignals);
        }


        // --- EXTRA ADVANCED & NICHE INDICATORS (User Request) ---

        // 15. Coppock Curve 
        // Uzun vadeli dip tespitinde çok başarılıdır (Unpopular but successful)
        const coppock = Lib3.CoppockCurve(closes);
        if (coppock && coppock.length > 2) {
            const curr = coppock[coppock.length - 1];
            const prev = coppock[coppock.length - 2];
            // Sıfırın altındaki dönüşler en güçlü AL sinyalidir
            let v = 0;
            if (curr < 0 && curr > prev && prev < coppock[coppock.length - 3]) v = 2.5; // Güçlü Dip Dönüşü
            else if (curr > 0 && curr > prev) v = 1; // Trend devam
            else if (curr > 0 && curr < prev) v = -1; // Trend zayıflıyor

            this._addSignalToGroup(groups.momentum, 'Coppock', v, 1.5, learnedStats, allSignals);
        }

        // 16. Elder Ray Index (Bull & Bear Power)
        // Boğalar ile Ayıların gücünü ölçer
        const elder = Lib3.ElderRay(highs, lows, closes, 13);
        if (elder && elder.bullPower) {
            const bull = elder.bullPower[elder.bullPower.length - 1];
            const bear = elder.bearPower[elder.bearPower.length - 1];
            // EMA-13 eğimi (Trend yönü)
            const ema13 = Lib1.EMA(closes, 13);
            const isTrendUp = ema13[ema13.length - 1] > ema13[ema13.length - 2];

            let v = 0;
            if (isTrendUp && bear < 0 && bear > elder.bearPower[elder.bearPower.length - 2]) v = 2; // Trend yukarıyken ayı gücü azalıyor (Alım Fırsatı)
            if (!isTrendUp && bull > 0 && bull < elder.bullPower[elder.bullPower.length - 2]) v = -2; // Trend aşağıyken boğa gücü azalıyor (Satış Fırsatı)

            this._addSignalToGroup(groups.trend, 'ElderRay', v, 1.6, learnedStats, allSignals);
        }

        // 17. Negative Volume Index (NVI) - "Smart Money"
        // Hacim düştüğünde fiyat artıyorsa "Akıllı Para" alıyor demektir.
        const nvi = Lib2.NVI(closes, volumes);
        if (nvi && nvi.length > 20) {
            // NVI kendi 255 günlük ortalamasının üzerindeyse Boğa Piyasası
            // Biz daha kısa vade bakalım: 20 günlük SMA
            const nviSMA = Lib1.SMA(nvi, 20);
            const currNVI = nvi[nvi.length - 1];
            const currSMA = nviSMA[nviSMA.length - 1];

            const v = currNVI > currSMA ? 1.5 : -1;
            this._addSignalToGroup(groups.volume, 'NVI-SmartMoney', v, 1.8, learnedStats, allSignals);
        }

        // 18. Accumulation / Distribution (A/D)
        // Hacim destekli fiyat hareketlerini doğrular
        const ad = Lib2.AD(highs, lows, closes, volumes);
        if (ad && ad.length > 1) {
            const curr = ad[ad.length - 1];
            const prev = ad[ad.length - 2];
            const v = curr > prev ? 1 : -1;
            this._addSignalToGroup(groups.volume, 'AccDist', v, 1.3, learnedStats, allSignals);
        }

        // 19. Detrended Price Oscillator (DPO)
        // Trendden arındırılmış kısa vadeli döngüleri bulur
        const dpo = Lib3.DPO(closes, 20);
        if (dpo && dpo.length > 1) {
            const curr = dpo[dpo.length - 1];
            const prev = dpo[dpo.length - 2];
            // Sıfırın üzerine çıkış AL
            const v = (curr > 0 && prev <= 0) ? 1.5 : (curr < 0 && prev >= 0) ? -1.5 : (curr > 0 ? 0.5 : -0.5);
            this._addSignalToGroup(groups.momentum, 'DPO', v, 1.2, learnedStats, allSignals);
        }

        // 20. Accelerator Oscillator (Bill Williams)
        // Momentumun ivmesini ölçer. Fiyattan önce değişir.
        const ac = Lib3.AcceleratorOscillator(highs, lows);
        if (ac && ac.length > 2) {
            const curr = ac[ac.length - 1];
            const prev = ac[ac.length - 2];
            let v = 0;
            // Yeşile dönüş (Güçleniyor)
            if (curr > prev) v = 1;
            // Kırmızıya dönüş (Zayıflıyor)
            if (curr < prev) v = -1;
            // Sıfır kesişimi ek puan
            if (curr > 0 && prev <= 0) v = 2;

            this._addSignalToGroup(groups.momentum, 'Accelerator', v, 1.4, learnedStats, allSignals);
        }

        // 21. Relative Vigor Index (RVI)
        // Kapanışın açılışa göre durumunu ölçer (Trend Gücü)
        const rvi = Lib3.RVI(opens, highs, lows, closes, 10);
        if (rvi && rvi.length > 1) {
            const curr = rvi[rvi.length - 1];
            const prev = rvi[rvi.length - 2];
            const v = (curr > prev) ? 1 : -1;
            // Sinyal çizgisi kesişimi (Basitçe RVI > 0.2 ise güçlü trend)

            this._addSignalToGroup(groups.momentum, 'RVI', v, 1.1, learnedStats, allSignals);
        }

        // 22. ATR Breakout (Volatility)
        // Fiyat, SMA + 2*ATR üzerine çıkarsa güçlü breakout
        const atr = Lib2.ATR(highs, lows, closes, 14);
        const sma20 = Lib1.SMA(closes, 20);
        if (atr && sma20 && atr.length > 0 && sma20.length > 0) {
            const currATR = atr[atr.length - 1];
            const currSMA = sma20[sma20.length - 1];
            const upperBand = currSMA + (2 * currATR);
            const lowerBand = currSMA - (2 * currATR);

            let v = 0;
            if (curPrice > upperBand) v = 2.0; // Breakout Long
            else if (curPrice < lowerBand) v = -2.0; // Breakout Short

            this._addSignalToGroup(groups.volatility, 'ATR-Breakout', v, 1.5, learnedStats, allSignals);
        }

        // 23. StochRSI
        // RSI üzerine Stoch uygulaması. Çok hassas.
        const rsi14 = Lib1.RSI(closes, 14);
        if (rsi14 && rsi14.length > 14) {
            // Basit Stoch hesaplama
            const period = 14;
            const currentRSI = rsi14.slice(-period);
            const minRSI = Math.min(...currentRSI);
            const maxRSI = Math.max(...currentRSI);
            const stochRSI = (rsi14[rsi14.length - 1] - minRSI) / (maxRSI - minRSI || 1); // 0-1 arası

            let v = 0;
            if (stochRSI < 0.2) v = 1.5; // Aşırı Satım (AL)
            else if (stochRSI > 0.8) v = -1.5; // Aşırı Alım (SAT)

            this._addSignalToGroup(groups.momentum, 'StochRSI', v, 1.3, learnedStats, allSignals);
        }

        // --- NİHAİ SKOR HESAPLAMA ---
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

        // Gruba göre ağırlıklı ortalama
        const finalScore = totalGroupWeight > 0 ? totalWeightedScore / totalGroupWeight : 50;

        const bullish = allSignals.filter(s => s.value > 0).length;
        const bearish = allSignals.filter(s => s.value < 0).length;

        return {
            score: Math.round(finalScore),
            signals: allSignals,
            confidence: Math.round((allSignals.filter(s => s.value !== 0).length / allSignals.length) * 100),
            details: [
                `Rejim/Trend: ${isTrending ? '📈 TREND' : isRanging ? '↔️ RANGE' : '🔄 NÖTR'} (ADX: ${adxValue.toFixed(0)})`,
                `Grup Skorları: Trend=%${groups.trend.score.toFixed(0)}, Mom=%${groups.momentum.score.toFixed(0)}, Vol=%${groups.volatility.score.toFixed(0)}`,
                `Sinyal Dağılımı: 🔼${bullish} | 🔽${bearish} | ⏺️${allSignals.length - bullish - bearish}`
            ],
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
        if (successRate > 0.5) multiplier = 1 + (successRate - 0.5) * 2; // Başarıyı daha çok ödüllendir
        else multiplier = Math.max(0.2, 1 - (0.5 - successRate) * 2); // Başarısızlığı cezalandır
        return baseWeight * multiplier;
    }
}

export default MasterIndicatorAnalyzer;
