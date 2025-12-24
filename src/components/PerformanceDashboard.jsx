import React, { useState, useEffect, useMemo } from 'react';

/**
 * PerformanceDashboard - Portfolio Performance Görselleştirme
 * Equity curve, P&L grafikleri, Win rate, Sharpe ratio
 */
const PerformanceDashboard = ({ trades = [], portfolio = {} }) => {
    const [timeframe, setTimeframe] = useState('30d');
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        calculateMetrics();
    }, [trades, timeframe]);

    const calculateMetrics = () => {
        const closedTrades = trades.filter(t => !t.isOpen);
        if (closedTrades.length === 0) {
            setMetrics(null);
            return;
        }

        // Basic metrics
        const wins = closedTrades.filter(t => t.pnl > 0);
        const losses = closedTrades.filter(t => t.pnl <= 0);
        const winRate = (wins.length / closedTrades.length) * 100;

        const totalPnL = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
        const avgWin = wins.length > 0 ? wins.reduce((a, t) => a + t.pnl, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, t) => a + t.pnl, 0) / losses.length) : 0;
        const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;

        // Best/Worst trades
        const sortedByPnL = [...closedTrades].sort((a, b) => b.pnl - a.pnl);
        const bestTrade = sortedByPnL[0];
        const worstTrade = sortedByPnL[sortedByPnL.length - 1];

        // Equity curve
        let equity = 10000; // Starting capital
        const equityCurve = closedTrades.map((t, i) => {
            equity += t.pnl || 0;
            return { date: t.closeDate || t.openDate, value: equity, index: i };
        });

        // Max Drawdown
        let peak = 10000;
        let maxDD = 0;
        for (const point of equityCurve) {
            if (point.value > peak) peak = point.value;
            const dd = ((peak - point.value) / peak) * 100;
            if (dd > maxDD) maxDD = dd;
        }

        // Sharpe Ratio (simplified)
        const returns = closedTrades.map(t => t.pnlPercent / 100);
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(returns.reduce((acc, r) => acc + Math.pow(r - avgReturn, 2), 0) / returns.length);
        const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

        setMetrics({
            totalTrades: closedTrades.length,
            winRate,
            totalPnL,
            avgWin,
            avgLoss,
            profitFactor,
            bestTrade,
            worstTrade,
            maxDrawdown: maxDD,
            sharpeRatio,
            equityCurve,
            wins: wins.length,
            losses: losses.length
        });
    };

    const styles = {
        container: {
            background: 'linear-gradient(135deg, rgba(20,20,35,0.95) 0%, rgba(30,30,50,0.95) 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: '#fff',
            border: '1px solid rgba(100,100,150,0.3)'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        tabs: {
            display: 'flex',
            gap: '8px'
        },
        tab: {
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s'
        },
        metricsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
        },
        metricCard: {
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
        },
        metricLabel: {
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '4px',
            textTransform: 'uppercase'
        },
        metricValue: {
            fontSize: '24px',
            fontWeight: 'bold'
        },
        chartContainer: {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
        },
        chartTitle: {
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '16px'
        },
        tradeRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '8px'
        }
    };

    const renderEquityChart = () => {
        if (!metrics?.equityCurve?.length) return null;

        const curve = metrics.equityCurve;
        const maxVal = Math.max(...curve.map(c => c.value));
        const minVal = Math.min(...curve.map(c => c.value));
        const range = maxVal - minVal || 1;
        const width = 100;
        const height = 60;

        const points = curve.map((c, i) => {
            const x = (i / (curve.length - 1)) * width;
            const y = height - ((c.value - minVal) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        const lastValue = curve[curve.length - 1]?.value || 10000;
        const isProfit = lastValue >= 10000;

        return (
            <svg width="100%" height="80" viewBox={`0 0 ${width} ${height + 10}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isProfit ? '#00ff88' : '#ff4444'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={isProfit ? '#00ff88' : '#ff4444'} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon
                    points={`0,${height} ${points} ${width},${height}`}
                    fill="url(#equityGradient)"
                />
                <polyline
                    points={points}
                    fill="none"
                    stroke={isProfit ? '#00ff88' : '#ff4444'}
                    strokeWidth="2"
                />
            </svg>
        );
    };

    const renderWinLossBar = () => {
        if (!metrics) return null;
        const total = metrics.wins + metrics.losses;
        const winPercent = (metrics.wins / total) * 100;

        return (
            <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: '#00ff88' }}>Kazanan: {metrics.wins}</span>
                    <span style={{ color: '#ff4444' }}>Kaybeden: {metrics.losses}</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: '#ff4444', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${winPercent}%`, background: '#00ff88', borderRadius: '4px' }} />
                </div>
            </div>
        );
    };

    if (!metrics) {
        return (
            <div style={styles.container}>
                <div style={styles.title}>📈 Performans Dashboard</div>
                <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '40px' }}>
                    Henüz kapatılmış işlem yok. İşlemler tamamlandıkça performans metrikleri burada görünecek.
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.title}>
                    <span>📈</span>
                    <span>Performans Dashboard</span>
                </div>
                <div style={styles.tabs}>
                    {['7d', '30d', '90d', 'all'].map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            style={{
                                ...styles.tab,
                                background: timeframe === tf ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                                color: timeframe === tf ? '#00d4ff' : 'rgba(255,255,255,0.6)'
                            }}
                        >
                            {tf === 'all' ? 'Tümü' : tf.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Toplam P/L</div>
                    <div style={{
                        ...styles.metricValue,
                        color: metrics.totalPnL >= 0 ? '#00ff88' : '#ff4444'
                    }}>
                        {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(2)}
                    </div>
                </div>
                <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Win Rate</div>
                    <div style={{ ...styles.metricValue, color: '#00d4ff' }}>
                        %{metrics.winRate.toFixed(1)}
                    </div>
                </div>
                <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>İşlem Sayısı</div>
                    <div style={{ ...styles.metricValue, color: '#fff' }}>
                        {metrics.totalTrades}
                    </div>
                </div>
                <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Profit Factor</div>
                    <div style={{ ...styles.metricValue, color: '#ffaa00' }}>
                        {metrics.profitFactor.toFixed(2)}
                    </div>
                </div>
                <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Max Drawdown</div>
                    <div style={{ ...styles.metricValue, color: '#ff6600' }}>
                        %{metrics.maxDrawdown.toFixed(1)}
                    </div>
                </div>
                <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Sharpe Ratio</div>
                    <div style={{ ...styles.metricValue, color: '#8b5cf6' }}>
                        {metrics.sharpeRatio.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Equity Curve */}
            <div style={styles.chartContainer}>
                <div style={styles.chartTitle}>📊 Equity Curve</div>
                {renderEquityChart()}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
                    <span>Başlangıç: $10,000</span>
                    <span>Şu an: ${metrics.equityCurve[metrics.equityCurve.length - 1]?.value.toFixed(2)}</span>
                </div>
                {renderWinLossBar()}
            </div>

            {/* Best/Worst Trades */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ ...styles.tradeRow, background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: '#00ff88', marginBottom: '4px' }}>🏆 EN İYİ İŞLEM</div>
                        <div style={{ fontWeight: 'bold' }}>{metrics.bestTrade?.symbol || 'N/A'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#00ff88' }}>
                            +${metrics.bestTrade?.pnl?.toFixed(2) || '0'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                            +{metrics.bestTrade?.pnlPercent?.toFixed(2) || '0'}%
                        </div>
                    </div>
                </div>
                <div style={{ ...styles.tradeRow, background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: '#ff4444', marginBottom: '4px' }}>💔 EN KÖTÜ İŞLEM</div>
                        <div style={{ fontWeight: 'bold' }}>{metrics.worstTrade?.symbol || 'N/A'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#ff4444' }}>
                            ${metrics.worstTrade?.pnl?.toFixed(2) || '0'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                            {metrics.worstTrade?.pnlPercent?.toFixed(2) || '0'}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Average Stats */}
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ ...styles.metricCard, background: 'rgba(0,255,136,0.08)' }}>
                    <div style={styles.metricLabel}>Ortalama Kazanç</div>
                    <div style={{ ...styles.metricValue, fontSize: '18px', color: '#00ff88' }}>
                        +${metrics.avgWin.toFixed(2)}
                    </div>
                </div>
                <div style={{ ...styles.metricCard, background: 'rgba(255,68,68,0.08)' }}>
                    <div style={styles.metricLabel}>Ortalama Kayıp</div>
                    <div style={{ ...styles.metricValue, fontSize: '18px', color: '#ff4444' }}>
                        -${metrics.avgLoss.toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboard;
