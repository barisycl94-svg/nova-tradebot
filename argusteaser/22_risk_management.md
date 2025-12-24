# ⚠️ RISK MANAGEMENT

## Konsept

Portföy riski, pozisyon boyutlandırma ve korelasyon analizi.

## Prompt

> Bana bir iOS SwiftUI uygulaması için risk yönetim sistemi yaz:
>
> 1. Position sizing (Kelly, Fixed Fractional)
> 2. Portföy korelasyonu
> 3. Max drawdown tracker
> 4. VaR (Value at Risk) basit hesaplama

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Risk Manager

class RiskManager {
    static let shared = RiskManager()
    
    private init() {}
    
    // MARK: - Position Sizing
    
    struct PositionSizeResult {
        let shares: Double
        let dollarAmount: Double
        let riskAmount: Double
        let method: String
    }
    
    /// Fixed Fractional: Risk X% of capital per trade
    func fixedFractional(
        capital: Double,
        riskPercent: Double,
        entryPrice: Double,
        stopLoss: Double
    ) -> PositionSizeResult {
        
        let riskPerShare = abs(entryPrice - stopLoss)
        let dollarRisk = capital * (riskPercent / 100)
        
        let shares = riskPerShare > 0 ? dollarRisk / riskPerShare : 0
        let dollarAmount = shares * entryPrice
        
        return PositionSizeResult(
            shares: shares,
            dollarAmount: dollarAmount,
            riskAmount: dollarRisk,
            method: "Fixed Fractional (\(riskPercent)%)"
        )
    }
    
    /// Kelly Criterion: Optimal bet size based on win rate and R/R
    func kelly(
        capital: Double,
        winRate: Double,
        avgWin: Double,
        avgLoss: Double,
        entryPrice: Double,
        fraction: Double = 0.25 // Use quarter Kelly for safety
    ) -> PositionSizeResult {
        
        guard avgLoss > 0 else {
            return PositionSizeResult(shares: 0, dollarAmount: 0, riskAmount: 0, method: "Kelly")
        }
        
        let winProb = winRate / 100
        let lossProb = 1 - winProb
        let winLossRatio = avgWin / avgLoss
        
        // Kelly formula: W - (1-W)/R
        let kellyPercent = winProb - (lossProb / winLossRatio)
        let adjustedKelly = max(0, kellyPercent * fraction) // Never negative
        
        let dollarAmount = capital * adjustedKelly
        let shares = dollarAmount / entryPrice
        
        return PositionSizeResult(
            shares: shares,
            dollarAmount: dollarAmount,
            riskAmount: dollarAmount * 0.1, // Approximate
            method: "Quarter Kelly (\(String(format: "%.1f", adjustedKelly * 100))%)"
        )
    }
    
    // MARK: - Correlation Analysis
    
    func calculateCorrelation(returns1: [Double], returns2: [Double]) -> Double {
        guard returns1.count == returns2.count, returns1.count > 1 else { return 0 }
        
        let n = Double(returns1.count)
        let mean1 = returns1.reduce(0, +) / n
        let mean2 = returns2.reduce(0, +) / n
        
        var numerator = 0.0
        var denom1 = 0.0
        var denom2 = 0.0
        
        for i in 0..<returns1.count {
            let diff1 = returns1[i] - mean1
            let diff2 = returns2[i] - mean2
            
            numerator += diff1 * diff2
            denom1 += diff1 * diff1
            denom2 += diff2 * diff2
        }
        
        guard denom1 > 0, denom2 > 0 else { return 0 }
        
        return numerator / sqrt(denom1 * denom2)
    }
    
    /// Calculate returns from candles
    func candlesToReturns(_ candles: [Candle]) -> [Double] {
        guard candles.count > 1 else { return [] }
        
        var returns: [Double] = []
        for i in 1..<candles.count {
            let ret = (candles[i].close - candles[i-1].close) / candles[i-1].close
            returns.append(ret)
        }
        return returns
    }
    
    // MARK: - Portfolio Correlation Matrix
    
    func correlationMatrix(symbols: [String], candles: [[Candle]]) -> [[Double]] {
        let n = symbols.count
        var matrix = [[Double]](repeating: [Double](repeating: 0, count: n), count: n)
        
        let allReturns = candles.map { candlesToReturns($0) }
        
        for i in 0..<n {
            for j in 0..<n {
                if i == j {
                    matrix[i][j] = 1.0
                } else {
                    matrix[i][j] = calculateCorrelation(
                        returns1: allReturns[i],
                        returns2: allReturns[j]
                    )
                }
            }
        }
        
        return matrix
    }
    
    // MARK: - Value at Risk (Historical Simulation)
    
    func historicalVaR(
        returns: [Double],
        confidenceLevel: Double = 0.95,
        portfolioValue: Double
    ) -> Double {
        
        guard !returns.isEmpty else { return 0 }
        
        let sorted = returns.sorted()
        let index = Int((1 - confidenceLevel) * Double(sorted.count))
        
        guard index >= 0, index < sorted.count else { return 0 }
        
        let worstReturn = sorted[index]
        
        return abs(worstReturn) * portfolioValue
    }
    
    // MARK: - Max Drawdown
    
    func calculateMaxDrawdown(equityCurve: [Double]) -> (maxDD: Double, maxDDPercent: Double) {
        guard !equityCurve.isEmpty else { return (0, 0) }
        
        var peak = equityCurve[0]
        var maxDDPercent = 0.0
        var maxDD = 0.0
        
        for equity in equityCurve {
            if equity > peak {
                peak = equity
            }
            
            let dd = peak - equity
            let ddPercent = (peak - equity) / peak * 100
            
            if ddPercent > maxDDPercent {
                maxDDPercent = ddPercent
                maxDD = dd
            }
        }
        
        return (maxDD, maxDDPercent)
    }
    
    // MARK: - Risk Report
    
    struct RiskReport {
        let portfolioValue: Double
        let cashPercent: Double
        let largestPosition: String
        let largestPositionPercent: Double
        let var95: Double
        let maxDrawdown: Double
        let avgCorrelation: Double
        let riskLevel: RiskLevel
    }
    
    enum RiskLevel: String {
        case low = "Düşük"
        case moderate = "Orta"
        case high = "Yüksek"
        case extreme = "Aşırı"
    }
    
    func generateRiskReport(
        cash: Double,
        positions: [PaperBroker.Position],
        historicalReturns: [Double]
    ) -> RiskReport {
        
        let totalValue = cash + positions.reduce(0) { $0 + $1.marketValue }
        let cashPercent = (cash / totalValue) * 100
        
        // Largest position
        let largest = positions.max { $0.marketValue < $1.marketValue }
        let largestPercent = largest.map { ($0.marketValue / totalValue) * 100 } ?? 0
        
        // VaR
        let var95 = historicalVaR(
            returns: historicalReturns,
            confidenceLevel: 0.95,
            portfolioValue: totalValue
        )
        
        // Determine risk level
        let riskLevel: RiskLevel
        if largestPercent > 50 || var95 > totalValue * 0.1 {
            riskLevel = .extreme
        } else if largestPercent > 30 || var95 > totalValue * 0.05 {
            riskLevel = .high
        } else if largestPercent > 15 {
            riskLevel = .moderate
        } else {
            riskLevel = .low
        }
        
        return RiskReport(
            portfolioValue: totalValue,
            cashPercent: cashPercent,
            largestPosition: largest?.symbol ?? "-",
            largestPositionPercent: largestPercent,
            var95: var95,
            maxDrawdown: 0, // Would need equity curve
            avgCorrelation: 0, // Would need correlation calc
            riskLevel: riskLevel
        )
    }
}
```

---

## UI

```swift
struct RiskDashboard: View {
    @State private var report: RiskManager.RiskReport?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                
                if let report = report {
                    // Risk Level Badge
                    HStack {
                        Text("Risk Seviyesi")
                            .font(.headline)
                        Spacer()
                        Text(report.riskLevel.rawValue)
                            .font(.headline)
                            .foregroundColor(riskColor(report.riskLevel))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(riskColor(report.riskLevel).opacity(0.2))
                            .cornerRadius(8)
                    }
                    .padding()
                    .background(Color.cardBackground)
                    .cornerRadius(16)
                    
                    // Metrics Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        RiskMetricCard(
                            title: "Portföy Değeri",
                            value: "$\(String(format: "%.0f", report.portfolioValue))",
                            color: .blue
                        )
                        
                        RiskMetricCard(
                            title: "Nakit Oranı",
                            value: "\(String(format: "%.1f", report.cashPercent))%",
                            color: .green
                        )
                        
                        RiskMetricCard(
                            title: "En Büyük Pozisyon",
                            value: "\(report.largestPosition)\n\(String(format: "%.1f", report.largestPositionPercent))%",
                            color: report.largestPositionPercent > 30 ? .red : .orange
                        )
                        
                        RiskMetricCard(
                            title: "VaR (95%)",
                            value: "$\(String(format: "%.0f", report.var95))",
                            color: .purple
                        )
                    }
                    
                    // Position Sizing Calculator
                    PositionSizingCard()
                }
                
            }
            .padding()
        }
        .navigationTitle("Risk Yönetimi")
        .task {
            await loadReport()
        }
    }
    
    func loadReport() async {
        let cash = await PaperBroker.shared.cash
        let positions = Array(await PaperBroker.shared.positions.values)
        
        report = RiskManager.shared.generateRiskReport(
            cash: cash,
            positions: positions,
            historicalReturns: [] // Would need historical data
        )
    }
    
    func riskColor(_ level: RiskManager.RiskLevel) -> Color {
        switch level {
        case .low: return .green
        case .moderate: return .yellow
        case .high: return .orange
        case .extreme: return .red
        }
    }
}

struct RiskMetricCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.headline)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(12)
    }
}

struct PositionSizingCard: View {
    @State private var capital = "10000"
    @State private var riskPercent = "2"
    @State private var entryPrice = "150"
    @State private var stopLoss = "145"
    @State private var result: RiskManager.PositionSizeResult?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Pozisyon Hesaplama")
                .font(.headline)
            
            HStack {
                TextField("Sermaye", text: $capital)
                    .textFieldStyle(.roundedBorder)
                TextField("Risk %", text: $riskPercent)
                    .textFieldStyle(.roundedBorder)
            }
            
            HStack {
                TextField("Giriş Fiyatı", text: $entryPrice)
                    .textFieldStyle(.roundedBorder)
                TextField("Stop Loss", text: $stopLoss)
                    .textFieldStyle(.roundedBorder)
            }
            
            Button("Hesapla") {
                calculate()
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(8)
            
            if let result = result {
                Divider()
                
                HStack {
                    VStack(alignment: .leading) {
                        Text("Alınacak: \(String(format: "%.0f", result.shares)) hisse")
                        Text("Tutar: $\(String(format: "%.0f", result.dollarAmount))")
                    }
                    .font(.caption)
                    
                    Spacer()
                    
                    Text("Risk: $\(String(format: "%.0f", result.riskAmount))")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(16)
    }
    
    func calculate() {
        guard let cap = Double(capital),
              let risk = Double(riskPercent),
              let entry = Double(entryPrice),
              let stop = Double(stopLoss) else { return }
        
        result = RiskManager.shared.fixedFractional(
            capital: cap,
            riskPercent: risk,
            entryPrice: entry,
            stopLoss: stop
        )
    }
}
```

---

## Tamamlandı! 🎉

Bu 22 dosya koleksiyonu, Argus Trading System'i sıfırdan inşa etmek için gereken tüm prompt'ları içerir.

**Başlangıç sırası:**

1. `17_models.md` → Data modelleri
2. `11_heimdall.md` → Yahoo Finance provider
3. `02_orion.md` → Teknik analiz
4. `01_atlas.md` → Fundamental analiz
5. `12_argus.md` → Decision engine
6. `18_integration.md` → Birleştirme

İyi kodlamalar! 🚀
