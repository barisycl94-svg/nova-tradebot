/**
 * HistoryView.jsx
 * Nova TradeBot - İşlem Geçmişi Görünümü
 */

import React, { useState, useEffect } from 'react';
import { tradingViewModel } from '../../viewmodels/TradingViewModel.js';
import { formatCurrency, formatPercent, formatPrice } from '../../utils/Formatters.js';
import { TradeDetailCard } from '../../components/TradeDetailCard.jsx';

export const HistoryView = () => {
    const [state, setState] = useState(tradingViewModel._getState());
    const [expandedTradeId, setExpandedTradeId] = useState(null);

    useEffect(() => {
        const unsubscribe = tradingViewModel.subscribe((newState) => setState(newState));
        return () => unsubscribe();
    }, []);

    const closedTrades = state.portfolio
        .filter(t => !t.isOpen)
        .sort((a, b) => new Date(b.exitDate || b.date) - new Date(a.exitDate || a.date));

    return (
        <div className="container" style={{ padding: '20px 0' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: 'var(--warning)', fontSize: '2rem' }}>📜</span>
                İşlem Geçmişi
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                    ({closedTrades.length} kapanmış işlem)
                </span>
            </h2>

            {closedTrades.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📜</div>
                    <div>Henüz kapatılmış bir işlem bulunmuyor.</div>
                    <p style={{ fontSize: '0.9rem' }}>İşlemler sonuçlandığında tüm detaylarıyla burada listelenecek.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {closedTrades.map(trade => (
                        <TradeDetailCard
                            key={trade.id}
                            trade={trade}
                            currentPrice={trade.exitPrice} // Geçmiş olduğu için çıkış fiyatı anlık fiyat kabul edilir
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryView;
