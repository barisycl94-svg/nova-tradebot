# 👁️ ARGUS - Decision Engine

## Konsept

Argus, yüz gözlü devdir. Bu modül, tüm diğer modüllerin skorlarını birleştirir ve nihai karar verir.

## Prompt

> Bana bir iOS SwiftUI uygulaması için karar motoru yaz:
>
> 1. Tüm modül skorlarını al (Atlas, Orion, Aether, vb.)
> 2. Core (yatırım) ve Pulse (trading) skorları hesapla
> 3. Nihai alım/satım sinyali üret
> 4. Chiron'dan gelen dinamik ağırlıkları kullan

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Argus Decision Engine
class ArgusDecisionEngine {
    static let shared = ArgusDecisionEngine()
    
    private init() {}
    
    // MARK: - Input Model
    
    struct ModuleInputs {
        let atlasScore: Double?
        let orionScore: Double?
        let aetherScore: Double?
        let phoenixScore: Double?
        let hermesScore: Double?
        let demeterScore: Double?
        let athenaScore: Double?
        let cronosScore: Double?
        let titanScore: Double? // For ETFs
        
        let symbol: String
        let isETF: Bool
    }
    
    // MARK: - Output Model
    
    struct ArgusDecision {
        let coreScore: Double      // 0-100, investment score
        let pulseScore: Double     // 0-100, trading score
        let coreSignal: Signal
        let pulseSignal: Signal
        let confidence: Double     // 0-100
        let explanation: String
        let weights: WeightsUsed
    }
    
    struct WeightsUsed {
        let core: [String: Double]
        let pulse: [String: Double]
    }
    
    enum Signal: String {
        case strongBuy = "Güçlü Al"
        case buy = "Al"
        case hold = "Tut"
        case sell = "Sat"
        case strongSell = "Güçlü Sat"
        
        var color: String {
            switch self {
            case .strongBuy, .buy: return "green"
            case .hold: return "gray"
            case .sell, .strongSell: return "red"
            }
        }
    }
    
    // MARK: - Main Decision Logic
    
    func makeDecision(inputs: ModuleInputs) -> ArgusDecision {
        // Get weights from Chiron
        let context = buildChironContext(inputs: inputs)
        let chironResult = ChironRegimeEngine.shared.evaluate(context: context)
        
        // Calculate Core Score (Investment - Long Term)
        let coreScore = calculateCoreScore(
            inputs: inputs,
            weights: chironResult.coreWeights
        )
        
        // Calculate Pulse Score (Trading - Short Term)
        let pulseScore = calculatePulseScore(
            inputs: inputs,
            weights: chironResult.pulseWeights
        )
        
        // Determine signals
        let coreSignal = getSignal(score: coreScore)
        let pulseSignal = getSignal(score: pulseScore)
        
        // Confidence based on data availability
        let confidence = calculateConfidence(inputs: inputs)
        
        // Generate explanation
        let explanation = generateExplanation(
            inputs: inputs,
            coreScore: coreScore,
            pulseScore: pulseScore,
            regime: chironResult.regime
        )
        
        return ArgusDecision(
            coreScore: coreScore,
            pulseScore: pulseScore,
            coreSignal: coreSignal,
            pulseSignal: pulseSignal,
            confidence: confidence,
            explanation: explanation,
            weights: WeightsUsed(
                core: weightsToDict(chironResult.coreWeights),
                pulse: weightsToDict(chironResult.pulseWeights)
            )
        )
    }
    
    // MARK: - Core Score Calculation
    
    private func calculateCoreScore(inputs: ModuleInputs, weights: ModuleWeights) -> Double {
        var totalWeight = 0.0
        var weightedSum = 0.0
        
        // Atlas (Fundamentals)
        if let atlas = inputs.atlasScore {
            weightedSum += atlas * weights.atlas
            totalWeight += weights.atlas
        }
        
        // Orion (Technical)
        if let orion = inputs.orionScore {
            weightedSum += orion * weights.orion
            totalWeight += weights.orion
        }
        
        // Aether (Macro)
        if let aether = inputs.aetherScore {
            weightedSum += aether * weights.aether
            totalWeight += weights.aether
        }
        
        // Demeter (Sector)
        if let demeter = inputs.demeterScore, let w = weights.demeter {
            weightedSum += demeter * w
            totalWeight += w
        }
        
        // Athena (Factors)
        if let athena = inputs.athenaScore, let w = weights.athena {
            weightedSum += athena * w
            totalWeight += w
        }
        
        // ETF: Use Titan instead of Atlas
        if inputs.isETF, let titan = inputs.titanScore {
            weightedSum += titan * weights.atlas // Substitute
            totalWeight += weights.atlas
        }
        
        guard totalWeight > 0 else { return 50.0 }
        return weightedSum / totalWeight
    }
    
    // MARK: - Pulse Score Calculation
    
    private func calculatePulseScore(inputs: ModuleInputs, weights: ModuleWeights) -> Double {
        var totalWeight = 0.0
        var weightedSum = 0.0
        
        // Orion (Technical - Primary for Pulse)
        if let orion = inputs.orionScore {
            weightedSum += orion * weights.orion
            totalWeight += weights.orion
        }
        
        // Phoenix (Price Action)
        if let phoenix = inputs.phoenixScore, let w = weights.phoenix {
            weightedSum += phoenix * w
            totalWeight += w
        }
        
        // Aether (Risk Context)
        if let aether = inputs.aetherScore {
            weightedSum += aether * weights.aether
            totalWeight += weights.aether
        }
        
        // Hermes (Sentiment)
        if let hermes = inputs.hermesScore, let w = weights.hermes {
            weightedSum += hermes * w
            totalWeight += w
        }
        
        // Cronos (Timing)
        if let cronos = inputs.cronosScore, let w = weights.cronos {
            weightedSum += cronos * w
            totalWeight += w
        }
        
        guard totalWeight > 0 else { return 50.0 }
        return weightedSum / totalWeight
    }
    
    // MARK: - Signal Determination
    
    private func getSignal(score: Double) -> Signal {
        switch score {
        case 80...100: return .strongBuy
        case 65..<80: return .buy
        case 45..<65: return .hold
        case 30..<45: return .sell
        default: return .strongSell
        }
    }
    
    // MARK: - Confidence
    
    private func calculateConfidence(inputs: ModuleInputs) -> Double {
        var available = 0
        let total = 6 // Main modules
        
        if inputs.atlasScore != nil || inputs.titanScore != nil { available += 1 }
        if inputs.orionScore != nil { available += 1 }
        if inputs.aetherScore != nil { available += 1 }
        if inputs.phoenixScore != nil { available += 1 }
        if inputs.demeterScore != nil { available += 1 }
        if inputs.athenaScore != nil { available += 1 }
        
        return Double(available) / Double(total) * 100
    }
    
    // MARK: - Explanation
    
    private func generateExplanation(
        inputs: ModuleInputs,
        coreScore: Double,
        pulseScore: Double,
        regime: MarketRegime
    ) -> String {
        var parts: [String] = []
        
        // Regime
        parts.append("Piyasa: \(regime.rawValue)")
        
        // Top contributor
        var highest: (String, Double) = ("", 0)
        
        if let atlas = inputs.atlasScore, atlas > highest.1 {
            highest = ("Atlas (Temel)", atlas)
        }
        if let orion = inputs.orionScore, orion > highest.1 {
            highest = ("Orion (Teknik)", orion)
        }
        if let phoenix = inputs.phoenixScore, phoenix > highest.1 {
            highest = ("Phoenix (PA)", phoenix)
        }
        
        if !highest.0.isEmpty {
            parts.append("En güçlü sinyal: \(highest.0) (\(Int(highest.1)))")
        }
        
        // Core vs Pulse divergence
        let divergence = abs(coreScore - pulseScore)
        if divergence > 20 {
            if coreScore > pulseScore {
                parts.append("⚠️ Uzun vade olumlu, kısa vade zayıf")
            } else {
                parts.append("⚠️ Trading fırsatı var, yatırım için bekle")
            }
        }
        
        return parts.joined(separator: " | ")
    }
    
    // MARK: - Helpers
    
    private func buildChironContext(inputs: ModuleInputs) -> ChironContext {
        return ChironContext(
            atlasScore: inputs.atlasScore,
            orionScore: inputs.orionScore,
            aetherScore: inputs.aetherScore,
            demeterScore: inputs.demeterScore,
            phoenixScore: inputs.phoenixScore,
            hermesScore: inputs.hermesScore,
            athenaScore: inputs.athenaScore,
            cronosScore: inputs.cronosScore,
            symbol: inputs.symbol,
            orionTrendStrength: nil,
            chopIndex: nil,
            volatilityHint: nil,
            isHermesAvailable: inputs.hermesScore != nil
        )
    }
    
    private func weightsToDict(_ weights: ModuleWeights) -> [String: Double] {
        return [
            "Atlas": weights.atlas,
            "Orion": weights.orion,
            "Aether": weights.aether,
            "Demeter": weights.demeter ?? 0,
            "Phoenix": weights.phoenix ?? 0,
            "Hermes": weights.hermes ?? 0,
            "Athena": weights.athena ?? 0,
            "Cronos": weights.cronos ?? 0
        ]
    }
}
```

---

## UI Bileşeni

```swift
struct ArgusScoreCard: View {
    let decision: ArgusDecisionEngine.ArgusDecision
    
    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                Image(systemName: "eye.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
                Text("ARGUS")
                    .font(.title2.bold())
                Spacer()
            }
            
            // Two scores side by side
            HStack(spacing: 20) {
                // Core Score
                VStack {
                    Text("CORE")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(Int(decision.coreScore))")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(signalColor(decision.coreSignal))
                    Text(decision.coreSignal.rawValue)
                        .font(.caption.bold())
                        .foregroundColor(signalColor(decision.coreSignal))
                }
                .frame(maxWidth: .infinity)
                
                Divider()
                    .frame(height: 60)
                
                // Pulse Score
                VStack {
                    Text("PULSE")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(Int(decision.pulseScore))")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(signalColor(decision.pulseSignal))
                    Text(decision.pulseSignal.rawValue)
                        .font(.caption.bold())
                        .foregroundColor(signalColor(decision.pulseSignal))
                }
                .frame(maxWidth: .infinity)
            }
            
            // Confidence bar
            HStack {
                Text("Güven")
                    .font(.caption)
                    .foregroundColor(.secondary)
                ProgressView(value: decision.confidence / 100)
                    .tint(.blue)
                Text("\(Int(decision.confidence))%")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Explanation
            Text(decision.explanation)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .shadow(radius: 5)
    }
    
    func signalColor(_ signal: ArgusDecisionEngine.Signal) -> Color {
        switch signal {
        case .strongBuy, .buy: return .green
        case .hold: return .yellow
        case .sell, .strongSell: return .red
        }
    }
}
```

---

## Kullanım

```swift
// Tüm modül skorlarını topla
let inputs = ArgusDecisionEngine.ModuleInputs(
    atlasScore: atlasResult.score,
    orionScore: orionResult.score,
    aetherScore: aetherResult.score,
    phoenixScore: phoenixAdvice.confidence,
    hermesScore: hermesResult.score,
    demeterScore: demeterResult.score,
    athenaScore: athenaResult.score,
    cronosScore: cronosResult.score,
    titanScore: nil,
    symbol: "AAPL",
    isETF: false
)

// Karar al
let decision = ArgusDecisionEngine.shared.makeDecision(inputs: inputs)

print("Core: \(decision.coreSignal.rawValue) (\(Int(decision.coreScore)))")
print("Pulse: \(decision.pulseSignal.rawValue) (\(Int(decision.pulseScore)))")
```

---

*Sonraki: `13_backtest.md` →*
