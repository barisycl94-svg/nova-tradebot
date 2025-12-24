/**
 * StockDetailView.jsx
 * Nova TradeBot - Hisse Detay ve Analiz Ekranı
 */

import React, { useEffect, useState } from 'react';
import { formatCurrency, formatPercent } from '../../utils/Formatters.js';
import { CandleChart } from '../../components/CandleChart.jsx';
import { NovaRadar } from '../../components/NovaRadar.jsx';
import { realMarketDataService } from '../../services/RealMarketDataProvider.js';
import { NovaDecisionEngine } from '../../services/NovaDecisionEngine.js';
import { tradingViewModel } from '../../viewmodels/TradingViewModel.js';

export const StockDetailView = ({ symbol, onBack }) => {
    const [data, setData] = useState({
        candles: [],
        quote: null,
        analysis: null,
        loading: true
    });

    useEffect(() => {
        let active = true;

        async function fetchData() {
            if (!symbol) return;

            try {
                // Paralel veri çekimi (Gerçek veriler)
                const [candles, quoteResult] = await Promise.all([
                    realMarketDataService.getCandles(symbol, '3mo'),
                    realMarketDataService.searchAssets(symbol)
                ]);

                const currentPrice = candles[candles.length - 1]?.close || 0;

                // Nova Analizi Yap
                const analysis = await NovaDecisionEngine.makeDecision(symbol, candles);

                if (active) {
                    setData({
                        candles,
                        quote: { symbol, price: currentPrice, change: 0 }, // Basitleştirildi
                        analysis,
                        loading: false
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }

        fetchData();
        return () => { active = false; };
    }, [symbol]);

    if (data.loading) {
        return <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Analiz Yapılıyor...</div>;
    }

    const { analysis } = data;

    return (
        <div style={{ paddingBottom: '80px' }}>
            {/* Navbar/Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <button className="btn" style={{ marginRight: '1rem', padding: '0.5rem' }} onClick={onBack}>←</button>
                <div>
                    <h2 style={{ margin: 0 }}>{symbol}</h2>
                    <div style={{ color: 'var(--text-muted)' }}>{formatCurrency(data.quote.price)}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    {/* Badge */}
                    <div style={{
                        padding: '5px 10px',
                        borderRadius: '5px',
                        background: analysis.finalDecision.color,
                        color: '#000',
                        fontWeight: 'bold',
                        boxShadow: `0 0 10px ${analysis.finalDecision.color}`
                    }}>
                        {analysis.finalDecision.label} ({analysis.confidence.toFixed(0)})
                    </div>
                </div>
            </div>

            {/* 1. Mumlama Grafiği */}
            <CandleChart candles={data.candles} height={300} />

            {/* 2. NOVA ANALİZ KARTI */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <NovaRadar decisionResult={analysis} />

                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ marginBottom: '1rem' }}>SİMÜLASYON RAPORU</h4>

                    <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.85rem' }}>
                        <div style={{ marginBottom: '10px', fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: '8px' }}>
                            "{analysis.reason}"
                        </div>

                        {analysis.traces.map((trace, i) => (
                            <div key={i} style={{ marginBottom: '6px', color: trace.recommendation.color }}>
                                <span style={{ fontWeight: 'bold' }}>[{trace.moduleId}]</span> {trace.recommendation.label}: {trace.reason}
                            </div>
                        ))}
                    </div>

                    {/* Manuel İşlem Butonları */}
                    <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', gap: '10px' }}>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1, backgroundColor: 'var(--success)', color: '#000' }}
                            onClick={() => {
                                tradingViewModel.manualBuy(symbol);
                                import('../../components/ToastService').then(mod => {
                                    mod.toastService.show(`${symbol} için alım emri iletildi`, 'success');
                                });
                            }}
                        >
                            MANUEL AL
                        </button>
                        <button
                            className="btn"
                            style={{ flex: 1, border: '1px solid var(--accent)', color: 'var(--accent)' }}
                            onClick={() => {
                                import('../../components/ToastService').then(mod => {
                                    mod.toastService.show(`${symbol} satışı portföyden yapılabilir`, 'warning');
                                });
                            }}
                        >
                            SAT
                        </button>
                    </div>
                </div>
            </div>


        </div>
    );
};
