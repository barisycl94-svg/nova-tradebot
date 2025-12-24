# 👁️ HEIMDALL - Yahoo Finance Provider

## Konsept

Heimdall, dünyaları birleştiren gökkuşağı köprüsünün bekçisidir. Bu modül, veri kaynaklarını yönetir ve Yahoo Finance entegrasyonunu sağlar.

## Prompt

> Bana bir iOS SwiftUI uygulaması için Yahoo Finance veri provider'ı yaz:
>
> 1. Güncel fiyat (quote)
> 2. Tarihi fiyatlar (candles)
> 3. Temel veriler (fundamentals)
> 4. Haber (news)
>
> Ücretsiz Yahoo Finance API kullan. Rate limiting ve caching ekle.

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Models

struct Candle: Identifiable, Codable {
    var id: Date { date }
    let date: Date
    let open: Double
    let high: Double
    let low: Double
    let close: Double
    let volume: Int
}

struct Quote: Codable {
    let symbol: String
    let price: Double
    let change: Double
    let changePercent: Double
    let open: Double?
    let high: Double?
    let low: Double?
    let volume: Int?
    let marketCap: Double?
}

struct Fundamentals: Codable {
    // Profitability
    var roe: Double?
    var profitMargin: Double?
    var operatingMargin: Double?
    
    // Valuation
    var peRatio: Double?
    var priceToBook: Double?
    var evToEbitda: Double?
    
    // Growth
    var revenueGrowth: Double?
    var earningsGrowth: Double?
    var pegRatio: Double?
    
    // Health
    var debtToEquity: Double?
    var currentRatio: Double?
    var interestCoverage: Double?
    
    // Cash
    var freeCashFlowMargin: Double?
    var cashToAssets: Double?
    var payoutRatio: Double?
}

// MARK: - Yahoo Finance Provider

class YahooFinanceProvider {
    static let shared = YahooFinanceProvider()
    
    private let session = URLSession.shared
    private var cache: [String: (data: Any, timestamp: Date)] = [:]
    private let cacheTimeout: TimeInterval = 300 // 5 minutes
    
    private init() {}
    
    // MARK: - Fetch Quote
    
    func fetchQuote(symbol: String) async throws -> Quote {
        let cacheKey = "quote_\(symbol)"
        
        if let cached = getCached(key: cacheKey) as? Quote {
            return cached
        }
        
        let url = URL(string: "https://query1.finance.yahoo.com/v7/finance/quote?symbols=\(symbol)")!
        let (data, _) = try await session.data(from: url)
        
        struct YahooResponse: Codable {
            let quoteResponse: QuoteResponse
            
            struct QuoteResponse: Codable {
                let result: [QuoteResult]
            }
            
            struct QuoteResult: Codable {
                let symbol: String
                let regularMarketPrice: Double?
                let regularMarketChange: Double?
                let regularMarketChangePercent: Double?
                let regularMarketOpen: Double?
                let regularMarketDayHigh: Double?
                let regularMarketDayLow: Double?
                let regularMarketVolume: Int?
                let marketCap: Double?
            }
        }
        
        let response = try JSONDecoder().decode(YahooResponse.self, from: data)
        
        guard let r = response.quoteResponse.result.first else {
            throw URLError(.badServerResponse)
        }
        
        let quote = Quote(
            symbol: r.symbol,
            price: r.regularMarketPrice ?? 0,
            change: r.regularMarketChange ?? 0,
            changePercent: r.regularMarketChangePercent ?? 0,
            open: r.regularMarketOpen,
            high: r.regularMarketDayHigh,
            low: r.regularMarketDayLow,
            volume: r.regularMarketVolume,
            marketCap: r.marketCap
        )
        
        setCache(key: cacheKey, value: quote)
        return quote
    }
    
    // MARK: - Fetch Candles
    
    func fetchCandles(symbol: String, range: String = "1y") async throws -> [Candle] {
        let cacheKey = "candles_\(symbol)_\(range)"
        
        if let cached = getCached(key: cacheKey) as? [Candle] {
            return cached
        }
        
        // Range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max
        // Interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo
        let interval = range.contains("d") ? "15m" : "1d"
        
        let url = URL(string: "https://query1.finance.yahoo.com/v8/finance/chart/\(symbol)?range=\(range)&interval=\(interval)")!
        
        let (data, _) = try await session.data(from: url)
        
        struct YahooChart: Codable {
            let chart: ChartResult
            
            struct ChartResult: Codable {
                let result: [Result]?
                
                struct Result: Codable {
                    let timestamp: [Int]?
                    let indicators: Indicators
                    
                    struct Indicators: Codable {
                        let quote: [QuoteData]
                        
                        struct QuoteData: Codable {
                            let open: [Double?]
                            let high: [Double?]
                            let low: [Double?]
                            let close: [Double?]
                            let volume: [Int?]
                        }
                    }
                }
            }
        }
        
        let response = try JSONDecoder().decode(YahooChart.self, from: data)
        
        guard let result = response.chart.result?.first,
              let timestamps = result.timestamp,
              let quote = result.indicators.quote.first else {
            throw URLError(.badServerResponse)
        }
        
        var candles: [Candle] = []
        
        for i in 0..<timestamps.count {
            guard let open = quote.open[i],
                  let high = quote.high[i],
                  let low = quote.low[i],
                  let close = quote.close[i],
                  let volume = quote.volume[i] else { continue }
            
            let candle = Candle(
                date: Date(timeIntervalSince1970: TimeInterval(timestamps[i])),
                open: open,
                high: high,
                low: low,
                close: close,
                volume: volume
            )
            candles.append(candle)
        }
        
        setCache(key: cacheKey, value: candles)
        return candles
    }
    
    // MARK: - Fetch Fundamentals
    
    func fetchFundamentals(symbol: String) async throws -> Fundamentals {
        let cacheKey = "fundamentals_\(symbol)"
        
        if let cached = getCached(key: cacheKey) as? Fundamentals {
            return cached
        }
        
        let modules = "financialData,defaultKeyStatistics,summaryDetail"
        let url = URL(string: "https://query1.finance.yahoo.com/v10/finance/quoteSummary/\(symbol)?modules=\(modules)")!
        
        let (data, _) = try await session.data(from: url)
        
        // Parse the complex response
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let quoteSummary = json?["quoteSummary"] as? [String: Any]
        let result = (quoteSummary?["result"] as? [[String: Any]])?.first
        
        let financialData = result?["financialData"] as? [String: Any]
        let keyStats = result?["defaultKeyStatistics"] as? [String: Any]
        let summaryDetail = result?["summaryDetail"] as? [String: Any]
        
        let fundamentals = Fundamentals(
            roe: extractRaw(financialData?["returnOnEquity"]),
            profitMargin: extractRaw(financialData?["profitMargins"]),
            operatingMargin: extractRaw(financialData?["operatingMargins"]),
            peRatio: extractRaw(summaryDetail?["trailingPE"]),
            priceToBook: extractRaw(keyStats?["priceToBook"]),
            evToEbitda: extractRaw(keyStats?["enterpriseToEbitda"]),
            revenueGrowth: extractRaw(financialData?["revenueGrowth"]),
            earningsGrowth: extractRaw(financialData?["earningsGrowth"]),
            pegRatio: extractRaw(keyStats?["pegRatio"]),
            debtToEquity: extractRaw(financialData?["debtToEquity"]),
            currentRatio: extractRaw(financialData?["currentRatio"]),
            interestCoverage: nil,
            freeCashFlowMargin: extractRaw(financialData?["freeCashflow"]),
            cashToAssets: nil,
            payoutRatio: extractRaw(summaryDetail?["payoutRatio"])
        )
        
        setCache(key: cacheKey, value: fundamentals)
        return fundamentals
    }
    
    private func extractRaw(_ value: Any?) -> Double? {
        guard let dict = value as? [String: Any],
              let raw = dict["raw"] as? Double else { return nil }
        return raw
    }
    
    // MARK: - Caching
    
    private func getCached(key: String) -> Any? {
        guard let cached = cache[key] else { return nil }
        
        if Date().timeIntervalSince(cached.timestamp) > cacheTimeout {
            cache.removeValue(forKey: key)
            return nil
        }
        
        return cached.data
    }
    
    private func setCache(key: String, value: Any) {
        cache[key] = (data: value, timestamp: Date())
    }
}
```

---

## Symbol Mapping

```swift
// Türk hisseleri için suffix ekleme
extension YahooFinanceProvider {
    func resolveSymbol(_ input: String) -> String {
        let upper = input.uppercased()
        
        // Already formatted
        if upper.hasSuffix(".IS") || upper.hasSuffix(".E") {
            return upper
        }
        
        // Known Turkish stocks
        let turkishStocks = ["THYAO", "GARAN", "AKBNK", "SISE", "KCHOL", "BIMAS"]
        
        if turkishStocks.contains(upper) {
            return "\(upper).IS"
        }
        
        return upper
    }
}
```

---

## Kullanım

```swift
// Fiyat
let quote = try await YahooFinanceProvider.shared.fetchQuote(symbol: "AAPL")
print("Price: $\(quote.price)")

// Candles
let candles = try await YahooFinanceProvider.shared.fetchCandles(symbol: "AAPL", range: "1y")
print("Candle count: \(candles.count)")

// Fundamentals
let fundamentals = try await YahooFinanceProvider.shared.fetchFundamentals(symbol: "AAPL")
print("P/E: \(fundamentals.peRatio ?? 0)")
```

---

*Sonraki: `12_argus.md` →*
