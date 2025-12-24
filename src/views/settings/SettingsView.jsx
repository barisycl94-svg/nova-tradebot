/**
 * SettingsView.jsx
 * Nova TradeBot - Ayarlar Sayfası
 */

import React, { useState, useEffect } from 'react';
import { tradingViewModel } from '../../viewmodels/TradingViewModel.js';
import { tradingConfig, TRADING_MODES } from '../../config/TradingConfig.js';
import { LearningDashboard } from '../../components/analytics/LearningDashboard.jsx';
import { learningEngine } from '../../services/learning/LearningEngine.js';
import TelegramSettingsPanel from '../../components/settings/TelegramSettingsPanel.jsx';
import BackgroundServicePanel from '../../components/settings/BackgroundServicePanel.jsx';
import {
    CyberSettingsIcon,
    CyberBrainIcon,
    CyberRobotIcon,
    CyberRiskShieldIcon,
    CyberBellIcon,
    CyberWarningIcon
} from '../../components/ui/CyberBadgeIcons.jsx';

const DEFAULT_SETTINGS = {
    maxPositionPercent: 10,
    maxOpenTrades: 50,
    scanIntervalSeconds: 30,
};

export const SettingsView = () => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('novaTradeBot_settings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });

    const [currentMode, setCurrentMode] = useState(tradingConfig.getMode());
    const [saved, setSaved] = useState(false);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleModeChange = (modeId) => {
        tradingConfig.setMode(modeId);
        setCurrentMode(modeId);
        setSaved(false);
    };

    const saveSettings = () => {
        localStorage.setItem('novaTradeBot_settings', JSON.stringify(settings));
        tradingViewModel.applySettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const resetToDefaults = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem('novaTradeBot_settings', JSON.stringify(DEFAULT_SETTINGS));
        tradingViewModel.applySettings(DEFAULT_SETTINGS);
        tradingConfig.setMode('balanced');
        setCurrentMode('balanced');
    };

    const allModes = tradingConfig.getAllModes();

    return (
        <div className="container" style={{ padding: '20px 0' }}>
            <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <CyberSettingsIcon />
                <span style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    letterSpacing: '2px',
                    background: 'linear-gradient(135deg, #e0e0e0 0%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
                }}>
                    AYARLAR
                </span>
            </h2>

            {/* YAPAY ZEKA VE ÖĞRENME PANELİ */}
            <LearningDashboard />

            {/* TRADING MODU */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CyberBrainIcon /> {/* Using Brain here as it fits "Mode/Strategy" or maybe I should use something else? 
                    Actually, "Trading Modu" is about strategy. Brain is good. Or I can use CyberTakeProfitIcon (Target).
                    Let's use a Target-like icon. I didn't export CyberTargetIcon explicitly, 
                    but CyberTakeProfitIcon is a target box. 
                    Let's stick to the user's screenshot where "Trading Modu" has a target/bullseye. 
                    I'll use CyberTakeProfitIcon for now or the Brain. 
                    Wait, let's use CyberRobotIcon for "Trading Modu" or "Otopilot". 
                    Let's use CyberRobotIcon for "Otopilot".
                    For "Trading Modu", let's use the standard "Target" emoji but stylized, OR 
                    since I didn't make a specific "CyberModeIcon", I will use `CyberRiskShieldIcon` for Risk.
                    Let's just use the `CyberBrainIcon` for "Otomatik Karar". 
                    
                    I will use a simple inline SVG for the Target if needed or just reuse CyberTakeProfitIcon which looks like a target. 
                    Actually, let's import CyberTakeProfitIcon and rename it/use it.
                    */}
                    <span style={{
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #00f3ff 0%, #0066ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 10px rgba(0, 243, 255, 0.3))'
                    }}>
                        TRADING MODU
                    </span>
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Botun ne kadar agresif işlem açacağını belirler. Agresif modlar daha fazla işlem açar ama risk artar.
                </p>

                <div style={{ display: 'grid', gap: '10px' }}>
                    {allModes.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => handleModeChange(mode.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                padding: '1rem 1.25rem',
                                background: currentMode === mode.id
                                    ? `linear-gradient(135deg, ${mode.color}22, ${mode.color}11)`
                                    : 'var(--bg-panel)',
                                border: currentMode === mode.id
                                    ? `2px solid ${mode.color}`
                                    : '2px solid transparent',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'left'
                            }}
                        >
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '10px',
                                background: `linear-gradient(135deg, ${mode.color}33, ${mode.color}11)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem'
                            }}>
                                {(mode?.name?.split(' ')[0] || '???').substring(0, 3)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: 'bold',
                                    color: currentMode === mode.id ? mode.color : 'var(--text-primary)',
                                    marginBottom: '4px'
                                }}>
                                    {mode.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {mode.description}
                                </div>
                            </div>
                            <div style={{
                                padding: '6px 12px',
                                background: 'var(--bg-dark)',
                                borderRadius: '8px',
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '0.85rem',
                                color: mode.color
                            }}>
                                AL: ≥{mode.buyThreshold}
                            </div>
                            {currentMode === mode.id && (
                                <div style={{ color: mode.color, fontSize: '1.2rem' }}>✓</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* RİSK YÖNETİMİ */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CyberRiskShieldIcon />
                    <span style={{
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #00a8ff 0%, #004e92 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 10px rgba(0, 168, 255, 0.3))'
                    }}>
                        RİSK YÖNETİMİ
                    </span>
                </h3>

                {/* Maksimum Pozisyon Yüzdesi */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Tek İşlemde Maksimum Portföy Kullanımı
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={settings.maxPositionPercent}
                            onChange={(e) => updateSetting('maxPositionPercent', parseInt(e.target.value))}
                            style={{ flex: 1, accentColor: 'var(--primary)' }}
                        />
                        <div style={{
                            minWidth: '80px',
                            padding: '10px 16px',
                            background: 'var(--bg-panel)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '1.2rem',
                            color: 'var(--primary)'
                        }}>
                            %{settings.maxPositionPercent}
                        </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        Her işlemde portföyünüzün maksimum bu kadarı kullanılır.
                    </div>
                </div>

                {/* Maksimum Açık İşlem */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Maksimum Açık İşlem Sayısı
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={settings.maxOpenTrades}
                            onChange={(e) => updateSetting('maxOpenTrades', parseInt(e.target.value))}
                            style={{ flex: 1, accentColor: 'var(--primary)' }}
                        />
                        <div style={{
                            minWidth: '80px',
                            padding: '10px 16px',
                            background: 'var(--bg-panel)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '1.2rem',
                            color: 'var(--primary)'
                        }}>
                            {settings.maxOpenTrades}
                        </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        Aynı anda en fazla bu kadar pozisyon açık olabilir.
                    </div>
                </div>
            </div>

            {/* OTOPİLOT AYARLARI */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CyberRobotIcon />
                    <span style={{
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #00f3ff 0%, #0066ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 10px rgba(0, 243, 255, 0.3))'
                    }}>
                        OTOPİLOT AYARLARI
                    </span>
                </h3>

                {/* Tarama Aralığı */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Piyasa Tarama Aralığı
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <input
                            type="range"
                            min="10"
                            max="120"
                            step="10"
                            value={settings.scanIntervalSeconds}
                            onChange={(e) => updateSetting('scanIntervalSeconds', parseInt(e.target.value))}
                            style={{ flex: 1, accentColor: 'var(--primary)' }}
                        />
                        <div style={{
                            minWidth: '100px',
                            padding: '10px 16px',
                            background: 'var(--bg-panel)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '1.2rem',
                            color: 'var(--primary)'
                        }}>
                            {settings.scanIntervalSeconds} sn
                        </div>
                    </div>
                </div>
            </div>

            {/* ⚡ ARKA PLAN MODU */}
            <BackgroundServicePanel />

            {/* 📱 TELEGRAM AYARLARI */}
            <TelegramSettingsPanel />

            {/* BİLGİ KUTUSU */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--success)' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CyberBrainIcon />
                    <span style={{
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #ff00cc 0%, #aa49ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 10px rgba(255, 0, 204, 0.3))'
                    }}>
                        OTOMATİK KARAR MEKANİZMASI
                    </span>
                </h3>
                <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <p style={{ margin: '0 0 10px 0' }}>
                        <strong>Stop Loss ve Take Profit</strong> seviyeleri sistem tarafından otomatik belirlenir:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>ATR (Average True Range) bazlı dinamik hesaplama</li>
                        <li>Stop Loss: 2x ATR (min %3, max %10)</li>
                        <li>Take Profit: 3x ATR (min %5, max %25)</li>
                        <li>Trailing Stop: Kâr %10'u aşarsa aktif</li>
                    </ul>
                </div>
            </div>

            {/* BUTONLAR */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                    onClick={saveSettings}
                    className="btn btn-premium"
                    style={{
                        flex: 1,
                        padding: '1rem',
                        fontSize: '1.1rem',
                        background: saved ? 'var(--success)' : undefined
                    }}
                >
                    {saved ? '✓ Kaydedildi!' : 'Ayarları Kaydet'}
                </button>

                <button
                    onClick={resetToDefaults}
                    className="btn btn-glass"
                >
                    Sıfırla
                </button>
            </div>

            {/* PORTFÖY SIFIRLAMA */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem', borderLeft: '4px solid var(--accent)' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CyberWarningIcon />
                    <span style={{
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #ff4b1f 0%, #ff9068 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 10px rgba(255, 75, 31, 0.3))'
                    }}>
                        TEHLİKELİ BÖLGE
                    </span>
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Portföyü sıfırla: Tüm işlemler, bakiye ve loglar silinir. Bu işlem geri alınamaz!
                </p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <button
                        onClick={() => {
                            if (window.confirm('⚠️ Portföyü sıfırlamak istediğinize emin misiniz?\n\nTüm işlemler, bakiye ve loglar silinecek!')) {
                                tradingViewModel.resetPortfolio();
                                alert('✅ Portföy sıfırlandı! Sayfa yenileniyor...');
                                window.location.reload();
                            }
                        }}
                        className="btn btn-accent"
                        style={{ width: '100%', padding: '1rem' }}
                    >
                        🗑️ Portföyü Sıfırla ($1,000'a dön)
                    </button>

                    <button
                        onClick={() => {
                            if (window.confirm('⚠️ Yapay zeka öğrenme verilerini sıfırlamak istediğinize emin misiniz?\n\nBu işlem botun tüm tecrübesini siler!')) {
                                learningEngine.resetLearning();
                                alert('✅ Öğrenme verileri sıfırlandı!');
                            }
                        }}
                        className="btn btn-warning"
                        style={{ width: '100%', padding: '1rem' }}
                    >
                        🧠 Öğrenme Verilerini Sıfırla
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
