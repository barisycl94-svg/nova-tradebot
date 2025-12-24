# 📊 BACKTEST ENGINE

## Prompt

> Bana bir iOS SwiftUI uygulaması için backtest motoru yaz:
>
> 1. Tarihi verilerle strateji test et
> 2. Trade listesi, P&L, drawdown hesapla
> 3. Orion V3 stratejisini destekle
> 4. Trailing stop, profit taking içersin

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Models

struct BacktestConfig {
    let symbol: String
    let strategy: StrategyType
    let initialCapital: Double
    let startDate: Date?
    let endDate: Date?
    let positionSizePercent: Double
    
    enum StrategyType: String, CaseIterable {
        case orionV2 = "Orion V3"
        case phoenixChannel = "Phoenix Channel"
        case buyAndHold = "Buy & Hold"
    }
    
    static let `default` = BacktestConfig(
        symbol: "AAPL",
        strategy: .orionV2,
        initialCapital: 10000,
        startDate: nil,
        endDate: nil,
        positionSizePercent: 100
    )
}

struct BacktestTrade {
    let entryDate: Date
    let entryPrice: Double
    let exitDate: Date?
    let exitPrice: Double?
    let shares: Double
    let pnl: Double
    let pnlPercent: Double
    let reason: String
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

// MARK: - Backtest Engine

class ArgusBacktestEngine {
    static let shared = ArgusBacktestEngine()
    
    private init() {}
    
    enum TradeAction {
        case buy
        case sell(Double) // Fraction to sell (0.5 = half, 1.0 = all)
        case hold
    }
    
    // MARK: - Run Backtest
    
    func runBacktest(
        symbol: String,
        config: BacktestConfig,
        candles: [Candle]
    ) async throws -> BacktestResult {
        
        let sorted = candles.sorted { $0.date < $1.date }
        
        var capital = config.initialCapital
        var shares: Double = 0
        var trades: [BacktestTrade] = []
        var equityCurve: [(Date, Double)] = []
        var activeTrade: (entry: Date, price: Double, shares: Double)? = nil
        var peakCapital = capital
        var maxDrawdown = 0.0
        
        let startIndex = 50 // Need history for indicators
        
        for i in startIndex..<sorted.count {
            let slice = Array(sorted[0...i])
            let bar = sorted[i]
            let price = bar.close
            
            // Calculate current equity
            let equity = capital + (shares * price)
            equityCurve.append((bar.date, equity))
            
            // Track drawdown
            if equity > peakCapital {
                peakCapital = equity
            }
            let drawdown = (peakCapital - equity) / peakCapital * 100
            if drawdown > maxDrawdown {
                maxDrawdown = drawdown
            }
            
            // Get trading signal based on strategy
            let (action, reason) = evaluateStrategy(
                config: config,
                candles: slice,
                shares: shares,
                entryPrice: activeTrade?.price
            )
            
            // Execute action
            switch action {
            case .buy:
                if shares == 0 {
                    let positionSize = capital * (config.positionSizePercent / 100)
                    let newShares = positionSize / price
                    shares = newShares
                    capital -= positionSize
                    activeTrade = (bar.date, price, newShares)
                }
                
            case .sell(let fraction):
                if shares > 0, let entry = activeTrade {
                    let sellShares = shares * fraction
                    let proceeds = sellShares * price
                    let pnl = (price - entry.price) * sellShares
                    let pnlPct = (price - entry.price) / entry.price * 100
                    
                    trades.append(BacktestTrade(
                        entryDate: entry.entry,
                        entryPrice: entry.price,
                        exitDate: bar.date,
                        exitPrice: price,
                        shares: sellShares,
                        pnl: pnl,
                        pnlPercent: pnlPct,
                        reason: reason
                    ))
                    
                    shares -= sellShares
                    capital += proceeds
                    
                    if shares < 0.01 {
                        shares = 0
                        activeTrade = nil
                    }
                }
                
            case .hold:
                break
            }
        }
        
        // Close any open position at end
        if shares > 0, let entry = activeTrade, let lastBar = sorted.last {
            let proceeds = shares * lastBar.close
            let pnl = (lastBar.close - entry.price) * shares
            
            trades.append(BacktestTrade(
                entryDate: entry.entry,
                entryPrice: entry.price,
                exitDate: lastBar.date,
                exitPrice: lastBar.close,
                shares: shares,
                pnl: pnl,
                pnlPercent: (lastBar.close - entry.price) / entry.price * 100,
                reason: "Test Sonu"
            ))
            
            capital += proceeds
            shares = 0
        }
        
        // Calculate metrics
        let totalReturn = (capital - config.initialCapital) / config.initialCapital * 100
        let wins = trades.filter { $0.pnl > 0 }.count
        let winRate = trades.isEmpty ? 0 : Double(wins) / Double(trades.count) * 100
        
        // Simplified Sharpe
        let returns = zip(equityCurve.dropFirst(), equityCurve).map {
            ($0.1 - $1.1) / $1.1
        }
        let avgReturn = returns.reduce(0, +) / Double(returns.count)
        let stdDev = sqrt(returns.map { pow($0 - avgReturn, 2) }.reduce(0, +) / Double(returns.count))
        let sharpe = stdDev > 0 ? (avgReturn / stdDev) * sqrt(252) : 0
        
        return BacktestResult(
            config: config,
            trades: trades,
            finalCapital: capital,
            totalReturn: totalReturn,
            maxDrawdown: maxDrawdown,
            winRate: winRate,
            sharpeRatio: sharpe,
            equityCurve: equityCurve
        )
    }
    
    // MARK: - Strategy Evaluation
    
    private func evaluateStrategy(
        config: BacktestConfig,
        candles: [Candle],
        shares: Double,
        entryPrice: Double?
    ) -> (TradeAction, String) {
        
        switch config.strategy {
        case .orionV2:
            return evaluateOrionV3(candles: candles, shares: shares, entryPrice: entryPrice)
            
        case .phoenixChannel:
            return evaluatePhoenix(candles: candles, shares: shares, entryPrice: entryPrice)
            
        case .buyAndHold:
            if shares == 0 {
                return (.buy, "Buy & Hold")
            }
            return (.hold, "")
        }
    }
    
    // MARK: - Orion V3 Strategy
    
    private func evaluateOrionV3(
        candles: [Candle],
        shares: Double,
        entryPrice: Double?
    ) -> (TradeAction, String) {
        
        guard let orionResult = OrionAnalysisService.shared.calculateOrionScore(
            symbol: "",
            candles: candles
        ) else {
            return (.hold, "")
        }
        
        let score = orionResult.score
        let price = candles.last?.close ?? 0
        
        // Trend indicators
        let recentSlice = Array(candles.suffix(20))
        let recentHigh = recentSlice.map(\.high).max() ?? price
        let recentLow = recentSlice.map(\.low).min() ?? price
        let trendRange = recentHigh - recentLow
        let pullbackDepth = trendRange > 0 ? (recentHigh - price) / trendRange : 0
        let isTrending = price > (recentLow + trendRange * 0.5)
        
        // Higher lows check
        let last5Lows = Array(candles.suffix(5)).map(\.low)
        let prev5Lows = Array(candles.dropLast(5).suffix(5)).map(\.low)
        let isHigherLows = (last5Lows.min() ?? 0) > (prev5Lows.min() ?? 0)
        
        // ENTRY CONDITIONS
        if shares == 0 {
            if score >= 55 {
                return (.buy, "Orion Güçlü (\(Int(score)))")
            }
            else if score >= 48 && isTrending && isHigherLows {
                return (.buy, "Trend + Momentum")
            }
            else if score >= 45 && isTrending && pullbackDepth > 0.25 && pullbackDepth < 0.65 {
                return (.buy, "Pullback Entry")
            }
        }
        
        // EXIT CONDITIONS
        else if shares > 0, let entry = entryPrice {
            let pnlPct = (price - entry) / entry * 100
            let highSinceEntry = candles.suffix(20).map(\.high).max() ?? price
            let drawdownFromHigh = (highSinceEntry - price) / highSinceEntry * 100
            
            // Hard stop
            if pnlPct < -8.0 {
                return (.sell(1.0), "Stop Loss (-8%)")
            }
            // Score crash
            if score < 30 {
                return (.sell(1.0), "Trend Bitti")
            }
            // Profit taking
            if pnlPct > 25 {
                return (.sell(0.70), "Kâr Al (+25%)")
            }
            // Trailing stop
            if pnlPct > 10 && drawdownFromHigh > 5.0 {
                return (.sell(1.0), "Trailing Stop")
            }
            // Protect profits
            if pnlPct > 8 && score < 45 {
                return (.sell(1.0), "Kâr Koru")
            }
            // Trend break with profit
            if !isTrending && pnlPct > 3 {
                return (.sell(1.0), "Trend Kırıldı")
            }
        }
        
        return (.hold, "")
    }
    
    // MARK: - Phoenix Strategy
    
    private func evaluatePhoenix(
        candles: [Candle],
        shares: Double,
        entryPrice: Double?
    ) -> (TradeAction, String) {
        
        let advice = PhoenixLogic.analyze(
            candles: candles,
            symbol: ""
        )
        
        let confidence = advice.confidence
        let price = candles.last?.close ?? 0
        
        // Entry
        if shares == 0 {
            if confidence >= 65 {
                return (.buy, "Phoenix Signal")
            }
        }
        
        // Exit
        else if shares > 0, let entry = entryPrice {
            let pnlPct = (price - entry) / entry * 100
            
            // Target hit
            if !advice.targets.isEmpty && price >= advice.targets[0] {
                return (.sell(0.5), "T1 Hedef")
            }
            
            // Stop loss
            if pnlPct < -5 {
                return (.sell(1.0), "Stop")
            }
            
            // Confidence drop
            if confidence < 40 && pnlPct > 2 {
                return (.sell(1.0), "Sinyal Zayıfladı")
            }
        }
        
        return (.hold, "")
    }
}
```

---

## Kullanım

```swift
let candles = try await YahooFinanceProvider.shared.fetchCandles(symbol: "AAPL", range: "2y")

let config = BacktestConfig(
    symbol: "AAPL",
    strategy: .orionV2,
    initialCapital: 10000,
    startDate: nil,
    endDate: nil,
    positionSizePercent: 100
)

let result = try await ArgusBacktestEngine.shared.runBacktest(
    symbol: "AAPL",
    config: config,
    candles: candles
)

print("Total Return: \(String(format: "%.2f", result.totalReturn))%")
print("Win Rate: \(String(format: "%.1f", result.winRate))%")
print("Max Drawdown: \(String(format: "%.2f", result.maxDrawdown))%")
print("Trades: \(result.trades.count)")
```

---

*Sonraki: `14_design_system.md` →*
