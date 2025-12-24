/**
 * CronosEngine.js
 * Zamanlama ve Mevsimsellik Motoru
 * Argus 08_cronos.md'den uyarlandı
 * 
 * Kripto piyasası için optimize edildi (7/24 açık ama hafta sonu düşük likidite)
 */

export class CronosEngine {

    // Kripto için aylık ortalama getiriler (BTC tarihsel verilerinden derlenmiş)
    static MONTHLY_RETURNS = {
        1: 1.2,   // Ocak - January Effect
        2: 0.8,   // Şubat
        3: -0.5,  // Mart - Geleneksel düşüş
        4: 1.8,   // Nisan - Güçlü
        5: -1.2,  // Mayıs - "Sell in May"
        6: -0.8,  // Haziran
        7: 0.5,   // Temmuz - Toparlanma
        8: -0.3,  // Ağustos - Yaz durgunluğu
        9: -1.5,  // Eylül - En kötü ay (tarihsel)
        10: 2.0,  // Ekim - "Uptober"
        11: 2.5,  // Kasım - Çok güçlü
        12: 1.5   // Aralık - Rally sezonu
    };

    // Haftanın günleri (0=Pazar, 6=Cumartesi)
    static DAY_FACTORS = {
        0: 0.7,   // Pazar - Düşük likidite
        1: 1.1,   // Pazartesi - Hareketli açılış
        2: 1.0,   // Salı
        3: 1.0,   // Çarşamba
        4: 1.0,   // Perşembe
        5: 0.9,   // Cuma - Hafta sonu öncesi temkinli
        6: 0.8    // Cumartesi - Düşük likidite
    };

    /**
     * Mevcut zamanlama analizini yapar
     * @returns {Object} { score, seasonality, warnings, recommendation }
     */
    static analyze() {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const dayOfWeek = now.getDay(); // 0-6
        const hour = now.getUTCHours();
        const dayOfMonth = now.getDate();

        let score = 50;
        const warnings = [];
        let seasonalitySignal = 'NEUTRAL';

        // 1. Mevsimsellik Analizi (Aylık)
        const monthlyReturn = this.MONTHLY_RETURNS[month] || 0;
        if (monthlyReturn >= 1.5) {
            score += 15;
            seasonalitySignal = 'BULLISH';
        } else if (monthlyReturn >= 0.5) {
            score += 8;
            seasonalitySignal = 'SLIGHTLY_BULLISH';
        } else if (monthlyReturn < -0.5) {
            score -= 12;
            seasonalitySignal = 'BEARISH';
            warnings.push(`⚠️ Tarihsel olarak ${this.getMonthName(month)} ayı zayıf (-${Math.abs(monthlyReturn).toFixed(1)}% ort.)`);
        }

        // 2. Gün Faktörü
        const dayFactor = this.DAY_FACTORS[dayOfWeek];
        if (dayFactor < 0.9) {
            score -= 8;
            warnings.push(`⏰ ${this.getDayName(dayOfWeek)} - Düşük likidite riski`);
        }

        // 3. Saat Analizi (UTC bazlı)
        // Kripto için en aktif saatler: 13:00-21:00 UTC (ABD/Avrupa çakışması)
        const isLowActivityHour = hour >= 0 && hour < 6; // Asya açık ama Batı kapalı
        if (isLowActivityHour && (dayOfWeek === 0 || dayOfWeek === 6)) {
            score -= 10;
            warnings.push('🌙 Hafta sonu gece saatleri - Manipülasyon riski yüksek');
        }

        // 4. Ay Sonu Etkisi (Son 3 gün genelde hareketli)
        if (dayOfMonth >= 28) {
            score += 5;
        }

        // 5. Çeyrek Sonu Etkisi (Mart, Haziran, Eylül, Aralık)
        const isQuarterEnd = [3, 6, 9, 12].includes(month) && dayOfMonth >= 25;
        if (isQuarterEnd) {
            warnings.push('📊 Çeyrek sonu - Kurumsal yeniden dengeleme olabilir');
        }

        // Skorun normalizasyonu
        score = Math.max(0, Math.min(100, score));

        // Öneri üret
        let recommendation = 'NORMAL';
        if (score >= 65) {
            recommendation = 'FAVORABLE';
        } else if (score <= 35) {
            recommendation = 'CAUTION';
        }

        return {
            score,
            seasonality: seasonalitySignal,
            monthlyTrend: monthlyReturn,
            dayFactor,
            currentHour: hour,
            warnings,
            recommendation,
            details: {
                month: this.getMonthName(month),
                day: this.getDayName(dayOfWeek),
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
                isLowLiquidity: isLowActivityHour
            }
        };
    }

    /**
     * Trade için uygun zaman mı kontrol eder
     * @returns {boolean}
     */
    static isGoodTimeToTrade() {
        const analysis = this.analyze();
        return analysis.score >= 45 && analysis.warnings.length < 2;
    }

    /**
     * Zamanlama ceza/bonus çarpanı döndürür (0.7 - 1.2 arası)
     */
    static getTimingMultiplier() {
        const analysis = this.analyze();
        // 50 = 1.0, 100 = 1.2, 0 = 0.7
        return 0.7 + (analysis.score / 100) * 0.5;
    }

    static getMonthName(month) {
        const months = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return months[month];
    }

    static getDayName(day) {
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        return days[day];
    }
}
