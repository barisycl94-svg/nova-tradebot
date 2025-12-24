# ✨ ANIMATIONS

## Neural Pulse Effect

```swift
import SwiftUI

struct NeuralPulseView: View {
    @State private var animationPhase: Double = 0
    
    let color: Color
    let intensity: Double
    
    init(color: Color = .blue, intensity: Double = 1.0) {
        self.color = color
        self.intensity = intensity
    }
    
    var body: some View {
        ZStack {
            // Multiple pulsing circles
            ForEach(0..<3) { i in
                Circle()
                    .stroke(
                        color.opacity(0.3 * intensity),
                        lineWidth: 2
                    )
                    .scaleEffect(1 + animationPhase + Double(i) * 0.3)
                    .opacity(1 - animationPhase - Double(i) * 0.2)
            }
            
            // Core glow
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            color.opacity(0.6 * intensity),
                            color.opacity(0.3 * intensity),
                            color.opacity(0)
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: 50
                    )
                )
                .frame(width: 100, height: 100)
        }
        .onAppear {
            withAnimation(
                .easeInOut(duration: 2)
                .repeatForever(autoreverses: false)
            ) {
                animationPhase = 1
            }
        }
    }
}
```

---

## Score Counter Animation

```swift
struct AnimatedScoreText: View {
    let score: Double
    @State private var displayedScore: Double = 0
    
    var body: some View {
        Text("\(Int(displayedScore))")
            .font(.system(size: 48, weight: .bold, design: .monospaced))
            .foregroundColor(scoreColor)
            .contentTransition(.numericText())
            .onAppear {
                withAnimation(.easeOut(duration: 1.0)) {
                    displayedScore = score
                }
            }
            .onChange(of: score) { newValue in
                withAnimation(.easeOut(duration: 0.5)) {
                    displayedScore = newValue
                }
            }
    }
    
    var scoreColor: Color {
        switch displayedScore {
        case 70...100: return .tradingGreen
        case 50..<70: return .yellow
        default: return .tradingRed
        }
    }
}
```

---

## Shimmer Loading

```swift
struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = 0
    
    func body(content: Content) -> some View {
        content
            .overlay(
                GeometryReader { geo in
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0),
                            Color.white.opacity(0.3),
                            Color.white.opacity(0)
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(width: geo.size.width * 0.5)
                    .offset(x: geo.size.width * (phase - 0.25))
                }
                .mask(content)
            )
            .onAppear {
                withAnimation(
                    .linear(duration: 1.5)
                    .repeatForever(autoreverses: false)
                ) {
                    phase = 1.25
                }
            }
    }
}

extension View {
    func shimmer() -> some View {
        modifier(ShimmerModifier())
    }
}

// Usage
struct LoadingPlaceholder: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 8)
            .fill(Color.gray.opacity(0.2))
            .frame(height: 20)
            .shimmer()
    }
}
```

---

## Chart Line Animation

```swift
struct AnimatedLineChart: View {
    let data: [Double]
    @State private var progress: CGFloat = 0
    
    var body: some View {
        GeometryReader { geo in
            let points = calculatePoints(in: geo.size)
            
            Path { path in
                guard !points.isEmpty else { return }
                path.move(to: points[0])
                for point in points.dropFirst() {
                    path.addLine(to: point)
                }
            }
            .trim(from: 0, to: progress)
            .stroke(
                LinearGradient(
                    colors: [.blue, .purple],
                    startPoint: .leading,
                    endPoint: .trailing
                ),
                style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round)
            )
        }
        .onAppear {
            withAnimation(.easeOut(duration: 1.5)) {
                progress = 1
            }
        }
    }
    
    func calculatePoints(in size: CGSize) -> [CGPoint] {
        guard data.count > 1 else { return [] }
        
        let minVal = data.min() ?? 0
        let maxVal = data.max() ?? 1
        let range = maxVal - minVal
        
        return data.enumerated().map { index, value in
            let x = CGFloat(index) / CGFloat(data.count - 1) * size.width
            let y = size.height - ((CGFloat(value - minVal) / CGFloat(range)) * size.height)
            return CGPoint(x: x, y: y)
        }
    }
}
```

---

## Particle Effect

```swift
struct ParticleEffect: View {
    @State private var particles: [Particle] = []
    let color: Color
    let count: Int
    
    struct Particle: Identifiable {
        let id = UUID()
        var x: CGFloat
        var y: CGFloat
        var scale: CGFloat
        var opacity: Double
    }
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                ForEach(particles) { particle in
                    Circle()
                        .fill(color)
                        .frame(width: 4, height: 4)
                        .scaleEffect(particle.scale)
                        .opacity(particle.opacity)
                        .position(x: particle.x, y: particle.y)
                }
            }
            .onAppear {
                startAnimation(in: geo.size)
            }
        }
    }
    
    func startAnimation(in size: CGSize) {
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            // Add new particle
            if particles.count < count {
                particles.append(Particle(
                    x: size.width / 2,
                    y: size.height / 2,
                    scale: 1,
                    opacity: 1
                ))
            }
            
            // Update existing
            for i in particles.indices {
                let angle = Double.random(in: 0...2 * .pi)
                let speed: CGFloat = 2
                
                particles[i].x += cos(angle) * speed
                particles[i].y += sin(angle) * speed
                particles[i].opacity -= 0.02
                particles[i].scale += 0.02
            }
            
            // Remove dead particles
            particles.removeAll { $0.opacity <= 0 }
        }
    }
}
```

---

## Spring Button

```swift
struct SpringButton: View {
    let title: String
    let action: () -> Void
    
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            isPressed = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                isPressed = false
            }
            action()
        }) {
            Text(title)
                .font(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.argusBlue)
                )
                .scaleEffect(isPressed ? 0.95 : 1)
        }
        .buttonStyle(PlainButtonStyle())
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
    }
}
```

---

*Sonraki: `17_models.md` →*
