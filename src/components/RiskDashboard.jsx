import React, { useState, useEffect } from 'react';
import { advancedRiskManager } from '../services/risk/AdvancedRiskManager.js';

/**
 * RiskDashboard - Argus 22_risk_management.md
 * Kelly Criterion, VaR, Korelasyon ve Drawdown görselleştirmesi
 */
const RiskDashboard = ({ portfolio = {}, historicalReturns = [] }) => {
    const [report, setReport] = useState(null);
    const [positionCalc, setPositionCalc] = useState({
        capital: '10000',
        riskPercent: '2',
        entryPrice: '100',
        stopLoss: '95',
        result: null
    });

    useEffect(() => {
        generateReport();
    }, [portfolio]);

    const generateReport = () => {
        const riskReport = advancedRiskManager.generateRiskReport({
            cash: portfolio.cash || 5000,
            positions: portfolio.positions || [],
            historicalReturns: historicalReturns,
            equityCurve: portfolio.equityCurve || []
        });
        setReport(riskReport);
    };

    const calculatePosition = () => {
        const result = advancedRiskManager.fixedFractional(
            parseFloat(positionCalc.capital) || 10000,
            parseFloat(positionCalc.riskPercent) || 2,
            parseFloat(positionCalc.entryPrice) || 100,
            parseFloat(positionCalc.stopLoss) || 95
        );
        setPositionCalc(prev => ({ ...prev, result }));
    };

    const calculateKelly = () => {
        const result = advancedRiskManager.kelly(
            parseFloat(positionCalc.capital) || 10000,
            55, // %55 win rate (örnek)
            1.5, // Avg win
            1.0, // Avg loss
            parseFloat(positionCalc.entryPrice) || 100,
            0.25
        );
        setPositionCalc(prev => ({ ...prev, result }));
    };

    const styles = {
        container: {
            background: 'linear-gradient(135deg, rgba(20,20,35,0.95) 0%, rgba(30,30,50,0.95) 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: '#fff',
            border: '1px solid rgba(100,100,150,0.3)'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(100,100,150,0.3)',
            paddingBottom: '15px'
        },
        title: {
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        badge: {
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
        },
        card: {
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '15px',
            textAlign: 'center'
        },
        cardLabel: {
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '5px',
            textTransform: 'uppercase'
        },
        cardValue: {
            fontSize: '20px',
            fontWeight: 'bold'
        },
        section: {
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px'
        },
        sectionTitle: {
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        inputRow: {
            display: 'flex',
            gap: '10px',
            marginBottom: '10px',
            flexWrap: 'wrap'
        },
        input: {
            flex: '1',
            minWidth: '80px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(100,100,150,0.3)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: '14px'
        },
        button: {
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            transition: 'all 0.2s'
        },
        resultBox: {
            marginTop: '15px',
            padding: '15px',
            background: 'rgba(0,255,136,0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(0,255,136,0.3)'
        },
        recommendation: {
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '8px',
            fontSize: '13px'
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'low': return '#00ff88';
            case 'moderate': return '#ffcc00';
            case 'high': return '#ff6600';
            case 'extreme': return '#ff0044';
            default: return '#888';
        }
    };

    if (!report) {
        return (
            <div style={styles.container}>
                <div style={styles.title}>⚠️ Risk Dashboard</div>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.title}>
                    <span>⚠️</span>
                    <span>Risk Yönetimi</span>
                </div>
                <div style={{
                    ...styles.badge,
                    background: `${getRiskColor(report.summary.riskLevel)}22`,
                    color: getRiskColor(report.summary.riskLevel),
                    border: `1px solid ${getRiskColor(report.summary.riskLevel)}44`
                }}>
                    {report.summary.riskLevelText}
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={styles.grid}>
                <div style={styles.card}>
                    <div style={styles.cardLabel}>Portföy Değeri</div>
                    <div style={{ ...styles.cardValue, color: '#00d4ff' }}>
                        ${report.summary.portfolioValue.toLocaleString()}
                    </div>
                </div>
                <div style={styles.card}>
                    <div style={styles.cardLabel}>Nakit Oranı</div>
                    <div style={{ ...styles.cardValue, color: '#00ff88' }}>
                        %{report.summary.cashPercent.toFixed(1)}
                    </div>
                </div>
                <div style={styles.card}>
                    <div style={styles.cardLabel}>VaR (95%)</div>
                    <div style={{ ...styles.cardValue, color: '#ff6600' }}>
                        ${report.var.var95.var.toLocaleString()}
                    </div>
                </div>
                <div style={styles.card}>
                    <div style={styles.cardLabel}>Max Drawdown</div>
                    <div style={{ ...styles.cardValue, color: '#ff4488' }}>
                        %{report.drawdown.maxDrawdownPercent.toFixed(1)}
                    </div>
                </div>
            </div>

            {/* Concentration */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>
                    <span>📊</span> Konsantrasyon Analizi
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>En Büyük Pozisyon:</span>
                    <span style={{ fontWeight: 'bold' }}>
                        {report.concentration.largestPosition} (%{report.concentration.largestPositionPercent.toFixed(1)})
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '8px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Top 3 Pozisyon:</span>
                    <span style={{ fontWeight: 'bold' }}>%{report.concentration.top3Percent.toFixed(1)}</span>
                </div>
            </div>

            {/* Position Calculator */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>
                    <span>🧮</span> Pozisyon Hesaplama
                </div>
                <div style={styles.inputRow}>
                    <input
                        style={styles.input}
                        type="number"
                        placeholder="Sermaye"
                        value={positionCalc.capital}
                        onChange={(e) => setPositionCalc(p => ({ ...p, capital: e.target.value }))}
                    />
                    <input
                        style={styles.input}
                        type="number"
                        placeholder="Risk %"
                        value={positionCalc.riskPercent}
                        onChange={(e) => setPositionCalc(p => ({ ...p, riskPercent: e.target.value }))}
                    />
                </div>
                <div style={styles.inputRow}>
                    <input
                        style={styles.input}
                        type="number"
                        placeholder="Giriş Fiyatı"
                        value={positionCalc.entryPrice}
                        onChange={(e) => setPositionCalc(p => ({ ...p, entryPrice: e.target.value }))}
                    />
                    <input
                        style={styles.input}
                        type="number"
                        placeholder="Stop Loss"
                        value={positionCalc.stopLoss}
                        onChange={(e) => setPositionCalc(p => ({ ...p, stopLoss: e.target.value }))}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        style={{ ...styles.button, background: '#00d4ff', color: '#000', flex: 1 }}
                        onClick={calculatePosition}
                    >
                        Fixed Fractional
                    </button>
                    <button
                        style={{ ...styles.button, background: '#ff6600', color: '#fff', flex: 1 }}
                        onClick={calculateKelly}
                    >
                        Kelly Criterion
                    </button>
                </div>

                {positionCalc.result && (
                    <div style={styles.resultBox}>
                        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#00ff88' }}>
                            {positionCalc.result.method}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                            <div>
                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Alınacak:</span>
                                <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{positionCalc.result.shares} adet</span>
                            </div>
                            <div>
                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Tutar:</span>
                                <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>${positionCalc.result.dollarAmount}</span>
                            </div>
                            <div>
                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Risk:</span>
                                <span style={{ marginLeft: '8px', fontWeight: 'bold', color: '#ff6600' }}>${positionCalc.result.riskAmount}</span>
                            </div>
                            {positionCalc.result.kellyPercent !== undefined && (
                                <div>
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Kelly %:</span>
                                    <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{positionCalc.result.kellyPercent}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Recommendations */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>
                    <span>💡</span> Öneriler
                </div>
                {report.recommendations.map((rec, idx) => (
                    <div
                        key={idx}
                        style={{
                            ...styles.recommendation,
                            background: rec.priority === 'high' ? 'rgba(255,68,68,0.15)' :
                                rec.priority === 'medium' ? 'rgba(255,170,0,0.15)' : 'rgba(0,255,136,0.15)',
                            borderLeft: `3px solid ${rec.priority === 'high' ? '#ff4444' :
                                rec.priority === 'medium' ? '#ffaa00' : '#00ff88'}`
                        }}
                    >
                        {rec.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RiskDashboard;
