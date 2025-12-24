/**
 * LearningDashboard.jsx
 * Nova TradeBot - Öğrenme ve Yapay Zeka Gösterge Paneli
 */

import React, { useState, useEffect } from 'react';
import { learningEngine } from '../../services/learning/LearningEngine.js';
import { formatPercent } from '../../utils/Formatters.js';
import { realMarketDataService } from '../../services/RealMarketDataProvider.js';
import { persistence } from '../../services/PersistenceService.js';
import { CyberBrainIcon } from '../ui/CyberBadgeIcons.jsx';

export const LearningDashboard = () => {
    const [summary, setSummary] = useState(learningEngine.getSummary());
    const [apiStatus, setApiStatus] = useState({ isBlocked: false, remainingMin: 0 });

    useEffect(() => {
        // İlk açılışta verileri senkronize et
        const syncData = async () => {
            const hasChanges = await persistence.syncFromPublic();
            if (hasChanges) {
                learningEngine.reload();
            }
        };
        syncData();

        const timer = setInterval(() => {
            if (realMarketDataService.isBlocked) {
                const diff = realMarketDataService.blockExpiry - Date.now();
                setApiStatus({
                    isBlocked: true,
                    remainingMin: Math.max(0, Math.ceil(diff / 60000))
                });
            } else {
                setApiStatus({ isBlocked: false, remainingMin: 0 });
            }
        }, 5000);

        const unsub = learningEngine.subscribe((newSummary) => {
            setSummary(newSummary);
        });
        return () => {
            unsub();
            clearInterval(timer);
        };
    }, []);

    const topIndicators = learningEngine.getTopIndicators(5);
    const weights = learningEngine.getModuleWeights();

    const getModuleColor = (id) => {
        const colors = { Orion: '#00f3ff', Atlas: '#f0b90b', Phoenix: '#ff6b35', Aether: '#8b5cf6' };
        return colors[id] || 'var(--primary)';
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CyberBrainIcon />
                    <div>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.2rem',
                            background: 'linear-gradient(135deg, #ff00cc 0%, #aa49ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 10px rgba(255, 0, 204, 0.3))',
                            letterSpacing: '1px',
                            fontWeight: '800'
                        }}>NOVA DERİN ÖĞRENME</h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', letterSpacing: '1px', marginTop: '4px' }}>YAPAY ZEKA ÇEKİRDEĞİ AKTİF</div>
                    </div>
                </div>
                {summary.isBacktesting && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginBottom: '4px' }}>BACKTEST DEVAM EDİYOR...</div>
                        <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${summary.backtestProgress}%`, height: '100%', background: 'var(--warning)', transition: 'width 0.3s' }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* API DURUMU (BOT TESPİTİ KORUMASI) */}
            {apiStatus.isBlocked && (
                <div style={{
                    padding: '10px 15px',
                    background: 'rgba(255, 0, 85, 0.1)',
                    border: '1px solid var(--accent)',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                        ⚠️ BINANCE BAĞLANTISI KISITLANDI ({apiStatus.remainingMin} dk bekleyin)
                    </div>
                    <button
                        onClick={() => {
                            realMarketDataService.isBlocked = false;
                            setApiStatus({ isBlocked: false, remainingMin: 0 });
                        }}
                        style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                        Zorla Yenile
                    </button>
                </div>
            )}

            {!apiStatus.isBlocked && (
                <div style={{
                    padding: '8px 12px',
                    background: 'rgba(0, 255, 157, 0.05)',
                    border: '1px solid rgba(0, 255, 157, 0.2)',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }}></div>
                    Binance Bağlantısı Güvenli (Endpoint Rotasyonu Aktif)
                </div>
            )}

            {/* İstatistik Özetleri */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <StatCard label="Öğrenilen İndikatör" value={summary.totalIndicators} icon="📈" />
                <StatCard label="Analiz Edilen İşlem" value={summary.totalTradesAnalyzed} icon="🔍" />
                <StatCard label="Başarı Oranı" value={formatPercent(summary.overallSuccessRate * 100)} icon="🎯" />
                <StatCard label="Profit Factor" value={summary.profitFactor} icon="💰" />
            </div>

            {/* Dinamik Ağırlıklar */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 'bold' }}>
                    MODÜL AĞIRLIKLARI (DİNAMİK)
                </div>
                <div style={{ display: 'flex', gap: '6px', height: '20px', borderRadius: '10px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                    {Object.entries(weights).map(([id, weight]) => (
                        <div
                            key={id}
                            style={{
                                width: `${weight * 100}%`,
                                background: getModuleColor(id),
                                transition: 'width 0.5s ease-in-out'
                            }}
                            title={`${id}: %${(weight * 100).toFixed(0)}`}
                        />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem' }}>
                    {Object.entries(weights).map(([id, weight]) => (
                        <span key={id} style={{ color: getModuleColor(id) }}>{id} (%{(weight * 100).toFixed(0)})</span>
                    ))}
                </div>
            </div>

            {/* En Başarılı İndikatörler */}
            {topIndicators.length > 0 && (
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 'bold' }}>
                        EN BAŞARILI STRATEJİLER
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {topIndicators.map((ind, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '6px',
                                borderLeft: `2px solid ${ind.successRate > 0.6 ? 'var(--success)' : 'var(--warning)'}`
                            }}>
                                <span style={{ fontSize: '0.85rem' }}>{ind.name}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: ind.successRate > 0.6 ? 'var(--success)' : 'var(--primary)' }}>
                                    {formatPercent(ind.successRate * 100)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon }) => (
    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '1.5rem' }}>{icon}</div>
        <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
        </div>
    </div>
);
