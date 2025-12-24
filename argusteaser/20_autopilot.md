# 🤖 AUTOPILOT SİSTEMİ

## Konsept

AutoPilot, Argus sinyallerine göre otomatik emir yönetimi sağlar. Uyarılarla çalışır, gerçek işlem için broker API gerekli.

## Prompt

> Bana bir iOS SwiftUI uygulaması için AutoPilot sistemi yaz:
>
> 1. Argus sinyallerine göre uyarı ver
> 2. Position sizing hesapla
> 3. Entry/Exit fiyatları öner
> 4. Risk/Reward analizi yap

---

## Swift Implementasyonu

```swift
import Foundation
import UserNotifications

// MARK: - AutoPilot Engine
class AutoPilotEngine: ObservableObject {
    static let shared = AutoPilotEngine()
    
    @Published var isEnabled = false
    @Published var pendingActions: [AutoPilotAction] = []
    @Published var executedActions: [AutoPilotAction] = []
    
    private var watchedSymbols: [String] = []
    private var timer: Timer?
    
    private init() {
        requestNotificationPermission()
    }
    
    // MARK: - Models
    
    struct AutoPilotAction: Identifiable {
        let id = UUID()
        let symbol: String
        let signal: Signal
        let entryPrice: Double
        let targetPrice: Double
        let stopLoss: Double
        let positionSize: Double
        let riskReward: Double
        let confidence: Double
        let timestamp: Date
        var status: ActionStatus
    }
    
    enum ActionStatus: String {
        case pending = "Bekliyor"
        case executed = "İşlendi"
        case cancelled = "İptal"
        case expired = "Zaman Aşımı"
    }
    
    // MARK: - Start/Stop
    
    func start(symbols: [String]) {
        watchedSymbols = symbols
        isEnabled = true
        
        // Check every 5 minutes
        timer = Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { [weak self] _ in
            Task { await self?.checkSignals() }
        }
        
        // Initial check
        Task { await checkSignals() }
    }
    
    func stop() {
        timer?.invalidate()
        timer = nil
        isEnabled = false
    }
    
    // MARK: - Signal Check
    
    private func checkSignals() async {
        for symbol in watchedSymbols {
            do {
                // Fetch data
                let candles = try await YahooFinanceProvider.shared.fetchCandles(
                    symbol: symbol,
                    range: "6mo"
                )
                let quote = try await YahooFinanceProvider.shared.fetchQuote(symbol: symbol)
                
                // Run Orion analysis
                guard let orionResult = OrionAnalysisService.shared.calculateOrionScore(
                    symbol: symbol,
                    candles: candles
                ) else { continue }
                
                // Check for actionable signal
                if let action = evaluateForAction(
                    symbol: symbol,
                    score: orionResult.score,
                    price: quote.price,
                    candles: candles
                ) {
                    await MainActor.run {
                        pendingActions.append(action)
                        sendNotification(for: action)
                    }
                }
                
            } catch {
                print("AutoPilot error for \(symbol): \(error)")
            }
        }
    }
    
    // MARK: - Position Sizing
    
    func calculatePositionSize(
        capital: Double,
        riskPercent: Double,
        entryPrice: Double,
        stopLoss: Double
    ) -> (shares: Double, dollarRisk: Double) {
        
        let dollarRisk = capital * (riskPercent / 100)
        let riskPerShare = abs(entryPrice - stopLoss)
        
        guard riskPerShare > 0 else { return (0, 0) }
        
        let shares = dollarRisk / riskPerShare
        
        return (shares, dollarRisk)
    }
    
    // MARK: - Entry/Exit Calculation
    
    private func evaluateForAction(
        symbol: String,
        score: Double,
        price: Double,
        candles: [Candle]
    ) -> AutoPilotAction? {
        
        // Only act on strong signals
        guard score >= 70 || score <= 30 else { return nil }
        
        let signal: Signal = score >= 70 ? .buy : .sell
        
        // Calculate levels
        let atr = calculateATR(candles: candles)
        
        let stopLoss: Double
        let target: Double
        
        if signal == .buy {
            stopLoss = price - (atr * 2) // 2 ATR stop
            target = price + (atr * 4)   // 4 ATR target (2:1 R/R)
        } else {
            stopLoss = price + (atr * 2)
            target = price - (atr * 4)
        }
        
        let riskReward = abs(target - price) / abs(price - stopLoss)
        
        // Position sizing (assume $10,000 capital, 2% risk)
        let (shares, _) = calculatePositionSize(
            capital: 10000,
            riskPercent: 2,
            entryPrice: price,
            stopLoss: stopLoss
        )
        
        return AutoPilotAction(
            symbol: symbol,
            signal: signal,
            entryPrice: price,
            targetPrice: target,
            stopLoss: stopLoss,
            positionSize: shares,
            riskReward: riskReward,
            confidence: score,
            timestamp: Date(),
            status: .pending
        )
    }
    
    private func calculateATR(candles: [Candle]) -> Double {
        guard candles.count >= 15 else { return 0 }
        
        let recent = Array(candles.suffix(15))
        var trs: [Double] = []
        
        for i in 1..<recent.count {
            let high = recent[i].high
            let low = recent[i].low
            let prevClose = recent[i-1].close
            
            let tr = max(high - low, max(abs(high - prevClose), abs(low - prevClose)))
            trs.append(tr)
        }
        
        return trs.reduce(0, +) / Double(trs.count)
    }
    
    // MARK: - Notifications
    
    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }
    
    private func sendNotification(for action: AutoPilotAction) {
        let content = UNMutableNotificationContent()
        content.title = "\(action.signal == .buy ? "🟢" : "🔴") \(action.symbol) \(action.signal.rawValue)"
        content.body = "Fiyat: $\(String(format: "%.2f", action.entryPrice)) | R/R: \(String(format: "%.1f", action.riskReward)):1"
        content.sound = .default
        
        let request = UNNotificationRequest(
            identifier: action.id.uuidString,
            content: content,
            trigger: nil
        )
        
        UNUserNotificationCenter.current().add(request)
    }
}
```

---

## UI

```swift
struct AutoPilotView: View {
    @ObservedObject var engine = AutoPilotEngine.shared
    @State private var symbols = "AAPL, MSFT, GOOGL"
    
    var body: some View {
        VStack(spacing: 20) {
            // Status
            HStack {
                Circle()
                    .fill(engine.isEnabled ? Color.green : Color.red)
                    .frame(width: 12, height: 12)
                Text(engine.isEnabled ? "AutoPilot Aktif" : "AutoPilot Kapalı")
                    .font(.headline)
            }
            
            // Symbol Input
            TextField("Semboller (virgülle)", text: $symbols)
                .textFieldStyle(.roundedBorder)
            
            // Toggle Button
            Button {
                if engine.isEnabled {
                    engine.stop()
                } else {
                    let syms = symbols.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) }
                    engine.start(symbols: syms)
                }
            } label: {
                Text(engine.isEnabled ? "Durdur" : "Başlat")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(engine.isEnabled ? Color.red : Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            
            // Pending Actions
            if !engine.pendingActions.isEmpty {
                Text("Bekleyen Aksiyonlar")
                    .font(.headline)
                
                ForEach(engine.pendingActions) { action in
                    ActionRow(action: action)
                }
            }
            
            Spacer()
        }
        .padding()
        .navigationTitle("AutoPilot")
    }
}

struct ActionRow: View {
    let action: AutoPilotEngine.AutoPilotAction
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(action.symbol)
                    .font(.headline)
                Text(action.signal.rawValue)
                    .font(.caption)
                    .foregroundColor(action.signal == .buy ? .green : .red)
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Text("$\(String(format: "%.2f", action.entryPrice))")
                    .font(.subheadline)
                Text("R/R: \(String(format: "%.1f", action.riskReward)):1")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(12)
    }
}
```

---

*Sonraki: `21_broker_api.md` →*
