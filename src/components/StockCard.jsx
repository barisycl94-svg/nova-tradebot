/**
 * StockCard.jsx
 * Nova TradeBot - Hisse Kartı Bileşeni
 */

import React from 'react';
import { formatCurrency, formatPercent } from '../utils/Formatters.js';

export const StockCard = ({ symbol, price, changePercent, decision, onClick }) => {
    const isPositive = changePercent >= 0;

    // Karar rengini belirle
    let decisionColor = 'var(--text-muted)';
    let decisionGlow = 'none';

    if (decision) {
        if (decision.label === 'AL') { decisionColor = 'var(--success)'; decisionGlow = '0 0 10px var(--success)'; }
        else if (decision.label === 'SAT') { decisionColor = 'var(--accent)'; decisionGlow = '0 0 10px var(--accent)'; }
        else if (decision.label === 'BEKLE') { decisionColor = 'var(--warning)'; }
        else if (decision.label === 'TUT') { decisionColor = 'var(--primary)'; }
    }

    return (
        <div
            className="glass-panel"
            onClick={onClick}
            style={{
                padding: '1.2rem',
                marginBottom: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{symbol}</h3>
                {decision && (
                    <span style={{
                        color: decisionColor,
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        marginTop: '6px',
                        textShadow: decisionGlow,
                        fontFamily: 'monospace'
                    }}>
                        NOVA: {decision.label}
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(price)}</span>
                <div style={{
                    backgroundColor: isPositive ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 0, 85, 0.15)',
                    color: isPositive ? 'var(--success)' : 'var(--accent)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    marginTop: '4px'
                }}>
                    {formatPercent(changePercent)}
                </div>
            </div>
        </div>
    );
};
