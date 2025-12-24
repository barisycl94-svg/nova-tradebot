# ⚡ ORION V3 - Teknik Analiz Motoru

## Konsept

Orion, gökyüzündeki en parlak takımyıldızlarından biridir. Bu modül, fiyat hareketlerini "okur" ve teknik sinyaller üretir.

## Prompt

> Bana bir iOS SwiftUI uygulaması için gelişmiş teknik analiz motoru yaz. Motor 5 bacaktan (leg) oluşsun:
>
> 1. **Structure (30%)** - Fibonacci, Pivots, Support/Resistance
> 2. **Trend (30%)** - SMA + MACD + Relative Strength
> 3. **Momentum (25%)** - RSI + Volume
> 4. **Pattern (10%)** - Mum formasyonları
> 5. **Volatility (5%)** - Bollinger Squeeze
>
> Her bacak için detaylı formüller kullan. Yahoo Finance candle verileriyle çalışsın.

---

## Bacak Ağırlıkları

```
┌─────────────────────────────────────────┐
│           ORION V3 SCORE                │
├─────────────────────────────────────────┤
│  Structure  ████████████░░░░░░░░  30%   │
│  Trend      ████████████░░░░░░░░  30%   │
│  Momentum   ██████████░░░░░░░░░░  25%   │
│  Pattern    ████░░░░░░░░░░░░░░░░  10%   │
│  Volatility ██░░░░░░░░░░░░░░░░░░   5%   │
└─────────────────────────────────────────┘
```

---

## 1. STRUCTURE LEG (Max 30 pts)

Fibonacci retracement, pivot noktaları ve destek/direnç analizi.

```swift
// MARK: - Structure Analysis
struct OrionStructureService {
    static let shared = OrionStructureService()
    
    struct StructureResult {
        let score: Double      // 0-100
        let trendState: TrendState
        let activeZone: String?
        let description: String
    }
    
    enum TrendState {
        case uptrend, downtrend, sideways
    }
    
    func analyzeStructure(candles: [Candle]) -> StructureResult? {
        guard candles.count >= 50 else { return nil }
        
        var score = 50.0
        var description = ""
        
        // 1. Find Swing Points (ZigZag)
        let swings = findSwingPoints(candles: candles, threshold: 0.05)
        
        // 2. Determine Trend
        let trendState = determineTrend(swings: swings)
        if trendState == .uptrend { score += 20 }
        else if trendState == .downtrend { score -= 20 }
        
        // 3. Fibonacci Levels
        let fibLevels = calculateFibonacci(swings: swings)
        let currentPrice = candles.last?.close ?? 0
        
        // Check if price is near key Fib level
        for (level, price) in fibLevels {
            let distance = abs(currentPrice - price) / price
            if distance < 0.02 { // Within 2%
                score += 15
                description = "Fib \(level) yakınında"
                break
            }
        }
        
        // 4. Pivot Points
        if let pivots = calculatePivots(candles: candles) {
            if currentPrice > pivots.p && currentPrice < pivots.r1 {
                score += 10 // Bullish zone
            } else if currentPrice < pivots.p {
                score -= 10 // Bearish zone
            }
        }
        
        return StructureResult(
            score: min(100, max(0, score)),
            trendState: trendState,
            activeZone: description.isEmpty ? nil : description,
            description: description
        )
    }
    
    private func findSwingPoints(candles: [Candle], threshold: Double) -> [(Int, Double, Bool)] {
        var swings: [(index: Int, price: Double, isHigh: Bool)] = []
        
        for i in 2..<(candles.count - 2) {
            let current = candles[i]
            let prev1 = candles[i-1]
            let prev2 = candles[i-2]
            let next1 = candles[i+1]
            let next2 = candles[i+2]
            
            // Swing High
            if current.high > prev1.high && current.high > prev2.high &&
               current.high > next1.high && current.high > next2.high {
                swings.append((i, current.high, true))
            }
            
            // Swing Low
            if current.low < prev1.low && current.low < prev2.low &&
               current.low < next1.low && current.low < next2.low {
                swings.append((i, current.low, false))
            }
        }
        
        return swings
    }
    
    private func calculateFibonacci(swings: [(Int, Double, Bool)]) -> [(String, Double)] {
        guard swings.count >= 2 else { return [] }
        
        // Find last significant high and low
        let highs = swings.filter { $0.2 }.suffix(3)
        let lows = swings.filter { !$0.2 }.suffix(3)
        
        guard let high = highs.max(by: { $0.1 < $1.1 }),
              let low = lows.min(by: { $0.1 < $1.1 }) else { return [] }
        
        let range = high.1 - low.1
        
        return [
            ("0%", low.1),
            ("23.6%", low.1 + range * 0.236),
            ("38.2%", low.1 + range * 0.382),
            ("50%", low.1 + range * 0.5),
            ("61.8%", low.1 + range * 0.618),
            ("100%", high.1)
        ]
    }
}
```

---

## 2. TREND LEG (Max 30 pts) - SMA + MACD + RS

```swift
// MARK: - Trend Analysis
private func calculateTrendLeg(candles: [Candle]) -> (Double, String) {
    let closes = candles.map { $0.close }
    let current = closes.last ?? 0
    
    guard let sma20 = sma(closes, 20),
          let sma50 = sma(closes, 50),
          let sma200 = sma(closes, 200) else {
        return (0.0, "Yetersiz Veri")
    }
    
    var score = 0.0
    
    // 1. Long Term Bias (Max 10 pts)
    if current > sma200 { score += 10 }
    else if (sma200 - current) / sma200 < 0.02 { score += 5 }
    
    // 2. MA Alignment (Max 10 pts)
    // Golden: SMA20 > SMA50 > SMA200
    if sma20 > sma50 && sma50 > sma200 {
        score += 10 // Full Bull Alignment
    } else if sma20 > sma50 {
        score += 7 // Short-term bull
    } else if sma20 > sma200 {
        score += 3 // Mixed
    }
    
    // 3. Price vs SMA20 (Max 10 pts)
    let dist20 = (current - sma20) / sma20
    if dist20 > 0 {
        let factor = min(1.0, dist20 / 0.05)
        score += 5.0 + (5.0 * factor)
    } else if sma20 > sma50 {
        // Buyable pullback
        if abs(dist20) < 0.03 { score += 6 }
        else if abs(dist20) < 0.07 { score += 3 }
    }
    
    // Over-extension penalty
    if (current - sma50) / sma50 > 0.20 {
        score -= 5
    }
    
    let desc = String(format: "Trend: %.1f/30 (%@)", 
                      score, 
                      sma20 > sma50 ? "Yükseliş" : "Düşüş")
    
    return (max(0, min(30, score)), desc)
}

// MACD for Trend (moved from Momentum)
private func calculateMACDForTrend(candles: [Candle]) -> (Double, String) {
    let (macdLine, signal, hist) = macd(candles)
    
    guard let h = hist, let sig = signal else {
        return (5.0, "MACD Veri Yok")
    }
    
    var score = 0.0
    
    if h > 0 {
        score += 6.0
        if sig > 0 { score += 4.0 } // Strong bullish
        else { score += 2.0 } // Early bullish
    } else {
        if h > sig { score += 5.0 } // Improving
        else { score += 2.0 } // Weak
    }
    
    return (min(10, score), h > 0 ? "MACD Pozitif" : "MACD Negatif")
}

// MACD Calculation
private func macd(_ candles: [Candle]) -> (Double?, Double?, Double?) {
    let closes = candles.map { $0.close }
    guard closes.count >= 35 else { return (nil, nil, nil) }
    
    let k12 = 2.0 / 13.0
    let k26 = 2.0 / 27.0
    let k9 = 2.0 / 10.0
    
    // EMA 12
    var ema12 = [Double](repeating: 0, count: closes.count)
    ema12[11] = closes.prefix(12).reduce(0, +) / 12.0
    for i in 12..<closes.count {
        ema12[i] = (closes[i] - ema12[i-1]) * k12 + ema12[i-1]
    }
    
    // EMA 26
    var ema26 = [Double](repeating: 0, count: closes.count)
    ema26[25] = closes.prefix(26).reduce(0, +) / 26.0
    for i in 26..<closes.count {
        ema26[i] = (closes[i] - ema26[i-1]) * k26 + ema26[i-1]
    }
    
    // MACD Line
    var macdLine = [Double](repeating: 0, count: closes.count)
    for i in 26..<closes.count {
        macdLine[i] = ema12[i] - ema26[i]
    }
    
    // Signal Line
    let signalSeed = macdLine[26..<35].reduce(0, +) / 9.0
    var currentSignal = signalSeed
    for i in 35..<closes.count {
        currentSignal = (macdLine[i] - currentSignal) * k9 + currentSignal
    }
    
    let finalMACD = macdLine.last ?? 0
    let hist = finalMACD - currentSignal
    
    return (finalMACD, currentSignal, hist)
}
```

---

## 3. MOMENTUM LEG (Max 25 pts) - RSI Only

```swift
// MARK: - Momentum (RSI + Volume, No MACD)
private func calculateMomentumLegNoMACD(candles: [Candle]) -> (Double, String) {
    guard let rsiVal = rsi(candles, 14) else { return (7.5, "Veri Yok") }
    
    var score = 0.0
    var notes: [String] = []
    
    if rsiVal >= 50 && rsiVal <= 70 {
        let strength = (rsiVal - 50) / 20.0
        score += 8.0 + (7.0 * strength) // 8-15 pts
        notes.append("RSI Güçlü (\(Int(rsiVal)))")
    } else if rsiVal > 70 {
        if rsiVal > 80 {
            score += 6.0 // Extended
            notes.append("RSI Şişkin")
        } else {
            score += 12.0 // High momentum
            notes.append("RSI Yüksek")
        }
    } else if rsiVal >= 40 {
        let recovery = (rsiVal - 40) / 10.0
        score += 5.0 + (3.0 * recovery)
        notes.append("RSI Nötr")
    } else {
        if rsiVal < 30 {
            score += 8.0 // Bounce potential
            notes.append("RSI Aşırı Satım (Bounce?)")
        } else {
            score += 5.0
            notes.append("RSI Zayıf")
        }
    }
    
    return (min(15, score), notes.joined(separator: ", "))
}

// RSI Calculation
private func rsi(_ candles: [Candle], _ period: Int) -> Double? {
    let closes = candles.map { $0.close }
    guard closes.count > period + 1 else { return 50.0 }
    
    var gains = 0.0, losses = 0.0
    
    for i in 1...period {
        let change = closes[i] - closes[i-1]
        if change > 0 { gains += change }
        else { losses -= change }
    }
    
    var avgGain = gains / Double(period)
    var avgLoss = losses / Double(period)
    
    for i in (period + 1)..<closes.count {
        let change = closes[i] - closes[i-1]
        let g = change > 0 ? change : 0
        let l = change < 0 ? -change : 0
        avgGain = (avgGain * Double(period - 1) + g) / Double(period)
        avgLoss = (avgLoss * Double(period - 1) + l) / Double(period)
    }
    
    if avgLoss == 0 { return 100.0 }
    let rs = avgGain / avgLoss
    return 100.0 - (100.0 / (1.0 + rs))
}
```

---

## 4. PATTERN LEG (Max 10 pts)

```swift
// MARK: - Pattern Recognition
struct OrionPatternService {
    static let shared = OrionPatternService()
    
    struct PatternResult {
        let score: Double
        let patterns: [String]
        let description: String
    }
    
    func analyzePatterns(candles: [Candle], context: String?) -> PatternResult {
        guard candles.count >= 5 else {
            return PatternResult(score: 50, patterns: [], description: "Yetersiz veri")
        }
        
        var patterns: [String] = []
        var score = 50.0
        
        let last = candles.suffix(5)
        let c = Array(last)
        
        // Bullish Engulfing
        if c.count >= 2 {
            let prev = c[c.count - 2]
            let curr = c[c.count - 1]
            
            if prev.close < prev.open && // Red candle
               curr.close > curr.open && // Green candle
               curr.open < prev.close &&
               curr.close > prev.open {
                patterns.append("Yutan Formasyon (Bullish)")
                score += 25
            }
        }
        
        // Hammer
        if let curr = c.last {
            let body = abs(curr.close - curr.open)
            let lowerWick = min(curr.open, curr.close) - curr.low
            let upperWick = curr.high - max(curr.open, curr.close)
            
            if lowerWick > body * 2 && upperWick < body * 0.5 {
                patterns.append("Çekiç (Hammer)")
                score += 20
            }
        }
        
        // Doji
        if let curr = c.last {
            let body = abs(curr.close - curr.open)
            let range = curr.high - curr.low
            
            if body < range * 0.1 {
                patterns.append("Doji")
                score += 10 // Indecision
            }
        }
        
        return PatternResult(
            score: min(100, max(0, score)),
            patterns: patterns,
            description: patterns.isEmpty ? "Formasyon yok" : patterns.joined(separator: ", ")
        )
    }
}
```

---

## 5. VOLATILITY LEG (Max 5 pts) - NEW

```swift
// MARK: - Volatility Squeeze
private func calculateVolatilityLeg(candles: [Candle]) -> (Double, Bool) {
    let closes = candles.map { $0.close }
    guard closes.count >= 20 else { return (50.0, false) }
    
    let price = closes.last ?? 0
    let atr = calculateATR(candles: candles, period: 14)
    
    // Bollinger Band Width
    guard let sma20 = sma(closes, 20) else { return (50.0, false) }
    
    let variance = closes.suffix(20).map { pow($0 - sma20, 2) }.reduce(0, +) / 20.0
    let stdDev = sqrt(variance)
    let bbWidth = (stdDev * 2) / sma20 * 100.0
    
    // Historical average
    var historicalWidths: [Double] = []
    for i in 20..<min(closes.count, 120) {
        let slice = Array(closes[(i-20)..<i])
        if let sliceSMA = sma(slice, 20) {
            let sliceVar = slice.map { pow($0 - sliceSMA, 2) }.reduce(0, +) / 20.0
            historicalWidths.append((sqrt(sliceVar) * 2) / sliceSMA * 100.0)
        }
    }
    
    let avgWidth = historicalWidths.isEmpty ? bbWidth : historicalWidths.reduce(0, +) / Double(historicalWidths.count)
    let isSqueeze = bbWidth < avgWidth * 0.7
    
    var score = 50.0
    
    if isSqueeze { score += 30 } // Breakout potential
    
    let atrPct = (atr / price) * 100.0
    if atrPct > 1.5 && atrPct < 4.0 {
        score += 20 // Goldilocks zone
    } else if atrPct < 1.0 {
        score += 10 // Low vol
    } else if atrPct > 6.0 {
        score -= 20 // Too volatile
    }
    
    return (min(100, max(0, score)), isSqueeze)
}
```

---

## Final Aggregation

```swift
func calculateOrionScore(symbol: String, candles: [Candle]) -> OrionScoreResult? {
    guard candles.count > 50 else { return nil }
    let sorted = candles.sorted { $0.date < $1.date }
    
    // 1. STRUCTURE (30%)
    let structRes = OrionStructureService.shared.analyzeStructure(candles: sorted)
    let structWeighted = ((structRes?.score ?? 50) / 100.0) * 30.0
    
    // 2. TREND (30%) - includes MACD
    let (trendRaw, _) = calculateTrendLeg(candles: sorted)
    let (macdScore, _) = calculateMACDForTrend(candles: sorted)
    let trendWeighted = ((trendRaw + macdScore) / 40.0) * 30.0
    
    // 3. MOMENTUM (25%) - RSI + Volume
    let (momRaw, _) = calculateMomentumLegNoMACD(candles: sorted)
    let (volRaw, _) = calculateVolLiquidityLeg(candles: sorted)
    let momWeighted = ((momRaw + volRaw) / 30.0) * 25.0
    
    // 4. PATTERN (10%)
    let patternRes = OrionPatternService.shared.analyzePatterns(candles: sorted, context: nil)
    let patternWeighted = (patternRes.score / 100.0) * 10.0
    
    // 5. VOLATILITY (5%)
    let (volScore, _) = calculateVolatilityLeg(candles: sorted)
    let volatilityWeighted = (volScore / 100.0) * 5.0
    
    // FINAL
    var finalScore = structWeighted + trendWeighted + momWeighted + patternWeighted + volatilityWeighted
    
    // Synergy bonus (8%)
    if let s = structRes, s.trendState == .uptrend, s.activeZone != nil {
        finalScore *= 1.08
    }
    
    return OrionScoreResult(
        symbol: symbol,
        score: min(100, max(0, finalScore)),
        // ... other fields
    )
}
```

---

*Sonraki: `03_aether.md` →*
