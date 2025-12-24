# 🌾 DEMETER - Sektör Analizi

## Konsept

Demeter, hasat ve bereket tanrıçasıdır. Bu modül, sektör rotasyonunu ve akış analizini yapar.

## Prompt

> Bana bir iOS SwiftUI uygulaması için sektör rotasyonu analiz motoru yaz:
>
> 1. US sektör ETF'lerini karşılaştır (XLK, XLF, XLE, vb.)
> 2. Sektör momentumlarını hesapla
> 3. Aktif hisse sektörün performansıyla karşılaştır
>
> Yahoo Finance verileriyle çalışsın.

---

## Sektör ETF Listesi

| ETF | Sektör |
|-----|--------|
| XLK | Teknoloji |
| XLF | Finans |
| XLE | Enerji |
| XLV | Sağlık |
| XLY | Tüketici (Discretionary) |
| XLP | Tüketici (Staples) |
| XLI | Endüstriyel |
| XLB | Malzeme |
| XLU | Kamu Hizmetleri |
| XLRE | Gayrimenkul |
| XLC | İletişim |

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Demeter Sector Engine
class DemeterEngine {
    static let shared = DemeterEngine()
    
    private init() {}
    
    struct SectorInfo {
        let etf: String
        let name: String
        let performance1M: Double
        let performance3M: Double
        let relativeStrength: Double
    }
    
    struct DemeterResult {
        let score: Double
        let stockSector: String
        let sectorPerformance: Double
        let vsMarket: Double
        let topSectors: [SectorInfo]
        let bottomSectors: [SectorInfo]
        let rotation: RotationType
    }
    
    enum RotationType: String {
        case riskOn = "Risk-On (Ofansif)"
        case riskOff = "Risk-Off (Defansif)"
        case mixed = "Karışık"
    }
    
    private let sectorETFs = [
        ("XLK", "Teknoloji"),
        ("XLF", "Finans"),
        ("XLE", "Enerji"),
        ("XLV", "Sağlık"),
        ("XLY", "Tüketici Disc."),
        ("XLP", "Tüketici Staples"),
        ("XLI", "Endüstriyel"),
        ("XLB", "Malzeme"),
        ("XLU", "Kamu Hizm."),
        ("XLRE", "Gayrimenkul"),
        ("XLC", "İletişim")
    ]
    
    private let defensive = ["XLU", "XLP", "XLV"]
    private let offensive = ["XLK", "XLY", "XLF", "XLB"]
    
    // MARK: - Analyze
    
    func analyze(stockSymbol: String, stockSector: String) async throws -> DemeterResult {
        // Fetch all sector performances
        var sectors: [SectorInfo] = []
        
        for (etf, name) in sectorETFs {
            if let info = try? await fetchSectorPerformance(etf: etf, name: name) {
                sectors.append(info)
            }
        }
        
        // Sort by 1M performance
        sectors.sort { $0.performance1M > $1.performance1M }
        
        let topSectors = Array(sectors.prefix(3))
        let bottomSectors = Array(sectors.suffix(3).reversed())
        
        // Determine rotation type
        let rotation = determineRotation(sectors: sectors)
        
        // Find stock's sector performance
        let sectorPerf = sectors.first { $0.name == stockSector }?.performance1M ?? 0
        
        // Compare to SPY
        let spyPerf = try? await fetchSectorPerformance(etf: "SPY", name: "Market")
        let vsMarket = sectorPerf - (spyPerf?.performance1M ?? 0)
        
        // Calculate score
        var score = 50.0
        
        // Sector outperforming market
        if vsMarket > 3 { score += 20 }
        else if vsMarket > 0 { score += 10 }
        else if vsMarket > -3 { score -= 5 }
        else { score -= 15 }
        
        // Sector in top 3
        if topSectors.contains(where: { $0.name == stockSector }) {
            score += 15
        }
        
        // Rotation alignment
        if rotation == .riskOn && offensive.contains(where: { sectors.first?.etf == $0 }) {
            score += 10
        }
        
        return DemeterResult(
            score: min(100, max(0, score)),
            stockSector: stockSector,
            sectorPerformance: sectorPerf,
            vsMarket: vsMarket,
            topSectors: topSectors,
            bottomSectors: bottomSectors,
            rotation: rotation
        )
    }
    
    private func fetchSectorPerformance(etf: String, name: String) async throws -> SectorInfo {
        let candles = try await YahooFinanceProvider.shared.fetchCandles(
            symbol: etf,
            range: "3mo"
        )
        
        guard candles.count >= 20 else {
            throw URLError(.badServerResponse)
        }
        
        let closes = candles.map { $0.close }
        let current = closes.last ?? 0
        
        // 1M performance (last ~21 trading days)
        let month = closes.count > 21 ? closes[closes.count - 21] : closes.first!
        let perf1M = (current - month) / month * 100
        
        // 3M performance
        let perf3M = (current - closes.first!) / closes.first! * 100
        
        // RS vs SPY (simplified - actual would compare to SPY)
        let rs = perf1M // Placeholder
        
        return SectorInfo(
            etf: etf,
            name: name,
            performance1M: perf1M,
            performance3M: perf3M,
            relativeStrength: rs
        )
    }
    
    private func determineRotation(sectors: [SectorInfo]) -> RotationType {
        let top3 = sectors.prefix(3).map { $0.etf }
        
        let offensiveCount = top3.filter { offensive.contains($0) }.count
        let defensiveCount = top3.filter { defensive.contains($0) }.count
        
        if offensiveCount >= 2 { return .riskOn }
        if defensiveCount >= 2 { return .riskOff }
        return .mixed
    }
}
```

---

## UI Bileşeni

```swift
struct DemeterCard: View {
    let result: DemeterEngine.DemeterResult
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "chart.pie.fill")
                    .foregroundColor(.orange)
                Text("Demeter Sektör")
                    .font(.headline)
                Spacer()
                Text(result.rotation.rawValue)
                    .font(.caption)
            }
            
            // Sector performance
            HStack {
                Text(result.stockSector)
                Spacer()
                Text(String(format: "%+.1f%%", result.sectorPerformance))
                    .foregroundColor(result.sectorPerformance > 0 ? .green : .red)
            }
            
            // vs Market
            HStack {
                Text("vs SPY")
                    .foregroundColor(.secondary)
                Spacer()
                Text(String(format: "%+.1f%%", result.vsMarket))
                    .foregroundColor(result.vsMarket > 0 ? .green : .red)
            }
            
            Divider()
            
            // Top sectors
            Text("En İyi Sektörler")
                .font(.caption)
                .foregroundColor(.secondary)
            
            ForEach(result.topSectors, id: \.etf) { sector in
                HStack {
                    Text(sector.name)
                        .font(.caption2)
                    Spacer()
                    Text(String(format: "%+.1f%%", sector.performance1M))
                        .font(.caption2)
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
}
```

---

*Sonraki: `08_cronos.md` →*
