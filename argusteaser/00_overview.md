# 🏛️ ARGUS Trading System - Genel Bakış

## Sistem Mimarisi

Argus, Yunan mitolojisindeki "yüz gözlü dev"den esinlenmiş bir trading karar destek sistemidir. Her "göz" farklı bir analiz modülünü temsil eder.

```
                    ┌─────────────────┐
                    │     ARGUS       │
                    │ Decision Engine │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  CORE   │          │  PULSE  │          │ CHIRON  │
   │ (Long)  │          │ (Short) │          │ (Meta)  │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                    │
   ┌────┴────┐          ┌────┴────┐               │
   │ Atlas   │          │ Orion   │          Learns from
   │ Aether  │          │ Phoenix │          all modules
   │ Demeter │          │ Hermes  │
   │ Athena  │          │ Cronos  │
   └─────────┘          └─────────┘
```

## Modül Hiyerarşisi

### Tier 1: Ana Motorlar (Her Zaman Aktif)

| Modül | Rol | Ağırlık |
|-------|-----|---------|
| **Atlas** | Fundamental Kalite | Core: 25% |
| **Orion** | Teknik Analiz | Pulse: 30% |
| **Aether** | Makro/Risk | Her ikisi: 20% |

### Tier 2: Destek Modülleri

| Modül | Rol | Ağırlık |
|-------|-----|---------|
| **Phoenix** | Price Action/Reversion | Pulse: 15% |
| **Hermes** | Sentiment/News | Pulse: 10% |
| **Demeter** | Sektör Analizi | Core: 15% |
| **Athena** | Faktör Analizi | Core: 15% |
| **Cronos** | Zamanlama | Bonus/Penalty |

### Tier 3: Altyapı

| Modül | Rol |
|-------|-----|
| **Heimdall** | Data Resolution & Mapping |
| **Titan** | ETF/Non-equity Lite Engine |
| **Chiron** | Meta-optimizer (LLM) |

## Scoring Sistemi

### İki Skorlama Modu

**CORE (Yatırım - Uzun Vade):**

```
CoreScore = (Atlas × 0.25) + (Aether × 0.20) + (Demeter × 0.15) + (Athena × 0.15) + (Orion × 0.25)
```

**PULSE (Trading - Kısa Vade):**

```
PulseScore = (Orion × 0.30) + (Phoenix × 0.15) + (Aether × 0.20) + (Hermes × 0.10) + (Atlas × 0.15) + (Cronos × 0.10)
```

### Sinyal Eşikleri

| Skor | Sinyal | Aksiyon |
|------|--------|---------|
| 80+ | 🟢 Güçlü Al | Full position |
| 65-80 | 🟡 Al | Half position |
| 50-65 | ⚪ Nötr | Hold |
| 35-50 | 🟡 Sat | Reduce |
| <35 | 🔴 Güçlü Sat | Exit |

## Veri Akışı

```swift
// 1. Veri Çekimi (Yahoo Finance)
let candles = try await YahooFinanceProvider.shared.fetchCandles(symbol: "AAPL", range: "1y")

// 2. Modül Analizleri
let atlasScore = AtlasEngine.shared.analyze(financials: financials)
let orionScore = OrionAnalysisService.shared.calculateOrionScore(symbol: "AAPL", candles: candles)
let aetherScore = AetherEngine.shared.evaluateMacro()

// 3. Argus Kararı
let decision = ArgusDecisionEngine.shared.makeDecision(
    atlas: atlasScore,
    orion: orionScore,
    aether: aetherScore,
    // ... diğer modüller
)

// 4. Sonuç
print(decision.finalScoreCore)  // 0-100
print(decision.finalActionCore) // .buy, .hold, .sell
```

## Yahoo Finance Entegrasyonu

Tüm sistem Yahoo Finance ücretsiz API'si ile çalışır:

```swift
struct YahooFinanceProvider {
    static let shared = YahooFinanceProvider()
    
    // Fiyat verileri
    func fetchCandles(symbol: String, range: String) async throws -> [Candle]
    
    // Güncel fiyat
    func fetchQuote(symbol: String) async throws -> Quote
    
    // Temel veriler
    func fetchFundamentals(symbol: String) async throws -> Fundamentals
}
```

**Desteklenen Semboller:**

- US Hisseler: `AAPL`, `MSFT`, `GOOGL`
- TR Hisseler: `THYAO.IS`, `GARAN.IS`, `AKBNK.IS`
- ETF'ler: `SPY`, `QQQ`, `VOO`
- Kripto: `BTC-USD`, `ETH-USD`

## Proje Yapısı

```
Algo-Trading/
├── Models/
│   ├── Candle.swift
│   ├── Quote.swift
│   ├── Fundamentals.swift
│   └── [Modül]Models.swift
├── Services/
│   ├── Providers/
│   │   └── YahooFinanceProvider.swift
│   ├── AtlasEngine.swift
│   ├── OrionAnalysisService.swift
│   ├── AetherEngine.swift
│   ├── PhoenixLogic.swift
│   ├── ChironRegimeEngine.swift
│   └── ArgusDecisionEngine.swift
├── Views/
│   ├── StockDetailView.swift
│   ├── Components/
│   │   ├── ArgusRadarChart.swift
│   │   └── [Modül]Card.swift
│   └── Labs/
│       └── ArgusBacktestView.swift
└── ViewModels/
    └── TradingViewModel.swift
```

## Sonraki Adımlar

1. **17_models.md** → Data modellerini oluştur
2. **11_heimdall.md** → Yahoo Finance provider'ı kur
3. **02_orion.md** → Teknik analiz motorunu yaz
4. **01_atlas.md** → Fundamental motoru ekle
5. **12_argus.md** → Decision engine'i birleştir

---

*Devam: `01_atlas.md` →*
