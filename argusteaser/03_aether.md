# 🌌 AETHER - Makro Analiz Motoru

## Konsept

Aether, antik Yunan'da gökyüzünü dolduran ilahi element'tir. Bu modül, "büyük resmi" - makro ekonomik ortamı ve risk durumunu analiz eder.

## Prompt

> Bana bir iOS SwiftUI uygulaması için makro analiz motoru yaz. Motor, piyasa genelindeki risk-on/risk-off durumunu değerlendirsin:
>
> 1. **VIX (Korku Endeksi)** - Volatilite
> 2. **Market Trend** - SPY/QQQ durumu
> 3. **Sector Rotation** - Defansif vs Ofansif
> 4. **Yield Curve** - Faiz yapısı
>
> Yahoo Finance verileriyle çalışsın. 0-100 arası risk skoru üretsin.

---

## Matematiksel Model

```
AetherScore = (VIX_Score × 0.30) + (Market_Score × 0.35) + (Sector_Score × 0.20) + (Yield_Score × 0.15)
```

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Aether Macro Engine
class AetherEngine {
    static let shared = AetherEngine()
    
    private init() {}
    
    enum MarketRegime: String {
        case riskOn = "Risk-On"
        case riskOff = "Risk-Off"
        case neutral = "Nötr"
        case caution = "Dikkat"
    }
    
    struct AetherResult {
        let score: Double
        let regime: MarketRegime
        let vixLevel: Double?
        let marketTrend: String
        let details: [String]
    }
    
    func evaluateMacro() async throws -> AetherResult {
        var details: [String] = []
        var totalScore = 0.0
        
        // 1. VIX Analysis (30%)
        let vixScore = try await analyzeVIX()
        totalScore += vixScore.score * 0.30
        if let vix = vixScore.vixLevel {
            details.append("VIX: \(String(format: "%.1f", vix))")
        }
        
        // 2. Market Trend (35%)
        let marketScore = try await analyzeMarketTrend()
        totalScore += marketScore.score * 0.35
        details.append("SPY: \(marketScore.trend)")
        
        // 3. Sector Rotation (20%)
        let sectorScore = try await analyzeSectorRotation()
        totalScore += sectorScore.score * 0.20
        details.append("Sektör: \(sectorScore.bias)")
        
        // 4. Simplified Yield (15%)
        let yieldScore = analyzeYieldSimplified()
        totalScore += yieldScore * 0.15
        
        let regime = determineRegime(score: totalScore, vix: vixScore.vixLevel)
        
        return AetherResult(
            score: totalScore,
            regime: regime,
            vixLevel: vixScore.vixLevel,
            marketTrend: marketScore.trend,
            details: details
        )
    }
    
    // MARK: - VIX Analysis
    
    private func analyzeVIX() async throws -> (score: Double, vixLevel: Double?) {
        // Fetch VIX from Yahoo Finance
        let candles = try await YahooFinanceProvider.shared.fetchCandles(
            symbol: "^VIX",
            range: "1mo"
        )
        
        guard let vixValue = candles.last?.close else {
            return (50.0, nil) // Neutral if no data
        }
        
        /*
         VIX Levels:
         < 15: Very low fear (maybe complacent) - Score: 80
         15-20: Normal - Score: 70
         20-25: Elevated - Score: 50
         25-30: High fear - Score: 30
         > 30: Panic - Score: 10 (but could be bounce opportunity)
        */
        
        var score = 50.0
        
        if vixValue < 15 {
            score = 80.0
        } else if vixValue < 20 {
            score = 70.0
        } else if vixValue < 25 {
            score = 50.0
        } else if vixValue < 30 {
            score = 30.0
        } else {
            score = 15.0 // Extreme fear
        }
        
        return (score, vixValue)
    }
    
    // MARK: - Market Trend
    
    private func analyzeMarketTrend() async throws -> (score: Double, trend: String) {
        let spyCandles = try await YahooFinanceProvider.shared.fetchCandles(
            symbol: "SPY",
            range: "6mo"
        )
        
        guard spyCandles.count >= 50 else {
            return (50.0, "Veri Yok")
        }
        
        let closes = spyCandles.map { $0.close }
        let current = closes.last ?? 0
        
        guard let sma50 = sma(closes, 50),
              let sma200 = sma(closes, 200) else {
            return (50.0, "Hesaplanamadı")
        }
        
        var score = 50.0
        var trend = "Nötr"
        
        // Price vs SMAs
        if current > sma50 && current > sma200 {
            score += 25
            trend = "Yükseliş"
        } else if current < sma50 && current < sma200 {
            score -= 25
            trend = "Düşüş"
        }
        
        // SMA Alignment
        if sma50 > sma200 {
            score += 15 // Bull market structure
            trend += " (Güçlü)"
        } else {
            score -= 15 // Bear market structure
            trend += " (Zayıf)"
        }
        
        // Recent momentum (last 20 days)
        let recent20 = Array(closes.suffix(20))
        let first = recent20.first ?? current
        let change = (current - first) / first * 100
        
        if change > 5 { score += 10 }
        else if change < -5 { score -= 10 }
        
        return (max(0, min(100, score)), trend)
    }
    
    // MARK: - Sector Rotation
    
    private func analyzeSectorRotation() async throws -> (score: Double, bias: String) {
        // Compare defensive vs offensive sectors
        // Defensive: XLU (Utilities), XLP (Consumer Staples), XLV (Healthcare)
        // Offensive: XLK (Tech), XLY (Consumer Discretionary), XLF (Financials)
        
        let defensive = ["XLU", "XLP", "XLV"]
        let offensive = ["XLK", "XLY", "XLF"]
        
        var defPerf = 0.0
        var offPerf = 0.0
        
        // Calculate 1-month performance
        for symbol in defensive {
            if let perf = try? await get1MPerformance(symbol: symbol) {
                defPerf += perf
            }
        }
        defPerf /= Double(defensive.count)
        
        for symbol in offensive {
            if let perf = try? await get1MPerformance(symbol: symbol) {
                offPerf += perf
            }
        }
        offPerf /= Double(offensive.count)
        
        let diff = offPerf - defPerf
        
        var score = 50.0
        var bias = "Nötr"
        
        if diff > 3 {
            score = 75
            bias = "Risk-On (Ofansif)"
        } else if diff > 0 {
            score = 60
            bias = "Hafif Risk-On"
        } else if diff > -3 {
            score = 40
            bias = "Hafif Risk-Off"
        } else {
            score = 25
            bias = "Risk-Off (Defansif)"
        }
        
        return (score, bias)
    }
    
    private func get1MPerformance(symbol: String) async throws -> Double {
        let candles = try await YahooFinanceProvider.shared.fetchCandles(
            symbol: symbol,
            range: "1mo"
        )
        
        guard let first = candles.first?.close,
              let last = candles.last?.close else { return 0 }
        
        return (last - first) / first * 100
    }
    
    // MARK: - Yield (Simplified)
    
    private func analyzeYieldSimplified() -> Double {
        // Note: Yahoo Finance doesn't have great yield curve data
        // This is a simplified placeholder
        // In production, you'd use FRED API or similar
        
        return 50.0 // Neutral assumption
    }
    
    // MARK: - Regime Detection
    
    private func determineRegime(score: Double, vix: Double?) -> MarketRegime {
        if let vix = vix, vix > 30 {
            return .riskOff
        }
        
        if score >= 70 { return .riskOn }
        else if score >= 50 { return .neutral }
        else if score >= 35 { return .caution }
        else { return .riskOff }
    }
    
    // MARK: - Helpers
    
    private func sma(_ data: [Double], _ period: Int) -> Double? {
        guard data.count >= period else { return nil }
        return data.suffix(period).reduce(0, +) / Double(period)
    }
}
```

---

## UI Bileşeni

```swift
struct AetherCard: View {
    let result: AetherEngine.AetherResult
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "globe.europe.africa.fill")
                    .foregroundColor(.purple)
                Text("Aether Makro")
                    .font(.headline)
                Spacer()
                Text(result.regime.rawValue)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(regimeColor.opacity(0.2))
                    .foregroundColor(regimeColor)
                    .cornerRadius(8)
            }
            
            // Score Gauge
            HStack {
                Text("Risk Skoru")
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(Int(result.score))")
                    .font(.title2.bold())
            }
            
            // VIX indicator
            if let vix = result.vixLevel {
                HStack {
                    Text("VIX")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(String(format: "%.1f", vix))
                        .foregroundColor(vixColor(vix))
                }
            }
            
            // Market trend
            Text(result.marketTrend)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
    
    var regimeColor: Color {
        switch result.regime {
        case .riskOn: return .green
        case .riskOff: return .red
        case .neutral: return .gray
        case .caution: return .yellow
        }
    }
    
    func vixColor(_ vix: Double) -> Color {
        if vix < 20 { return .green }
        else if vix < 30 { return .yellow }
        else { return .red }
    }
}
```

---

## Kullanım

```swift
// Makro durumu değerlendir
let aetherResult = try await AetherEngine.shared.evaluateMacro()

print("Regime: \(aetherResult.regime.rawValue)")
print("Score: \(aetherResult.score)")

// Argus'a bildir
if aetherResult.regime == .riskOff {
    // Daha muhafazakar pozisyon al
}
```

---

*Sonraki: `04_phoenix.md` →*
