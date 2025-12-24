import React, { useEffect, useState } from 'react';

/**
 * ArgusRadarChart - Modül skorlarını görselleştiren radar/spider chart
 * Argus 15_components.md'den uyarlandı
 */
export const RadarChart = ({ scores, size = 280 }) => {
    const [animatedScores, setAnimatedScores] = useState(scores.map(() => 0));

    useEffect(() => {
        // Animate scores on load
        const timeout = setTimeout(() => {
            setAnimatedScores(scores.map(s => s.score));
        }, 100);
        return () => clearTimeout(timeout);
    }, [scores]);

    const center = size / 2;
    const radius = (size / 2) - 50;
    const angleStep = (2 * Math.PI) / scores.length;

    // Calculate points for polygon
    const getPoint = (index, value) => {
        const angle = (index * angleStep) - (Math.PI / 2);
        const dist = radius * (value / 100);
        return {
            x: center + Math.cos(angle) * dist,
            y: center + Math.sin(angle) * dist
        };
    };

    // Generate polygon path
    const polygonPoints = animatedScores.map((score, i) => {
        const point = getPoint(i, score);
        return `${point.x},${point.y}`;
    }).join(' ');

    // Generate grid circles
    const gridLevels = [25, 50, 75, 100];

    return (
        <div className="radar-chart-container" style={{ width: size, height: size, margin: '0 auto' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <defs>
                    <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(0, 212, 255, 0.4)" />
                        <stop offset="100%" stopColor="rgba(138, 43, 226, 0.4)" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background grid circles */}
                {gridLevels.map((level, i) => (
                    <circle
                        key={level}
                        cx={center}
                        cy={center}
                        r={radius * (level / 100)}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                        strokeDasharray={i === gridLevels.length - 1 ? "none" : "4,4"}
                    />
                ))}

                {/* Axis lines */}
                {scores.map((_, i) => {
                    const point = getPoint(i, 100);
                    return (
                        <line
                            key={`axis-${i}`}
                            x1={center}
                            y1={center}
                            x2={point.x}
                            y2={point.y}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Data polygon */}
                <polygon
                    points={polygonPoints}
                    fill="url(#radarGradient)"
                    stroke="rgba(0, 212, 255, 0.8)"
                    strokeWidth="2"
                    filter="url(#glow)"
                    style={{ transition: 'all 1s ease-out' }}
                />

                {/* Data points */}
                {animatedScores.map((score, i) => {
                    const point = getPoint(i, score);
                    return (
                        <circle
                            key={`point-${i}`}
                            cx={point.x}
                            cy={point.y}
                            r="6"
                            fill={scores[i].color || '#00d4ff'}
                            stroke="#fff"
                            strokeWidth="2"
                            filter="url(#glow)"
                            style={{ transition: 'all 1s ease-out' }}
                        />
                    );
                })}

                {/* Labels */}
                {scores.map((item, i) => {
                    const angle = (i * angleStep) - (Math.PI / 2);
                    const labelRadius = radius + 35;
                    const x = center + Math.cos(angle) * labelRadius;
                    const y = center + Math.sin(angle) * labelRadius;

                    return (
                        <g key={`label-${i}`}>
                            <text
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={item.color || '#888'}
                                fontSize="11"
                                fontWeight="600"
                            >
                                {item.name}
                            </text>
                            <text
                                x={x}
                                y={y + 14}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#fff"
                                fontSize="12"
                                fontWeight="700"
                                fontFamily="JetBrains Mono, monospace"
                            >
                                {Math.round(animatedScores[i])}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default RadarChart;
