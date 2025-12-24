/**
 * ArgusRadarChart.jsx - Argus 15_components.md
 * 10 Modül için tam radar chart (Orion, Atlas, Aether, Phoenix, Hermes, Demeter, Athena, Cronos, Titan, Chiron)
 */

import React from 'react';

const ArgusRadarChart = ({ scores = {}, size = 300 }) => {
    // 10 Argus modülü
    const modules = [
        { key: 'orion', label: 'ORION', color: '#8b5cf6', description: 'Teknik' },
        { key: 'atlas', label: 'ATLAS', color: '#3b82f6', description: 'Fundamental' },
        { key: 'aether', label: 'AETHER', color: '#6366f1', description: 'Makro' },
        { key: 'phoenix', label: 'PHOENIX', color: '#f97316', description: 'Senaryo' },
        { key: 'hermes', label: 'HERMES', color: '#06b6d4', description: 'Haber' },
        { key: 'demeter', label: 'DEMETER', color: '#eab308', description: 'Sektör' },
        { key: 'athena', label: 'ATHENA', color: '#ec4899', description: 'Faktör' },
        { key: 'cronos', label: 'CRONOS', color: '#22c55e', description: 'Zamanlama' },
        { key: 'titan', label: 'TITAN', color: '#6b7280', description: 'Piyasa' },
        { key: 'chiron', label: 'CHIRON', color: '#14b8a6', description: 'Öğrenme' }
    ];

    const cx = size / 2;
    const cy = size / 2;
    const radius = (size / 2) - 50;
    const angleStep = (2 * Math.PI) / modules.length;

    const calculatePoint = (value, index) => {
        const angle = (index * angleStep) - (Math.PI / 2);
        const r = (value / 100) * radius;
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        };
    };

    const calculateLabelPoint = (index, distance = 1.25) => {
        const angle = (index * angleStep) - (Math.PI / 2);
        return {
            x: cx + radius * distance * Math.cos(angle),
            y: cy + radius * distance * Math.sin(angle)
        };
    };

    // Polygon noktaları
    const polygonPoints = modules.map((m, i) => {
        const value = scores[m.key] ?? 50;
        const p = calculatePoint(value, i);
        return `${p.x},${p.y}`;
    }).join(' ');

    // Grid seviyeleri
    const gridLevels = [20, 40, 60, 80, 100];

    const styles = {
        container: {
            background: 'linear-gradient(135deg, rgba(20,20,35,0.95) 0%, rgba(30,30,50,0.95) 100%)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(100,100,150,0.3)'
        },
        title: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        },
        legend: {
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '15px'
        },
        legendItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.7)'
        },
        legendDot: {
            width: '8px',
            height: '8px',
            borderRadius: '50%'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.title}>
                <span>📡</span>
                <span>ARGUS MODÜL RADARI</span>
            </div>

            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Arka plan gradient */}
                <defs>
                    <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(0,243,255,0.1)" />
                        <stop offset="100%" stopColor="rgba(139,92,246,0.05)" />
                    </radialGradient>
                </defs>

                {/* Grid halkaları */}
                {gridLevels.map(level => {
                    const points = modules.map((_, i) => {
                        const p = calculatePoint(level, i);
                        return `${p.x},${p.y}`;
                    }).join(' ');
                    return (
                        <polygon
                            key={level}
                            points={points}
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Eksen çizgileri */}
                {modules.map((m, i) => {
                    const p = calculatePoint(100, i);
                    return (
                        <line
                            key={m.key}
                            x1={cx}
                            y1={cy}
                            x2={p.x}
                            y2={p.y}
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Veri alanı */}
                <polygon
                    points={polygonPoints}
                    fill="url(#radarGradient)"
                    stroke="rgba(0,243,255,0.8)"
                    strokeWidth="2"
                />

                {/* Veri noktaları */}
                {modules.map((m, i) => {
                    const value = scores[m.key] ?? 50;
                    const p = calculatePoint(value, i);
                    return (
                        <g key={m.key}>
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r="5"
                                fill={m.color}
                                stroke="#fff"
                                strokeWidth="2"
                            />
                            {/* Skor değeri */}
                            <text
                                x={p.x}
                                y={p.y - 10}
                                fill="#fff"
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="middle"
                            >
                                {Math.round(value)}
                            </text>
                        </g>
                    );
                })}

                {/* Etiketler */}
                {modules.map((m, i) => {
                    const p = calculateLabelPoint(i, 1.2);
                    return (
                        <text
                            key={`label-${m.key}`}
                            x={p.x}
                            y={p.y}
                            fill={m.color}
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {m.label}
                        </text>
                    );
                })}

                {/* Merkez değer */}
                <text
                    x={cx}
                    y={cy}
                    fill="#fff"
                    fontSize="18"
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                >
                    {Math.round(Object.values(scores).reduce((a, b) => a + (b || 50), 0) / Math.max(Object.keys(scores).length, 1))}
                </text>
                <text
                    x={cx}
                    y={cy + 15}
                    fill="rgba(255,255,255,0.6)"
                    fontSize="9"
                    textAnchor="middle"
                >
                    TOPLAM
                </text>
            </svg>

            {/* Legend */}
            <div style={styles.legend}>
                {modules.map(m => (
                    <div key={m.key} style={styles.legendItem}>
                        <div style={{ ...styles.legendDot, background: m.color }} />
                        <span>{m.description}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArgusRadarChart;
