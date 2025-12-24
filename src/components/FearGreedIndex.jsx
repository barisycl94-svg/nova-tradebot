import React, { useState, useEffect } from 'react';

/**
 * FearGreedIndex - Crypto Fear & Greed Göstergesi
 * Piyasa sentiment analizi
 */
const FearGreedIndex = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchFearGreed();
    }, []);

    const fetchFearGreed = async () => {
        try {
            // Alternative.me Fear & Greed API
            const response = await fetch('https://api.alternative.me/fng/?limit=30');
            const result = await response.json();

            if (result.data && result.data.length > 0) {
                setData(result.data[0]);
                setHistory(result.data.slice(0, 7)); // Son 7 gün
            }
        } catch (error) {
            console.error('Fear & Greed API hatası:', error);
            // Fallback simulated data
            setData({
                value: Math.floor(Math.random() * 100),
                value_classification: 'Neutral',
                timestamp: Date.now() / 1000
            });
        }
        setLoading(false);
    };

    const getColor = (value) => {
        if (value <= 20) return '#ff0000'; // Extreme Fear
        if (value <= 40) return '#ff6600'; // Fear
        if (value <= 60) return '#ffcc00'; // Neutral
        if (value <= 80) return '#88cc00'; // Greed
        return '#00ff00'; // Extreme Greed
    };

    const getLabel = (value) => {
        if (value <= 20) return 'Aşırı Korku';
        if (value <= 40) return 'Korku';
        if (value <= 60) return 'Nötr';
        if (value <= 80) return 'Açgözlülük';
        return 'Aşırı Açgözlülük';
    };

    const getEmoji = (value) => {
        if (value <= 20) return '😱';
        if (value <= 40) return '😨';
        if (value <= 60) return '😐';
        if (value <= 80) return '😊';
        return '🤑';
    };

    const getAdvice = (value) => {
        if (value <= 20) return 'Potansiyel alım fırsatı - Herkes korktuğunda cesur ol!';
        if (value <= 40) return 'Dikkatli ol - Piyasa endişeli ama panik yapma.';
        if (value <= 60) return 'Piyasa dengede - Stratejine sadık kal.';
        if (value <= 80) return 'Dikkatli ol - FOMO yapmaktan kaçın.';
        return 'Aşırı iyimserlik - Kar realizasyonu düşün!';
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
            marginBottom: '20px'
        },
        title: {
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        gaugeContainer: {
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px'
        },
        valueDisplay: {
            textAlign: 'center',
            marginBottom: '20px'
        },
        historyContainer: {
            marginTop: '20px'
        },
        historyBar: {
            display: 'flex',
            gap: '4px',
            marginTop: '12px'
        },
        advice: {
            padding: '16px',
            borderRadius: '12px',
            marginTop: '20px',
            fontSize: '14px',
            textAlign: 'center'
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.title}>😱 Fear & Greed Index</div>
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)' }}>
                    Yükleniyor...
                </div>
            </div>
        );
    }

    const value = parseInt(data?.value || 50);
    const color = getColor(value);

    // Gauge SVG
    const renderGauge = () => {
        const size = 200;
        const strokeWidth = 20;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * Math.PI; // Yarım daire
        const progress = (value / 100) * circumference;

        return (
            <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
                {/* Background arc */}
                <path
                    d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Gradient definition */}
                <defs>
                    <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ff0000" />
                        <stop offset="25%" stopColor="#ff6600" />
                        <stop offset="50%" stopColor="#ffcc00" />
                        <stop offset="75%" stopColor="#88cc00" />
                        <stop offset="100%" stopColor="#00ff00" />
                    </linearGradient>
                </defs>

                {/* Progress arc */}
                <path
                    d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                    fill="none"
                    stroke="url(#fearGreedGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                />

                {/* Needle */}
                <g transform={`translate(${size / 2}, ${size / 2}) rotate(${(value / 100) * 180 - 90})`}>
                    <line x1="0" y1="0" x2="0" y2={-radius + 30} stroke={color} strokeWidth="3" />
                    <circle cx="0" cy="0" r="8" fill={color} />
                </g>

                {/* Labels */}
                <text x="15" y={size / 2 + 15} fill="rgba(255,255,255,0.5)" fontSize="10">Korku</text>
                <text x={size - 55} y={size / 2 + 15} fill="rgba(255,255,255,0.5)" fontSize="10">Açgözlülük</text>
            </svg>
        );
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.title}>
                    <span>{getEmoji(value)}</span>
                    <span>Fear & Greed Index</span>
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    Güncelleme: {new Date(data.timestamp * 1000).toLocaleDateString('tr-TR')}
                </div>
            </div>

            <div style={styles.gaugeContainer}>
                {renderGauge()}
            </div>

            <div style={styles.valueDisplay}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: color }}>
                    {value}
                </div>
                <div style={{ fontSize: '18px', color: color, marginTop: '8px' }}>
                    {getLabel(value)}
                </div>
            </div>

            {/* 7 Günlük Tarihçe */}
            <div style={styles.historyContainer}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    📅 Son 7 Gün
                </div>
                <div style={styles.historyBar}>
                    {history.map((item, index) => {
                        const val = parseInt(item.value);
                        return (
                            <div
                                key={index}
                                style={{
                                    flex: 1,
                                    height: '40px',
                                    background: getColor(val),
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: val > 50 ? '#000' : '#fff'
                                }}
                                title={new Date(item.timestamp * 1000).toLocaleDateString('tr-TR')}
                            >
                                {val}
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                    <span>Bugün</span>
                    <span>7 gün önce</span>
                </div>
            </div>

            {/* Trading Advice */}
            <div style={{
                ...styles.advice,
                background: `${color}22`,
                border: `1px solid ${color}44`
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: color }}>
                    💡 Trading İpucu
                </div>
                {getAdvice(value)}
            </div>

            {/* Scale Legend */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '20px',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)'
            }}>
                <span>0 - Aşırı Korku</span>
                <span>25 - Korku</span>
                <span>50 - Nötr</span>
                <span>75 - Açgözlülük</span>
                <span>100 - Aşırı Açgözlülük</span>
            </div>
        </div>
    );
};

export default FearGreedIndex;
