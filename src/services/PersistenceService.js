/**
 * PersistenceService.js
 * Nova TradeBot - Veri Saklama Katmanı (Browser-Only)
 * 
 * Tarayıcıda localStorage kullanır.
 * Node.js desteği kaldırıldı (Vercel build uyumluluğu için)
 */

class PersistenceService {
    constructor() {
        this.isNode = typeof window === 'undefined';
    }

    getItem(key) {
        if (this.isNode) {
            return null; // Node.js'de localStorage yok
        }
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error('localStorage getItem error:', e);
            return null;
        }
    }

    setItem(key, value) {
        if (this.isNode) {
            return; // Node.js'de localStorage yok
        }
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('localStorage setItem error:', e);
        }
    }

    removeItem(key) {
        if (this.isNode) {
            return;
        }
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('localStorage removeItem error:', e);
        }
    }

    /**
     * Browser ortamında public/db.json dosyasından verileri çekip localStorage'ı günceller
     * Bu metod asenkrondur ve UI tarafından çağrılmalıdır.
     */
    async syncFromPublic() {
        if (this.isNode) return false;

        try {
            const response = await fetch('/db.json?t=' + Date.now()); // Cache-busting
            if (!response.ok) return false;

            const remoteData = await response.json();
            let hasChanges = false;

            Object.keys(remoteData).forEach(key => {
                const localVal = localStorage.getItem(key);
                const remoteVal = typeof remoteData[key] === 'string' ? remoteData[key] : JSON.stringify(remoteData[key]);

                if (localVal !== remoteVal) {
                    localStorage.setItem(key, remoteVal);
                    hasChanges = true;
                }
            });

            return hasChanges;
        } catch (e) {
            console.warn('Sync failed:', e);
            return false;
        }
    }
}

export const persistence = new PersistenceService();
