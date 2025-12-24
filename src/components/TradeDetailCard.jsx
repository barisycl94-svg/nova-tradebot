/**
 * TradeDetailCard.jsx
 * Nova TradeBot - Detaylı İşlem Açıklama Kartı
 */

import React, { useState } from 'react';
import { formatCurrency, formatPercent, formatPrice } from '../utils/Formatters.js';
import { SignalAction } from '../models/Models.js';
import { CyberStopLossIcon, CyberTakeProfitIcon } from './ui/CyberBadgeIcons.jsx';

// İkon bileşenleri
const getVoteIcon = (signal) => {
    if (signal === SignalAction.BUY || signal?.label === 'AL' || signal?.label === 'GÜÇLÜ AL') {
        return <span style={{ color: 'var(--success)' }}>👍</span>;
    } else if (signal === SignalAction.SELL || signal?.label === 'SAT' || signal?.label === 'GÜÇLÜ SAT') {
        return <span style={{ color: 'var(--accent)' }}>👎</span>;
    }
    return <span style={{ color: 'var(--warning)' }}>✋</span>;
};

export const TradeDetailCard = ({ trade, currentPrice, onClose }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const entryPrice = trade.entryPrice || 0;
    const exitPrice = trade.exitPrice || currentPrice || entryPrice;
    const quantity = trade.quantity || 0;

    const pnl = (exitPrice - entryPrice) * quantity;
    const pnlPercent = entryPrice > 0 ? ((exitPrice - entryPrice) / entryPrice) * 100 : 0;
    const isProfit = pnl >= 0;

    const decisionContext = trade.decisionContext || {};
    // Sadece Konsey üyelerini göster, 250+ teknik detayı arka planda tut
    const traces = (decisionContext.traces || []).filter(t => !t.moduleId?.startsWith('Ind-'));

    // Modül grupları
    const getModuleColor = (moduleId) => {
        const colors = {
            'Orion': '#00f3ff',
            'Atlas': '#f0b90b',
            'Aether': '#8b5cf6',
            'Phoenix': '#ff6b35',
            'Hermes': '#10b981',
            'Chiron': '#ec4899'
        };
        return colors[moduleId?.split('-')[0]] || 'var(--primary)';
    };

    const positionValue = (currentPrice || entryPrice) * quantity;
    const costBasis = entryPrice * quantity;

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: `4px solid ${isProfit ? 'var(--success)' : 'var(--accent)'}` }}>
            {/* Başlık */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {trade.symbol}
                        <span style={{
                            fontSize: '0.7rem',
                            padding: '3px 8px',
                            background: trade.isOpen ? 'var(--success)' : 'var(--text-muted)',
                            color: '#000',
                            borderRadius: '4px'
                        }}>
                            {trade.isOpen ? 'AÇIK' : 'KAPALI'}
                        </span>
                    </h3>
                </div>

                {/* PnL */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: isProfit ? 'var(--success)' : 'var(--accent)',
                        fontFamily: 'JetBrains Mono, monospace'
                    }}>
                        {isProfit ? '+' : ''}{formatCurrency(pnl)}
                    </div>
                    <div style={{ color: isProfit ? 'var(--success)' : 'var(--accent)', fontSize: '0.9rem' }}>
                        {formatPercent(pnlPercent)}
                    </div>
                </div>
            </div>

            {/* Detay Bilgi Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '1rem',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px'
            }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ANLIK FİYAT</div>
                    <div style={{ fontSize: '1rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>
                        {formatPrice(currentPrice || entryPrice)}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>GİRİŞ FİYATI</div>
                    <div style={{ fontSize: '1rem', fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatPrice(entryPrice)}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>MİKTAR</div>
                    <div style={{ fontSize: '1rem', fontFamily: 'JetBrains Mono, monospace' }}>
                        {quantity.toLocaleString()} Lot
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>POZİSYON DEĞERİ</div>
                    <div style={{ fontSize: '1rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--warning)' }}>
                        {formatCurrency(positionValue)}
                    </div>
                </div>
            </div>

            {/* SL/TP Bilgisi */}
            {trade.isOpen && (trade.stopLossPercent || trade.takeProfitPercent) && (
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1rem',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ padding: '6px 12px', background: 'rgba(255, 0, 85, 0.15)', borderRadius: '6px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CyberStopLossIcon />
                        <span style={{ fontWeight: 'bold' }}>SL: -{trade.stopLossPercent?.toFixed(1)}%</span>
                    </div>
                    <div style={{ padding: '6px 12px', background: 'rgba(0, 255, 157, 0.15)', borderRadius: '6px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CyberTakeProfitIcon />
                        <span style={{ fontWeight: 'bold' }}>TP: +{trade.takeProfitPercent?.toFixed(1)}%</span>
                    </div>
                </div>
            )}
            {/* CYA AYIRICI VE AÇILABİLİR TETİKLEYİCİ */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    height: '2px',
                    background: 'var(--primary)',
                    margin: '1.5rem -1.5rem',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.3s'
                }}
                className="hover-glow"
            >
                <div style={{
                    background: '#1a1d2e', // Panel arka planına yakın bir renk
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}>
                    {isExpanded ? 'DETAYLARI GİZLE ▴' : 'ANALİZ DETAYLARINI GÖR ▾'}
                </div>
            </div>

            {/* AÇILABİLİR BÖLÜM */}
            <div style={{
                maxHeight: isExpanded ? '2000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.5s ease-in-out',
                opacity: isExpanded ? 1 : 0,
                pointerEvents: isExpanded ? 'all' : 'none'
            }}>
                {/* GİRİŞ SEBEBİ */}
                <div style={{
                    background: 'rgba(0, 243, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderLeft: '4px solid var(--primary)'
                }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '8px', fontWeight: 'bold' }}>
                        📥 GİRİŞ SEBEBİ
                    </div>
                    <div style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#fff', lineHeight: 1.6 }}>
                        {trade.rationale || decisionContext.reason || 'Nova analizi sonucu uygun sinyal yakalandı.'}
                    </div>
                    {decisionContext.riskNotes && (
                        <div style={{
                            marginTop: '10px',
                            padding: '8px 12px',
                            background: 'rgba(251, 191, 36, 0.15)',
                            borderRadius: '6px',
                            color: 'var(--warning)',
                            fontSize: '0.85rem'
                        }}>
                            ⚠️ Risk Notları: {decisionContext.riskNotes}
                        </div>
                    )}
                </div>

                {/* ÇIKIŞ SEBEBİ (Kapalı pozisyonlar için) */}
                {!trade.isOpen && trade.exitReason && (
                    <div style={{
                        background: 'rgba(255, 0, 85, 0.08)',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        borderLeft: '4px solid var(--accent)'
                    }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '8px', fontWeight: 'bold' }}>
                            📤 ÇIKIŞ SEBEBİ
                        </div>
                        <div style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#fff' }}>
                            {trade.exitReason}
                        </div>
                    </div>
                )}

                {/* ARGUS KONSEYİ TUTANAKLARI */}
                {traces.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginBottom: '12px',
                            letterSpacing: '1px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            paddingBottom: '8px',
                            fontWeight: 'bold'
                        }}>
                            NOVA KONSEYİ TUTANAKLARI ({traces.length})
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {traces.map((trace, i) => {
                                const moduleName = trace.moduleId?.split('-')[0] || 'Sistem';
                                const moduleColor = getModuleColor(trace.moduleId);
                                const confidence = trace.score || trace.confidence || 50;

                                return (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '12px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '8px',
                                        borderLeft: `2px solid ${moduleColor}`
                                    }}>
                                        {/* Oy İkonu */}
                                        <div style={{ fontSize: '1.2rem', marginTop: '2px' }}>
                                            {getVoteIcon(trace.recommendation)}
                                        </div>

                                        {/* İçerik */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: moduleColor, fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                    {moduleName}
                                                </span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                    %{confidence} Güven
                                                </span>
                                            </div>
                                            <div style={{ color: '#eee', fontSize: '0.9rem', marginTop: '6px', lineHeight: 1.5 }}>
                                                {trace.reason}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Kapat Butonu (Açık pozisyonlar için) */}
            {trade.isOpen && onClose && (
                <button
                    className="btn btn-accent"
                    onClick={() => onClose(trade)}
                    style={{
                        width: '100%',
                        marginTop: '1rem'
                    }}
                >
                    POZİSYONU KAPAT
                </button>
            )}
        </div>
    );
};

export default TradeDetailCard;
