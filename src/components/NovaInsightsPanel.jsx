/**
 * NovaInsightsPanel.jsx
 * Nova TradeBot - Akıllı Analiz ve Piyasa Duyarlılığı Paneli
 */

import React, { useState, useEffect } from 'react';
import { AtlasEngine } from '../services/engines/AtlasEngine.js';
import { learningEngine } from '../services/learning/LearningEngine.js';
import { formatPercent } from '../utils/Formatters.js';
import { CyberInsightIcon } from './ui/CyberBadgeIcons.jsx';

export const NovaInsightsPanel = () => {
    const [sentiment, setSentiment] = useState(null);
    const [learningSummary, setLearningSummary] = useState(null);

    useEffect(() => {
        const updateInsights = () => {
            setSentiment(AtlasEngine.getGlobalSentiment());
            setLearningSummary(learningEngine.getSummary());
        };

        updateInsights();
        const interval = setInterval(updateInsights, 5000); // 5 saniyede bir güncelle

        return () => clearInterval(interval);
    }, []);

    if (!sentiment) return null;

    const getSentimentColor = (score) => {
        if (score > 70) return 'var(--success)';
        if (score > 55) return '#00f3ff';
        if (score < 30) return 'var(--accent)';
        if (score < 45) return 'var(--warning)';
        return 'var(--text-muted)';
    };

    return (
        <div className="glass-panel" style={{
            padding: '1.2rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(15, 17, 38, 0.4) 0%, rgba(10, 8, 25, 0.6) 100%)',
            borderRight: `4px solid ${getSentimentColor(sentiment.score)}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CyberInsightIcon />
                    <h4 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        letterSpacing: '2px',
                        background: 'linear-gradient(135deg, #ffd700 0%, #ff9900 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
                        fontWeight: '800'
                    }}>
                        NOVA INSIGHTS
                    </h4>
                </div>
                <div style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-muted)'
                }}>
                    Yapay Zeka Analizi
                </div>
            </div>

            {/* Piyasa Duyarlılığı Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(120px, 1fr) 2fr',
                gap: '1.5rem',
                alignItems: 'center'
            }}>
                {/* Sentiment Score Circular Gauge (Simple) */}
                <div style={{ textAlign: 'center', position: 'relative' }}>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        border: '4px solid rgba(255,255,255,0.1)',
                        borderTop: `4px solid ${getSentimentColor(sentiment.score)}`,
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: `rotate(${sentiment.score * 3.6}deg)`,
                        transition: 'transform 1s ease-in-out'
                    }}>
                        <div style={{
                            transform: `rotate(-${sentiment.score * 3.6}deg)`,
                            fontWeight: 'bold',
                            fontSize: '1.1rem'
                        }}>
                            {Math.round(sentiment.score)}
                        </div>
                    </div>
                    <div style={{ fontSize: '0.65rem', marginTop: '6px', color: 'var(--text-muted)' }}>GENEL PUAN</div>
                </div>

                {/* Sentiment Text */}
                <div>
                    <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: getSentimentColor(sentiment.score),
                        marginBottom: '4px'
                    }}>
                        {sentiment.mood}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-white)', opacity: 0.8, lineHeight: '1.4' }}>
                        {sentiment.description}
                    </div>
                </div>
            </div>

            {/* Stat Row */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '4px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <MiniStat label="BTC 24S" value={formatPercent(sentiment.btcChange)} color={sentiment.btcChange >= 0 ? 'var(--success)' : 'var(--accent)'} />
                <MiniStat label="PİYASA ORT." value={formatPercent(sentiment.avgChange)} color={sentiment.avgChange >= 0 ? 'var(--success)' : 'var(--accent)'} />
                {learningSummary && (
                    <MiniStat
                        label="SİSTEM BAŞARISI"
                        value={formatPercent(learningSummary.overallSuccessRate * 100)}
                        color={learningSummary.overallSuccessRate >= 0.5 ? 'var(--success)' : 'var(--accent)'}
                    />
                )}
            </div>

            {/* Learning Insight (Conditional) */}
            {learningSummary && learningSummary.bestModule && (
                <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(0, 243, 255, 0.8)',
                    background: 'rgba(0, 243, 255, 0.05)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontStyle: 'italic'
                }}>
                    💡 En güvenilir modül: <strong>{learningSummary.bestModule.name}</strong> ({formatPercent(learningSummary.bestModule.successRate * 100)} başarı). Bu modülün ağırlığı artırıldı.
                </div>
            )}
        </div>
    );
};

const MiniStat = ({ label, value, color }) => (
    <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color, fontFamily: 'monospace' }}>{value}</div>
    </div>
);
