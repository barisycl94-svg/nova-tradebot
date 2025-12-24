/**
 * MarketView.jsx
 * Nova TradeBot - Piyasa Görünümü (Gerçek Fiyatlar)
 */

import React, { useState, useEffect } from 'react';
import { StockCard } from '../../components/StockCard.jsx';
import { realMarketDataService } from '../../services/RealMarketDataProvider.js';
import { tradingViewModel } from '../../viewmodels/TradingViewModel.js';

import { MarketSentiment } from '../../components/analytics/MarketSentiment.jsx';
import { AtlasEngine } from '../../services/engines/AtlasEngine.js';

export const MarketView = ({ onSelectStock }) => {
    const [quotes, setQuotes] = useState({});
    const [sentiment, setSentiment] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'crypto', 'stock'
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        realMarketDataService.startStreaming();
        const unsub = realMarketDataService.subscribe((newQuotes) => {
            setQuotes({ ...newQuotes });
            // Duyarlılık Güncelle
            setSentiment(AtlasEngine.getGlobalSentiment());
        });
        return unsub;
    }, []);

    // Filtreleme
    const getFilteredSymbols = () => {
        let symbols = Object.keys(quotes);

        // Tip filtresi
        if (filter === 'crypto') {
            symbols = symbols.filter(s => quotes[s]?.type === 'crypto');
        } else if (filter === 'stock') {
            symbols = symbols.filter(s => quotes[s]?.type === 'stock');
        }

        // Arama filtresi
        if (searchQuery) {
            const q = searchQuery.toUpperCase();
            symbols = symbols.filter(s => s.includes(q));
        }

        // En yüksek değişenler üste
        symbols.sort((a, b) => Math.abs(quotes[b]?.changePercent || 0) - Math.abs(quotes[a]?.changePercent || 0));

        return symbols.slice(0, 50); // İlk 50
    };

    const filteredSymbols = getFilteredSymbols();

    return (
        <div className="container" style={{ padding: '20px 0' }}>
            <MarketSentiment sentiment={sentiment} />

            {/* Arama ve Filtreler */}
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="Sembol Ara... (BTC, AAPL, TSLA)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(0,0,0,0.3)',
                        color: '#fff',
                        outline: 'none',
                        marginBottom: '1rem'
                    }}
                />

                {/* Filtre Butonları */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    {['all', 'crypto', 'stock'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: filter === f ? 'none' : '1px solid var(--border-color)',
                                background: filter === f ? 'var(--primary)' : 'transparent',
                                color: filter === f ? '#000' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontWeight: filter === f ? 'bold' : 'normal'
                            }}
                        >
                            {f === 'all' ? 'Tümü' : f === 'crypto' ? '₿ Kripto' : '📈 Hisse'}
                        </button>
                    ))}
                </div>
            </div>

            {/* İstatistik */}
            <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Toplam {Object.keys(quotes).length} varlık izleniyor • Gösterilen: {filteredSymbols.length}
            </div>

            {/* Liste */}
            <div>
                {filteredSymbols.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                        Veri yükleniyor veya eşleşen sonuç yok...
                    </div>
                ) : (
                    filteredSymbols.map(symbol => {
                        const data = quotes[symbol];
                        return (
                            <StockCard
                                key={symbol}
                                symbol={symbol}
                                price={data?.price || 0}
                                changePercent={data?.changePercent || 0}
                                onClick={() => onSelectStock(symbol)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};
