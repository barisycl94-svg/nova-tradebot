/**
 * CandleChart.jsx
 * Nova TradeBot - İnteraktif Mum Grafiği
 * 
 * Basit SVG veya Canvas tabanlı çizim.
 * Harici kütüphane (Recharts/Chart.js) yerine yerleşik SVG kullanacağız (Bağımlılık azaltmak için).
 */

import React, { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/Formatters.js';

export const CandleChart = ({ candles, width = '100%', height = 300 }) => {
    const [hoverData, setHoverData] = useState(null);

    // Ölçekleme hesapları
    const { points, maxPrice, minPrice } = useMemo(() => {
        if (!candles || candles.length === 0) return { points: [], maxPrice: 0, minPrice: 0 };

        const prices = candles.flatMap(c => [c.high, c.low]);
        const maxP = Math.max(...prices);
        const minP = Math.min(...prices);
        const range = maxP - minP || 1;

        // Grafik için biraz boşluk bırak (padding)
        const paddedMax = maxP + (range * 0.05);
        const paddedMin = minP - (range * 0.05);
        const paddedRange = paddedMax - paddedMin || 1;

        // SVG Koordinatlarına çevir
        // X ekseni: Eşit aralıklı
        // Y ekseni: Fiyat
        // SVG Height = 300
        // SVG Width = 100% (Viewbox ile halledeceğiz)

        const count = candles.length;
        // Her muma 10 birim genişlik + 2 birim boşluk verelim = 12
        const candleWidth = 8;
        const gap = 4;
        const unitWidth = candleWidth + gap;
        const totalWidth = count * unitWidth;

        const mappedPoints = candles.map((c, index) => {
            const x = (index * unitWidth) + (unitWidth / 2);

            const yOpen = 300 - ((c.open - paddedMin) / paddedRange) * 300;
            const yClose = 300 - ((c.close - paddedMin) / paddedRange) * 300;
            const yHigh = 300 - ((c.high - paddedMin) / paddedRange) * 300;
            const yLow = 300 - ((c.low - paddedMin) / paddedRange) * 300;

            return {
                ...c,
                x,
                yOpen,
                yClose,
                yHigh,
                yLow,
                isBullish: c.close >= c.open
            };
        });

        return { points: mappedPoints, maxPrice: paddedMax, minPrice: paddedMin, totalWidth };
    }, [candles]);

    if (!candles || candles.length === 0) {
        return <div className="glass-panel" style={{ height: height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Grafik Verisi Yok</div>;
    }

    return (
        <div className="glass-panel" style={{ position: 'relative', height: 'auto', overflow: 'hidden' }}>
            {/* Header Info */}
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, fontSize: '0.8rem', color: '#a0a5b9' }}>
                {hoverData ? (
                    <div>
                        <span style={{ color: '#fff' }}>{new Date(hoverData.date).toLocaleDateString()}</span> |
                        O: {hoverData.open.toFixed(2)} H: {hoverData.high.toFixed(2)} L: {hoverData.low.toFixed(2)} C: {hoverData.close.toFixed(2)}
                    </div>
                ) : (
                    <div>Grafiğe dokunarak detayları gör</div>
                )}
            </div>

            <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '10px' }}>
                <svg
                    width={Math.max(points.totalWidth, 600)}
                    height={300}
                    style={{ display: 'block', backgroundColor: 'transparent' }}
                    onMouseLeave={() => setHoverData(null)}
                >
                    {/* Grid Lines (Opsiyonel) */}
                    <line x1="0" y1={75} x2="100%" y2={75} stroke="rgba(255,255,255,0.05)" />
                    <line x1="0" y1={150} x2="100%" y2={150} stroke="rgba(255,255,255,0.05)" />
                    <line x1="0" y1={225} x2="100%" y2={225} stroke="rgba(255,255,255,0.05)" />

                    {/* Candles */}
                    {points.map((p, i) => (
                        <g
                            key={p.id || i}
                            onMouseEnter={() => setHoverData(p)}
                            style={{ cursor: 'crosshair' }}
                        >
                            {/* Wick (Fitil) */}
                            <line
                                x1={p.x} y1={p.yHigh}
                                x2={p.x} y2={p.yLow}
                                stroke={p.isBullish ? 'var(--success)' : 'var(--accent)'}
                                strokeWidth="1"
                            />
                            {/* Body */}
                            <rect
                                x={p.x - 4}
                                y={Math.min(p.yOpen, p.yClose)}
                                width="8"
                                height={Math.abs(p.yClose - p.yOpen) || 1}
                                fill={p.isBullish ? 'var(--success)' : 'var(--accent)'}
                            />

                            {/* Invisible Hit Area for easier hovering */}
                            <rect x={p.x - 6} y={0} width="12" height={300} fill="transparent" />
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};
