# ⚖️ YASAL UYARI & SORUMLULUK REDDİ

> **ÖNEMLİ:** Bu dokümanı okumadan ve kabul etmeden uygulamayı KULLANMAYINIZ.

---

## 🚨 KRİTİK UYARILAR

1. **YATIRIM TAVSİYESİ DEĞİLDİR**
   - Argus Trading System ve tüm modülleri (Atlas, Orion, Phoenix, vb.) **eğitim ve araştırma amaçlıdır**.
   - Bu sistem **yatırım tavsiyesi, alım-satım önerisi veya finansal danışmanlık** sağlamaz.
   - Üretilen skorlar, sinyaller ve analizler **bilgi amaçlıdır, alım-satım emri değildir**.

2. **GERÇEK PARA İLE KULLANMAYIN**
   - Bu sistem **paper trading** (simülasyon) için tasarlanmıştır.
   - Gerçek para ile yapılan işlemlerin **tüm riski size aittir**.
   - Geliştirici, gerçek para kayıplarından **hiçbir şekilde sorumlu değildir**.

3. **GEÇMİŞ PERFORMANS GELECEĞİ GARANTİLEMEZ**
   - Backtest sonuçları **geçmiş verilere** dayanır.
   - Geçmiş performans, **gelecekteki sonuçları garanti etmez**.

---

## 📜 SORUMLULUK REDDİ (DISCLAIMER)

```
SORUMLULUK REDDİ:

Bu yazılım "OLDUĞU GİBİ" sağlanmaktadır ve hiçbir garanti içermez.
Geliştirici(ler), bu yazılımın kullanımından doğabilecek doğrudan veya 
dolaylı zararlardan (kâr kaybı, veri kaybı, finansal kayıp dahil ancak 
bunlarla sınırlı olmaksızın) hiçbir şekilde sorumlu tutulamaz.

Bu yazılımı kullanarak aşağıdakileri kabul etmiş sayılırsınız:
- Tüm yatırım kararlarının kendi sorumluluğunuzda olduğunu
- Bu yazılımın profesyonel finansal danışmanlık yerine geçmediğini
- Gerçek para ile işlem yapmadan önce lisanslı bir danışmana başvurmanız gerektiğini
- Geliştirici(ler)in hiçbir mali sonuçtan sorumlu olmadığını

UYARI: Borsa ve finansal piyasalarda işlem yapmak yüksek risk içerir.
Kaybetmeyi göze alamayacağınız paralarla işlem yapmayınız.
```

---

## 🛡️ SWIFT IMPLEMENTASYONU

### 1. Onay Ekranı (İlk Açılışta)

```swift
import SwiftUI

struct DisclaimerView: View {
    @AppStorage("hasAcceptedDisclaimer") private var hasAccepted = false
    @State private var showApp = false
    @State private var scrolledToBottom = false
    
    var body: some View {
        if hasAccepted || showApp {
            ContentView()
        } else {
            disclaimerContent
        }
    }
    
    var disclaimerContent: some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.orange)
                
                Text("YASAL UYARI")
                    .font(.title.bold())
                
                Text("Devam etmeden önce aşağıdaki uyarıyı okuyunuz")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 40)
            
            // Disclaimer Text
            ScrollView {
                ScrollViewReader { proxy in
                    VStack(alignment: .leading, spacing: 16) {
                        disclaimerText
                        
                        Color.clear
                            .frame(height: 1)
                            .id("bottom")
                            .onAppear {
                                scrolledToBottom = true
                            }
                    }
                    .padding()
                }
            }
            .frame(maxHeight: 400)
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .padding(.horizontal)
            
            // Checkboxes
            VStack(spacing: 12) {
                CheckboxRow(
                    text: "Bu yazılımın yatırım tavsiyesi olmadığını anlıyorum",
                    isChecked: $check1
                )
                
                CheckboxRow(
                    text: "Tüm finansal riskleri kabul ediyorum",
                    isChecked: $check2
                )
                
                CheckboxRow(
                    text: "Sorumluluk reddini okudum ve kabul ediyorum",
                    isChecked: $check3
                )
            }
            .padding(.horizontal)
            
            // Accept Button
            Button {
                hasAccepted = true
                showApp = true
            } label: {
                Text("KABUL EDİYORUM")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(allChecked ? Color.blue : Color.gray)
                    .cornerRadius(12)
            }
            .disabled(!allChecked)
            .padding(.horizontal)
            .padding(.bottom, 30)
        }
    }
    
    @State private var check1 = false
    @State private var check2 = false
    @State private var check3 = false
    
    var allChecked: Bool {
        check1 && check2 && check3
    }
    
    var disclaimerText: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("⚠️ ÖNEMLİ UYARI")
                .font(.headline)
                .foregroundColor(.orange)
            
            Text("""
            Bu uygulama (Argus Trading System) YALNIZCA eğitim ve araştırma amaçlıdır.
            
            • Bu uygulama yatırım tavsiyesi DEĞİLDİR
            • Üretilen sinyaller alım-satım emri DEĞİLDİR
            • Geçmiş performans gelecek sonuçları GARANTİLEMEZ
            • Gerçek para ile işlem yapmanız ÖNERİLMEZ
            
            Finansal piyasalarda işlem yapmak yüksek risk içerir. 
            Kaybetmeyi göze alamayacağınız paralarla işlem yapmayınız.
            
            Bu yazılımı kullanarak, olası tüm finansal kayıpların 
            sorumluluğunun size ait olduğunu kabul etmiş sayılırsınız.
            
            Yatırım kararları vermeden önce lisanslı bir finansal 
            danışmana başvurmanız şiddetle tavsiye edilir.
            """)
            .font(.subheadline)
            .foregroundColor(.primary)
        }
    }
}

struct CheckboxRow: View {
    let text: String
    @Binding var isChecked: Bool
    
    var body: some View {
        Button {
            isChecked.toggle()
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: isChecked ? "checkmark.square.fill" : "square")
                    .foregroundColor(isChecked ? .blue : .gray)
                    .font(.title3)
                
                Text(text)
                    .font(.subheadline)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.leading)
                
                Spacer()
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}
```

---

### 2. Ayarlarda Görünen Disclaimer

```swift
// SettingsView.swift içine eklenecek

struct SettingsDisclaimerSection: View {
    @State private var showFullDisclaimer = false
    
    var body: some View {
        Section {
            // Warning banner
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Yasal Uyarı")
                        .font(.subheadline.bold())
                    Text("Bu uygulama yatırım tavsiyesi değildir")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            .padding(.vertical, 4)
            
            // Full disclaimer button
            Button {
                showFullDisclaimer = true
            } label: {
                HStack {
                    Text("Tam Sorumluluk Reddini Görüntüle")
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                }
            }
            .foregroundColor(.primary)
            
        } header: {
            Text("Yasal")
        } footer: {
            Text("Bu uygulama eğitim amaçlıdır. Gerçek para ile işlem yapmak yüksek risk içerir.")
        }
        .sheet(isPresented: $showFullDisclaimer) {
            FullDisclaimerSheet()
        }
    }
}

struct FullDisclaimerSheet: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    
                    Group {
                        Text("⚠️ YATIRIM TAVSİYESİ DEĞİLDİR")
                            .font(.headline)
                            .foregroundColor(.orange)
                        
                        Text("""
                        Argus Trading System ve tüm modülleri (Atlas, Orion, Phoenix, Aether, Chiron, vb.) yalnızca eğitim ve araştırma amaçlıdır.
                        
                        Bu sistem yatırım tavsiyesi, alım-satım önerisi veya finansal danışmanlık sağlamaz. Üretilen skorlar, sinyaller ve analizler bilgi amaçlıdır ve alım-satım emri olarak değerlendirilmemelidir.
                        """)
                    }
                    
                    Divider()
                    
                    Group {
                        Text("🚫 GERÇEK PARA İLE KULLANMAYIN")
                            .font(.headline)
                            .foregroundColor(.red)
                        
                        Text("""
                        Bu sistem paper trading (simülasyon) için tasarlanmıştır. Gerçek para ile yapılan işlemlerin tüm riski size aittir.
                        
                        Geliştirici(ler), gerçek para ile yapılan işlemlerden kaynaklanan kayıplardan hiçbir şekilde sorumlu değildir.
                        """)
                    }
                    
                    Divider()
                    
                    Group {
                        Text("📊 GEÇMİŞ PERFORMANS")
                            .font(.headline)
                            .foregroundColor(.yellow)
                        
                        Text("""
                        Backtest sonuçları geçmiş verilere dayanır. Geçmiş performans, gelecekteki sonuçları garanti etmez.
                        
                        Piyasa koşulları sürekli değişir ve herhangi bir trading stratejisi her zaman kârlı olamaz.
                        """)
                    }
                    
                    Divider()
                    
                    Group {
                        Text("📜 SORUMLULUK REDDİ")
                            .font(.headline)
                        
                        Text("""
                        Bu yazılım "OLDUĞU GİBİ" sağlanmaktadır ve hiçbir garanti içermez.
                        
                        Geliştirici(ler), bu yazılımın kullanımından doğabilecek doğrudan veya dolaylı zararlardan (kâr kaybı, veri kaybı, finansal kayıp dahil ancak bunlarla sınırlı olmaksızın) hiçbir şekilde sorumlu tutulamaz.
                        
                        Bu yazılımı kullanarak:
                        • Tüm yatırım kararlarının kendi sorumluluğunuzda olduğunu
                        • Bu yazılımın profesyonel finansal danışmanlık yerine geçmediğini
                        • Gerçek işlem yapmadan önce lisanslı bir danışmana başvurmanız gerektiğini
                        • Geliştirici(ler)in hiçbir mali sonuçtan sorumlu olmadığını
                        
                        KABUL ETMİŞ SAYILIRSINIZ.
                        """)
                        .font(.footnote)
                    }
                    
                }
                .padding()
            }
            .navigationTitle("Yasal Uyarı")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Kapat") {
                        dismiss()
                    }
                }
            }
        }
    }
}
```

---

### 3. App Entry Point Güncellemesi

```swift
// Algo_TradingApp.swift

@main
struct Algo_TradingApp: App {
    var body: some Scene {
        WindowGroup {
            DisclaimerView() // ContentView yerine bu
        }
    }
}
```

---

### 4. Her Analizde Küçük Uyarı

```swift
// Herhangi bir score card'ının altına eklenebilir
struct MiniDisclaimer: View {
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "info.circle")
                .font(.caption2)
            Text("Yatırım tavsiyesi değildir")
                .font(.caption2)
        }
        .foregroundColor(.secondary)
        .padding(.top, 4)
    }
}
```

---

## ✅ KULLANICI AKIŞI

```
App Açılış
    ↓
┌─────────────────────────┐
│   YASAL UYARI EKRANI    │
│                         │
│   ⚠️ Disclaimer metni   │
│                         │
│   ☐ Anlıyorum           │
│   ☐ Kabul ediyorum      │
│   ☐ Okudum              │
│                         │
│   [KABUL EDİYORUM]      │
└─────────────────────────┘
    ↓ (3 checkbox işaretli)
┌─────────────────────────┐
│      ANA UYGULAMA       │
│                         │
│  Ayarlar → Yasal Uyarı  │
│  (her zaman erişilebilir)│
└─────────────────────────┘
```

---

**Bu dosya olmazsa diğer promptları KULLANMAYINIZ.**
