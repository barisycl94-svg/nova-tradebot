# 🔗 INTEGRATION GUIDE

## Adım Adım Entegrasyon

### Adım 1: Proje Yapısı

```
Algo-Trading/
├── Models/
│   ├── Candle.swift           (17_models.md)
│   ├── Quote.swift
│   ├── Fundamentals.swift
│   ├── OrionModels.swift
│   ├── PhoenixModels.swift
│   ├── ArgusModels.swift
│   └── BacktestModels.swift
│
├── Services/
│   ├── Providers/
│   │   └── YahooFinanceProvider.swift  (11_heimdall.md)
│   │
│   ├── AtlasEngine.swift       (01_atlas.md)
│   ├── OrionAnalysisService.swift (02_orion.md)
│   ├── AetherEngine.swift      (03_aether.md)
│   ├── PhoenixLogic.swift      (04_phoenix.md)
│   ├── ChironRegimeEngine.swift (05_chiron.md)
│   ├── HermesEngine.swift      (06_hermes.md)
│   ├── DemeterEngine.swift     (07_demeter.md)
│   ├── CronosEngine.swift      (08_cronos.md)
│   ├── AthenaFactorEngine.swift (09_athena.md)
│   ├── TitanEngine.swift       (10_titan.md)
│   ├── ArgusDecisionEngine.swift (12_argus.md)
│   └── ArgusBacktestEngine.swift (13_backtest.md)
│
├── Views/
│   ├── StockDetailView.swift
│   ├── BacktestView.swift
│   └── Components/
│       ├── ArgusRadarChart.swift (15_components.md)
│       ├── ScoreBar.swift
│       └── CandlestickChart.swift
│
└── ViewModels/
    └── TradingViewModel.swift
```

---

### Adım 2: Ana ViewModel

```swift
import SwiftUI

@MainActor
class TradingViewModel: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var quote: Quote?
    @Published var candles: [Candle] = []
    @Published var fundamentals: Fundamentals?
    
    @Published var atlasScore: AtlasEngine.AtlasResult?
    @Published var orionScore: OrionScoreResult?
    @Published var aetherScore: AetherResult?
    @Published var phoenixAdvice: PhoenixAdvice?
    @Published var hermesScore: HermesEngine.HermesResult?
    
    @Published var argusDecision: ArgusDecision?
    
    @Published var isLoading = false
    @Published var error: String?
    
    // MARK: - Load All Data
    
    func loadFullAnalysis(symbol: String) async {
        isLoading = true
        error = nil
        
        do {
            // 1. Fetch market data
            async let quoteTask = YahooFinanceProvider.shared.fetchQuote(symbol: symbol)
            async let candlesTask = YahooFinanceProvider.shared.fetchCandles(symbol: symbol, range: "1y")
            async let fundamentalsTask = YahooFinanceProvider.shared.fetchFundamentals(symbol: symbol)
            
            let (q, c, f) = try await (quoteTask, candlesTask, fundamentalsTask)
            
            self.quote = q
            self.candles = c
            self.fundamentals = f
            
            // 2. Run module analyses
            await runModuleAnalyses(symbol: symbol, candles: c, fundamentals: f)
            
            // 3. Make Argus decision
            makeArgusDecision(symbol: symbol)
            
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    // MARK: - Module Analyses
    
    private func runModuleAnalyses(
        symbol: String,
        candles: [Candle],
        fundamentals: Fundamentals
    ) async {
        
        // Atlas (Fundamental)
        atlasScore = AtlasEngine.shared.analyze(fundamentals: fundamentals)
        
        // Orion (Technical)
        orionScore = OrionAnalysisService.shared.calculateOrionScore(
            symbol: symbol,
            candles: candles
        )
        
        // Phoenix (Price Action)
        phoenixAdvice = PhoenixLogic.analyze(
            candles: candles,
            symbol: symbol
        )
        
        // Aether (Macro)
        do {
            aetherScore = try await AetherEngine.shared.evaluateMacro()
        } catch {
            print("Aether error: \(error)")
        }
        
        // Hermes (Sentiment)
        do {
            hermesScore = try await HermesEngine.shared.analyze(symbol: symbol)
        } catch {
            print("Hermes error: \(error)")
        }
    }
    
    // MARK: - Argus Decision
    
    private func makeArgusDecision(symbol: String) {
        let inputs = ArgusDecisionEngine.ModuleInputs(
            atlasScore: atlasScore?.score,
            orionScore: orionScore?.score,
            aetherScore: aetherScore?.score,
            phoenixScore: phoenixAdvice?.confidence,
            hermesScore: hermesScore?.score,
            demeterScore: nil, // Add if needed
            athenaScore: nil,
            cronosScore: nil,
            titanScore: nil,
            symbol: symbol,
            isETF: false
        )
        
        argusDecision = ArgusDecisionEngine.shared.makeDecision(inputs: inputs)
    }
}
```

---

### Adım 3: Ana View

```swift
struct StockDetailView: View {
    let symbol: String
    @StateObject private var viewModel = TradingViewModel()
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                
                // Loading
                if viewModel.isLoading {
                    ProgressView()
                        .frame(height: 200)
                }
                
                // Error
                if let error = viewModel.error {
                    Text(error)
                        .foregroundColor(.red)
                        .padding()
                }
                
                // Quote Header
                if let quote = viewModel.quote {
                    QuoteHeader(quote: quote)
                }
                
                // Argus Decision Card
                if let decision = viewModel.argusDecision {
                    ArgusScoreCard(decision: decision)
                }
                
                // Price Chart
                if !viewModel.candles.isEmpty {
                    CandlestickChart(candles: viewModel.candles, height: 250)
                        .padding()
                }
                
                // Module Cards
                moduleCardsSection
                
            }
            .padding()
        }
        .navigationTitle(symbol)
        .task {
            await viewModel.loadFullAnalysis(symbol: symbol)
        }
    }
    
    var moduleCardsSection: some View {
        VStack(spacing: 12) {
            
            // Atlas
            if let atlas = viewModel.atlasScore {
                ModuleCard(icon: "building.columns.fill", title: "Atlas", color: .blue) {
                    ScoreBar(label: "Fundamental", value: atlas.score, max: 100)
                    Text(atlas.verdict)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Orion
            if let orion = viewModel.orionScore {
                ModuleCard(icon: "star.fill", title: "Orion", color: .purple) {
                    ScoreBar(label: "Teknik", value: orion.score, max: 100)
                    Text(orion.verdict)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Phoenix
            if let phoenix = viewModel.phoenixAdvice {
                ModuleCard(icon: "flame.fill", title: "Phoenix", color: .orange) {
                    HStack {
                        Text(phoenix.mode == .trend ? "Trend" : "Reversion")
                        Spacer()
                        Text("\(Int(phoenix.confidence))")
                            .bold()
                    }
                }
            }
            
            // Aether
            if let aether = viewModel.aetherScore {
                ModuleCard(icon: "globe.europe.africa.fill", title: "Aether", color: .indigo) {
                    Text(aether.regime.rawValue)
                        .font(.caption)
                    if let vix = aether.vixLevel {
                        Text("VIX: \(String(format: "%.1f", vix))")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
        }
    }
}
```

---

### Adım 4: Backtest View

```swift
struct BacktestView: View {
    let symbol: String
    @State private var result: BacktestResult?
    @State private var isRunning = false
    @State private var selectedStrategy: BacktestConfig.StrategyType = .orionV3
    
    var body: some View {
        VStack(spacing: 20) {
            
            // Strategy Picker
            Picker("Strateji", selection: $selectedStrategy) {
                ForEach(BacktestConfig.StrategyType.allCases, id: \.self) { strategy in
                    Text(strategy.rawValue).tag(strategy)
                }
            }
            .pickerStyle(.segmented)
            
            // Run Button
            Button {
                Task { await runBacktest() }
            } label: {
                HStack {
                    if isRunning {
                        ProgressView()
                            .progressViewStyle(.circular)
                    }
                    Text("Backtest Çalıştır")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(isRunning)
            
            // Results
            if let result = result {
                BacktestResultView(result: result)
            }
            
            Spacer()
        }
        .padding()
        .navigationTitle("Backtest: \(symbol)")
    }
    
    func runBacktest() async {
        isRunning = true
        
        do {
            let candles = try await YahooFinanceProvider.shared.fetchCandles(
                symbol: symbol,
                range: "2y"
            )
            
            let config = BacktestConfig(
                symbol: symbol,
                strategy: selectedStrategy,
                initialCapital: 10000,
                startDate: nil,
                endDate: nil,
                positionSizePercent: 100
            )
            
            result = try await ArgusBacktestEngine.shared.runBacktest(
                symbol: symbol,
                config: config,
                candles: candles
            )
            
        } catch {
            print("Backtest error: \(error)")
        }
        
        isRunning = false
    }
}

struct BacktestResultView: View {
    let result: BacktestResult
    
    var body: some View {
        VStack(spacing: 12) {
            
            // Key Metrics
            HStack {
                MetricBox(title: "Getiri", value: "\(String(format: "%.1f", result.totalReturn))%", color: result.totalReturn >= 0 ? .green : .red)
                MetricBox(title: "Win Rate", value: "\(String(format: "%.0f", result.winRate))%", color: .blue)
                MetricBox(title: "Max DD", value: "\(String(format: "%.1f", result.maxDrawdown))%", color: .orange)
            }
            
            // Trade count
            Text("\(result.trades.count) işlem")
                .font(.caption)
                .foregroundColor(.secondary)
            
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(16)
    }
}

struct MetricBox: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack {
            Text(value)
                .font(.title2.bold())
                .foregroundColor(color)
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}
```

---

### Adım 5: App Entry Point

```swift
@main
struct AlgoTradingApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                WatchlistView()
            }
            .preferredColorScheme(.dark)
        }
    }
}

struct WatchlistView: View {
    @State private var symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"]
    
    var body: some View {
        List(symbols, id: \.self) { symbol in
            NavigationLink(destination: StockDetailView(symbol: symbol)) {
                Text(symbol)
            }
        }
        .navigationTitle("İzleme Listesi")
    }
}
```

---

## Özet: Hangi Dosyadan Ne Alınır?

| Prompt | Ne Alınır |
|--------|-----------|
| `11_heimdall.md` | YahooFinanceProvider |
| `17_models.md` | Tüm veri modelleri |
| `01-10_*.md` | Modül motorları |
| `12_argus.md` | Decision Engine |
| `13_backtest.md` | Backtest Engine |
| `14-16_*.md` | UI/Design |

---

*Sonraki: `19_logos.md` →*
