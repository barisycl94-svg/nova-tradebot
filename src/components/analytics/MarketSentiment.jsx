/**
 * MarketSentiment.jsx
 * Nova TradeBot - Piyasa Duyarlılığı Göstergesi
 */

import React from 'react';

export const MarketSentiment = ({ sentiment }) => {
    if (!sentiment) return null;

    const { score, mood, description, btcChange, avgChange } = sentiment;

    const getScoreColor = () => {
        if (score > 70) return 'var(--success)';
        if (score > 55) return '#a3ff12';
        if (score < 30) return 'var(--accent)';
        if (score < 45) return '#ffaa00';
        return 'var(--primary)';
    };

    return (
        <div className="glass-panel" style={{
            padding: '1.25rem',
            marginBottom: '1.5rem',
            borderLeft: `5px solid ${getScoreColor()}`,
            background: `linear-gradient(90deg, ${getScoreColor()}0a, transparent)`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🌐</span>
                    <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '1px' }}>PİYASA DUYARLILIĞI</h3>
                </div>
                <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    color: getScoreColor(),
                    fontFamily: 'JetBrains Mono, monospace'
                }}>
                    %{score.toFixed(0)}
                </div>
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: getScoreColor(), marginBottom: '4px' }}>
                {mood}
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {description}
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{
                    flex: 1,
                    padding: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <span style={{ color: 'var(--text-muted)' }}>BTC 24S</span>
                    <span style={{ color: btcChange >= 0 ? 'var(--success)' : 'var(--accent)', fontWeight: 'bold' }}>
                        {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                    </span>
                </div>
                <div style={{
                    flex: 1,
                    padding: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <span style={{ color: 'var(--text-muted)' }}>Piyasa Ort.</span>
                    <span style={{ color: avgChange >= 0 ? 'var(--success)' : 'var(--accent)', fontWeight: 'bold' }}>
                        {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                    </span>
                </div>
            </div>
        </div>
    );
};
