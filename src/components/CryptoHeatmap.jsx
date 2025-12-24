import React, { useState, useEffect } from 'react';

/**
 * CryptoHeatmap - Piyasa Isı Haritası
 * Top coinlerin performans görselleştirmesi
 */
const CryptoHeatmap = () => {
    const [coins, setCoins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('24h');
    const [sortBy, setSortBy] = useState('marketCap');

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Her dakika güncelle
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            // Binance'den top coinleri çek
            const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
            const data = await response.json();

            // USDT çiftlerini filtrele ve sırala
            const usdtPairs = data
                .filter(t => t.symbol.endsWith('USDT') &&
                    !t.symbol.includes('UP') &&
                    !t.symbol.includes('DOWN') &&
                    !t.symbol.includes('BUSD') &&
                    parseFloat(t.quoteVolume) > 1000000)
                .map(t => ({
                    symbol: t.symbol.replace('USDT', ''),
                    price: parseFloat(t.lastPrice),
                    change24h: parseFloat(t.priceChangePercent),
                    volume: parseFloat(t.quoteVolume),
                    high24h: parseFloat(t.highPrice),
                    low24h: parseFloat(t.lowPrice)
                }))
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 50);

            setCoins(usdtPairs);
            setLoading(false);
        } catch (error) {
            console.error('Heatmap veri çekme hatası:', error);
            setLoading(false);
        }
    };

    const getColor = (change) => {
        if (change >= 10) return '#00ff88';
        if (change >= 5) return '#00dd77';
        if (change >= 2) return '#00bb66';
        if (change >= 0) return '#009955';
        if (change >= -2) return '#bb4444';
        if (change >= -5) return '#dd3333';
        if (change >= -10) return '#ff2222';
        return '#ff0000';
    };

    const getSize = (volume, maxVolume) => {
        const minSize = 60;
        const maxSize = 140;
        const ratio = Math.log10(volume) / Math.log10(maxVolume);
        return minSize + (maxSize - minSize) * ratio;
    };

    const formatVolume = (vol) => {
        if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
        if (vol >= 1e6) return (vol / 1e6).toFixed(1) + 'M';
        if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
        return vol.toFixed(0);
    };

    const formatPrice = (price) => {
        if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
        if (price >= 1) return price.toFixed(2);
        if (price >= 0.01) return price.toFixed(4);
        return price.toFixed(8);
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
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        controls: {
            display: 'flex',
            gap: '8px'
        },
        button: {
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s'
        },
        heatmapGrid: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center'
        },
        coinCell: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            padding: '8px'
        },
        legend: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px',
            flexWrap: 'wrap'
        },
        legendItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.7)'
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.title}>🔥 Crypto Heatmap</div>
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.6)' }}>
                    Yükleniyor...
                </div>
            </div>
        );
    }

    const maxVolume = Math.max(...coins.map(c => c.volume));

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.title}>
                    <span>🔥</span>
                    <span>Crypto Heatmap</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal' }}>
                        Top 50 Coin
                    </span>
                </div>
                <div style={styles.controls}>
                    <button
                        style={{
                            ...styles.button,
                            background: sortBy === 'change' ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                            color: sortBy === 'change' ? '#00d4ff' : 'rgba(255,255,255,0.6)'
                        }}
                        onClick={() => {
                            setSortBy('change');
                            setCoins([...coins].sort((a, b) => b.change24h - a.change24h));
                        }}
                    >
                        Değişime Göre
                    </button>
                    <button
                        style={{
                            ...styles.button,
                            background: sortBy === 'volume' ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                            color: sortBy === 'volume' ? '#00d4ff' : 'rgba(255,255,255,0.6)'
                        }}
                        onClick={() => {
                            setSortBy('volume');
                            setCoins([...coins].sort((a, b) => b.volume - a.volume));
                        }}
                    >
                        Hacime Göre
                    </button>
                </div>
            </div>

            <div style={styles.heatmapGrid}>
                {coins.map((coin, index) => {
                    const size = getSize(coin.volume, maxVolume);
                    const color = getColor(coin.change24h);

                    return (
                        <div
                            key={coin.symbol}
                            style={{
                                ...styles.coinCell,
                                width: size,
                                height: size,
                                background: `${color}22`,
                                border: `1px solid ${color}44`
                            }}
                            title={`${coin.symbol}\nFiyat: $${formatPrice(coin.price)}\nDeğişim: ${coin.change24h.toFixed(2)}%\nHacim: $${formatVolume(coin.volume)}`}
                        >
                            <span style={{ fontWeight: 'bold', fontSize: size > 80 ? '14px' : '11px' }}>
                                {coin.symbol}
                            </span>
                            <span style={{
                                fontSize: size > 80 ? '12px' : '9px',
                                color: color,
                                fontWeight: 'bold'
                            }}>
                                {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(1)}%
                            </span>
                            {size > 100 && (
                                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>
                                    ${formatPrice(coin.price)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={styles.legend}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginRight: '8px' }}>
                    24s Değişim:
                </span>
                {[
                    { label: '>10%', color: '#00ff88' },
                    { label: '5-10%', color: '#00bb66' },
                    { label: '0-5%', color: '#009955' },
                    { label: '-5-0%', color: '#bb4444' },
                    { label: '<-5%', color: '#ff2222' }
                ].map(item => (
                    <div key={item.label} style={styles.legendItem}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Summary Stats */}
            <div style={{
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
            }}>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,255,136,0.1)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Yükselenler</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00ff88' }}>
                        {coins.filter(c => c.change24h > 0).length}
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,68,68,0.1)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Düşenler</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4444' }}>
                        {coins.filter(c => c.change24h < 0).length}
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,212,255,0.1)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>En Yüksek</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00d4ff' }}>
                        {coins.sort((a, b) => b.change24h - a.change24h)[0]?.symbol} +{coins.sort((a, b) => b.change24h - a.change24h)[0]?.change24h.toFixed(1)}%
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,170,0,0.1)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>En Düşük</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffaa00' }}>
                        {coins.sort((a, b) => a.change24h - b.change24h)[0]?.symbol} {coins.sort((a, b) => a.change24h - b.change24h)[0]?.change24h.toFixed(1)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CryptoHeatmap;
