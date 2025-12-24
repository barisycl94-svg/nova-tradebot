import React, { useState, useEffect } from 'react';
import { DemeterCryptoSectorEngine } from '../services/sector/DemeterCryptoSectorEngine';

/**
 * SectorAnalysisCard - Kripto sektör performans kartı
 * Premium tasarım ile inline styles
 */
export const SectorAnalysisCard = () => {
    const [sectorData, setSectorData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSectorData();
        const interval = setInterval(fetchSectorData, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchSectorData = async () => {
        try {
            const result = await DemeterCryptoSectorEngine.analyzeRotation();
            setSectorData(result);
        } catch (e) {
            console.error('Sektör verisi alınamadı:', e);
        } finally {
            setLoading(false);
        }
    };

    const getSectorIcon = (sectorId) => {
        const icons = {
            layer1: '🔷',
            layer2: '⚡',
            defi: '🏦',
            meme: '🐕',
            ai: '🤖',
            gaming: '🎮',
            exchange: '📊',
            privacy: '🔒',
            storage: '💾'
        };
        return icons[sectorId] || '💰';
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
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(100,100,150,0.2)'
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        rotationBadge: {
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold'
        },
        sectorList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        },
        sectorRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(100,100,150,0.15)',
            transition: 'all 0.2s'
        },
        sectorInfo: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        sectorIcon: {
            fontSize: '20px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)'
        },
        sectorName: {
            fontWeight: '600',
            fontSize: '14px'
        },
        sectorCoins: {
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '2px'
        },
        sectorChange: {
            textAlign: 'right'
        },
        changeValue: {
            fontSize: '16px',
            fontWeight: 'bold'
        },
        progressBar: {
            width: '80px',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(255,255,255,0.1)',
            marginTop: '6px',
            overflow: 'hidden'
        },
        progressFill: {
            height: '100%',
            borderRadius: '2px',
            transition: 'width 0.3s'
        },
        summary: {
            marginTop: '20px',
            padding: '16px',
            borderRadius: '12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
        },
        summaryItem: {
            textAlign: 'center'
        },
        summaryLabel: {
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '4px'
        },
        summaryValue: {
            fontSize: '18px',
            fontWeight: 'bold'
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.title}>
                    <span>🌾</span> Sektör Analizi
                </div>
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    Yükleniyor...
                </div>
            </div>
        );
    }

    const sectors = sectorData?.sectors || [];
    const topSectors = sectors.filter(s => s.performance1M > 0).slice(0, 3);
    const worstSectors = sectors.filter(s => s.performance1M <= 0).slice(-2);

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.title}>
                    <span style={{ fontSize: '28px' }}>🌾</span>
                    <span>Sektör Rotasyonu</span>
                </div>
                <div style={{
                    ...styles.rotationBadge,
                    background: sectorData?.rotation === 'Risk-On' ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,68,0.15)',
                    color: sectorData?.rotation === 'Risk-On' ? '#00ff88' : '#ff4444',
                    border: `1px solid ${sectorData?.rotation === 'Risk-On' ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)'}`
                }}>
                    {sectorData?.rotation === 'Risk-On' ? '📈 Risk-On' : '📉 Risk-Off'}
                </div>
            </div>

            {/* Sector List */}
            <div style={styles.sectorList}>
                {sectors.slice(0, 6).map((sector, idx) => {
                    const isPositive = sector.performance1M > 0;
                    const changeColor = isPositive ? '#00ff88' : '#ff4444';
                    const barWidth = Math.min(100, Math.abs(sector.performance1M) * 3);

                    return (
                        <div
                            key={sector.id}
                            style={{
                                ...styles.sectorRow,
                                borderLeft: `3px solid ${changeColor}`
                            }}
                        >
                            <div style={styles.sectorInfo}>
                                <div style={styles.sectorIcon}>
                                    {getSectorIcon(sector.id)}
                                </div>
                                <div>
                                    <div style={styles.sectorName}>{sector.name}</div>
                                    <div style={styles.sectorCoins}>
                                        {sector.coins?.slice(0, 3).join(', ')}
                                    </div>
                                </div>
                            </div>
                            <div style={styles.sectorChange}>
                                <div style={{ ...styles.changeValue, color: changeColor }}>
                                    {isPositive ? '+' : ''}{sector.performance1M?.toFixed(1)}%
                                </div>
                                <div style={styles.progressBar}>
                                    <div style={{
                                        ...styles.progressFill,
                                        width: `${barWidth}%`,
                                        background: changeColor
                                    }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div style={{
                ...styles.summary,
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.2)'
            }}>
                <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>En İyi Sektör</div>
                    <div style={{ ...styles.summaryValue, color: '#00ff88' }}>
                        {topSectors[0]?.name || 'N/A'}
                    </div>
                </div>
                <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Skor</div>
                    <div style={{ ...styles.summaryValue, color: '#00d4ff' }}>
                        {sectorData?.score?.toFixed(0) || 50}/100
                    </div>
                </div>
                <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Rotasyon</div>
                    <div style={{
                        ...styles.summaryValue,
                        color: sectorData?.rotation === 'Risk-On' ? '#00ff88' : '#ff4444'
                    }}>
                        {sectorData?.rotation || 'Neutral'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SectorAnalysisCard;
