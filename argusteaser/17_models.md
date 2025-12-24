# 📦 DATA MODELS

## Temel Modeller

```swift
import Foundation

// MARK: - Candle Model

struct Candle: Identifiable, Codable, Equatable {
    var id: Date { date }
    let date: Date
    let open: Double
    let high: Double
    let low: Double
    let close: Double
    let volume: Int
    
    var isBullish: Bool { close >= open }
    var bodySize: Double { abs(close - open) }
    var range: Double { high - low }
}

// MARK: - Quote Model

struct Quote: Codable {
    let symbol: String
    let price: Double
    let change: Double
    let changePercent: Double
    let open: Double?
    let high: Double?
    let low: Double?
    let volume: Int?
    let marketCap: Double?
    let timestamp: Date?
    
    var isPositive: Bool { change >= 0 }
}

// MARK: - Fundamentals Model

struct Fundamentals: Codable {
    // Profitability
    var roe: Double?              // Return on Equity
    var profitMargin: Double?     // Net Margin
    var operatingMargin: Double?
    var grossMargin: Double?
    
    // Valuation
    var peRatio: Double?          // Price to Earnings
    var priceToBook: Double?      // P/B
    var evToEbitda: Double?       // EV/EBITDA
    var priceToSales: Double?     // P/S
    
    // Growth
    var revenueGrowth: Double?    // YoY Revenue Growth
    var earningsGrowth: Double?   // YoY Earnings Growth
    var pegRatio: Double?         // P/E to Growth
    
    // Financial Health
    var debtToEquity: Double?     // D/E Ratio
    var currentRatio: Double?     // Current Assets / Current Liabilities
    var quickRatio: Double?
    var interestCoverage: Double?
    
    // Cash
    var freeCashFlow: Double?
    var freeCashFlowMargin: Double?
    var cashToAssets: Double?
    var payoutRatio: Double?      // Dividend / EPS
    
    // Dividend
    var dividendYield: Double?
    var dividendRate: Double?
}

// MARK: - Orion Models

struct OrionScoreResult {
    let symbol: String
    let score: Double
    let components: OrionComponentScores
    let verdict: String
    let generatedAt: Date
}

struct OrionComponentScores {
    let structure: Double   // Max 30 (V3)
    let trend: Double       // Max 30 (V3)
    let momentum: Double    // Max 25
    let pattern: Double     // Max 10
    let volatility: Double  // Max 5
    
    // Descriptions
    let structureDesc: String
    let trendDesc: String
    let momentumDesc: String
    let patternDesc: String
    let volatilityDesc: String
    
    // Legacy fields
    let relativeStrength: Double?
    let isRsAvailable: Bool
}

// MARK: - Phoenix Models

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
}

// MARK: - Aether Models

struct AetherResult {
    let score: Double
    let regime: MarketRegime
    let vixLevel: Double?
    let marketTrend: String
    let sectorRotation: String
    let details: [String]
}

enum MarketRegime: String, Codable {
    case riskOn = "Risk-On"
    case riskOff = "Risk-Off"
    case neutral = "Nötr"
    case caution = "Dikkat"
}

// MARK: - Argus Decision Models

struct ArgusDecision {
    let coreScore: Double
    let pulseScore: Double
    let coreSignal: Signal
    let pulseSignal: Signal
    let confidence: Double
    let explanation: String
    let moduleScores: [String: Double]
}

enum Signal: String, CaseIterable {
    case strongBuy = "Güçlü Al"
    case buy = "Al"
    case hold = "Tut"
    case sell = "Sat"
    case strongSell = "Güçlü Sat"
    
    var color: String {
        switch self {
        case .strongBuy, .buy: return "green"
        case .hold: return "yellow"
        case .sell, .strongSell: return "red"
        }
    }
}

// MARK: - Backtest Models

struct BacktestConfig {
    let symbol: String
    let strategy: StrategyType
    let initialCapital: Double
    let startDate: Date?
    let endDate: Date?
    let positionSizePercent: Double
    
    enum StrategyType: String, CaseIterable {
        case orionV3 = "Orion V3"
        case phoenixChannel = "Phoenix Channel"
        case buyAndHold = "Buy & Hold"
    }
}

struct BacktestTrade: Identifiable {
    let id = UUID()
    let entryDate: Date
    let entryPrice: Double
    let exitDate: Date?
    let exitPrice: Double?
    let shares: Double
    let pnl: Double
    let pnlPercent: Double
    let reason: String
    
    var isWin: Bool { pnl > 0 }
}

struct BacktestResult {
    let config: BacktestConfig
    let trades: [BacktestTrade]
    let finalCapital: Double
    let totalReturn: Double
    let maxDrawdown: Double
    let winRate: Double
    let sharpeRatio: Double
    let equityCurve: [(Date, Double)]
}

// MARK: - Chiron Models

struct ChironContext {
    let atlasScore: Double?
    let orionScore: Double?
    let aetherScore: Double?
    let phoenixScore: Double?
    let hermesScore: Double?
    let demeterScore: Double?
    let athenaScore: Double?
    let cronosScore: Double?
    let symbol: String
    let orionTrendStrength: Double?
    let chopIndex: Double?
    let volatilityHint: Double?
    let isHermesAvailable: Bool
}

struct ModuleWeights: Codable {
    let atlas: Double
    let orion: Double
    let aether: Double
    let demeter: Double?
    let phoenix: Double?
    let hermes: Double?
    let athena: Double?
    let cronos: Double?
}

// MARK: - Watchlist Models

struct WatchlistItem: Identifiable, Codable {
    let id: UUID
    let symbol: String
    let name: String
    var notes: String?
    let addedAt: Date
}

// MARK: - Alert Models

struct PriceAlert: Identifiable, Codable {
    let id: UUID
    let symbol: String
    let targetPrice: Double
    let alertType: AlertType
    let isActive: Bool
    let createdAt: Date
    
    enum AlertType: String, Codable {
        case above = "Üstüne Çıkarsa"
        case below = "Altına Düşerse"
    }
}
```

---

*Sonraki: `18_integration.md` →*
