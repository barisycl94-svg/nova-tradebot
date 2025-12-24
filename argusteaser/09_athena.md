# 🦉 ATHENA - Faktör Analizi

## Konsept

Athena, bilgelik tanrıçasıdır. Bu modül, akademik faktör modellerini (Value, Momentum, Quality) uygular.

## Prompt

> Bana bir iOS SwiftUI uygulaması için faktör analiz motoru yaz:
>
> 1. Value faktörü (P/E, P/B, EV/EBITDA)
> 2. Momentum faktörü (6-12 ay getiri)
> 3. Quality faktörü (ROE, Debt/Equity)
> 4. Size faktörü (Market Cap)
>
> Yahoo Finance verileriyle çalışsın.

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Athena Factor Engine
class AthenaFactorEngine {
    static let shared = AthenaFactorEngine()
    
    private init() {}
    
    struct AthenaResult {
        let score: Double
        let valueScore: Double
        let momentumScore: Double
        let qualityScore: Double
        let sizeScore: Double
        let factors: [FactorDetail]
    }
    
    struct FactorDetail {
        let name: String
        let value: Double
        let score: Double
        let percentile: Double?
    }
    
    // MARK: - Main Analysis
    
    func analyze(
        fundamentals: Fundamentals,
        candles: [Candle],
        marketCap: Double?
    ) -> AthenaResult {
        
        // 1. VALUE FACTOR (25%)
        let valueScore = calculateValueFactor(fundamentals: fundamentals)
        
        // 2. MOMENTUM FACTOR (30%)
        let momentumScore = calculateMomentumFactor(candles: candles)
        
        // 3. QUALITY FACTOR (30%)
        let qualityScore = calculateQualityFactor(fundamentals: fundamentals)
        
        // 4. SIZE FACTOR (15%)
        let sizeScore = calculateSizeFactor(marketCap: marketCap)
        
        // Weighted Total
        let totalScore = (valueScore * 0.25) + 
                         (momentumScore * 0.30) + 
                         (qualityScore * 0.30) + 
                         (sizeScore * 0.15)
        
        return AthenaResult(
            score: totalScore,
            valueScore: valueScore,
            momentumScore: momentumScore,
            qualityScore: qualityScore,
            sizeScore: sizeScore,
            factors: [] // Populate with details
        )
    }
    
    // MARK: - Value Factor (P/E, P/B, EV/EBITDA)
    
    private func calculateValueFactor(fundamentals: Fundamentals) -> Double {
        var score = 50.0
        var count = 0
        
        // P/E Ratio
        if let pe = fundamentals.peRatio, pe > 0 {
            count += 1
            if pe < 15 { score += 20 }         // Deep value
            else if pe < 20 { score += 10 }   // Fair value
            else if pe < 30 { score += 0 }    // Growth
            else { score -= 15 }               // Expensive
        }
        
        // P/B Ratio
        if let pb = fundamentals.priceToBook, pb > 0 {
            count += 1
            if pb < 1 { score += 20 }          // Below book
            else if pb < 3 { score += 10 }
            else if pb < 5 { score += 0 }
            else { score -= 10 }
        }
        
        // EV/EBITDA
        if let evEbitda = fundamentals.evToEbitda, evEbitda > 0 {
            count += 1
            if evEbitda < 8 { score += 15 }
            else if evEbitda < 12 { score += 5 }
            else if evEbitda < 20 { score += 0 }
            else { score -= 10 }
        }
        
        return min(100, max(0, score))
    }
    
    // MARK: - Momentum Factor (6M, 12M returns)
    
    private func calculateMomentumFactor(candles: [Candle]) -> Double {
        guard candles.count >= 252 else { return 50.0 } // Need 1 year data
        
        let closes = candles.map { $0.close }
        let current = closes.last ?? 0
        
        // 12-month momentum (skip last month for mean reversion)
        let month12 = closes.count > 252 ? closes[closes.count - 252] : closes.first!
        let month1 = closes.count > 21 ? closes[closes.count - 21] : current
        
        // 12-1 momentum (exclude last month)
        let return12_1 = (month1 - month12) / month12 * 100
        
        // 6-month momentum
        let month6 = closes.count > 126 ? closes[closes.count - 126] : closes.first!
        let return6 = (current - month6) / month6 * 100
        
        var score = 50.0
        
        // 12-1 Momentum
        if return12_1 > 30 { score += 25 }
        else if return12_1 > 15 { score += 15 }
        else if return12_1 > 0 { score += 5 }
        else if return12_1 > -15 { score -= 5 }
        else { score -= 20 }
        
        // 6M Momentum
        if return6 > 20 { score += 15 }
        else if return6 > 10 { score += 10 }
        else if return6 > 0 { score += 5 }
        else { score -= 10 }
        
        return min(100, max(0, score))
    }
    
    // MARK: - Quality Factor (ROE, Debt, Profitability)
    
    private func calculateQualityFactor(fundamentals: Fundamentals) -> Double {
        var score = 50.0
        
        // ROE
        if let roe = fundamentals.roe {
            if roe >= 0.20 { score += 20 }
            else if roe >= 0.15 { score += 15 }
            else if roe >= 0.10 { score += 5 }
            else if roe >= 0 { score += 0 }
            else { score -= 15 }
        }
        
        // Debt/Equity
        if let de = fundamentals.debtToEquity {
            if de <= 0.3 { score += 15 }
            else if de <= 0.6 { score += 10 }
            else if de <= 1.0 { score += 0 }
            else { score -= 10 }
        }
        
        // Profit Margin
        if let margin = fundamentals.profitMargin {
            if margin >= 0.20 { score += 15 }
            else if margin >= 0.10 { score += 10 }
            else if margin >= 0 { score += 0 }
            else { score -= 10 }
        }
        
        return min(100, max(0, score))
    }
    
    // MARK: - Size Factor
    
    private func calculateSizeFactor(marketCap: Double?) -> Double {
        guard let cap = marketCap else { return 50.0 }
        
        // Size premium: small caps historically outperform
        // But we also want liquidity
        
        var score = 50.0
        
        if cap < 2_000_000_000 { // < $2B Small Cap
            score += 15
        } else if cap < 10_000_000_000 { // < $10B Mid Cap
            score += 10
        } else if cap < 100_000_000_000 { // < $100B Large Cap
            score += 5
        } else { // Mega Cap
            score += 0 // No size premium but safe
        }
        
        return min(100, max(0, score))
    }
}
```

---

## UI Bileşeni

```swift
struct AthenaCard: View {
    let result: AthenaFactorEngine.AthenaResult
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(.purple)
                Text("Athena Faktörler")
                    .font(.headline)
                Spacer()
                Text("\(Int(result.score))")
                    .font(.title2.bold())
            }
            
            // Factor bars
            FactorBar(label: "Value", score: result.valueScore)
            FactorBar(label: "Momentum", score: result.momentumScore)
            FactorBar(label: "Quality", score: result.qualityScore)
            FactorBar(label: "Size", score: result.sizeScore)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
}

struct FactorBar: View {
    let label: String
    let score: Double
    
    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                    Rectangle()
                        .fill(scoreColor)
                        .frame(width: geo.size.width * score / 100)
                }
                .cornerRadius(4)
            }
            .frame(height: 8)
            Text("\(Int(score))")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
    
    var scoreColor: Color {
        if score >= 70 { return .green }
        if score >= 50 { return .yellow }
        return .red
    }
}
```

---

*Sonraki: `10_titan.md` →*
