/**
 * PortfolioView.jsx
 * Nova TradeBot - Ana Dashboard (Profesyonel Trading UI)
 */

import React, { useState, useEffect } from 'react';
import { tradingViewModel } from '../../viewmodels/TradingViewModel.js';
import { realMarketDataService } from '../../services/RealMarketDataProvider.js';
import { formatCurrency, formatPercent, formatPrice } from '../../utils/Formatters.js';
import { TradeDetailCard } from '../../components/TradeDetailCard.jsx';
import { LearningStatusPanel } from '../../components/LearningStatusPanel.jsx';
import { NovaInsightsPanel } from '../../components/NovaInsightsPanel.jsx';
import { CyberEye } from '../../components/ui/CyberEye';
import { RiskAssessmentCard } from '../../components/RiskAssessmentCard.jsx';

export const PortfolioView = () => {
    const [state, setState] = useState(tradingViewModel._getState());
    const [prices, setPrices] = useState({});
    const [sortOrder, setSortOrder] = useState('pnl-desc'); // 'pnl-desc' veya 'pnl-asc'

    useEffect(() => {
        const unsubscribe = tradingViewModel.subscribe((newState) => setState(newState));

        // Gerçek fiyatları başlat
        realMarketDataService.startStreaming();
        const unsubPrices = realMarketDataService.subscribe((quotes) => setPrices(quotes));

        return () => {
            unsubscribe();
            unsubPrices();
        };
    }, []);

    // PnL Hesaplamaları
    const calculatePnL = () => {
        const COMMISSION_RATE = 0.001; // %0.1 komisyon
        const STARTING_BALANCE = 1000; // Başlangıç bakiyesi
        let unrealizedPnL = 0;
        let positionsValue = 0;
        let totalCommissionPaid = 0;

        // Açık pozisyonların anlık değeri
        state.portfolio.filter(t => t.isOpen).forEach(trade => {
            const currentPrice = prices[trade.symbol]?.price || trade.entryPrice;
            const positionValue = currentPrice * trade.quantity;
            // Maliyet = alış fiyatı * miktar + alış komisyonu
            const baseCost = trade.entryPrice * trade.quantity;
            const buyCommission = baseCost * COMMISSION_RATE;
            totalCommissionPaid += buyCommission;
            const totalCost = baseCost + buyCommission;

            positionsValue += positionValue;
            // Potansiyel satış komisyonunu da düş
            const potentialSellCommission = positionValue * COMMISSION_RATE;
            unrealizedPnL += (positionValue - potentialSellCommission - totalCost);
        });

        // Kapanmış işlemlerden ödenen komisyon (hem alış hem satış)
        state.portfolio.filter(t => !t.isOpen).forEach(trade => {
            const baseCost = trade.entryPrice * trade.quantity;
            const sellValue = (trade.exitPrice || trade.entryPrice) * trade.quantity;
            totalCommissionPaid += baseCost * COMMISSION_RATE; // Alış komisyonu
            totalCommissionPaid += sellValue * COMMISSION_RATE; // Satış komisyonu
        });

        // Gerçekleşmiş K/Z (sadece kapanmış işlemlerden)
        const realizedPnL = state.totalPnLRealized || 0;

        // Toplam K/Z = Gerçekleşmiş + Gerçekleşmemiş
        const totalPnL = realizedPnL + unrealizedPnL;

        // TOPLAM BAKİYE = Başlangıç + Toplam K/Z (komisyonlar zaten PnL içinde)
        const totalValue = STARTING_BALANCE + totalPnL;

        const pnlPercent = (totalPnL / STARTING_BALANCE) * 100;

        return { totalValue, unrealizedPnL, realizedPnL, totalPnL, pnlPercent, positionsValue, totalCommissionPaid };
    };

    const pnl = calculatePnL();
    const isOverallProfit = pnl.totalPnL >= 0;
    const isRealizedProfit = pnl.realizedPnL >= 0;

    return (
        <div className="container" style={{ padding: '20px 0' }}>


            {/* ============ ÜST PANEL - BAKİYE & PNL ============ */}
            <div className="glass-panel" style={{
                padding: '1.5rem 2rem',
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, rgba(15, 17, 38, 0.95) 0%, rgba(10, 8, 25, 0.98) 100%)',
                borderLeft: `4px solid ${isOverallProfit ? 'var(--success)' : 'var(--accent)'}`
            }}>
                {/* Ana Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '1.5rem',
                    textAlign: 'center'
                }}>
                    {/* Toplam Bakiye */}
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '5px' }}>TOPLAM BAKİYE</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>
                            {formatCurrency(pnl.totalValue)}
                        </div>
                    </div>

                    {/* Nakit Para */}
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '5px' }}>NAKİT</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {formatCurrency(state.balance)}
                        </div>
                    </div>

                    {/* Gerçekleşmiş K/Z (Kapanmış İşlemler) */}
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '5px' }}>GERÇEKLEŞMİŞ K/Z</div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: isRealizedProfit ? 'var(--success)' : 'var(--accent)',
                            fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            {isRealizedProfit && pnl.realizedPnL > 0 ? '+' : ''}{formatCurrency(pnl.realizedPnL)}
                        </div>
                    </div>

                    {/* Anlık (Unrealized) PnL */}
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '5px' }}>CANLI PNL</div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: pnl.unrealizedPnL >= 0 ? 'var(--success)' : 'var(--accent)',
                            fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            {pnl.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(pnl.unrealizedPnL)}
                        </div>
                    </div>

                    {/* Yüzde Değişim */}
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '5px' }}>TOPLAM %</div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: isOverallProfit ? 'var(--success)' : 'var(--accent)',
                            fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            {formatPercent(pnl.pnlPercent)}
                        </div>
                    </div>
                </div>
            </div>

            {/* ============ NOVA INSIGHTS PANEL ============ */}
            <NovaInsightsPanel />

            {/* ============ OTOPİLOT BUTONU ============ */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <button
                    className={`btn ${state.isAutoPilotActive ? 'btn-success-glow' : 'btn-neon'}`}
                    onClick={() => tradingViewModel.toggleAutoPilot()}
                    style={{
                        width: '100%',
                        maxWidth: '600px',
                        height: '64px',
                        fontSize: '1.2rem',
                        gap: '15px'
                    }}
                >
                    <CyberEye isActive={state.isAutoPilotActive} />
                    {state.isAutoPilotActive ? 'NOVA AKTİF (500+ İNDİKATÖR TARANIYOR...)' : 'NOVA OTOPİLOT BAŞLAT'}
                </button>
            </div>

            {/* ============ AÇIK POZİSYONLAR ============ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <span style={{ color: 'var(--primary)' }}>●</span> Açık Pozisyonlar
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({state.portfolio.filter(t => t.isOpen).length})</span>
                </h3>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn btn-glass btn-sm"
                        onClick={() => setSortOrder(sortOrder === 'pnl-desc' ? 'pnl-asc' : 'pnl-desc')}
                    >
                        📊 PnL: {sortOrder === 'pnl-desc' ? 'Azalan' : 'Artan'}
                    </button>
                </div>
            </div>

            {
                state.portfolio.filter(t => t.isOpen).length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                        <div>Henüz açık pozisyon yok.</div>
                        <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Nova piyasayı tarayıp fırsat bulduğunda otomatik işlem açacak.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {state.portfolio
                            .filter(t => t.isOpen)
                            .sort((a, b) => {
                                const priceA = prices[a.symbol]?.price || a.entryPrice;
                                const pnlA = ((priceA - a.entryPrice) / a.entryPrice);
                                const priceB = prices[b.symbol]?.price || b.entryPrice;
                                const pnlB = ((priceB - b.entryPrice) / b.entryPrice);

                                return sortOrder === 'pnl-desc' ? pnlB - pnlA : pnlA - pnlB;
                            })
                            .map(trade => (
                                <TradeDetailCard
                                    key={trade.id}
                                    trade={trade}
                                    currentPrice={prices[trade.symbol]?.price}
                                    onClose={(t) => {
                                        const exitPrice = prices[t.symbol]?.price || t.entryPrice;
                                        tradingViewModel.sell(t, exitPrice, 'Kullanıcı tarafından kapatıldı');
                                    }}
                                />
                            ))}
                    </div>
                )
            }

            {/* ============ SİSTEM GÜNLÜĞÜ (İşlem Geçmişi Yerine) ============ */}
            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--warning)' }}>📜</span> Sistem Günlüğü
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    (Son olaylar)
                </span>
            </h3>

            {/* ============ SİSTEM GÜNLÜĞÜ ============ */}

            <div className="glass-panel" style={{
                height: '200px',
                overflowY: 'auto',
                padding: '12px',
                fontSize: '0.8rem',
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--text-muted)',
                background: 'rgba(0, 0, 0, 0.3)'
            }}>
                {state.logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Henüz log yok...</div>
                ) : (
                    state.logs.map((log, i) => (
                        <div
                            key={i}
                            style={{
                                marginBottom: '6px',
                                paddingBottom: '4px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                color: log.includes('AL') ? 'var(--success)' : log.includes('SAT') ? 'var(--accent)' : 'inherit'
                            }}
                        >
                            {log}
                        </div>
                    ))
                )}
            </div>

            {/* ============ ÖĞRENME SİSTEMİ PANELİ ============ */}
            <div style={{ marginTop: '2rem' }}>
                <LearningStatusPanel />
            </div>

            {/* ============ RISK DASHBOARD (EN ALTTA) ============ */}
            <div style={{ marginTop: '2rem' }}>
                <RiskAssessmentCard
                    portfolio={state.portfolio}
                    balance={state.balance}
                    totalValue={pnl.totalValue}
                />
            </div>
        </div >
    );
};
