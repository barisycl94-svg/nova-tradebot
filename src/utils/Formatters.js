/**
 * Formatters.js
 * Nova TradeBot - Yardımcı Araçlar
 * 
 * Para birimi ve sayı formatlama işlemleri.
 */

/**
 * Fiyata göre uygun ondalık hane sayısını belirler
 * Düşük fiyatlı coinler için daha fazla hane gösterir
 */
export const getDecimalPlaces = (value) => {
    if (value === undefined || value === null || value === 0) return 2;

    const absValue = Math.abs(value);

    if (absValue >= 1000) return 2;      // $1000+ → 2 hane
    if (absValue >= 1) return 4;          // $1-1000 → 4 hane
    if (absValue >= 0.01) return 6;       // $0.01-1 → 6 hane
    if (absValue >= 0.0001) return 8;     // $0.0001-0.01 → 8 hane
    return 10;                            // Çok küçük değerler → 10 hane
};

/**
 * Fiyat formatlayıcı - dinamik ondalık hane
 * Örn: $97,234.12 veya $0.00001234
 */
export const formatPrice = (value, currency = 'USD') => {
    if (value === undefined || value === null) return '-';

    const decimals = getDecimalPlaces(value);

    // Çok küçük değerler için özel format
    if (Math.abs(value) < 0.01) {
        const prefix = currency === 'USD' ? '$' : '';
        return `${prefix}${value.toFixed(decimals)}`;
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};

// Para birimi formatlayıcı (Örn: $1,234.56) - büyük değerler için
export const formatCurrency = (value, currency = 'USD') => {
    if (value === undefined || value === null) return '-';

    // Küçük değerler için dinamik formatlama kullan
    if (Math.abs(value) < 1 && value !== 0) {
        return formatPrice(value, currency);
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

/**
 * Yüzdelik değişim formatlayıcı.
 * Renk için CSS class döndürmez, sadece string döndürür.
 * Örn: "+5.12%" veya "-1.20%"
 */
export const formatPercent = (value) => {
    if (value === undefined || value === null) return '-';

    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
};

/**
 * Büyük sayıları (Piyasa Değeri gibi) kısaltır.
 * Örn: 1.2M, 4.5B
 */
export const formatCompactNumber = (number) => {
    if (!number) return '0';
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(number);
};
