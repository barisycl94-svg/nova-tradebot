import React, { useState, useEffect } from 'react';
import { TitanMarketEngine } from '../services/market/TitanMarketEngine.js';

/**
 * MarketOverviewCard - Genel piyasa durumu
 * Premium tasarım ile inline styles
 */
export const MarketOverviewCard = () => {
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMarketData();
        const interval = setInterval(fetchMarketData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchMarketData = async () => {
        try {
            const btcData = await TitanMarketEngine.analyzeBTC();
            const ethData = await TitanMarketEngine.analyzeETH();
            const marketScore = TitanMarketEngine.getOverallScore();

            setMarketData({
                btc: btcData,
                eth: ethData,
                score: marketScore,
                totalMarketCap: 2.1, // Trillion
                btcDominance: 52.3,
                volume24h: 85.6 // Billion
            });
        } catch (e) {
            console.error('Market verisi alınamadı:', e);
            // Fallback data
            setMarketData({
                btc: { price: 43500, change24h: 2.3, trend: 'Bullish' },
                eth: { price: 2280, change24h: 1.8, trend: 'Bullish' },
                score: 65,
                totalMarketCap: 2.1,
                btcDominance: 52.3,
                volume24h: 85.6
            });
        } finally {
            setLoading(false);
        }
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
            justifyContent: 'space-between',
            marginBottom: '24px'
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        scoreBadge: {
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 'bold'
        },
        mainGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '20px'
        },
        coinCard: {
            padding: '20px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(100,100,150,0.2)'
        },
        coinHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
        },
        coinIcon: {
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
        },
        coinName: {
            fontWeight: 'bold',
            fontSize: '16px'
        },
        coinSymbol: {
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)'
        },
        coinPrice: {
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '8px'
        },
        coinChange: {
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
        },
        statCard: {
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            textAlign: 'center'
        },
        statLabel: {
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '6px',
            textTransform: 'uppercase'
        },
        statValue: {
            fontSize: '20px',
            fontWeight: 'bold'
        },
        trendIndicator: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px',
            padding: '16px',
            borderRadius: '12px'
        }
    };

    const getScoreColor = (score) => {
        if (score >= 70) return '#00ff88';
        if (score >= 50) return '#ffaa00';
        return '#ff4444';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Güçlü Yükseliş';
        if (score >= 60) return 'Yükseliş';
        if (score >= 40) return 'Nötr';
        if (score >= 20) return 'Düşüş';
        return 'Güçlü Düşüş';
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.title}>
                    <span>🏛️</span> Piyasa Durumu
                </div>
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
                    Yükleniyor...
                </div>
            </div>
        );
    }

    const btcPositive = (marketData?.btc?.change24h || 0) >= 0;
    const ethPositive = (marketData?.eth?.change24h || 0) >= 0;
    const score = marketData?.score || 50;
    const scoreColor = getScoreColor(score);

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.title}>
                    <span style={{ fontSize: '28px' }}>🏛️</span>
                    <span>Piyasa Durumu</span>
                </div>
                <div style={{
                    ...styles.scoreBadge,
                    background: `${scoreColor}22`,
                    color: scoreColor,
                    border: `1px solid ${scoreColor}44`
                }}>
                    {score}/100 • {getScoreLabel(score)}
                </div>
            </div>

            {/* BTC & ETH Cards */}
            <div style={styles.mainGrid}>
                {/* BTC */}
                <div style={{
                    ...styles.coinCard,
                    borderTop: `3px solid ${btcPositive ? '#00ff88' : '#ff4444'}`
                }}>
                    <div style={styles.coinHeader}>
                        <div style={{
                            ...styles.coinIcon,
                            background: 'linear-gradient(135deg, #f7931a 0%, #ffb700 100%)'
                        }}>
                            ₿
                        </div>
                        <div>
                            <div style={styles.coinName}>Bitcoin</div>
                            <div style={styles.coinSymbol}>BTC</div>
                        </div>
                    </div>
                    <div style={styles.coinPrice}>
                        ${(marketData?.btc?.price || 43500).toLocaleString()}
                    </div>
                    <div style={{
                        ...styles.coinChange,
                        color: btcPositive ? '#00ff88' : '#ff4444'
                    }}>
                        <span>{btcPositive ? '▲' : '▼'}</span>
                        <span>{btcPositive ? '+' : ''}{(marketData?.btc?.change24h || 0).toFixed(2)}%</span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>24s</span>
                    </div>
                </div>

                {/* ETH */}
                <div style={{
                    ...styles.coinCard,
                    borderTop: `3px solid ${ethPositive ? '#00ff88' : '#ff4444'}`
                }}>
                    <div style={styles.coinHeader}>
                        <div style={{
                            ...styles.coinIcon,
                            background: 'linear-gradient(135deg, #627eea 0%, #8a9df9 100%)'
                        }}>
                            Ξ
                        </div>
                        <div>
                            <div style={styles.coinName}>Ethereum</div>
                            <div style={styles.coinSymbol}>ETH</div>
                        </div>
                    </div>
                    <div style={styles.coinPrice}>
                        ${(marketData?.eth?.price || 2280).toLocaleString()}
                    </div>
                    <div style={{
                        ...styles.coinChange,
                        color: ethPositive ? '#00ff88' : '#ff4444'
                    }}>
                        <span>{ethPositive ? '▲' : '▼'}</span>
                        <span>{ethPositive ? '+' : ''}{(marketData?.eth?.change24h || 0).toFixed(2)}%</span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>24s</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>Toplam Market Cap</div>
                    <div style={{ ...styles.statValue, color: '#00d4ff' }}>
                        ${marketData?.totalMarketCap?.toFixed(2)}T
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>BTC Dominance</div>
                    <div style={{ ...styles.statValue, color: '#f7931a' }}>
                        %{marketData?.btcDominance?.toFixed(1)}
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>24s Hacim</div>
                    <div style={{ ...styles.statValue, color: '#8b5cf6' }}>
                        ${marketData?.volume24h?.toFixed(1)}B
                    </div>
                </div>
            </div>

            {/* Trend Indicator */}
            <div style={{
                ...styles.trendIndicator,
                background: `${scoreColor}15`,
                border: `1px solid ${scoreColor}33`
            }}>
                <span style={{ fontSize: '24px' }}>
                    {score >= 60 ? '📈' : score >= 40 ? '➡️' : '📉'}
                </span>
                <span style={{ fontWeight: 'bold', color: scoreColor }}>
                    {marketData?.btc?.trend || 'Neutral'} Trend
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                    • Titan Engine
                </span>
            </div>
        </div>
    );
};

export default MarketOverviewCard;
