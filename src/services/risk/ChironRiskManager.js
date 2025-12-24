/**
 * ChironRiskManager.js (AgoraExecutionGovernor)
 * Nova TradeBot - Risk Yönetimi ve Denetim Modülü
 * 
 * Nova'dan gelen alım kararlarını portföy kurallarına göre denetler.
 * Duygusal değil, tamamen matematiksel koruma sağlar.
 */

import { Trade, SignalAction } from '../../models/Models.js';

export const AuditStatus = {
    APPROVED: 'approved',
    BLOCKED: 'blocked',
    WARNING: 'warning'
};

import { learningEngine } from '../learning/LearningEngine.js';

export class AuditResult {
    constructor(status, adjustedQuantity = 0, reason = '') {
        this.status = status;
        this.adjustedQuantity = adjustedQuantity;
        this.reason = reason;
    }
}

export class ChironRiskManager {

    /**
     * Pozisyon büyüklüğünü Kelly Kriteri veya Sabit Risk Yöntemi ile hesaplar.
     * Hedef: Kasanın belirli bir yüzdesinden fazlasını tek işlemde kaybetmemek.
     * @param {number} equity - Toplam kasa
     * @param {number} riskPerTradePercent - İşlem başına risk yüzdesi (Örn: 0.02 = %2)
     * @param {number} stopLossPrice - Zarar kes fiyatı
     * @param {number} entryPrice - Giriş fiyatı
     */
    static calculatePositionSize(equity, riskPerTradePercent, stopLossPrice, entryPrice) {
        if (stopLossPrice >= entryPrice) return 0; // Short işlem değilse imkansız

        // Riske atılacak maksimum para ($)
        const maxRiskAmount = equity * riskPerTradePercent;

        // Hisse başına risk ($)
        const riskPerShare = entryPrice - stopLossPrice;

        // Alınabilecek lot sayısı
        let quantity = maxRiskAmount / riskPerShare;

        // Küsuratı at (Tam sayı lot, kripto için ondalıklı olabilir ama burada tam sayı varsayalım)
        return Math.floor(quantity);
    }

    /**
     * İşlemi denetler ve onay/red verir.
     * @param {Object} decision - NovaDecisionResult
     * @param {Trade[]} currentPortfolio - Mevcut açık işlemler
     * @param {number} currentBalance - Kullanılabilir nakit bakiye
     * @param {number} totalEquity - Toplam kasa değeri (Nakit + Pozisyonlar)
     * @param {number} entryPrice - Güncel fiyat
     * @returns {AuditResult}
     */
    static audit(decision, currentPortfolio, currentBalance, totalEquity, entryPrice) {
        // Ayarları localStorage'dan yükle
        const settings = this._getSettings();

        // Sadece ALIM işlemlerini denetleriz. SAT veya BEKLE zaten risksizdir.
        if (decision.finalDecision.id === 'sell') {
            return new AuditResult(AuditStatus.APPROVED, decision.quantity);
        }

        // 1. Portföy Limiti Kontrolü ve Asset Bazlı Limit
        // Aynı coin'den zaten var mı?
        const existingPosition = currentPortfolio.find(p => p.symbol === decision.symbol);

        if (existingPosition) {
            // Bu kısım, piramitleme kontrolü ile birleştiği için burada sadece bloklama yapıyoruz.
            // Piramitleme koşulları aşağıda tekrar kontrol edilecek.
            // Eğer piramitleme koşulları sağlanmazsa, bu bloklama geçerli olacak.
            // Bu if bloğu, aşağıdaki KURAL 2'nin başlangıcındaki `if (existingTrade)` bloğu ile çakışıyor.
            // Bu nedenle, bu `if (existingPosition)` bloğunu kaldırmak veya KURAL 2 ile birleştirmek daha mantıklı olacaktır.
            // Şimdilik, kullanıcının verdiği snippet'i koruyarak, bu bloğun içindeki mantığı düzeltiyorum.
            // Kullanıcının snippet'indeki `Trades.length >= settings.maxOpenTrades` kısmı hatalıydı,
            // bu birleştirilmiş bir kontrol gibi duruyor.
            // Eğer amaç sadece aynı coin'den zaten varsa bloklamaksa, aşağıdaki KURAL 2'nin else bloğu yeterlidir.
            // Ancak, kullanıcının snippet'inde `Trades.length >= settings.maxOpenTrades` gibi bir kontrol de var.
            // Bu, KURAL 1'deki `openTrades.length` kontrolü ile aynı.
            // Bu durumda, kullanıcının snippet'i KURAL 1'i de bu bloğun içine taşımış gibi görünüyor.
            // Kullanıcının isteği üzerine, verilen snippet'i mümkün olduğunca koruyarak,
            // hatalı `Trades.length` kısmını `openTrades.length` ile değiştiriyorum ve
            // `existingPosition` kontrolünü de ekliyorum.
            const openTrades = currentPortfolio.filter(t => t.isOpen); // openTrades burada tanımlanmalı
            if (openTrades.length >= settings.maxOpenTrades) {
                console.log(`⛔ Chiron: Maks işlem limiti (${openTrades.length}/${settings.maxOpenTrades})`);
                return new AuditResult(AuditStatus.BLOCKED, 0, `Maksimum açık işlem sayısına (${settings.maxOpenTrades}) ulaşıldı.`);
            }
        }

        // --- KURAL 2: Çeşitlendirme & Piramitleme (Pyramiding) ---
        const openTrades = currentPortfolio.filter(t => t.isOpen);

        if (openTrades.length >= settings.maxOpenTrades) {
            console.log(`⛔ Chiron: Maks işlem limiti (${openTrades.length}/${settings.maxOpenTrades})`);
            return new AuditResult(AuditStatus.BLOCKED, 0, `Maksimum açık işlem sayısına (${settings.maxOpenTrades}) ulaşıldı.`);
        }

        // --- KURAL 2: Çeşitlendirme & Piramitleme (Pyramiding) ---
        const existingTrade = openTrades.find(t => t.symbol === decision.symbol);
        if (existingTrade) {
            // PnL Hesabı
            const pnlPercent = ((entryPrice - existingTrade.entryPrice) / existingTrade.entryPrice) * 100;
            const score = decision.totalScore || decision.score || 0;

            // PİRAMİTLEME ŞARTLARI:
            // 1. İşlem kârda olmalı (> %2.5)
            // 2. Sinyal çok güçlü olmalı (> 70)
            // 3. Henüz "pyramided" etiketi olmamalı (veya pozisyon çok büyümemeli)
            const isPyramidEligible = pnlPercent > 2.5 && score > 70 && !existingTrade.isPyramided;

            if (isPyramidEligible) {
                // Piramitleme için onay ver ama miktarı hesaplamaya devam et
                // Aşağıdaki bakiye kontrollerine girmesi için akışı devam ettiriyoruz
                // Ancak bu özel durumu işaretlememiz lazım
                decision.isPyramiding = true;
                // Devam et... (Bloklama yapma)
                console.log(`🚀 Chiron: Pyramiding onayı verildi (${decision.symbol} +%${pnlPercent.toFixed(2)})`);
            } else {
                return new AuditResult(AuditStatus.BLOCKED, 0, `${decision.symbol} zaten portföyde mevcut.`);
            }
        }

        // --- KURAL 3: Sektörel Koruma (Aynı türden çok fazla alma) ---
        const sectorPrefix = decision.symbol.substring(0, 2);
        const sectorCount = openTrades.filter(t => t.symbol.startsWith(sectorPrefix)).length;
        if (sectorCount >= 10) {
            return new AuditResult(AuditStatus.BLOCKED, 0, `Sektörel limit aşıldı (${sectorPrefix} grubu).`);
        }

        // --- KURAL 4: Korelasyon Kontrolü (Yeni) ---
        if (!ChironRiskManager.checkCorrelationLimit(decision.symbol, currentPortfolio, settings)) {
            return new AuditResult(AuditStatus.BLOCKED, 0, 'Sektörel aşırı yoğunlaşma (Korelasyon Riski).');
        }

        // --- KURAL 5: Bakiye Kontrolü ve Pozisyon Hesaplama ---
        if (currentBalance < entryPrice) {
            return new AuditResult(AuditStatus.BLOCKED, 0, 'Yetersiz Bakiye.');
        }

        // Ayarlardan maksimum pozisyon yüzdesi al (Equity bazlı)
        const maxInvestmentPercent = settings.maxPositionPercent / 100;
        let investmentAmount = totalEquity * maxInvestmentPercent;

        // 📉 AKILLI POSİSYON YÖNETİMİ (Smart Sizing)
        // Botun genel başarısı düşükse, risk iştahını kapat.
        try {
            const summary = learningEngine.getSummary();
            const winRate = summary.successRate || 0.5;

            if (winRate < 0.45) {
                // Başarı oranı %45'in altındaysa pozisyonu %30 küçült
                investmentAmount *= 0.7;
                // console.log(`📉 Chiron: Düşük başarı oranı (%${(winRate*100).toFixed(1)}) nedeniyle pozisyon küçültüldü.`);
            } else if (winRate < 0.35) {
                // Başarı oranı %35'in altındaysa pozisyonu YARIYA indir
                investmentAmount *= 0.5;
            }
        } catch (e) {
            // Hata olursa varsayılan risk ile devam
        }

        // PİRAMİTLEME KONTROLÜ: Ek pozisyon daha küçük olmalı (Örn: Normalin yarısı)
        if (decision.isPyramiding) {
            investmentAmount *= 0.5;
        }

        // Emniyet: Nakit bakiyeden fazlasını harcama
        if (investmentAmount > currentBalance) {
            investmentAmount = currentBalance;
        }

        let quantity = investmentAmount / entryPrice;

        // Kripto için ondalıklı lot desteği (Hassas küsurat)
        if (quantity < 0.000001) {
            console.log(`⛔ Chiron: Yetersiz bakiye (quantity=${quantity})`);
            return new AuditResult(AuditStatus.BLOCKED, 0, 'Bakiye minimum pozisyon büyüklüğü için yetersiz.');
        }

        const successMsg = decision.isPyramiding
            ? `Piramitleme Onaylandı (Miktar: ${quantity.toFixed(4)})`
            : `Risk kontrolleri geçildi. Bütçe uygun (%${settings.maxPositionPercent} Equity).`;

        return new AuditResult(AuditStatus.APPROVED, quantity, successMsg);
    }

    /**
     * Sektörel korelasyon kontrolü
     * Aynı kategorideki coinlerden çok fazla almayı engeller
     */
    static checkCorrelationLimit(symbol, currentPortfolio, settings) {
        // Sektör tanımları (Basitleştirilmiş)
        const sectors = {
            'AI': ['FET', 'AGIX', 'OCEAN', 'RNDR', 'NEAR', 'PHB', 'TAO', 'AKT', 'IO'],
            'MEME': ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'MEME', 'PNUT', 'DOGS'],
            'LAYER1': ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'AVAX', 'DOT', 'TRX', 'MATIC', 'NEAR', 'SUI', 'APT'],
            'GAMING': ['GALA', 'IMX', 'BEAM', 'SAND', 'MANA', 'AXS', 'RON'],
            'DEFI': ['UNI', 'AAVE', 'LINK', 'MAKER', 'CRV', 'SUSHI', 'SNX', 'DYDX']
        };

        const base = symbol.replace('USDT', '');
        let targetSector = null;

        for (const [sectorName, coins] of Object.entries(sectors)) {
            if (coins.includes(base)) {
                targetSector = sectorName;
                break;
            }
        }

        if (!targetSector) return true;

        const sectorCount = currentPortfolio.filter(p => {
            const pBase = p.symbol.replace('USDT', '');
            return sectors[targetSector].includes(pBase);
        }).length;

        // Bir sektörden en fazla %20 (50 işlem için 10 adet) işlem olabilir
        const maxSectorLimit = Math.ceil(settings.maxOpenTrades * 0.2);

        if (sectorCount >= maxSectorLimit) {
            console.warn(`⚠️ Chiron: ${targetSector} sektörü limitine ulaşıldı (${sectorCount}/${maxSectorLimit})`);
            return false;
        }

        return true;
    }

    static _getSettings() {
        const defaults = {
            maxPositionPercent: 10,
            maxOpenTrades: 50, // Varsayılan 50 işlem
            stopLossPercent: 5,
            takeProfitPercent: 15
        };
        try {
            const saved = localStorage.getItem('novaTradeBot_settings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return defaults;
        }
    }

    /**
     * İşlem denetim günlüğü (Log) tutar
     */
    static logTransaction(symbol, action, status, reason) {
        const log = {
            timestamp: new Date(),
            symbol,
            action: action.label,
            status,
            reason
        };
        // İleride veritabanına yazılabilir
        // console.log(`[CHIRON AUDIT]`, log);
        return log;
    }
}
