import React, { useState, useEffect } from 'react';
import { autoPilotEngine } from '../services/autopilot/AutoPilotEngine.js';

/**
 * AutoPilotCard - ATR bazlı Stop Loss/Take Profit hesaplama UI
 * Demo mode ile çalışabilir
 */
const AutoPilotCard = ({ currentPrice = 0, candles = [], signal = 'BUY', symbol = 'BTC' }) => {
    const [levels, setLevels] = useState(null);
    const [targets, setTargets] = useState([]);
    const [settings, setSettings] = useState({
        atrMultiplierStop: 2.0,
        atrMultiplierTarget: 4.0
    });
    const [demoMode, setDemoMode] = useState(false);
    const [inputPrice, setInputPrice] = useState('');
    const [inputAtr, setInputAtr] = useState('');

    useEffect(() => {
        try {
            const engineSettings = autoPilotEngine.getSettings();
            if (engineSettings) setSettings(engineSettings);
        } catch (e) {
            console.log('AutoPilot settings fallback');
        }
    }, []);

    useEffect(() => {
        if (currentPrice > 0 && candles.length >= 15) {
            calculate();
            setDemoMode(false);
        } else {
            // Demo mode with sample data
            calculateDemo();
            setDemoMode(true);
        }
    }, [currentPrice, candles, signal, settings]);

    const calculate = () => {
        try {
            const atr = autoPilotEngine.calculateATR(candles);
            if (atr === 0) {
                calculateDemo();
                return;
            }
            const calculatedLevels = autoPilotEngine.calculateLevels(signal, currentPrice, atr);
            setLevels(calculatedLevels);
            const multiTargets = autoPilotEngine.calculateMultipleTargets(currentPrice, atr, signal);
            setTargets(multiTargets);
        } catch (e) {
            calculateDemo();
        }
    };

    const calculateDemo = () => {
        // Demo values for BTC
        const demoPrice = parseFloat(inputPrice) || 45000;
        const demoAtr = parseFloat(inputAtr) || (demoPrice * 0.025); // ~2.5% ATR

        const isLong = signal === 'BUY' || signal === 'STRONG_BUY';
        const stopMult = settings.atrMultiplierStop;
        const targetMult = settings.atrMultiplierTarget;

        const stopLoss = isLong ? demoPrice - (demoAtr * stopMult) : demoPrice + (demoAtr * stopMult);
        const takeProfit = isLong ? demoPrice + (demoAtr * targetMult) : demoPrice - (demoAtr * targetMult);
        const riskAmount = Math.abs(demoPrice - stopLoss);
        const rewardAmount = Math.abs(takeProfit - demoPrice);

        setLevels({
            entryPrice: demoPrice,
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            riskReward: riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(2) : 0,
            riskPercent: ((riskAmount / demoPrice) * 100).toFixed(2),
            atr: demoAtr,
            atrPercent: ((demoAtr / demoPrice) * 100).toFixed(2)
        });

        const dir = isLong ? 1 : -1;
        setTargets([
            { level: 1, price: demoPrice + (dir * demoAtr * 2), percentage: 33 },
            { level: 2, price: demoPrice + (dir * demoAtr * 4), percentage: 33 },
            { level: 3, price: demoPrice + (dir * demoAtr * 6), percentage: 34 }
        ]);
    };

    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: parseFloat(value) };
        setSettings(newSettings);
        try {
            autoPilotEngine.updateSettings(newSettings);
        } catch (e) { }
    };

    const formatPrice = (price) => {
        if (!price && price !== 0) return '-';
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return '-';
        if (numPrice >= 1000) return numPrice.toLocaleString(undefined, { maximumFractionDigits: 2 });
        if (numPrice >= 1) return numPrice.toFixed(4);
        return numPrice.toFixed(8);
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
            paddingBottom: '15px',
            borderBottom: '1px solid rgba(100,100,150,0.3)'
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        demoBadge: {
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            background: 'rgba(255,170,0,0.2)',
            color: '#ffaa00',
            marginLeft: '10px'
        },
        inputSection: {
            background: 'rgba(0,212,255,0.1)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid rgba(0,212,255,0.2)'
        },
        inputRow: {
            display: 'flex',
            gap: '12px',
            marginBottom: '12px'
        },
        inputGroup: {
            flex: 1
        },
        label: {
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '4px',
            display: 'block'
        },
        input: {
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(100,100,150,0.3)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: '14px',
            boxSizing: 'border-box'
        },
        levelRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderRadius: '12px',
            marginBottom: '10px'
        },
        levelLabel: {
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        levelValue: {
            fontSize: '18px',
            fontWeight: 'bold'
        },
        section: {
            marginTop: '20px',
            padding: '16px',
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
        targetRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(0,255,136,0.08)',
            marginBottom: '8px',
            fontSize: '13px',
            alignItems: 'center'
        },
        slider: {
            width: '120px',
            accentColor: '#00d4ff'
        },
        infoBox: {
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(0,212,255,0.1)',
            border: '1px solid rgba(0,212,255,0.3)',
            marginTop: '16px'
        }
    };

    const isLong = signal === 'BUY' || signal === 'STRONG_BUY';

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.title}>
                    <span style={{ fontSize: '28px' }}>🤖</span>
                    <span>AutoPilot</span>
                    {demoMode && <span style={styles.demoBadge}>DEMO</span>}
                </div>
                <div style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: isLong ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,68,0.2)',
                    color: isLong ? '#00ff88' : '#ff4444',
                    border: `1px solid ${isLong ? 'rgba(0,255,136,0.4)' : 'rgba(255,68,68,0.4)'}`
                }}>
                    {isLong ? '📈 LONG' : '📉 SHORT'}
                </div>
            </div>

            {/* Demo Input */}
            {demoMode && (
                <div style={styles.inputSection}>
                    <div style={{ fontSize: '12px', color: '#00d4ff', marginBottom: '12px', fontWeight: 'bold' }}>
                        💡 Demo Modu - Fiyat ve ATR değerlerini girin
                    </div>
                    <div style={styles.inputRow}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Giriş Fiyatı ($)</label>
                            <input
                                type="number"
                                style={styles.input}
                                value={inputPrice}
                                onChange={(e) => {
                                    setInputPrice(e.target.value);
                                    setTimeout(calculateDemo, 100);
                                }}
                                placeholder="45000"
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>ATR Değeri ($)</label>
                            <input
                                type="number"
                                style={styles.input}
                                value={inputAtr}
                                onChange={(e) => {
                                    setInputAtr(e.target.value);
                                    setTimeout(calculateDemo, 100);
                                }}
                                placeholder="1125"
                            />
                        </div>
                    </div>
                </div>
            )}

            {levels && (
                <>
                    {/* Entry Price */}
                    <div style={{ ...styles.levelRow, background: 'rgba(0,212,255,0.15)' }}>
                        <div style={styles.levelLabel}>
                            <span>🎯</span> Giriş Fiyatı
                        </div>
                        <div style={{ ...styles.levelValue, color: '#00d4ff' }}>
                            ${formatPrice(levels.entryPrice)}
                        </div>
                    </div>

                    {/* Stop Loss */}
                    <div style={{ ...styles.levelRow, background: 'rgba(255,68,68,0.15)' }}>
                        <div style={styles.levelLabel}>
                            <span>🛑</span> Stop Loss
                        </div>
                        <div style={{ ...styles.levelValue, color: '#ff4444' }}>
                            ${formatPrice(levels.stopLoss)}
                            <span style={{ fontSize: '12px', marginLeft: '10px', opacity: 0.8 }}>
                                (-{levels.riskPercent}%)
                            </span>
                        </div>
                    </div>

                    {/* Take Profit */}
                    <div style={{ ...styles.levelRow, background: 'rgba(0,255,136,0.15)' }}>
                        <div style={styles.levelLabel}>
                            <span>💰</span> Take Profit
                        </div>
                        <div style={{ ...styles.levelValue, color: '#00ff88' }}>
                            ${formatPrice(levels.takeProfit)}
                        </div>
                    </div>

                    {/* Risk/Reward */}
                    <div style={{ ...styles.levelRow, background: 'rgba(255,170,0,0.15)' }}>
                        <div style={styles.levelLabel}>
                            <span>⚖️</span> Risk/Reward
                        </div>
                        <div style={{ ...styles.levelValue, color: '#ffaa00' }}>
                            1:{levels.riskReward}
                        </div>
                    </div>

                    {/* ATR Info */}
                    <div style={styles.infoBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>ATR (14):</span>
                            <span style={{ fontWeight: 'bold' }}>${formatPrice(levels.atr)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '10px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Volatilite:</span>
                            <span style={{
                                fontWeight: 'bold',
                                color: parseFloat(levels.atrPercent) > 5 ? '#ff6600' : '#00ff88'
                            }}>
                                %{levels.atrPercent}
                            </span>
                        </div>
                    </div>

                    {/* Multi-Target Strategy */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>
                            <span>🎯</span> Scale-Out Hedefleri
                        </div>
                        {targets.map((target, idx) => (
                            <div key={idx} style={styles.targetRow}>
                                <span style={{ fontWeight: 'bold' }}>Hedef {target.level}</span>
                                <span style={{ fontWeight: 'bold', color: '#00ff88' }}>${formatPrice(target.price)}</span>
                                <span style={{
                                    padding: '4px 8px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    fontSize: '11px'
                                }}>
                                    %{target.percentage} kapat
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Settings */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>
                            <span>⚙️</span> Ayarlar
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Stop Loss Çarpanı</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>ATR x {settings.atrMultiplierStop}</div>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="4"
                                step="0.5"
                                value={settings.atrMultiplierStop}
                                onChange={(e) => updateSetting('atrMultiplierStop', e.target.value)}
                                style={styles.slider}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Take Profit Çarpanı</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>ATR x {settings.atrMultiplierTarget}</div>
                            </div>
                            <input
                                type="range"
                                min="2"
                                max="8"
                                step="0.5"
                                value={settings.atrMultiplierTarget}
                                onChange={(e) => updateSetting('atrMultiplierTarget', e.target.value)}
                                style={styles.slider}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AutoPilotCard;
