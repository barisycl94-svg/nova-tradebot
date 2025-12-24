import React, { useMemo } from 'react';
import { formatPercent } from '../utils/Formatters';

/**
 * Visualizes Portfolio Risk Metrics (Argus Risk Management Module)
 * Vanilla CSS version - No Tailwind
 */
export const RiskAssessmentCard = ({ portfolio, balance, totalValue }) => {

    // 🧠 Calculate Risk Metrics
    const riskMetrics = useMemo(() => {
        const positions = portfolio.filter(t => t.isOpen);

        // 1. Exposure Calculation
        const totalExposure = positions.reduce((acc, t) => acc + (t.entryPrice * t.quantity), 0);
        const exposurePercent = totalValue > 0 ? (totalExposure / totalValue) * 100 : 0;
        const cashPercent = 100 - exposurePercent;

        // 2. Concentration Risk (Largest Position)
        let largestPosPercent = 0;
        let largestSymbol = '-';
        if (positions.length > 0) {
            const sorted = [...positions].sort((a, b) => (b.entryPrice * b.quantity) - (a.entryPrice * a.quantity));
            const largestVal = sorted[0].entryPrice * sorted[0].quantity;
            largestPosPercent = (largestVal / totalValue) * 100;
            largestSymbol = sorted[0].symbol;
        }

        // 3. Risk Level Determination
        let level = 'LOW';
        let color = '#22c55e'; // green
        let score = 90;

        if (exposurePercent > 80 || largestPosPercent > 40) {
            level = 'EXTREME';
            color = '#ef4444'; // red
            score = 20;
        } else if (exposurePercent > 50 || largestPosPercent > 20) {
            level = 'HIGH';
            color = '#f97316'; // orange
            score = 50;
        } else if (exposurePercent > 20) {
            level = 'MODERATE';
            color = '#eab308'; // yellow
            score = 75;
        }

        return {
            exposurePercent,
            cashPercent,
            largestPosPercent,
            largestSymbol,
            level,
            color,
            score,
            positionCount: positions.length
        };
    }, [portfolio, balance, totalValue]);

    const styles = {
        container: {
            background: 'linear-gradient(135deg, rgba(15, 17, 38, 0.95) 0%, rgba(10, 8, 25, 0.98) 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            borderLeft: `4px solid ${riskMetrics.color}`,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
        },
        title: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        icon: {
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${riskMetrics.color}20 0%, ${riskMetrics.color}10 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
        },
        titleText: {
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: '#fff'
        },
        badge: {
            padding: '6px 14px',
            borderRadius: '20px',
            background: `${riskMetrics.color}20`,
            border: `1px solid ${riskMetrics.color}50`,
            color: riskMetrics.color,
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
        },
        metric: {
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
        },
        metricLabel: {
            fontSize: '11px',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
        },
        metricValue: {
            fontSize: '24px',
            fontWeight: 700,
            color: '#fff',
            fontFamily: 'JetBrains Mono, monospace'
        },
        metricSub: {
            fontSize: '12px',
            color: '#9ca3af',
            marginTop: '4px'
        },
        progressBar: {
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            marginTop: '12px',
            overflow: 'hidden'
        },
        progressFill: {
            height: '100%',
            background: `linear-gradient(90deg, ${riskMetrics.color}, ${riskMetrics.color}80)`,
            borderRadius: '3px',
            transition: 'width 1s ease-out'
        },
        scoreCircle: {
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            border: `4px solid ${riskMetrics.color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '8px auto',
            position: 'relative',
            background: `conic-gradient(${riskMetrics.color} ${riskMetrics.score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`
        },
        scoreInner: {
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(15, 17, 38, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 700,
            color: '#fff',
            fontFamily: 'JetBrains Mono, monospace'
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.title}>
                    <div style={styles.icon}>🛡️</div>
                    <h3 style={styles.titleText}>Risk Analizi</h3>
                </div>
                <div style={styles.badge}>
                    {riskMetrics.level} RISK
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={styles.grid}>
                {/* Metric 1: Portfolio Allocation */}
                <div style={styles.metric}>
                    <div style={styles.metricLabel}>Pozisyon Oranı</div>
                    <div style={styles.metricValue}>
                        {riskMetrics.exposurePercent.toFixed(1)}%
                    </div>
                    <div style={styles.metricSub}>
                        {riskMetrics.positionCount} açık işlem
                    </div>
                    <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${Math.min(riskMetrics.exposurePercent, 100)}%` }} />
                    </div>
                </div>

                {/* Metric 2: Concentration */}
                <div style={styles.metric}>
                    <div style={styles.metricLabel}>En Büyük Pozisyon</div>
                    <div style={{ ...styles.metricValue, color: 'var(--primary)' }}>
                        {riskMetrics.largestSymbol.replace('USDT', '')}
                    </div>
                    <div style={{
                        ...styles.metricSub,
                        color: riskMetrics.largestPosPercent > 20 ? '#ef4444' : '#22c55e'
                    }}>
                        {riskMetrics.largestPosPercent.toFixed(1)}% ağırlık
                    </div>
                </div>

                {/* Metric 3: Health Score */}
                <div style={styles.metric}>
                    <div style={styles.metricLabel}>Sağlık Skoru</div>
                    <div style={styles.scoreCircle}>
                        <div style={styles.scoreInner}>
                            {riskMetrics.score}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
