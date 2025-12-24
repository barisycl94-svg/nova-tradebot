/**
 * Models.js
 * Nova TradeBot - Veri Modelleri
 * Bu dosya uygulamanın temel veri yapılarını içerir.
 */

// Browser-safe UUID generation
const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/* -------------------------------------------------------------------------- */
/*                                    ENUMS                                   */
/* -------------------------------------------------------------------------- */

/**
 * İşlem sinyali türleri.
 * Her durumun bir rengi ve metin karşılığı vardır.
 */
export const SignalAction = {
  BUY: {
    id: 'buy',
    label: 'AL',
    color: 'var(--success)', // #00ff9d
    description: 'Varlık satın alımı için güçlü sinyal.'
  },
  SELL: {
    id: 'sell',
    label: 'SAT',
    color: 'var(--accent)', // #ff0055
    description: 'Varlık satışı veya short pozisyon için sinyal.'
  },
  HOLD: {
    id: 'hold',
    label: 'TUT',
    color: 'var(--primary)', // #00f3ff
    description: 'Mevcut pozisyonu koru.'
  },
  WAIT: {
    id: 'wait',
    label: 'BEKLE',
    color: 'var(--warning)', // #ffd700
    description: 'Henüz işlem yapma, piyasayı izle.'
  }
};

/**
 * İşlemin kaynağını belirtir: Manuel veya Otopilot.
 */
export const TradeSource = {
  USER: 'user',        // Manuel işlem
  AUTOPILOT: 'autoPilot' // Algoritmik otomasyon
};

/**
 * Varlık türleri.
 */
export const AssetType = {
  STOCK: 'stock',   // Hisse Senedi
  CRYPTO: 'crypto', // Kripto Para
  ETF: 'etf',       // Borsa Yatırım Fonu
  FOREX: 'forex'    // Döviz Çifti
};

/* -------------------------------------------------------------------------- */
/*                                   CLASSES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Fiyat verisi gösterimi için kullanılan model.
 */
export class DisplayQuote {
  /**
   * @param {string} symbol - Sembol (örn: BTC/USD)
   * @param {number} price - Güncel fiyat
   * @param {number} changePercent - Yüzdelik değişim
   * @param {number} marketCap - Piyasa değeri (Optional)
   */
  constructor(symbol, price, changePercent, marketCap = 0) {
    this.symbol = symbol;
    this.price = price;
    this.changePercent = changePercent;
    this.marketCap = marketCap;
  }
}

/**
 * Grafik verisi için mum çubuğu (Candle).
 */
export class Candle {
  /**
   * @param {string|Date} date - Tarih zaman damgası
   * @param {number} open - Açılış fiyatı
   * @param {number} high - En yüksek fiyat
   * @param {number} low - En düşük fiyat
   * @param {number} close - Kapanış fiyatı
   * @param {number} volume - Hacim
   */
  constructor(date, open, high, low, close, volume) {
    this.id = generateUUID(); // Identifiable
    this.date = new Date(date);
    this.open = open;
    this.high = high;
    this.low = low;
    this.close = close;
    this.volume = volume;
  }
}

/**
 * Arama sonuçları için model.
 */
export class SearchResult {
  /**
   * @param {string} symbol - Sembol
   * @param {string} name - Tam isim
   * @param {string} type - Varlık türü (AssetType)
   */
  constructor(symbol, name, type) {
    this.symbol = symbol;
    this.name = name;
    this.type = type;
  }
}

/**
 * Portföydeki bir işlemi temsil eder.
 */
export class Trade {
  /**
   * @param {string} symbol - Sembol
   * @param {number} entryPrice - Giriş fiyatı
   * @param {number} quantity - Miktar
   * @param {string} source - TradeSource (User/AutoPilot)
   * @param {string} rationale - Karar gerekçesi
   * @param {object} decisionContext - Karar bağlamı (Analiz verileri vb.)
   * @param {number|null} stopLoss - Zarar kes seviyesi (Optional)
   * @param {number|null} takeProfit - Kar al seviyesi (Optional)
   */
  constructor(symbol, entryPrice, quantity, source, rationale, decisionContext, stopLoss = null, takeProfit = null) {
    this.id = generateUUID();
    this.symbol = symbol;
    this.entryPrice = entryPrice;
    this.quantity = quantity;
    this.date = new Date();
    this.isOpen = true; // Varsayılan olarak açık
    this.source = source;

    // Stratejik veriler
    this.stopLoss = stopLoss;
    this.takeProfit = takeProfit;

    // Analitik veriler (Neden bu işlem açıldı?)
    this.rationale = rationale;
    this.decisionContext = decisionContext;
  }

  /**
   * İşlemi kapatır.
   */
  closeTrade() {
    this.isOpen = false;
  }
}
