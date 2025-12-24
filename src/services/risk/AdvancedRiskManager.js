/**
 * Advanced Risk Manager - Argus 22_risk_management.md
 * 
 * Gelişmiş risk yönetimi:
 * - Kelly Criterion pozisyon boyutlandırma
 * - Fixed Fractional pozisyon boyutlandırma
 * - VaR (Value at Risk) hesaplama
 * - Portföy korelasyon matrisi
 * - Max Drawdown tracker
 */

class AdvancedRiskManager {
    constructor() {
        this.equityCurve = [];
        this.correlationCache = new Map();
    }

    // ==========================================
    // POSITION SIZING METHODS
    // ==========================================

    /**
     * Fixed Fractional: Her işlemde sermayenin X%'ini riske at
     * @param {number} capital - Toplam sermaye
     * @param {number} riskPercent - Risk yüzdesi (örn: 2 = %2)
     * @param {number} entryPrice - Giriş fiyatı
     * @param {number} stopLoss - Stop loss fiyatı
     * @returns {Object} Position size result
     */
    fixedFractional(capital, riskPercent, entryPrice, stopLoss) {
        const riskPerShare = Math.abs(entryPrice - stopLoss);
        const dollarRisk = capital * (riskPercent / 100);

        const shares = riskPerShare > 0 ? dollarRisk / riskPerShare : 0;
        const dollarAmount = shares * entryPrice;

        return {
            shares: Math.floor(shares * 100) / 100, // 2 decimal precision
            dollarAmount: Math.round(dollarAmount * 100) / 100,
            riskAmount: Math.round(dollarRisk * 100) / 100,
            method: `Fixed Fractional (${riskPercent}%)`,
            riskRewardRatio: null // Calculated if target provided
        };
    }

    /**
     * Kelly Criterion: Win rate ve R/R'ye göre optimal pozisyon boyutu
     * @param {number} capital - Toplam sermaye
     * @param {number} winRate - Kazanma oranı (0-100)
     * @param {number} avgWin - Ortalama kazanç miktarı
     * @param {number} avgLoss - Ortalama kayıp miktarı
     * @param {number} entryPrice - Giriş fiyatı
     * @param {number} fraction - Kelly kesir (güvenlik için 0.25 önerilir)
     * @returns {Object} Position size result
     */
    kelly(capital, winRate, avgWin, avgLoss, entryPrice, fraction = 0.25) {
        if (avgLoss <= 0) {
            return {
                shares: 0,
                dollarAmount: 0,
                riskAmount: 0,
                method: 'Kelly (Invalid)',
                kellyPercent: 0
            };
        }

        const winProb = winRate / 100;
        const lossProb = 1 - winProb;
        const winLossRatio = avgWin / avgLoss;

        // Kelly formula: W - (1-W)/R
        const kellyPercent = winProb - (lossProb / winLossRatio);
        const adjustedKelly = Math.max(0, kellyPercent * fraction); // Never negative

        const dollarAmount = capital * adjustedKelly;
        const shares = dollarAmount / entryPrice;

        return {
            shares: Math.floor(shares * 100) / 100,
            dollarAmount: Math.round(dollarAmount * 100) / 100,
            riskAmount: Math.round(dollarAmount * 0.1 * 100) / 100, // Approximate
            method: `Quarter Kelly (${(adjustedKelly * 100).toFixed(1)}%)`,
            kellyPercent: Math.round(kellyPercent * 10000) / 100, // As percentage
            adjustedKellyPercent: Math.round(adjustedKelly * 10000) / 100
        };
    }

    /**
     * Optimal F: Daha agresif Kelly varyantı
     * @param {Array} returns - Geçmiş getiri dizisi
     * @param {number} capital - Toplam sermaye
     * @param {number} entryPrice - Giriş fiyatı
     * @returns {Object} Position size result
     */
    optimalF(returns, capital, entryPrice) {
        if (!returns || returns.length < 10) {
            return this.fixedFractional(capital, 2, entryPrice, entryPrice * 0.95);
        }

        const wins = returns.filter(r => r > 0);
        const losses = returns.filter(r => r < 0);

        if (losses.length === 0) {
            return this.fixedFractional(capital, 5, entryPrice, entryPrice * 0.95);
        }

        const winRate = (wins.length / returns.length) * 100;
        const avgWin = wins.reduce((a, b) => a + b, 0) / wins.length || 0;
        const avgLoss = Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) || 1;

        return this.kelly(capital, winRate, avgWin, avgLoss, entryPrice, 0.5);
    }

    // ==========================================
    // VALUE AT RISK (VaR) METHODS
    // ==========================================

    /**
     * Historical VaR: Geçmiş getirilerden VaR hesapla
     * @param {Array} returns - Günlük getiri dizisi
     * @param {number} confidenceLevel - Güven seviyesi (0.95 = %95)
     * @param {number} portfolioValue - Portföy değeri
     * @returns {Object} VaR result
     */
    historicalVaR(returns, confidenceLevel = 0.95, portfolioValue = 10000) {
        if (!returns || returns.length === 0) {
            return {
                var: 0,
                varPercent: 0,
                confidenceLevel: confidenceLevel * 100,
                method: 'Historical Simulation',
                worstReturn: 0
            };
        }

        const sorted = [...returns].sort((a, b) => a - b);
        const index = Math.floor((1 - confidenceLevel) * sorted.length);
        const worstReturn = sorted[Math.max(0, index)];

        const varAmount = Math.abs(worstReturn) * portfolioValue;

        return {
            var: Math.round(varAmount * 100) / 100,
            varPercent: Math.round(Math.abs(worstReturn) * 10000) / 100,
            confidenceLevel: confidenceLevel * 100,
            method: 'Historical Simulation',
            worstReturn: Math.round(worstReturn * 10000) / 100
        };
    }

    /**
     * Parametric VaR: Normal dağılım varsayımıyla VaR
     * @param {Array} returns - Günlük getiri dizisi
     * @param {number} confidenceLevel - Güven seviyesi
     * @param {number} portfolioValue - Portföy değeri
     * @returns {Object} VaR result
     */
    parametricVaR(returns, confidenceLevel = 0.95, portfolioValue = 10000) {
        if (!returns || returns.length < 5) {
            return this.historicalVaR(returns, confidenceLevel, portfolioValue);
        }

        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);

        // Z-score for confidence level
        const zScores = {
            0.90: 1.282,
            0.95: 1.645,
            0.99: 2.326
        };
        const z = zScores[confidenceLevel] || 1.645;

        const varPercent = z * stdDev;
        const varAmount = varPercent * portfolioValue;

        return {
            var: Math.round(varAmount * 100) / 100,
            varPercent: Math.round(varPercent * 10000) / 100,
            confidenceLevel: confidenceLevel * 100,
            method: 'Parametric (Normal)',
            mean: Math.round(mean * 10000) / 100,
            stdDev: Math.round(stdDev * 10000) / 100
        };
    }

    /**
     * Conditional VaR (Expected Shortfall): VaR'ı aşan ortalama kayıp
     * @param {Array} returns - Günlük getiri dizisi
     * @param {number} confidenceLevel - Güven seviyesi
     * @param {number} portfolioValue - Portföy değeri
     * @returns {Object} CVaR result
     */
    conditionalVaR(returns, confidenceLevel = 0.95, portfolioValue = 10000) {
        if (!returns || returns.length === 0) {
            return {
                cvar: 0,
                cvarPercent: 0,
                confidenceLevel: confidenceLevel * 100,
                method: 'Expected Shortfall'
            };
        }

        const sorted = [...returns].sort((a, b) => a - b);
        const cutoffIndex = Math.floor((1 - confidenceLevel) * sorted.length);
        const tailReturns = sorted.slice(0, Math.max(1, cutoffIndex));

        const avgTailReturn = tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length;
        const cvarAmount = Math.abs(avgTailReturn) * portfolioValue;

        return {
            cvar: Math.round(cvarAmount * 100) / 100,
            cvarPercent: Math.round(Math.abs(avgTailReturn) * 10000) / 100,
            confidenceLevel: confidenceLevel * 100,
            method: 'Expected Shortfall',
            tailObservations: tailReturns.length
        };
    }

    // ==========================================
    // CORRELATION ANALYSIS
    // ==========================================

    /**
     * İki varlık arasındaki korelasyonu hesapla
     * @param {Array} returns1 - Birinci varlığın getirileri
     * @param {Array} returns2 - İkinci varlığın getirileri
     * @returns {number} Korelasyon katsayısı (-1 ile 1 arası)
     */
    calculateCorrelation(returns1, returns2) {
        if (returns1.length !== returns2.length || returns1.length < 2) {
            return 0;
        }

        const n = returns1.length;
        const mean1 = returns1.reduce((a, b) => a + b, 0) / n;
        const mean2 = returns2.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denom1 = 0;
        let denom2 = 0;

        for (let i = 0; i < n; i++) {
            const diff1 = returns1[i] - mean1;
            const diff2 = returns2[i] - mean2;

            numerator += diff1 * diff2;
            denom1 += diff1 * diff1;
            denom2 += diff2 * diff2;
        }

        if (denom1 === 0 || denom2 === 0) return 0;

        return numerator / Math.sqrt(denom1 * denom2);
    }

    /**
     * Candle verilerinden getiri hesapla
     * @param {Array} candles - Candle dizisi
     * @returns {Array} Günlük getiriler
     */
    candlesToReturns(candles) {
        if (!candles || candles.length < 2) return [];

        const returns = [];
        for (let i = 1; i < candles.length; i++) {
            const ret = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
            returns.push(ret);
        }
        return returns;
    }

    /**
     * Portföy korelasyon matrisi oluştur
     * @param {Array} symbols - Sembol listesi
     * @param {Object} candlesMap - Sembol -> Candle dizisi map'i
     * @returns {Object} Korelasyon matrisi ve özet
     */
    correlationMatrix(symbols, candlesMap) {
        const n = symbols.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
        const allReturns = {};

        // Calculate returns for each symbol
        for (const symbol of symbols) {
            const candles = candlesMap[symbol] || [];
            allReturns[symbol] = this.candlesToReturns(candles);
        }

        // Build correlation matrix
        let totalCorrelation = 0;
        let correlationCount = 0;

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 1.0;
                } else {
                    const corr = this.calculateCorrelation(
                        allReturns[symbols[i]] || [],
                        allReturns[symbols[j]] || []
                    );
                    matrix[i][j] = Math.round(corr * 100) / 100;

                    if (j > i) {
                        totalCorrelation += Math.abs(corr);
                        correlationCount++;
                    }
                }
            }
        }

        const avgCorrelation = correlationCount > 0
            ? totalCorrelation / correlationCount
            : 0;

        // Find highly correlated pairs
        const highlyCorrelated = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(matrix[i][j]) > 0.7) {
                    highlyCorrelated.push({
                        pair: [symbols[i], symbols[j]],
                        correlation: matrix[i][j]
                    });
                }
            }
        }

        return {
            matrix,
            symbols,
            avgCorrelation: Math.round(avgCorrelation * 100) / 100,
            highlyCorrelated,
            diversificationScore: Math.round((1 - avgCorrelation) * 100)
        };
    }

    // ==========================================
    // MAX DRAWDOWN TRACKING
    // ==========================================

    /**
     * Equity curve'dan max drawdown hesapla
     * @param {Array} equityCurve - Portföy değer geçmişi
     * @returns {Object} Drawdown analizi
     */
    calculateMaxDrawdown(equityCurve) {
        if (!equityCurve || equityCurve.length === 0) {
            return {
                maxDrawdown: 0,
                maxDrawdownPercent: 0,
                currentDrawdown: 0,
                currentDrawdownPercent: 0,
                peakValue: 0,
                troughValue: 0,
                recoveryProgress: 100
            };
        }

        let peak = equityCurve[0];
        let maxDDPercent = 0;
        let maxDD = 0;
        let peakIndex = 0;
        let troughIndex = 0;

        for (let i = 0; i < equityCurve.length; i++) {
            const equity = equityCurve[i];

            if (equity > peak) {
                peak = equity;
                peakIndex = i;
            }

            const dd = peak - equity;
            const ddPercent = (peak - equity) / peak * 100;

            if (ddPercent > maxDDPercent) {
                maxDDPercent = ddPercent;
                maxDD = dd;
                troughIndex = i;
            }
        }

        // Current drawdown from latest peak
        const currentValue = equityCurve[equityCurve.length - 1];
        const latestPeak = Math.max(...equityCurve);
        const currentDD = latestPeak - currentValue;
        const currentDDPercent = (currentDD / latestPeak) * 100;

        // Recovery progress
        const recoveryProgress = currentDDPercent > 0
            ? ((currentValue - (latestPeak - maxDD)) / maxDD) * 100
            : 100;

        return {
            maxDrawdown: Math.round(maxDD * 100) / 100,
            maxDrawdownPercent: Math.round(maxDDPercent * 100) / 100,
            currentDrawdown: Math.round(currentDD * 100) / 100,
            currentDrawdownPercent: Math.round(currentDDPercent * 100) / 100,
            peakValue: Math.round(latestPeak * 100) / 100,
            troughValue: Math.round((latestPeak - maxDD) * 100) / 100,
            recoveryProgress: Math.min(100, Math.max(0, Math.round(recoveryProgress)))
        };
    }

    /**
     * Equity curve'a yeni değer ekle
     * @param {number} value - Yeni portföy değeri
     */
    addEquityPoint(value) {
        this.equityCurve.push(value);

        // Keep last 365 days
        if (this.equityCurve.length > 365) {
            this.equityCurve.shift();
        }
    }

    /**
     * Drawdown uyarı seviyesi
     * @param {number} drawdownPercent - Mevcut drawdown yüzdesi
     * @returns {Object} Uyarı seviyesi
     */
    getDrawdownAlert(drawdownPercent) {
        if (drawdownPercent >= 25) {
            return { level: 'critical', message: 'KRİTİK: Ciddi kayıp, pozisyon azaltın', color: '#ff0000' };
        } else if (drawdownPercent >= 15) {
            return { level: 'high', message: 'YÜKSEK: Dikkatli olun, riski azaltın', color: '#ff6600' };
        } else if (drawdownPercent >= 10) {
            return { level: 'moderate', message: 'ORTA: İzlemeye devam', color: '#ffcc00' };
        } else if (drawdownPercent >= 5) {
            return { level: 'low', message: 'DÜŞÜK: Normal dalgalanma', color: '#66cc00' };
        }
        return { level: 'none', message: 'Normal', color: '#00cc66' };
    }

    // ==========================================
    // COMPREHENSIVE RISK REPORT
    // ==========================================

    /**
     * Kapsamlı risk raporu oluştur
     * @param {Object} params - Rapor parametreleri
     * @returns {Object} Risk raporu
     */
    generateRiskReport({
        cash = 0,
        positions = [],
        historicalReturns = [],
        equityCurve = []
    }) {
        const totalValue = cash + positions.reduce((acc, p) => acc + (p.marketValue || 0), 0);
        const cashPercent = totalValue > 0 ? (cash / totalValue) * 100 : 0;

        // Largest position
        const sortedPositions = [...positions].sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0));
        const largest = sortedPositions[0];
        const largestPercent = largest && totalValue > 0
            ? (largest.marketValue / totalValue) * 100
            : 0;

        // VaR calculations
        const var95 = this.historicalVaR(historicalReturns, 0.95, totalValue);
        const var99 = this.historicalVaR(historicalReturns, 0.99, totalValue);
        const cvar95 = this.conditionalVaR(historicalReturns, 0.95, totalValue);

        // Drawdown
        const drawdown = this.calculateMaxDrawdown(equityCurve.length > 0 ? equityCurve : this.equityCurve);
        const drawdownAlert = this.getDrawdownAlert(drawdown.currentDrawdownPercent);

        // Determine overall risk level
        let riskScore = 0;

        // Position concentration risk
        if (largestPercent > 50) riskScore += 3;
        else if (largestPercent > 30) riskScore += 2;
        else if (largestPercent > 20) riskScore += 1;

        // VaR risk
        if (var95.varPercent > 10) riskScore += 3;
        else if (var95.varPercent > 5) riskScore += 2;
        else if (var95.varPercent > 3) riskScore += 1;

        // Drawdown risk
        if (drawdown.currentDrawdownPercent > 20) riskScore += 3;
        else if (drawdown.currentDrawdownPercent > 10) riskScore += 2;
        else if (drawdown.currentDrawdownPercent > 5) riskScore += 1;

        // Cash buffer
        if (cashPercent < 5) riskScore += 2;
        else if (cashPercent < 10) riskScore += 1;

        let riskLevel, riskLevelText, riskColor;
        if (riskScore >= 8) {
            riskLevel = 'extreme';
            riskLevelText = 'Aşırı Yüksek';
            riskColor = '#ff0000';
        } else if (riskScore >= 5) {
            riskLevel = 'high';
            riskLevelText = 'Yüksek';
            riskColor = '#ff6600';
        } else if (riskScore >= 3) {
            riskLevel = 'moderate';
            riskLevelText = 'Orta';
            riskColor = '#ffcc00';
        } else {
            riskLevel = 'low';
            riskLevelText = 'Düşük';
            riskColor = '#00cc66';
        }

        return {
            summary: {
                portfolioValue: Math.round(totalValue * 100) / 100,
                cashPercent: Math.round(cashPercent * 100) / 100,
                positionCount: positions.length,
                riskLevel,
                riskLevelText,
                riskColor,
                riskScore
            },
            concentration: {
                largestPosition: largest?.symbol || '-',
                largestPositionPercent: Math.round(largestPercent * 100) / 100,
                top3Percent: Math.round(
                    sortedPositions.slice(0, 3).reduce((acc, p) => acc + ((p.marketValue || 0) / totalValue) * 100, 0) * 100
                ) / 100
            },
            var: {
                var95,
                var99,
                cvar95
            },
            drawdown,
            drawdownAlert,
            recommendations: this.generateRecommendations(riskScore, largestPercent, cashPercent, var95.varPercent)
        };
    }

    /**
     * Risk azaltma önerileri
     */
    generateRecommendations(riskScore, largestPercent, cashPercent, varPercent) {
        const recommendations = [];

        if (largestPercent > 30) {
            recommendations.push({
                type: 'concentration',
                priority: 'high',
                message: `En büyük pozisyon portföyün %${largestPercent.toFixed(1)}'ini oluşturuyor. Çeşitlendirme için azaltmayı düşünün.`
            });
        }

        if (cashPercent < 10) {
            recommendations.push({
                type: 'liquidity',
                priority: 'medium',
                message: `Nakit oranı %${cashPercent.toFixed(1)}. Fırsatlar için en az %10-15 nakit tutun.`
            });
        }

        if (varPercent > 5) {
            recommendations.push({
                type: 'volatility',
                priority: 'high',
                message: `Günlük VaR %${varPercent.toFixed(1)}. Daha az volatil varlıklara geçmeyi düşünün.`
            });
        }

        if (riskScore >= 5) {
            recommendations.push({
                type: 'general',
                priority: 'high',
                message: 'Genel risk seviyesi yüksek. Pozisyon boyutlarını küçültün ve stop-loss emirleri kullanın.'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                type: 'general',
                priority: 'low',
                message: 'Portföy risk seviyeleri kabul edilebilir aralıkta. İzlemeye devam edin.'
            });
        }

        return recommendations;
    }
}

// Singleton export
export const advancedRiskManager = new AdvancedRiskManager();
export default AdvancedRiskManager;
