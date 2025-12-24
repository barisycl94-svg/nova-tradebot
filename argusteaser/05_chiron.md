# 🧠 CHIRON - Meta-Optimizer (LLM Weight Learning)

## Konsept

Chiron, Yunan mitolojisinde yarı insan yarı at olan bilge öğretmendir. Bu modül, diğer tüm modüllerin performansını analiz eder ve ağırlıkları optimize eder.

## Prompt

> Bana bir iOS SwiftUI uygulaması için meta-optimizer motoru yaz. Motor:
>
> 1. Backtest sonuçlarını analiz etsin
> 2. Hangi modülün hangi koşullarda iyi çalıştığını öğrensin
> 3. Modül ağırlıklarını dinamik olarak ayarlasın
> 4. LLM (Groq/GPT) ile ağırlık optimizasyonu yapsın
>
> Öğrenilen ağırlıklar persist edilsin ve zamanla iyileşsin.

---

## Sistem Mimarisi

```
┌─────────────────────────────────────────────────────┐
│                    CHIRON ENGINE                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│   ┌──────────────┐     ┌──────────────┐             │
│   │  Performance │────▶│    LLM       │             │
│   │    Logs      │     │  (Groq API)  │             │
│   └──────────────┘     └──────┬───────┘             │
│                               │                      │
│                               ▼                      │
│                        ┌──────────────┐             │
│                        │   Optimized  │             │
│                        │   Weights    │             │
│                        └──────┬───────┘             │
│                               │                      │
│                               ▼                      │
│   ┌──────────────┐     ┌──────────────┐             │
│   │  UserDefaults│◀────│   Apply to   │             │
│   │  Persistence │     │   Argus      │             │
│   └──────────────┘     └──────────────┘             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 1. Performance Logging

```swift
// MARK: - Performance Log Models

struct PerformanceLog: Codable {
    let symbol: String
    let timeframe: String
    let regime: RegimeInfo
    let dataHealth: Double
    let moduleResults: ModuleResults
    let strategyType: String
    
    struct RegimeInfo: Codable {
        let macro: String      // "RISK_ON", "RISK_OFF"
        let trendState: String // "TRENDING", "RANGING"
    }
    
    struct ModuleResults: Codable {
        let atlas: ModuleStats
        let orion: ModuleStats
        let phoenix: ModuleStats?
        let aether: ModuleStats?
        let hermes: ModuleStats?
    }
    
    struct ModuleStats: Codable {
        let trades: Int
        let winRate: Double
        let avgR: Double
        let pnlPercent: Double
        let maxDrawdown: Double
        
        static let empty = ModuleStats(
            trades: 0, winRate: 0, avgR: 0, pnlPercent: 0, maxDrawdown: 0
        )
    }
}
```

---

## 2. Chiron Regime Engine

```swift
// MARK: - Chiron Regime Engine

enum MarketRegime: String, Codable {
    case neutral = "Neutral"
    case trend = "Trend"
    case chop = "Chop"
    case riskOff = "Risk-Off"
    case newsShock = "News Shock"
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
    
    var normalized: ModuleWeights {
        let sum = atlas + orion + aether + (demeter ?? 0) + (phoenix ?? 0) + 
                  (hermes ?? 0) + (athena ?? 0) + (cronos ?? 0)
        guard sum > 0 else { return self }
        
        return ModuleWeights(
            atlas: atlas / sum,
            orion: orion / sum,
            aether: aether / sum,
            demeter: (demeter ?? 0) / sum,
            phoenix: (phoenix ?? 0) / sum,
            hermes: (hermes ?? 0) / sum,
            athena: (athena ?? 0) / sum,
            cronos: (cronos ?? 0) / sum
        )
    }
}

class ChironRegimeEngine {
    static let shared = ChironRegimeEngine()
    
    private var dynamicConfig: ChironOptimizationOutput?
    private let persistenceKey = "chiron_learned_weights"
    
    private init() {
        loadFromDisk()
    }
    
    func loadDynamicWeights(_ config: ChironOptimizationOutput) {
        self.dynamicConfig = config
        saveToDisk()
    }
    
    private func saveToDisk() {
        guard let config = dynamicConfig else { return }
        if let data = try? JSONEncoder().encode(config) {
            UserDefaults.standard.set(data, forKey: persistenceKey)
        }
    }
    
    private func loadFromDisk() {
        if let data = UserDefaults.standard.data(forKey: persistenceKey),
           let config = try? JSONDecoder().decode(ChironOptimizationOutput.self, from: data) {
            self.dynamicConfig = config
            print("💾 Chiron: Öğrenilmiş ağırlıklar yüklendi.")
        }
    }
    
    func evaluate(context: ChironContext) -> ChironResult {
        let regime = detectRegime(context: context)
        var weights = getBaseWeights(for: regime)
        
        // Apply learned adjustments
        if let dynamic = dynamicConfig {
            weights = blend(base: weights, learned: dynamic, factor: 0.6)
        }
        
        return ChironResult(
            regime: regime,
            coreWeights: weights.core.normalized,
            pulseWeights: weights.pulse.normalized,
            learningNotes: dynamicConfig?.learningNotes
        )
    }
    
    private func detectRegime(context: ChironContext) -> MarketRegime {
        let orion = context.orionScore ?? 50
        let aether = context.aetherScore ?? 50
        let chop = context.chopIndex ?? 50
        
        if aether < 40 { return .riskOff }
        if orion >= 60 && chop < 45 { return .trend }
        if chop > 60 { return .chop }
        
        return .neutral
    }
    
    private func getBaseWeights(for regime: MarketRegime) -> (core: ModuleWeights, pulse: ModuleWeights) {
        switch regime {
        case .trend:
            return (
                core: ModuleWeights(atlas: 0.20, orion: 0.25, aether: 0.20, demeter: 0.15, phoenix: 0.10, hermes: 0.05, athena: 0.05, cronos: 0.0),
                pulse: ModuleWeights(atlas: 0.10, orion: 0.35, aether: 0.15, demeter: 0.10, phoenix: 0.20, hermes: 0.05, athena: 0.05, cronos: 0.0)
            )
        case .chop:
            return (
                core: ModuleWeights(atlas: 0.30, orion: 0.15, aether: 0.25, demeter: 0.15, phoenix: 0.05, hermes: 0.05, athena: 0.05, cronos: 0.0),
                pulse: ModuleWeights(atlas: 0.20, orion: 0.20, aether: 0.20, demeter: 0.15, phoenix: 0.15, hermes: 0.05, athena: 0.05, cronos: 0.0)
            )
        case .riskOff:
            return (
                core: ModuleWeights(atlas: 0.35, orion: 0.10, aether: 0.30, demeter: 0.15, phoenix: 0.0, hermes: 0.05, athena: 0.05, cronos: 0.0),
                pulse: ModuleWeights(atlas: 0.25, orion: 0.15, aether: 0.30, demeter: 0.15, phoenix: 0.05, hermes: 0.05, athena: 0.05, cronos: 0.0)
            )
        default:
            return (
                core: ModuleWeights(atlas: 0.25, orion: 0.20, aether: 0.20, demeter: 0.15, phoenix: 0.05, hermes: 0.05, athena: 0.10, cronos: 0.0),
                pulse: ModuleWeights(atlas: 0.15, orion: 0.25, aether: 0.20, demeter: 0.10, phoenix: 0.15, hermes: 0.10, athena: 0.05, cronos: 0.0)
            )
        }
    }
}
```

---

## 3. LLM Optimization Service

```swift
// MARK: - Chiron Optimization Service

struct ChironOptimizationInput: Codable {
    let globalSettings: GlobalSettings
    let performanceLogs: [PerformanceLog]
    
    struct GlobalSettings: Codable {
        let currentArgusWeights: ArgusWeights
        let currentOrionWeights: OrionWeights
        let safeguards: Safeguards
    }
    
    struct ArgusWeights: Codable {
        let core: ModuleWeights
        let pulse: ModuleWeights
    }
    
    struct OrionWeights: Codable {
        let trend: Double
        let momentum: Double
        let relStrength: Double
        let volatility: Double
        let pullback: Double
        let riskReward: Double
    }
    
    struct Safeguards: Codable {
        let minTradesForLearning: Int
        let maxWeightChangePerStep: Double
        let minModuleWeightCore: Double
        let minModuleWeightPulse: Double
    }
}

struct ChironOptimizationOutput: Codable {
    let newArgusWeights: ChironOptimizationInput.ArgusWeights
    let newOrionWeights: ChironOptimizationInput.OrionWeights
    let perSymbolOverrides: [SymbolOverride]?
    let learningNotes: [String]
    
    struct SymbolOverride: Codable {
        let symbol: String
        let orionWeight: Double?
        let atlasWeight: Double?
    }
}

final class ChironOptimizationService {
    static let shared = ChironOptimizationService()
    
    func optimize(input: ChironOptimizationInput) async throws -> ChironOptimizationOutput {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        
        let inputData = try encoder.encode(input)
        guard let inputString = String(data: inputData, encoding: .utf8) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        // Call LLM (Groq example)
        let messages = [
            ChatMessage(role: "system", content: ChironSystemPrompt.text),
            ChatMessage(role: "user", content: """
            Backtest ve performans verilerini analiz et.
            Optimized ağırlıkları JSON olarak döndür.
            
            \(inputString)
            """)
        ]
        
        let result: ChironOptimizationOutput = try await GroqClient.shared.generateJSON(
            messages: messages,
            maxTokens: 4096
        )
        
        return result
    }
}
```

---

## 4. Chiron System Prompt

```swift
struct ChironSystemPrompt {
    static let text = """
    Sen CHIRON ENGINE'sin - Argus Trading System'in meta-optimizer'ı.
    
    Görevin:
    - Backtest ve canlı performans loglarını analiz et
    - Hangi modülün hangi koşullarda iyi çalıştığını öğren
    - Ağırlıkları YAVAŞ ve GÜVENLİ şekilde ayarla
    - Her zaman JSON formatında yanıt ver
    
    KURALLAR:
    1. Minimum 5 trade olmadan ağırlık değiştirme
    2. Tek adımda max %10 ağırlık değişikliği
    3. Atlas ve Aether hiçbir zaman %5'in altına düşmesin
    4. learningNotes TÜRKÇE olmalı
    
    ÇIKTI FORMATI:
    {
      "newArgusWeights": { "core": {...}, "pulse": {...} },
      "newOrionWeights": { "trend": 0.3, ... },
      "perSymbolOverrides": [],
      "learningNotes": ["Açıklama 1", "Açıklama 2"]
    }
    """
}
```

---

## 5. Backtest to Chiron Integration

```swift
extension ArgusBacktestEngine {
    
    func feedBacktestToChiron(symbol: String, result: BacktestResult) async {
        print("🧠 Chiron: Backtest analiz ediliyor - \(symbol)")
        
        let metrics = calculateMetrics(trades: result.trades)
        
        let log = PerformanceLog(
            symbol: symbol,
            timeframe: "D1",
            regime: PerformanceLog.RegimeInfo(macro: "MIXED", trendState: "TRENDING"),
            dataHealth: 100.0,
            moduleResults: PerformanceLog.ModuleResults(
                atlas: .empty,
                orion: metrics,
                phoenix: nil,
                aether: nil,
                hermes: nil
            ),
            strategyType: result.config.strategy.rawValue
        )
        
        let input = ChironOptimizationInput(
            globalSettings: ChironOptimizationInput.GlobalSettings(
                currentArgusWeights: /* current */,
                currentOrionWeights: /* current */,
                safeguards: ChironOptimizationInput.Safeguards(
                    minTradesForLearning: 5,
                    maxWeightChangePerStep: 0.10,
                    minModuleWeightCore: 0.05,
                    minModuleWeightPulse: 0.05
                )
            ),
            performanceLogs: [log]
        )
        
        do {
            let optimized = try await ChironOptimizationService.shared.optimize(input: input)
            
            await MainActor.run {
                ChironRegimeEngine.shared.loadDynamicWeights(optimized)
                print("🧠 Chiron: Optimizasyon uygulandı!")
                for note in optimized.learningNotes {
                    print("   📝 \(note)")
                }
            }
        } catch {
            print("🧠 Chiron Error: \(error)")
        }
    }
    
    private func calculateMetrics(trades: [BacktestTrade]) -> PerformanceLog.ModuleStats {
        guard !trades.isEmpty else { return .empty }
        
        let wins = trades.filter { $0.pnl > 0 }.count
        let winRate = Double(wins) / Double(trades.count) * 100
        
        return PerformanceLog.ModuleStats(
            trades: trades.count,
            winRate: winRate,
            avgR: 1.0, // Simplified
            pnlPercent: trades.reduce(0) { $0 + $1.pnlPercent },
            maxDrawdown: 0
        )
    }
}
```

---

## Kullanım

```swift
// Backtest tamamlandığında
let result = try await ArgusBacktestEngine.shared.runDetailedBacktest(/*...*/)

// Chiron'a gönder
await ArgusBacktestEngine.shared.feedBacktestToChiron(symbol: "AAPL", result: result)

// Chiron'un öğrendiği ağırlıkları kullan
let decision = ChironRegimeEngine.shared.evaluate(context: currentContext)
print("Regime: \(decision.regime)")
print("Orion Weight: \(decision.pulseWeights.orion)")
```

---

*Sonraki: `06_hermes.md` →*
