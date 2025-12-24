# 🔥 PHOENIX - Mean Reversion + Trend Hybrid

## Konsept

Phoenix, küllerinden yeniden doğan efsanevi kuştur. Bu modül, "aşırı satılmış" durumlardan toparlanma (mean reversion) ve trend takibi yapar.

## Prompt

> Bana bir iOS SwiftUI uygulaması için hybrid price action motoru yaz. Motor iki modda çalışsın:
>
> 1. **Mean Reversion Mode** - Aşırı satımdan dönüş
> 2. **Trend Mode** - Uptrend'de pullback fırsatları
>
> Linear regression channel, RSI, bullish divergence kullan. Yahoo Finance candle verileriyle çalışsın.

---

## Dual Mode Sistemi

```
┌─────────────────────────────────────────────────┐
│              PHOENIX LOGIC                       │
├─────────────────────────────────────────────────┤
│                                                  │
│   ┌─────────────┐        ┌─────────────┐        │
│   │  TREND      │        │  REVERSION  │        │
│   │  MODE       │   OR   │  MODE       │        │
│   │             │        │             │        │
│   │ slope > 0   │        │ slope ≤ 0   │        │
│   │ price > mid │        │ price < mid │        │
│   └─────────────┘        └─────────────┘        │
│                                                  │
│   Pullback Entry          Lower Band Touch       │
│   RSI < 60               RSI Reversal            │
│   Trend Continuation      Divergence             │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Phoenix Logic
struct PhoenixLogic {
    
    static func analyze(
        candles: [Candle],
        symbol: String,
        config: PhoenixConfig = .default
    ) -> PhoenixAdvice {
        
        let n = candles.count
        let N = min(config.lookback, n)
        
        guard n >= 60 else {
            return PhoenixAdvice.insufficient(symbol: symbol)
        }
        
        let analysisSlice = Array(candles.suffix(N))
        
        // 1. Linear Regression Channel
        let closes = analysisSlice.map { $0.close }
        let (slope, sigma, mid, upper, lower) = calculateLinRegChannel(
            closes: closes,
            k: config.regressionMultiplier
        )
        
        // 2. ATR
        let atr = calculateATR(candles: analysisSlice, period: config.atrPeriod)
        
        // 3. Entry Zones
        let bufferBase = max(0.15 * sigma, (atr ?? 0) * 0.1)
        let entryZoneLow = lower - (0.10 * bufferBase)
        let entryZoneHigh = lower + (0.90 * bufferBase)
        
        // 4. Targets
        let t1 = mid
        let isDowntrend = slope < -(mid * 0.0005)
        let t2 = isDowntrend ? mid + (upper - mid) * 0.5 : upper
        
        // 5. Current State
        guard let latest = analysisSlice.last else {
            return PhoenixAdvice.insufficient(symbol: symbol)
        }
        
        let touchLowerBand = latest.low <= (lower + 0.10 * bufferBase)
        
        // RSI
        let rsiValues = calculateRSI(candles: analysisSlice, period: 14)
        let currentRSI = rsiValues.last ?? 50
        let prevRSI = rsiValues.dropLast().last ?? 50
        let rsiReversal = (currentRSI >= 40 && prevRSI < 40 && currentRSI > prevRSI)
        
        // Divergence
        let divergence = checkBullishDivergence(candles: analysisSlice, rsi: rsiValues)
        
        // Trend Check
        let trendOk = slope >= 0 || slope > -(mid * 0.0002)
        
        // 6. DETECT MARKET MODE
        let isUptrend = slope > 0 && latest.close > mid
        let isPullback = isUptrend && latest.close < (mid + 0.3 * sigma) && currentRSI < 60
        
        // 7. HYBRID SCORING
        var score = 50.0
        
        if isUptrend {
            // === TREND MODE ===
            score += 10  // Base uptrend bonus
            if isPullback { score += 15 }  // Pullback opportunity
            if currentRSI < 50 { score += 5 }  // Not overbought
            if slope > (mid * 0.001) { score += 10 }  // Strong slope
        } else {
            // === MEAN REVERSION MODE ===
            if touchLowerBand { score += 15 }
            if rsiReversal { score += 10 }
            if divergence { score += 15 }
            if slope > 0 { score += 10 }
        }
        
        // Volume Spike (both modes)
        let vol = latest.volume
        let avgVol = analysisSlice.suffix(21).prefix(20).map { $0.volume }.reduce(0, +) / 20.0
        if avgVol > 0 && vol > 1.5 * avgVol {
            score += 5
        }
        
        // Penalties
        if slope < -(mid * 0.0005) { score -= 15 }  // Clear downtrend
        if (sigma / mid) > 0.08 { score -= 10 }  // High volatility
        
        score = min(max(score, 0), 100)
        
        let reason = generateReason(
            score: score,
            isUptrend: isUptrend,
            isPullback: isPullback,
            touch: touchLowerBand,
            rsi: rsiReversal
        )
        
        return PhoenixAdvice(
            symbol: symbol,
            status: score > 60 ? .active : .inactive,
            channelUpper: upper,
            channelMid: mid,
            channelLower: lower,
            entryZoneLow: entryZoneLow,
            entryZoneHigh: entryZoneHigh,
            targets: [t1, t2],
            confidence: score,
            mode: isUptrend ? .trend : .reversion,
            reasonShort: reason
        )
    }
    
    // MARK: - Linear Regression Channel
    
    static func calculateLinRegChannel(closes: [Double], k: Double) -> (Double, Double, Double, Double, Double) {
        let n = Double(closes.count)
        
        // Linear Regression: y = mx + b
        var sumX = 0.0, sumY = 0.0, sumXY = 0.0, sumX2 = 0.0
        for (i, y) in closes.enumerated() {
            let x = Double(i)
            sumX += x
            sumY += y
            sumXY += x * y
            sumX2 += x * x
        }
        
        let slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
        let intercept = (sumY - slope * sumX) / n
        
        // Standard deviation from line
        var deviations: [Double] = []
        for (i, y) in closes.enumerated() {
            let predicted = intercept + slope * Double(i)
            deviations.append(y - predicted)
        }
        let sigma = sqrt(deviations.map { $0 * $0 }.reduce(0, +) / n)
        
        // Channel levels at last bar
        let finalX = n - 1
        let mid = intercept + slope * finalX
        let upper = mid + (k * sigma)
        let lower = mid - (k * sigma)
        
        return (slope, sigma, mid, upper, lower)
    }
    
    // MARK: - RSI
    
    static func calculateRSI(candles: [Candle], period: Int) -> [Double] {
        guard candles.count > period + 1 else { return [] }
        
        var rsis: [Double] = []
        let closes = candles.map { $0.close }
        
        for i in period..<closes.count {
            let slice = Array(closes[(i-period)...i])
            var gains = 0.0, losses = 0.0
            
            for j in 1..<slice.count {
                let change = slice[j] - slice[j-1]
                if change > 0 { gains += change }
                else { losses -= change }
            }
            
            let avgGain = gains / Double(period)
            let avgLoss = losses / Double(period)
            
            let rs = avgLoss == 0 ? 100 : avgGain / avgLoss
            let rsi = 100 - (100 / (1 + rs))
            rsis.append(rsi)
        }
        
        return rsis
    }
    
    // MARK: - Bullish Divergence
    
    static func checkBullishDivergence(candles: [Candle], rsi: [Double]) -> Bool {
        guard rsi.count >= 20 else { return false }
        
        // Find RSI lows
        let rsiSlice = Array(rsi.suffix(20))
        
        var dips: [(Int, Double)] = []
        for i in 1..<(rsiSlice.count - 1) {
            if rsiSlice[i] < rsiSlice[i-1] && rsiSlice[i] < rsiSlice[i+1] {
                dips.append((i, rsiSlice[i]))
            }
        }
        
        guard dips.count >= 2 else { return false }
        
        let lastDip = dips[dips.count - 1]
        let priorDip = dips[dips.count - 2]
        
        // Price making lower lows but RSI making higher lows = Bullish Divergence
        let candleSlice = Array(candles.suffix(20))
        let lastDipPrice = candleSlice[lastDip.0].low
        let priorDipPrice = candleSlice[priorDip.0].low
        
        return lastDipPrice < priorDipPrice && lastDip.1 > priorDip.1
    }
    
    // MARK: - Reason
    
    static func generateReason(
        score: Double,
        isUptrend: Bool,
        isPullback: Bool,
        touch: Bool,
        rsi: Bool
    ) -> String {
        if score >= 70 {
            if isUptrend && isPullback {
                return "Trend pullback fırsatı - RSI uygun."
            } else if touch {
                return "Kanal dibine yakın, dönüş sinyalleri var."
            }
            return "Güçlü sinyal."
        } else if score >= 50 {
            return "Orta seviye sinyal, teyit bekle."
        } else {
            return "Zayıf koşullar, Phoenix aktif değil."
        }
    }
}

// MARK: - Models

struct PhoenixConfig {
    let lookback: Int
    let regressionMultiplier: Double
    let atrPeriod: Int
    
    static let `default` = PhoenixConfig(
        lookback: 50,
        regressionMultiplier: 2.0,
        atrPeriod: 14
    )
}

struct PhoenixAdvice {
    let symbol: String
    let status: Status
    let channelUpper: Double
    let channelMid: Double
    let channelLower: Double
    let entryZoneLow: Double
    let entryZoneHigh: Double
    let targets: [Double]
    let confidence: Double
    let mode: Mode
    let reasonShort: String
    
    enum Status { case active, inactive }
    enum Mode { case trend, reversion }
    
    static func insufficient(symbol: String) -> PhoenixAdvice {
        PhoenixAdvice(
            symbol: symbol,
            status: .inactive,
            channelUpper: 0, channelMid: 0, channelLower: 0,
            entryZoneLow: 0, entryZoneHigh: 0,
            targets: [],
            confidence: 0,
            mode: .reversion,
            reasonShort: "Yetersiz veri"
        )
    }
}
```

---

## UI Bileşeni

```swift
struct PhoenixCard: View {
    let advice: PhoenixAdvice
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: "flame.fill")
                    .foregroundColor(.orange)
                Text("Phoenix")
                    .font(.headline)
                Spacer()
                Text(advice.mode == .trend ? "TREND" : "REVERSION")
                    .font(.caption.bold())
                    .foregroundColor(advice.mode == .trend ? .green : .orange)
            }
            
            // Confidence
            HStack {
                Text("Güven")
                Spacer()
                Text("\(Int(advice.confidence))")
                    .font(.title2.bold())
                    .foregroundColor(confidenceColor)
            }
            
            // Channel Levels
            VStack(alignment: .leading, spacing: 4) {
                LevelRow(label: "Üst Band", value: advice.channelUpper)
                LevelRow(label: "Orta", value: advice.channelMid)
                LevelRow(label: "Alt Band", value: advice.channelLower)
            }
            
            // Reason
            Text(advice.reasonShort)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
    
    var confidenceColor: Color {
        switch advice.confidence {
        case 70...100: return .green
        case 50..<70: return .yellow
        default: return .red
        }
    }
}
```

---

## Kullanım

```swift
let candles = try await YahooFinanceProvider.shared.fetchCandles(symbol: "AAPL", range: "6mo")
let advice = PhoenixLogic.analyze(candles: candles, symbol: "AAPL")

if advice.status == .active {
    print("Mode: \(advice.mode)")
    print("Confidence: \(advice.confidence)")
    print("Entry Zone: \(advice.entryZoneLow) - \(advice.entryZoneHigh)")
}
```

---

*Sonraki: `05_chiron.md` →*
