# 🏦 BROKER API (Paper Trading)

## Konsept

Gerçek broker entegrasyonu olmadan paper trading simülasyonu.

## Prompt

> Bana bir iOS SwiftUI uygulaması için paper trading broker simülatörü yaz:
>
> 1. Sanal hesap bakiyesi
> 2. Order yerleştirme (market, limit)
> 3. Position tracking
> 4. P&L hesaplama

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Paper Broker

actor PaperBroker {
    static let shared = PaperBroker()
    
    // Account State
    private(set) var cash: Double = 10_000
    private(set) var positions: [String: Position] = [:]
    private(set) var orders: [Order] = []
    private(set) var trades: [Trade] = []
    
    private init() {}
    
    // MARK: - Models
    
    struct Position {
        let symbol: String
        var shares: Double
        var avgCost: Double
        var currentPrice: Double
        
        var marketValue: Double { shares * currentPrice }
        var pnl: Double { (currentPrice - avgCost) * shares }
        var pnlPercent: Double { (currentPrice - avgCost) / avgCost * 100 }
    }
    
    struct Order: Identifiable {
        let id = UUID()
        let symbol: String
        let side: OrderSide
        let type: OrderType
        let quantity: Double
        let limitPrice: Double?
        let status: OrderStatus
        let createdAt: Date
    }
    
    enum OrderSide: String { case buy, sell }
    enum OrderType: String { case market, limit }
    enum OrderStatus: String { case pending, filled, cancelled }
    
    struct Trade: Identifiable {
        let id = UUID()
        let symbol: String
        let side: OrderSide
        let quantity: Double
        let price: Double
        let timestamp: Date
    }
    
    // MARK: - Account Info
    
    var equity: Double {
        cash + positions.values.reduce(0) { $0 + $1.marketValue }
    }
    
    var totalPnL: Double {
        positions.values.reduce(0) { $0 + $1.pnl }
    }
    
    // MARK: - Place Order
    
    func placeOrder(
        symbol: String,
        side: OrderSide,
        quantity: Double,
        type: OrderType = .market,
        limitPrice: Double? = nil
    ) async throws -> Order {
        
        // Get current price
        let quote = try await YahooFinanceProvider.shared.fetchQuote(symbol: symbol)
        let fillPrice = quote.price
        
        // Simulate slippage for market orders
        let executionPrice: Double
        if type == .market {
            let slippage = fillPrice * 0.001 // 0.1% slippage
            executionPrice = side == .buy ? fillPrice + slippage : fillPrice - slippage
        } else {
            executionPrice = limitPrice ?? fillPrice
        }
        
        // Check funds/position
        if side == .buy {
            let cost = executionPrice * quantity
            guard cash >= cost else {
                throw BrokerError.insufficientFunds
            }
        } else {
            guard let pos = positions[symbol], pos.shares >= quantity else {
                throw BrokerError.insufficientShares
            }
        }
        
        // Execute
        let order = Order(
            symbol: symbol,
            side: side,
            type: type,
            quantity: quantity,
            limitPrice: limitPrice,
            status: .filled,
            createdAt: Date()
        )
        
        orders.append(order)
        
        // Record trade
        let trade = Trade(
            symbol: symbol,
            side: side,
            quantity: quantity,
            price: executionPrice,
            timestamp: Date()
        )
        trades.append(trade)
        
        // Update position
        if side == .buy {
            cash -= executionPrice * quantity
            
            if var existing = positions[symbol] {
                let totalShares = existing.shares + quantity
                let totalCost = (existing.avgCost * existing.shares) + (executionPrice * quantity)
                existing.avgCost = totalCost / totalShares
                existing.shares = totalShares
                existing.currentPrice = executionPrice
                positions[symbol] = existing
            } else {
                positions[symbol] = Position(
                    symbol: symbol,
                    shares: quantity,
                    avgCost: executionPrice,
                    currentPrice: executionPrice
                )
            }
        } else {
            cash += executionPrice * quantity
            
            if var existing = positions[symbol] {
                existing.shares -= quantity
                if existing.shares <= 0.01 {
                    positions.removeValue(forKey: symbol)
                } else {
                    positions[symbol] = existing
                }
            }
        }
        
        return order
    }
    
    // MARK: - Update Prices
    
    func updatePrices() async {
        for symbol in positions.keys {
            if let quote = try? await YahooFinanceProvider.shared.fetchQuote(symbol: symbol) {
                positions[symbol]?.currentPrice = quote.price
            }
        }
    }
    
    // MARK: - Reset
    
    func reset(initialCash: Double = 10_000) {
        cash = initialCash
        positions = [:]
        orders = []
        trades = []
    }
    
    // MARK: - Errors
    
    enum BrokerError: Error {
        case insufficientFunds
        case insufficientShares
        case invalidOrder
    }
}
```

---

## UI

```swift
struct PaperTradingView: View {
    @State private var cash: Double = 10_000
    @State private var positions: [PaperBroker.Position] = []
    @State private var equity: Double = 10_000
    
    @State private var symbol = ""
    @State private var quantity = ""
    
    var body: some View {
        VStack(spacing: 20) {
            // Account Summary
            HStack {
                VStack(alignment: .leading) {
                    Text("Nakit")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", cash))")
                        .font(.title2.bold())
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Toplam")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", equity))")
                        .font(.title2.bold())
                        .foregroundColor(equity >= 10_000 ? .green : .red)
                }
            }
            .padding()
            .background(Color.cardBackground)
            .cornerRadius(16)
            
            // Order Entry
            HStack {
                TextField("Sembol", text: $symbol)
                    .textFieldStyle(.roundedBorder)
                    .frame(width: 80)
                
                TextField("Adet", text: $quantity)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
                    .frame(width: 80)
                
                Button("Al") {
                    Task { await placeOrder(.buy) }
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
                
                Button("Sat") {
                    Task { await placeOrder(.sell) }
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
            }
            
            // Positions
            if !positions.isEmpty {
                Text("Pozisyonlar")
                    .font(.headline)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                ForEach(positions, id: \.symbol) { position in
                    PositionRow(position: position)
                }
            }
            
            Spacer()
        }
        .padding()
        .navigationTitle("Paper Trading")
        .task {
            await refresh()
        }
    }
    
    func placeOrder(_ side: PaperBroker.OrderSide) async {
        guard !symbol.isEmpty, let qty = Double(quantity), qty > 0 else { return }
        
        do {
            _ = try await PaperBroker.shared.placeOrder(
                symbol: symbol.uppercased(),
                side: side,
                quantity: qty
            )
            await refresh()
        } catch {
            print("Order error: \(error)")
        }
    }
    
    func refresh() async {
        await PaperBroker.shared.updatePrices()
        cash = await PaperBroker.shared.cash
        positions = Array(await PaperBroker.shared.positions.values)
        equity = await PaperBroker.shared.equity
    }
}

struct PositionRow: View {
    let position: PaperBroker.Position
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(position.symbol)
                    .font(.headline)
                Text("\(String(format: "%.2f", position.shares)) hisse")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Text("$\(String(format: "%.2f", position.marketValue))")
                    .font(.subheadline)
                Text("\(String(format: "%+.2f", position.pnlPercent))%")
                    .font(.caption)
                    .foregroundColor(position.pnl >= 0 ? .green : .red)
            }
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(12)
    }
}
```

---

*Sonraki: `22_risk_management.md` →*
