# 🔱 TITAN - ETF/Non-Equity Lite Engine

## Konsept

Titan, devasa ilkel güçtür. Bu modül, ETF ve hisse dışı varlıklar için sadeleştirilmiş bir analiz sağlar (fundamental analiz olmadan).

## Prompt

> Bana bir iOS SwiftUI uygulaması için ETF/Non-equity analiz motoru yaz:
>
> 1. Sadece teknik ve makro analiz (fundamental yok)
> 2. Trend analizi
> 3. Volatilite analizi
> 4. Relative strength vs benchmark
>
> Yahoo Finance verileriyle çalışsın.

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Titan Lite Engine
class TitanEngine {
    static let shared = TitanEngine()
    
    private init() {}
    
    struct TitanResult {
        let score: Double
        let trendScore: Double
        let volatilityScore: Double
        let rsScore: Double
        let assetType: AssetType
        let verdict: String
    }
    
    enum AssetType: String {
        case etf = "ETF"
        case crypto = "Kripto"
        case commodity = "Emtia"
        case bond = "Tahvil"
        case unknown = "Bilinmiyor"
    }
    
    // MARK: - Detect Asset Type
    
    func detectAssetType(symbol: String) -> AssetType {
        let upper = symbol.uppercased()
        
        // Crypto patterns
        if upper.contains("-USD") || upper.contains("-BTC") ||
           ["BTC", "ETH", "SOL", "ADA", "XRP"].contains(where: { upper.starts(with: $0) }) {
            return .crypto
        }
        
        // Common ETFs
        let etfPatterns = ["SPY", "QQQ", "IWM", "DIA", "VOO", "VTI", "XL", "IY"]
        if etfPatterns.contains(where: { upper.starts(with: $0) }) {
            return .etf
        }
        
        // Commodities
        let commodities = ["GLD", "SLV", "USO", "UNG", "CORN", "WEAT"]
        if commodities.contains(upper) {
            return .commodity
        }
        
        // Bonds
        let bonds = ["TLT", "IEF", "SHY", "BND", "LQD", "HYG"]
        if bonds.contains(upper) {
            return .bond
        }
        
        return .etf // Default for most non-stocks
    }
    
    // MARK: - Analyze
    
    func analyze(symbol: String, candles: [Candle]) async throws -> TitanResult {
        guard candles.count >= 50 else {
            throw URLError(.badServerResponse)
        }
        
        let assetType = detectAssetType(symbol: symbol)
        
        // 1. TREND ANALYSIS (40%)
        let trendScore = calculateTrend(candles: candles)
        
        // 2. VOLATILITY ANALYSIS (30%)
        let volatilityScore = calculateVolatility(candles: candles, assetType: assetType)
        
        // 3. RELATIVE STRENGTH (30%)
        let rsScore = try await calculateRelativeStrength(symbol: symbol, candles: candles)
        
        // Weighted total
        let totalScore = (trendScore * 0.40) + 
                         (volatilityScore * 0.30) + 
                         (rsScore * 0.30)
        
        return TitanResult(
            score: totalScore,
            trendScore: trendScore,
            volatilityScore: volatilityScore,
            rsScore: rsScore,
            assetType: assetType,
            verdict: getVerdict(score: totalScore)
        )
    }
    
    // MARK: - Trend Analysis
    
    private func calculateTrend(candles: [Candle]) -> Double {
        let closes = candles.map { $0.close }
        let current = closes.last ?? 0
        
        guard let sma20 = sma(closes, 20),
              let sma50 = sma(closes, 50) else {
            return 50.0
        }
        
        var score = 50.0
        
        // Price vs SMAs
        if current > sma20 && current > sma50 {
            score += 25
        } else if current > sma20 {
            score += 10
        } else if current < sma50 {
            score -= 20
        }
        
        // SMA alignment
        if sma20 > sma50 {
            score += 15
        } else {
            score -= 15
        }
        
        // Recent momentum
        let first = closes[closes.count - 20]
        let change = (current - first) / first * 100
        
        if change > 5 { score += 10 }
        else if change < -5 { score -= 10 }
        
        return min(100, max(0, score))
    }
    
    // MARK: - Volatility Analysis
    
    private func calculateVolatility(candles: [Candle], assetType: AssetType) -> Double {
        let closes = candles.map { $0.close }
        let returns = zip(closes.dropFirst(), closes).map { ($0 - $1) / $1 * 100 }
        
        let mean = returns.reduce(0, +) / Double(returns.count)
        let variance = returns.map { pow($0 - mean, 2) }.reduce(0, +) / Double(returns.count)
        let stdDev = sqrt(variance)
        
        // Annualized volatility
        let annualVol = stdDev * sqrt(252)
        
        // Optimal ranges vary by asset type
        var score = 50.0
        
        switch assetType {
        case .crypto:
            // Crypto is expected to be volatile
            if annualVol < 40 { score += 20 }
            else if annualVol < 80 { score += 10 }
            else { score -= 10 }
            
        case .bond:
            // Bonds should be low vol
            if annualVol < 10 { score += 20 }
            else if annualVol < 20 { score += 10 }
            else { score -= 20 }
            
        default:
            // ETFs/Commodities
            if annualVol < 15 { score += 15 }
            else if annualVol < 25 { score += 10 }
            else if annualVol < 40 { score += 0 }
            else { score -= 15 }
        }
        
        return min(100, max(0, score))
    }
    
    // MARK: - Relative Strength
    
    private func calculateRelativeStrength(symbol: String, candles: [Candle]) async throws -> Double {
        // Compare to SPY
        let spyCandles = try await YahooFinanceProvider.shared.fetchCandles(
            symbol: "SPY",
            range: "3mo"
        )
        
        guard spyCandles.count >= 20, candles.count >= 20 else {
            return 50.0
        }
        
        let assetReturn = (candles.last!.close - candles.first!.close) / candles.first!.close * 100
        let spyReturn = (spyCandles.last!.close - spyCandles.first!.close) / spyCandles.first!.close * 100
        
        let delta = assetReturn - spyReturn
        
        var score = 50.0
        
        if delta > 10 { score += 30 }
        else if delta > 5 { score += 20 }
        else if delta > 0 { score += 10 }
        else if delta > -5 { score -= 5 }
        else { score -= 20 }
        
        return min(100, max(0, score))
    }
    
    // MARK: - Helpers
    
    private func sma(_ data: [Double], _ period: Int) -> Double? {
        guard data.count >= period else { return nil }
        return data.suffix(period).reduce(0, +) / Double(period)
    }
    
    private func getVerdict(score: Double) -> String {
        switch score {
        case 75...100: return "Güçlü"
        case 55..<75: return "Olumlu"
        case 45..<55: return "Nötr"
        case 25..<45: return "Zayıf"
        default: return "Riskli"
        }
    }
}
```

---

## UI Kullanımı

```swift
// ETF kontrolü
let candles = try await YahooFinanceProvider.shared.fetchCandles(symbol: "QQQ", range: "6mo")
let titanResult = try await TitanEngine.shared.analyze(symbol: "QQQ", candles: candles)

// Atlas kullanma (fundamental yok)
// Titan kullan
if titanResult.assetType == .etf {
    print("Titan Score: \(titanResult.score)")
}
```

---

*Sonraki: `11_heimdall.md` →*
