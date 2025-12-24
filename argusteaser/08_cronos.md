# ⏰ CRONOS - Zamanlama Motoru

## Konsept

Cronos, zaman tanrısıdır. Bu modül, zamanlama faktörlerini (earnings, seasonality, market hours) analiz eder.

## Prompt

> Bana bir iOS SwiftUI uygulaması için zamanlama analiz motoru yaz:
>
> 1. Earnings takvimi kontrolü
> 2. Mevsimsellik analizi
> 3. Hafta içi/hafta sonu kontrolü
>
> Yahoo Finance verileriyle çalışsın.

---

## Swift Implementasyonu

```swift
import Foundation

// MARK: - Cronos Timing Engine
class CronosEngine {
    static let shared = CronosEngine()
    
    private init() {}
    
    struct CronosResult {
        let score: Double
        let isEarningsSoon: Bool
        let daysToEarnings: Int?
        let seasonality: SeasonalitySignal
        let tradingDay: TradingDay
        let warnings: [String]
    }
    
    enum SeasonalitySignal: String {
        case bullish = "Yükseliş Döneminde"
        case bearish = "Düşüş Döneminde"
        case neutral = "Nötr"
    }
    
    enum TradingDay: String {
        case regular = "Normal"
        case monday = "Pazartesi (Dikkat)"
        case friday = "Cuma (Pozisyon Kapat?)"
        case weekend = "Piyasa Kapalı"
    }
    
    // MARK: - Seasonal Patterns (S&P 500 historical)
    
    private let monthlyReturns: [Int: Double] = [
        1: 1.0,   // Ocak - January Effect
        2: -0.3,  // Şubat
        3: 1.2,   // Mart
        4: 1.5,   // Nisan - Strong
        5: 0.3,   // Mayıs - Sell in May?
        6: -0.1,  // Haziran
        7: 1.0,   // Temmuz
        8: -0.1,  // Ağustos
        9: -0.5,  // Eylül - Worst month
        10: 0.8,  // Ekim - Volatil ama genelde pozitif
        11: 1.5,  // Kasım - Strong
        12: 1.3   // Aralık - Santa Rally
    ]
    
    // MARK: - Analyze
    
    func analyze(symbol: String) async throws -> CronosResult {
        var score = 50.0
        var warnings: [String] = []
        
        // 1. Earnings check
        let (isEarningsSoon, daysToEarnings) = try await checkEarnings(symbol: symbol)
        if isEarningsSoon {
            warnings.append("⚠️ Earnings yaklaşıyor (\(daysToEarnings ?? 0) gün)")
            score -= 10 // Risk factor
        }
        
        // 2. Seasonality
        let month = Calendar.current.component(.month, from: Date())
        let seasonality = getSeasonality(month: month)
        
        if let monthReturn = monthlyReturns[month] {
            if monthReturn > 1.0 {
                score += 15
            } else if monthReturn > 0 {
                score += 5
            } else {
                score -= 10
            }
        }
        
        // 3. Day of week
        let weekday = Calendar.current.component(.weekday, from: Date())
        let tradingDay = getTradingDay(weekday: weekday)
        
        switch tradingDay {
        case .weekend:
            warnings.append("Piyasa kapalı")
        case .monday:
            warnings.append("Pazartesi - açılış volatil olabilir")
        case .friday:
            warnings.append("Cuma - hafta sonu riski")
        default:
            break
        }
        
        // 4. Month-end effect (last 3 days typically bullish)
        let day = Calendar.current.component(.day, from: Date())
        if day >= 28 {
            score += 5
        }
        
        return CronosResult(
            score: min(100, max(0, score)),
            isEarningsSoon: isEarningsSoon,
            daysToEarnings: daysToEarnings,
            seasonality: seasonality,
            tradingDay: tradingDay,
            warnings: warnings
        )
    }
    
    private func checkEarnings(symbol: String) async throws -> (Bool, Int?) {
        // Try to fetch earnings date from Yahoo Finance
        let url = URL(string: "https://query1.finance.yahoo.com/v10/finance/quoteSummary/\(symbol)?modules=calendarEvents")!
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            
            struct EarningsResponse: Codable {
                let quoteSummary: QuoteSummary?
                
                struct QuoteSummary: Codable {
                    let result: [Result]?
                    
                    struct Result: Codable {
                        let calendarEvents: CalendarEvents?
                        
                        struct CalendarEvents: Codable {
                            let earnings: Earnings?
                            
                            struct Earnings: Codable {
                                let earningsDate: [EarningsDate]?
                                
                                struct EarningsDate: Codable {
                                    let raw: Int? // Unix timestamp
                                }
                            }
                        }
                    }
                }
            }
            
            let response = try JSONDecoder().decode(EarningsResponse.self, from: data)
            
            if let timestamp = response.quoteSummary?.result?.first?.calendarEvents?.earnings?.earningsDate?.first?.raw {
                let earningsDate = Date(timeIntervalSince1970: TimeInterval(timestamp))
                let days = Calendar.current.dateComponents([.day], from: Date(), to: earningsDate).day ?? 0
                
                // Consider "soon" if within 14 days
                return (days > 0 && days <= 14, days)
            }
        } catch {
            // Silently fail - earnings data not always available
        }
        
        return (false, nil)
    }
    
    private func getSeasonality(month: Int) -> SeasonalitySignal {
        guard let returns = monthlyReturns[month] else { return .neutral }
        
        if returns >= 1.0 { return .bullish }
        if returns < 0 { return .bearish }
        return .neutral
    }
    
    private func getTradingDay(weekday: Int) -> TradingDay {
        switch weekday {
        case 1: return .weekend // Sunday
        case 2: return .monday
        case 6: return .friday
        case 7: return .weekend // Saturday
        default: return .regular
        }
    }
}
```

---

## Kullanım

```swift
let result = try await CronosEngine.shared.analyze(symbol: "AAPL")

print("Score: \(result.score)")
print("Seasonality: \(result.seasonality.rawValue)")

if result.isEarningsSoon {
    print("⚠️ Earnings in \(result.daysToEarnings ?? 0) days")
}
```

---

*Sonraki: `09_athena.md` →*
