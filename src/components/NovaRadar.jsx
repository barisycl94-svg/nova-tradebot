/**
 * NovaRadar.jsx
 * Nova TradeBot - 5 Boyutlu Güç Analizi (Radar Chart)
 * 
 * Beş Köşe: Orion (Teknik), Atlas (Temel), Aether (Makro), Hermes (Haber), Phoenix (Trend)
 */

import React from 'react';

export const NovaRadar = ({ decisionResult }) => {
    if (!decisionResult) return null;

    // Skorları Normalize Et (0-100)
    // NovaDecisionResult yapısında: atlasScore, orionScore, aetherScore, hermesScore mevcut.
    // Phoenix ve Hermes için eğer değer gelmiyorsa varsayılan atayalım.
    const scores = [
        { label: 'ORION', value: decisionResult.orionScore || 50, angle: 0 },       // Teknik (Sağ)
        { label: 'ATLAS', value: decisionResult.atlasScore || 50, angle: 72 },     // Temel (Sağ Alt)
        { label: 'PHOENIX', value: decisionResult.totalScore || 50, angle: 144 },  // Trend/Sonuç (Sol Alt)
        { label: 'AETHER', value: decisionResult.aetherScore || 50, angle: 216 },   // Makro (Sol Üst)
        { label: 'HERMES', value: decisionResult.hermesScore || 50, angle: 288 }    // Haber (Üst)
    ];

    /* 
       SVG Radar Hesabı:
       Merkez: 150, 150
       Yarıçap: 100
    */
    const cx = 150;
    const cy = 150;
    const radius = 100;

    const calculatePoint = (value, angleDeg) => {
        const rad = (angleDeg - 90) * (Math.PI / 180);
        const r = (value / 100) * radius;
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad)
        };
    };

    // Poligon Noktaları (Değerler için)
    const polygonPoints = scores.map(s => {
        const p = calculatePoint(s.value, s.angle);
        return `${p.x},${p.y}`;
    }).join(' ');

    // Arka Plan Ağı (Grid - 20, 40, 60, 80, 100)
    const gridLevels = [20, 40, 60, 80, 100];

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary)', letterSpacing: '1px' }}>NOVA ANALİZ RADARI</h4>
            <svg width="300" height="300">
                {/* Grid Çizgileri */}
                {gridLevels.map(level => {
                    const points = scores.map(s => {
                        const p = calculatePoint(level, s.angle);
                        return `${p.x},${p.y}`;
                    }).join(' ');
                    return (
                        <polygon
                            key={level}
                            points={points}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Eksen Çizgileri */}
                {scores.map(s => {
                    const p = calculatePoint(100, s.angle);
                    return (
                        <line
                            key={s.label}
                            x1={cx} y1={cy}
                            x2={p.x} y2={p.y}
                            stroke="rgba(255,255,255,0.1)"
                        />
                    );
                })}

                {/* Veri Alanı */}
                <polygon
                    points={polygonPoints}
                    fill="rgba(0, 243, 255, 0.2)"
                    stroke="var(--primary)"
                    strokeWidth="2"
                />

                {/* Noktalar */}
                {scores.map(s => {
                    const p = calculatePoint(s.value, s.angle);
                    return <circle key={s.label} cx={p.x} cy={p.y} r="3" fill="#fff" />
                })}

                {/* Etiketler (Basit yerleştirme) */}
                {scores.map(s => {
                    // Etiketleri biraz dışarı it
                    const p = calculatePoint(115, s.angle);
                    return (
                        <text
                            key={'txt' + s.label}
                            x={p.x} y={p.y}
                            fill="var(--text-muted)"
                            fontSize="10"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {s.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};
