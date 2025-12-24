# 📰 HERMES - Sentiment & News Analizi

## Konsept

Hermes, tanrıların habercisidir. Bu modül, haber ve sentiment verilerini analiz eder.

## Prompt

> Bana bir iOS SwiftUI uygulaması için basit sentiment analiz motoru yaz. Motor:
>
> 1. Haber başlıklarını analiz etsin (Yahoo Finance RSS)
> 2. Basit keyword-based sentiment skoru üretsin
> 3. 0-100 arası sentiment skoru döndürsün
>
> Not: LLM gerekli değil, basit keyword matching yeterli.

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Hermes Sentiment Engine
class HermesEngine {
    static let shared = HermesEngine()
    
    private init() {}
    
    struct HermesResult {
        let score: Double
        let sentiment: Sentiment
        let headlines: [String]
        let keywords: [String: Int]
    }
    
    enum Sentiment: String {
        case veryBullish = "Çok Olumlu"
        case bullish = "Olumlu"
        case neutral = "Nötr"
        case bearish = "Olumsuz"
        case veryBearish = "Çok Olumsuz"
    }
    
    // MARK: - Keyword Dictionaries
    
    private let bullishKeywords = [
        "upgrade", "outperform", "buy", "bullish", "growth", "beat", "beats",
        "exceeds", "record", "surge", "soar", "rally", "breakout", "strong",
        "positive", "gains", "profit", "revenue", "earnings", "dividend",
        "analyst", "upgrade", "target", "raised", "expansion", "deal", "acquisition"
    ]
    
    private let bearishKeywords = [
        "downgrade", "underperform", "sell", "bearish", "decline", "miss",
        "misses", "below", "fall", "crash", "drop", "warning", "weak",
        "negative", "loss", "layoff", "layoffs", "cut", "cuts", "lawsuit",
        "investigation", "fraud", "debt", "default", "bankruptcy", "recession"
    ]
    
    // MARK: - Analyze
    
    func analyze(symbol: String) async throws -> HermesResult {
        let headlines = try await fetchHeadlines(symbol: symbol)
        
        var bullishCount = 0
        var bearishCount = 0
        var foundKeywords: [String: Int] = [:]
        
        for headline in headlines {
            let lower = headline.lowercased()
            
            for keyword in bullishKeywords {
                if lower.contains(keyword) {
                    bullishCount += 1
                    foundKeywords[keyword, default: 0] += 1
                }
            }
            
            for keyword in bearishKeywords {
                if lower.contains(keyword) {
                    bearishCount += 1
                    foundKeywords[keyword, default: 0] += 1
                }
            }
        }
        
        // Calculate score
        let total = bullishCount + bearishCount
        var score = 50.0
        
        if total > 0 {
            let ratio = Double(bullishCount) / Double(total)
            score = ratio * 100
        }
        
        let sentiment = getSentiment(score: score)
        
        return HermesResult(
            score: score,
            sentiment: sentiment,
            headlines: Array(headlines.prefix(5)),
            keywords: foundKeywords
        )
    }
    
    // MARK: - Fetch Headlines (Yahoo Finance RSS)
    
    private func fetchHeadlines(symbol: String) async throws -> [String] {
        // Yahoo Finance doesn't have a direct RSS anymore
        // Use the quote summary instead for news
        let url = URL(string: "https://query1.finance.yahoo.com/v1/finance/search?q=\(symbol)&newsCount=10")!
        
        let (data, _) = try await URLSession.shared.data(from: url)
        
        struct YahooSearch: Codable {
            let news: [NewsItem]?
            
            struct NewsItem: Codable {
                let title: String
            }
        }
        
        let result = try JSONDecoder().decode(YahooSearch.self, from: data)
        return result.news?.map { $0.title } ?? []
    }
    
    // Alternative: Scrape from Yahoo Finance page
    private func fetchHeadlinesAlternative(symbol: String) async throws -> [String] {
        let url = URL(string: "https://finance.yahoo.com/quote/\(symbol)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        
        guard let html = String(data: data, encoding: .utf8) else {
            return []
        }
        
        // Simple regex to find headlines (won't work perfectly)
        var headlines: [String] = []
        let pattern = "<h3[^>]*>([^<]+)</h3>"
        
        if let regex = try? NSRegularExpression(pattern: pattern, options: []) {
            let range = NSRange(html.startIndex..., in: html)
            let matches = regex.matches(in: html, options: [], range: range)
            
            for match in matches.prefix(10) {
                if let r = Range(match.range(at: 1), in: html) {
                    headlines.append(String(html[r]))
                }
            }
        }
        
        return headlines
    }
    
    private func getSentiment(score: Double) -> Sentiment {
        switch score {
        case 80...100: return .veryBullish
        case 60..<80: return .bullish
        case 40..<60: return .neutral
        case 20..<40: return .bearish
        default: return .veryBearish
        }
    }
}
```

---

## UI Bileşeni

```swift
struct HermesCard: View {
    let result: HermesEngine.HermesResult
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "newspaper.fill")
                    .foregroundColor(.cyan)
                Text("Hermes Sentiment")
                    .font(.headline)
                Spacer()
                Text(result.sentiment.rawValue)
                    .font(.caption.bold())
                    .foregroundColor(sentimentColor)
            }
            
            // Score
            HStack {
                Text("Skor")
                Spacer()
                Text("\(Int(result.score))")
                    .font(.title2.bold())
            }
            
            // Headlines
            if !result.headlines.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Son Haberler")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    ForEach(result.headlines.prefix(3), id: \.self) { headline in
                        Text("• \(headline)")
                            .font(.caption2)
                            .lineLimit(2)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
    
    var sentimentColor: Color {
        switch result.sentiment {
        case .veryBullish, .bullish: return .green
        case .neutral: return .gray
        case .bearish, .veryBearish: return .red
        }
    }
}
```

---

## Kullanım

```swift
let result = try await HermesEngine.shared.analyze(symbol: "AAPL")

print("Sentiment: \(result.sentiment.rawValue)")
print("Score: \(result.score)")
print("Top Keywords: \(result.keywords)")
```

---

## Not

Hermes basit keyword matching kullanır. Daha gelişmiş sentiment için:

- LLM (GPT/Claude) entegrasyonu
- FinBERT gibi fine-tuned modeller
- Twitter/Reddit API entegrasyonu

---

*Sonraki: `07_demeter.md` →*
