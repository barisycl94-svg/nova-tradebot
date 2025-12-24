# 🤖 Nova Trading Bot - GitHub Actions Kurulumu

## Otomatik Arka Plan Analizi

Bu proje, GitHub Actions kullanarak **ücretsiz** olarak arka planda çalışan bir trading bot içeriyor.

### ✨ Özellikler

- ⏰ **Her 15 dakikada** bir otomatik analiz
- 📊 Top 10 coin için teknik analiz (RSI, SMA, Trend)
- 📱 Güçlü sinyal bulunursa **Telegram'a bildirim**
- 💰 **Tamamen ücretsiz** (GitHub Actions)

---

## 🚀 Kurulum

### 1. GitHub Secrets Ekle

Repository ayarlarından **Settings → Secrets and variables → Actions** sayfasına git:

| Secret Name | Değer |
|-------------|-------|
| `TELEGRAM_BOT_TOKEN` | BotFather'dan aldığın token |
| `TELEGRAM_CHAT_ID` | Telegram chat ID |

### 2. Telegram Bot Oluşturma

1. Telegram'da **@BotFather** ile konuş
2. `/newbot` komutu ile yeni bot oluştur
3. Bot token'ı kopyala
4. **@userinfobot** veya **@raw_data_bot** ile Chat ID öğren

### 3. Actions'ı Aktif Et

GitHub repo sayfasında **Actions** sekmesine git ve workflow'u aktif et.

---

## 📅 Çalışma Zamanlaması

| Özellik | Açıklama |
|---------|----------|
| Analiz Sıklığı | Her 15 dakika |
| Telegram Sinyal | Güçlü AL/SAT bulunursa |
| Telegram Özet | Her 4 saatte |
| Manuel Tetikleme | Actions → Run workflow |

---

## 📊 Analiz Edilen Coinler

- BTC, ETH, BNB, SOL, XRP
- ADA, AVAX, DOT, MATIC, LINK

---

## 🔔 Sinyal Türleri

| Sinyal | Skor | Açıklama |
|--------|------|----------|
| 🟢 STRONG_BUY | ≥75 | Güçlü alım fırsatı |
| 🟢 BUY | ≥60 | Alım fırsatı |
| ⚪ HOLD | 40-60 | Bekle |
| 🔴 SELL | ≤40 | Satış düşün |
| 🔴 STRONG_SELL | ≤25 | Güçlü satış sinyali |

---

## ⚙️ Kullanılan İndikatörler

- **RSI (14)** - Aşırı alım/satım
- **SMA 20** - Kısa vadeli trend
- **SMA 50** - Orta vadeli trend
- **24s Değişim** - Momentum

---

## 📱 Telegram Mesaj Örnekleri

### Güçlü Sinyal
```
🤖 NOVA BOT - 1 GÜÇLÜ SİNYAL

🟢 BTC
   💰 Fiyat: $45,000
   📊 Sinyal: STRONG_BUY
   🎯 Skor: 78/100
   📈 24s: +3.5%
```

### 4 Saatlik Özet
```
📊 NOVA 4 SAATLIK ÖZET

🟢 En İyi Fırsatlar:
• SOL: 72/100 ($95.50)
• ETH: 68/100 ($2,350)
• AVAX: 65/100 ($38.20)

🔴 Dikkat Edilmesi Gerekenler:
• XRP: 35/100
• DOT: 38/100
```

---

## 💡 Limitler

GitHub Actions ücretsiz plan:
- **2000 dakika/ay** (private repo için)
- **Sınırsız** (public repo için)

Her çalışma ~30 saniye sürer:
- Günde 96 çalışma × 0.5 dk = 48 dk/gün
- Ayda ~1500 dk kullanım (limitin altında ✅)

---

## 🛠️ Özelleştirme

### Daha fazla coin eklemek
`.github/workflows/trading-bot.yml` dosyasında WATCHLIST dizisini düzenle.

### Analiz sıklığını değiştirmek
```yaml
on:
  schedule:
    - cron: '*/30 * * * *'  # 30 dakikada bir
```

---

## 📞 Destek

Sorun yaşarsan:
1. Actions sekmesinden logları kontrol et
2. Secrets'ların doğru eklendiğinden emin ol
3. Telegram bot'un aktif olduğunu doğrula
