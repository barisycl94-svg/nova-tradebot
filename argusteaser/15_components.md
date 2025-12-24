# 🧩 UI COMPONENTS

## Radar Chart

```swift
import SwiftUI

struct ArgusRadarChart: View {
    let scores: [ModuleScore]
    
    struct ModuleScore: Identifiable {
        let id = UUID()
        let name: String
        let score: Double // 0-100
        let color: Color
    }
    
    var body: some View {
        GeometryReader { geo in
            let center = CGPoint(x: geo.size.width / 2, y: geo.size.height / 2)
            let radius = min(geo.size.width, geo.size.height) / 2 - 40
            let angleStep = (2 * .pi) / CGFloat(scores.count)
            
            ZStack {
                // Background rings
                ForEach([0.25, 0.5, 0.75, 1.0], id: \.self) { scale in
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        .frame(width: radius * 2 * scale, height: radius * 2 * scale)
                }
                
                // Data polygon
                Path { path in
                    for (index, score) in scores.enumerated() {
                        let angle = CGFloat(index) * angleStep - .pi / 2
                        let dist = radius * (score.score / 100)
                        let point = CGPoint(
                            x: center.x + cos(angle) * dist,
                            y: center.y + sin(angle) * dist
                        )
                        
                        if index == 0 {
                            path.move(to: point)
                        } else {
                            path.addLine(to: point)
                        }
                    }
                    path.closeSubpath()
                }
                .fill(Color.blue.opacity(0.2))
                .overlay(
                    Path { path in
                        for (index, score) in scores.enumerated() {
                            let angle = CGFloat(index) * angleStep - .pi / 2
                            let dist = radius * (score.score / 100)
                            let point = CGPoint(
                                x: center.x + cos(angle) * dist,
                                y: center.y + sin(angle) * dist
                            )
                            
                            if index == 0 {
                                path.move(to: point)
                            } else {
                                path.addLine(to: point)
                            }
                        }
                        path.closeSubpath()
                    }
                    .stroke(Color.blue, lineWidth: 2)
                )
                
                // Labels
                ForEach(Array(scores.enumerated()), id: \.1.id) { index, score in
                    let angle = CGFloat(index) * angleStep - .pi / 2
                    let labelRadius = radius + 25
                    
                    Text(score.name)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .position(
                            x: center.x + cos(angle) * labelRadius,
                            y: center.y + sin(angle) * labelRadius
                        )
                }
                
                // Data points
                ForEach(Array(scores.enumerated()), id: \.1.id) { index, score in
                    let angle = CGFloat(index) * angleStep - .pi / 2
                    let dist = radius * (score.score / 100)
                    
                    Circle()
                        .fill(score.color)
                        .frame(width: 8, height: 8)
                        .position(
                            x: center.x + cos(angle) * dist,
                            y: center.y + sin(angle) * dist
                        )
                }
            }
        }
        .aspectRatio(1, contentMode: .fit)
    }
}
```

---

## Score Bar

```swift
struct ScoreBar: View {
    let label: String
    let value: Double
    let max: Double
    let color: Color
    
    init(label: String, value: Double, max: Double = 100, color: Color = .blue) {
        self.label = label
        self.value = value
        self.max = max
        self.color = color
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(Int(value))/\(Int(max))")
                    .font(.caption2.monospacedDigit())
                    .foregroundColor(.secondary)
            }
            
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geo.size.width * min(value / max, 1.0))
                }
            }
            .frame(height: 8)
        }
    }
}
```

---

## Price Change Badge

```swift
struct PriceChangeBadge: View {
    let change: Double
    let changePercent: Double
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: isPositive ? "arrow.up.right" : "arrow.down.right")
                .font(.caption2)
            
            Text(String(format: "%+.2f", change))
                .font(.caption.monospacedDigit())
            
            Text("(\(String(format: "%+.2f", changePercent))%)")
                .font(.caption2)
        }
        .foregroundColor(isPositive ? .tradingGreen : .tradingRed)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill((isPositive ? Color.tradingGreen : Color.tradingRed).opacity(0.15))
        )
    }
    
    var isPositive: Bool { change >= 0 }
}
```

---

## Signal Badge

```swift
struct SignalBadge: View {
    let signal: String
    let score: Double
    
    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(signalColor)
                .frame(width: 8, height: 8)
            
            Text(signal)
                .font(.caption.bold())
                .foregroundColor(signalColor)
            
            if score > 0 {
                Text("(\(Int(score)))")
                    .font(.caption2.monospacedDigit())
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(
            Capsule()
                .fill(signalColor.opacity(0.15))
        )
    }
    
    var signalColor: Color {
        switch signal.lowercased() {
        case "güçlü al", "strongbuy", "al", "buy":
            return .tradingGreen
        case "güçlü sat", "strongsell", "sat", "sell":
            return .tradingRed
        default:
            return .gray
        }
    }
}
```

---

## Module Card

```swift
struct ModuleCard<Content: View>: View {
    let icon: String
    let title: String
    let color: Color
    let content: () -> Content
    
    init(
        icon: String,
        title: String,
        color: Color,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.icon = icon
        self.title = title
        self.color = color
        self.content = content
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            content()
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(16)
    }
}
```

---

## Candlestick Chart

```swift
struct CandlestickChart: View {
    let candles: [Candle]
    let height: CGFloat
    
    var body: some View {
        GeometryReader { geo in
            let visibleCandles = Array(candles.suffix(60))
            let candleWidth = geo.size.width / CGFloat(visibleCandles.count + 1)
            
            let allPrices = visibleCandles.flatMap { [$0.high, $0.low] }
            let minPrice = allPrices.min() ?? 0
            let maxPrice = allPrices.max() ?? 0
            let priceRange = maxPrice - minPrice
            
            HStack(alignment: .bottom, spacing: 1) {
                ForEach(Array(visibleCandles.enumerated()), id: \.1.id) { _, candle in
                    CandleView(
                        candle: candle,
                        height: geo.size.height,
                        minPrice: minPrice,
                        priceRange: priceRange
                    )
                    .frame(width: candleWidth - 2)
                }
            }
        }
        .frame(height: height)
    }
}

struct CandleView: View {
    let candle: Candle
    let height: CGFloat
    let minPrice: Double
    let priceRange: Double
    
    var body: some View {
        GeometryReader { geo in
            let isBullish = candle.close >= candle.open
            let color = isBullish ? Color.tradingGreen : Color.tradingRed
            
            let bodyTop = max(candle.open, candle.close)
            let bodyBottom = min(candle.open, candle.close)
            
            let highY = priceToY(candle.high, geo.size.height)
            let lowY = priceToY(candle.low, geo.size.height)
            let bodyTopY = priceToY(bodyTop, geo.size.height)
            let bodyBottomY = priceToY(bodyBottom, geo.size.height)
            
            ZStack {
                // Wick
                Path { path in
                    let centerX = geo.size.width / 2
                    path.move(to: CGPoint(x: centerX, y: highY))
                    path.addLine(to: CGPoint(x: centerX, y: lowY))
                }
                .stroke(color, lineWidth: 1)
                
                // Body
                Rectangle()
                    .fill(color)
                    .frame(
                        width: geo.size.width * 0.8,
                        height: max(1, bodyBottomY - bodyTopY)
                    )
                    .position(
                        x: geo.size.width / 2,
                        y: (bodyTopY + bodyBottomY) / 2
                    )
            }
        }
    }
    
    func priceToY(_ price: Double, _ height: CGFloat) -> CGFloat {
        guard priceRange > 0 else { return height / 2 }
        return height - CGFloat((price - minPrice) / priceRange) * height
    }
}
```

---

*Sonraki: `16_animations.md` →*
