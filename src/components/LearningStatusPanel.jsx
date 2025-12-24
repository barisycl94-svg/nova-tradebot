/**
 * LearningStatusPanel.jsx
 * Nova TradeBot - Öğrenme Durumu Paneli
 * 
 * Bot'un öğrenme durumunu, backtest sonuçlarını ve
 * modül performanslarını görsel olarak gösterir.
 */

import React, { useState, useEffect } from 'react';
import { learningEngine } from '../services/learning/LearningEngine.js';
import { backtestRunner } from '../services/learning/BacktestRunner.js';
import { formatPercent } from '../utils/Formatters.js';

export const LearningStatusPanel = () => {
    const [summary, setSummary] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // İlk değerleri al
        setSummary(learningEngine.getSummary());

        // Değişikliklere abone ol
        const unsubscribe = learningEngine.subscribe((newSummary) => {
            setSummary(newSummary);
        });

        return () => unsubscribe();
    }, []);

    if (!summary) return null;

    const moduleStats = Object.values(learningEngine.moduleStats);
    const hasLearning = moduleStats.some(m => m.totalTrades > 0);

    return (
        <div className="glass-panel" style={{
            padding: '1rem',
            marginBottom: '1rem',
            borderLeft: '4px solid var(--primary)'
        }}>
            {/* Başlık */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🧠</span>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>Öğrenme Sistemi</h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {hasLearning
                                ? `${summary.totalTradesAnalyzed} işlem öğrenildi`
                                : 'Öğrenme henüz başlamadı'
                            }
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Backtest Durumu */}
                    {summary.isBacktesting && (
                        <div style={{
                            padding: '4px 10px',
                            background: 'rgba(0, 243, 255, 0.15)',
                            borderRadius: '15px',
                            fontSize: '0.75rem',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span className="spinner" style={{
                                width: '10px',
                                height: '10px',
                                border: '2px solid var(--primary)',
                                borderTop: '2px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></span>
                            Backtest: {summary.backtestProgress}%
                        </div>
                    )}

                    {/* Genel Başarı */}
                    {hasLearning && (
                        <div style={{
                            padding: '4px 10px',
                            background: summary.overallSuccessRate >= 0.5
                                ? 'rgba(0, 255, 157, 0.15)'
                                : 'rgba(255, 0, 85, 0.15)',
                            borderRadius: '15px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: summary.overallSuccessRate >= 0.5 ? 'var(--success)' : 'var(--accent)'
                        }}>
                            {formatPercent(summary.overallSuccessRate * 100)} Başarı
                        </div>
                    )}

                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {isExpanded ? '▴' : '▾'}
                    </span>
                </div>
            </div>

            {/* Genişletilebilir İçerik */}
            {isExpanded && (
                <div style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {/* Modül Performansları */}
                    {moduleStats.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginBottom: '10px',
                                letterSpacing: '1px'
                            }}>
                                MODÜL PERFORMANSLARI
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {moduleStats
                                    .sort((a, b) => b.successRate - a.successRate)
                                    .map(module => (
                                        <ModuleBar
                                            key={module.name}
                                            module={module}
                                        />
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    {/* Backtest Sonuçları */}
                    {summary.backtestResults && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginBottom: '10px',
                                letterSpacing: '1px'
                            }}>
                                SON BACKTEST SONUÇLARI
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '10px'
                            }}>
                                <StatBox
                                    label="Test Edilen"
                                    value={summary.backtestResults.symbolsTested}
                                    suffix=" sembol"
                                />
                                <StatBox
                                    label="Toplam İşlem"
                                    value={summary.backtestResults.totalTrades}
                                />
                                <StatBox
                                    label="Başarı Oranı"
                                    value={(summary.backtestResults.successRate * 100).toFixed(1)}
                                    suffix="%"
                                    color={summary.backtestResults.successRate >= 0.5 ? 'var(--success)' : 'var(--accent)'}
                                />
                                <StatBox
                                    label="Ort. Kâr"
                                    value={summary.backtestResults.avgProfitPerTrade?.toFixed(2) || '0'}
                                    suffix="%"
                                    color={summary.backtestResults.avgProfitPerTrade >= 0 ? 'var(--success)' : 'var(--accent)'}
                                />
                            </div>

                            <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                marginTop: '8px',
                                textAlign: 'right'
                            }}>
                                Son güncelleme: {new Date(summary.backtestResults.endTime).toLocaleString('tr-TR')}
                            </div>
                        </div>
                    )}

                    {/* Manuel Backtest Butonu */}
                    <button
                        className="btn"
                        disabled={summary.isBacktesting}
                        onClick={() => backtestRunner.triggerManualBacktest()}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: summary.isBacktesting ? 'rgba(0,0,0,0.3)' : 'rgba(0, 243, 255, 0.1)',
                            border: '1px solid var(--primary)',
                            color: 'var(--primary)',
                            opacity: summary.isBacktesting ? 0.5 : 1,
                            cursor: summary.isBacktesting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {summary.isBacktesting
                            ? `🔄 Backtest Devam Ediyor (${summary.backtestProgress}%)`
                            : '🔬 Manuel Backtest Başlat'
                        }
                    </button>
                </div>
            )}

            {/* CSS Animation for spinner */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

// Modül performans çubuğu
const ModuleBar = ({ module }) => {
    const getModuleColor = (name) => {
        const colors = {
            'Orion': '#00f3ff',
            'Atlas': '#f0b90b',
            'Aether': '#8b5cf6',
            'Phoenix': '#ff6b35'
        };
        return colors[name] || 'var(--primary)';
    };

    const color = getModuleColor(module.name);
    const successPercent = module.successRate * 100;
    const weightPercent = module.weight * 100;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            borderLeft: `3px solid ${color}`
        }}>
            <div style={{ minWidth: '80px', fontWeight: 'bold', color }}>
                {module.name}
            </div>

            {/* Başarı Çubuğu */}
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                <div style={{
                    width: `${successPercent}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}, ${successPercent >= 50 ? 'var(--success)' : 'var(--accent)'})`,
                    borderRadius: '4px',
                    transition: 'width 0.5s'
                }}></div>
            </div>

            <div style={{
                minWidth: '80px',
                textAlign: 'right',
                fontSize: '0.8rem',
                color: successPercent >= 50 ? 'var(--success)' : 'var(--accent)'
            }}>
                {successPercent.toFixed(1)}%
            </div>

            <div style={{
                minWidth: '60px',
                textAlign: 'right',
                fontSize: '0.7rem',
                color: 'var(--text-muted)'
            }}>
                Ağırlık: {weightPercent.toFixed(0)}%
            </div>

            <div style={{
                minWidth: '50px',
                textAlign: 'right',
                fontSize: '0.7rem',
                color: 'var(--text-muted)'
            }}>
                {module.totalTrades} işlem
            </div>
        </div>
    );
};

// İstatistik kutusu
const StatBox = ({ label, value, suffix = '', color = '#fff' }) => (
    <div style={{
        padding: '10px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {label}
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color, fontFamily: 'JetBrains Mono, monospace' }}>
            {value}{suffix}
        </div>
    </div>
);

export default LearningStatusPanel;
