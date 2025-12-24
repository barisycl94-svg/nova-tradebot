# 🎨 DESIGN SYSTEM

## Konsept

Argus Trading System için premium, karanlık temada, modern tasarım sistemi.

## Prompt

> Bana bir iOS SwiftUI uygulaması için premium trading app tasarım sistemi yaz:
>
> 1. Karanlık tema (Dark Mode)
> 2. Glassmorphism efektleri
> 3. Renk paleti (yeşil/kırmızı trading renkler)
> 4. Typography
> 5. Spacing sistemi

---

## Renk Paleti

```swift
import SwiftUI

extension Color {
    // MARK: - Brand Colors
    
    static let argusBlue = Color(hex: "007AFF")
    static let argusPurple = Color(hex: "5856D6")
    static let argusGold = Color(hex: "FFD700")
    
    // MARK: - Trading Colors
    
    static let tradingGreen = Color(hex: "34C759")
    static let tradingRed = Color(hex: "FF3B30")
    static let tradingYellow = Color(hex: "FFCC00")
    
    // MARK: - Background Colors
    
    static let darkBackground = Color(hex: "000000")
    static let cardBackground = Color(hex: "1C1C1E")
    static let secondaryBackground = Color(hex: "2C2C2E")
    
    // MARK: - Text Colors
    
    static let primaryText = Color.white
    static let secondaryText = Color(hex: "8E8E93")
    static let tertiaryText = Color(hex: "636366")
    
    // MARK: - Module Colors
    
    static let atlasColor = Color.blue
    static let orionColor = Color.purple
    static let aetherColor = Color.indigo
    static let phoenixColor = Color.orange
    static let hermesColor = Color.cyan
    static let demeterColor = Color.yellow
    static let athenaColor = Color.pink
    static let cronosColor = Color.green
    static let titanColor = Color.gray
    static let chironColor = Color.mint
    
    // MARK: - Hex Initializer
    
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
```

---

## Glassmorphism

```swift
// MARK: - Glass Card Modifier

struct GlassCard: ViewModifier {
    let cornerRadius: CGFloat
    
    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
            )
    }
}

extension View {
    func glassCard(cornerRadius: CGFloat = 16) -> some View {
        modifier(GlassCard(cornerRadius: cornerRadius))
    }
}

// MARK: - Premium Card

struct PremiumCard: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.cardBackground,
                                Color.cardBackground.opacity(0.8)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.2),
                                        Color.white.opacity(0.05)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
                    .shadow(color: .black.opacity(0.3), radius: 10, x: 0, y: 5)
            )
    }
}

extension View {
    func premiumCard() -> some View {
        modifier(PremiumCard())
    }
}
```

---

## Typography

```swift
// MARK: - Typography System

struct ArgusTypography {
    
    // Headlines
    static let largeTitle = Font.system(size: 34, weight: .bold)
    static let title1 = Font.system(size: 28, weight: .bold)
    static let title2 = Font.system(size: 22, weight: .bold)
    static let title3 = Font.system(size: 20, weight: .semibold)
    
    // Body
    static let body = Font.system(size: 17)
    static let bodyBold = Font.system(size: 17, weight: .semibold)
    static let callout = Font.system(size: 16)
    
    // Supporting
    static let subheadline = Font.system(size: 15)
    static let footnote = Font.system(size: 13)
    static let caption1 = Font.system(size: 12)
    static let caption2 = Font.system(size: 11)
    
    // Monospace (for numbers)
    static let monoLarge = Font.system(size: 32, weight: .bold, design: .monospaced)
    static let monoMedium = Font.system(size: 24, weight: .semibold, design: .monospaced)
    static let monoSmall = Font.system(size: 14, weight: .medium, design: .monospaced)
}
```

---

## Spacing System

```swift
// MARK: - Spacing

struct ArgusSpacing {
    static let xxxs: CGFloat = 2
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
    static let xxxl: CGFloat = 64
}

// MARK: - Corner Radius

struct ArgusRadius {
    static let small: CGFloat = 8
    static let medium: CGFloat = 12
    static let large: CGFloat = 16
    static let xlarge: CGFloat = 24
    static let pill: CGFloat = 100
}
```

---

## Gradients

```swift
// MARK: - Gradients

struct ArgusGradients {
    
    static let primaryGradient = LinearGradient(
        colors: [Color.argusBlue, Color.argusPurple],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let successGradient = LinearGradient(
        colors: [Color.tradingGreen, Color.tradingGreen.opacity(0.7)],
        startPoint: .top,
        endPoint: .bottom
    )
    
    static let dangerGradient = LinearGradient(
        colors: [Color.tradingRed, Color.tradingRed.opacity(0.7)],
        startPoint: .top,
        endPoint: .bottom
    )
    
    static let goldGradient = LinearGradient(
        colors: [Color.argusGold, Color.orange],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let cardGradient = LinearGradient(
        colors: [
            Color.cardBackground,
            Color.cardBackground.opacity(0.95)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
```

---

## Usage

```swift
struct ExampleView: View {
    var body: some View {
        VStack(spacing: ArgusSpacing.md) {
            Text("ARGUS")
                .font(ArgusTypography.title1)
                .foregroundColor(.primaryText)
            
            Text("Score: 85")
                .font(ArgusTypography.monoLarge)
                .foregroundColor(.tradingGreen)
            
            Text("Güçlü Al")
                .font(ArgusTypography.caption1)
                .foregroundColor(.secondaryText)
        }
        .premiumCard()
    }
}
```

---

*Sonraki: `15_components.md` →*
