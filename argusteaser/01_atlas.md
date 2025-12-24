# 🏛️ ATLAS - Fundamental Analiz Motoru

## Konsept

Atlas, Yunan mitolojisinde gökyüzünü omuzlarında taşıyan Titan'dır. Bu modül, şirketin "temel yapısını" - finansal sağlığını ve kalitesini analiz eder.

## Prompt

> Bana bir iOS SwiftUI uygulaması için fundamental analiz motoru yaz. Motor, Yahoo Finance'den gelen finansal verileri analiz edip 0-100 arası bir kalite skoru üretmeli. Aşağıdaki 4 kategoriyi değerlendir:
>
> 1. **Profitability (Kârlılık)** - 30 puan
> 2. **Growth (Büyüme)** - 25 puan  
> 3. **Financial Health (Borç/Risk)** - 25 puan
> 4. **Cash Quality (Nakit Kalitesi)** - 20 puan
>
> Her kategori için spesifik metrikler ve formüller kullan. Yahoo Finance'den gelen veri yapısına uygun olsun.

---

## Matematiksel Model

### 1. Profitability Score (Max 30)

```swift
func calculateProfitability(data: Fundamentals) -> Double {
    var score = 0.0
    
    // ROE (Return on Equity) - Max 10 pts
    // Optimal: 15-25%
    if let roe = data.roe {
        if roe >= 0.25 { score += 10 }
        else if roe >= 0.15 { score += 8 }
        else if roe >= 0.10 { score += 5 }
        else if roe >= 0.05 { score += 2 }
        else { score += 0 }
    }
    
    // Net Margin - Max 10 pts
    // Optimal: > 20%
    if let margin = data.profitMargin {
        if margin >= 0.30 { score += 10 }
        else if margin >= 0.20 { score += 8 }
        else if margin >= 0.10 { score += 5 }
        else if margin >= 0.05 { score += 2 }
        else { score += 0 }
    }
    
    // Operating Margin - Max 10 pts
    if let opMargin = data.operatingMargin {
        if opMargin >= 0.25 { score += 10 }
        else if opMargin >= 0.15 { score += 7 }
        else if opMargin >= 0.08 { score += 4 }
        else { score += 1 }
    }
    
    return min(30, score)
}
```

### 2. Growth Score (Max 25)

```swift
func calculateGrowth(data: Fundamentals) -> Double {
    var score = 0.0
    
    // Revenue Growth (YoY) - Max 10 pts
    if let revGrowth = data.revenueGrowth {
        if revGrowth >= 0.30 { score += 10 }
        else if revGrowth >= 0.15 { score += 7 }
        else if revGrowth >= 0.05 { score += 4 }
        else if revGrowth >= 0 { score += 2 }
        else { score += 0 } // Negative growth
    }
    
    // Earnings Growth - Max 10 pts
    if let epsGrowth = data.earningsGrowth {
        if epsGrowth >= 0.25 { score += 10 }
        else if epsGrowth >= 0.10 { score += 6 }
        else if epsGrowth >= 0 { score += 3 }
        else { score += 0 }
    }
    
    // PEG Ratio (Growth-adjusted P/E) - Max 5 pts
    // PEG < 1 = Undervalued, PEG > 2 = Expensive
    if let peg = data.pegRatio, peg > 0 {
        if peg <= 1.0 { score += 5 }
        else if peg <= 1.5 { score += 3 }
        else if peg <= 2.0 { score += 1 }
        else { score += 0 }
    }
    
    return min(25, score)
}
```

### 3. Financial Health Score (Max 25)

```swift
func calculateFinancialHealth(data: Fundamentals) -> Double {
    var score = 0.0
    
    // Debt/Equity Ratio - Max 10 pts
    // Lower is better: < 0.5 ideal
    if let debtEquity = data.debtToEquity {
        if debtEquity <= 0.3 { score += 10 }
        else if debtEquity <= 0.6 { score += 7 }
        else if debtEquity <= 1.0 { score += 4 }
        else if debtEquity <= 2.0 { score += 1 }
        else { score += 0 } // Highly leveraged
    }
    
    // Current Ratio (Liquidity) - Max 8 pts
    // > 2.0 is healthy, < 1.0 is risky
    if let current = data.currentRatio {
        if current >= 2.5 { score += 8 }
        else if current >= 1.5 { score += 6 }
        else if current >= 1.0 { score += 3 }
        else { score += 0 }
    }
    
    // Interest Coverage - Max 7 pts
    if let coverage = data.interestCoverage, coverage > 0 {
        if coverage >= 10 { score += 7 }
        else if coverage >= 5 { score += 5 }
        else if coverage >= 2 { score += 2 }
        else { score += 0 }
    }
    
    return min(25, score)
}
```

### 4. Cash Quality Score (Max 20)

```swift
func calculateCashQuality(data: Fundamentals) -> Double {
    var score = 0.0
    
    // Free Cash Flow Margin - Max 10 pts
    if let fcfMargin = data.freeCashFlowMargin {
        if fcfMargin >= 0.20 { score += 10 }
        else if fcfMargin >= 0.10 { score += 7 }
        else if fcfMargin >= 0.05 { score += 4 }
        else if fcfMargin > 0 { score += 2 }
        else { score += 0 } // Negative FCF
    }
    
    // Cash/Total Assets - Max 5 pts
    if let cashRatio = data.cashToAssets {
        if cashRatio >= 0.20 { score += 5 }
        else if cashRatio >= 0.10 { score += 3 }
        else { score += 1 }
    }
    
    // Dividend Sustainability - Max 5 pts
    if let payoutRatio = data.payoutRatio {
        if payoutRatio > 0 && payoutRatio <= 0.50 { score += 5 }
        else if payoutRatio <= 0.75 { score += 3 }
        else if payoutRatio <= 1.0 { score += 1 }
        else { score += 0 } // Paying more than earned
    }
    
    return min(20, score)
}
```

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Atlas Fundamental Engine
class AtlasEngine {
    static let shared = AtlasEngine()
    
    private init() {}
    
    struct AtlasResult {
        let score: Double
        let profitability: Double
        let growth: Double
        let health: Double
        let cashQuality: Double
        let verdict: String
        let details: [String]
    }
    
    func analyze(fundamentals: Fundamentals) -> AtlasResult {
        let profitability = calculateProfitability(data: fundamentals)
        let growth = calculateGrowth(data: fundamentals)
        let health = calculateFinancialHealth(data: fundamentals)
        let cash = calculateCashQuality(data: fundamentals)
        
        let totalScore = profitability + growth + health + cash
        
        // Collect details
        var details: [String] = []
        if let roe = fundamentals.roe {
            details.append("ROE: \(String(format: "%.1f", roe * 100))%")
        }
        if let margin = fundamentals.profitMargin {
            details.append("Kâr Marjı: \(String(format: "%.1f", margin * 100))%")
        }
        if let de = fundamentals.debtToEquity {
            details.append("Borç/Özsermaye: \(String(format: "%.2f", de))")
        }
        
        return AtlasResult(
            score: totalScore,
            profitability: profitability,
            growth: growth,
            health: health,
            cashQuality: cash,
            verdict: getVerdict(score: totalScore),
            details: details
        )
    }
    
    private func getVerdict(score: Double) -> String {
        switch score {
        case 80...100: return "Mükemmel Kalite"
        case 65..<80: return "Güçlü Temel"
        case 50..<65: return "Ortalama"
        case 35..<50: return "Zayıf"
        default: return "Riskli"
        }
    }
    
    // ... (yukarıdaki calculate fonksiyonları buraya)
}
```

---

## Yahoo Finance'den Veri Alma

```swift
struct Fundamentals: Codable {
    // Profitability
    var roe: Double?              // returnOnEquity
    var profitMargin: Double?     // netMargin
    var operatingMargin: Double?
    
    // Growth
    var revenueGrowth: Double?
    var earningsGrowth: Double?
    var pegRatio: Double?
    
    // Health
    var debtToEquity: Double?
    var currentRatio: Double?
    var interestCoverage: Double?
    
    // Cash
    var freeCashFlowMargin: Double?
    var cashToAssets: Double?
    var payoutRatio: Double?
}

// Yahoo Finance'den parsing
extension YahooFinanceProvider {
    func fetchFundamentals(symbol: String) async throws -> Fundamentals {
        let url = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/\(symbol)?modules=financialData,defaultKeyStatistics,incomeStatementHistory"
        
        // ... fetch and parse
        
        return Fundamentals(
            roe: json["financialData"]["returnOnEquity"].doubleValue,
            profitMargin: json["financialData"]["profitMargins"].doubleValue,
            // ... diğer alanlar
        )
    }
}
```

---

## UI Bileşeni

```swift
struct AtlasScoreCard: View {
    let result: AtlasEngine.AtlasResult
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: "building.columns.fill")
                    .foregroundColor(.blue)
                Text("Atlas Fundamental")
                    .font(.headline)
                Spacer()
                Text("\(Int(result.score))")
                    .font(.title2.bold())
                    .foregroundColor(scoreColor)
            }
            
            // Score Bars
            ScoreBar(label: "Kârlılık", value: result.profitability, max: 30)
            ScoreBar(label: "Büyüme", value: result.growth, max: 25)
            ScoreBar(label: "Sağlık", value: result.health, max: 25)
            ScoreBar(label: "Nakit", value: result.cashQuality, max: 20)
            
            // Verdict
            Text(result.verdict)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
    
    var scoreColor: Color {
        switch result.score {
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
// Veri çek
let fundamentals = try await YahooFinanceProvider.shared.fetchFundamentals(symbol: "AAPL")

// Analiz et
let atlasResult = AtlasEngine.shared.analyze(fundamentals: fundamentals)

// Sonuç
print("Atlas Score: \(atlasResult.score)")
print("Verdict: \(atlasResult.verdict)")
```

---

*Sonraki: `02_orion.md` →*
