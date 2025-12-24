/**
 * TelegramSettings.jsx
 * Nova TradeBot - Telegram Bildirim Ayarları
 */

import React, { useState } from 'react';
import { telegramService } from '../../services/TelegramService.js';
import { CyberTelegramIcon } from '../ui/CyberBadgeIcons.jsx';

export const TelegramSettings = () => {
    const [config, setConfig] = useState(telegramService.config);
    const [saved, setSaved] = useState(false);
    const [testLoading, setTestLoading] = useState(false);

    const handleSave = () => {
        telegramService.saveConfig(config);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const sendTestMessage = async () => {
        setTestLoading(true);
        // Önce ayarları kaydet ki güncel tokenla göndersin
        telegramService.saveConfig(config);
        await telegramService.sendNotification("🧪 Bu bir test mesajıdır. Bağlantı başarılı!");
        setTestLoading(false);
        alert("Test mesajı gönderildi! (Telegram'ı kontrol edin)");
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CyberTelegramIcon />
                <span style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #0088cc 0%, #00bfff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 10px rgba(0, 136, 204, 0.3))'
                }}>
                    TELEGRAM BİLDİRİMLERİ
                </span>
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                İşlem açılış ve kapanışlarını anlık olarak Telegram'dan takip edin.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                    <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: config.enabled ? '#0088cc' : '#ccc',
                        transition: '.4s', borderRadius: '34px'
                    }}>
                        <span style={{
                            position: 'absolute', height: '18px', width: '18px', left: config.enabled ? '28px' : '4px', bottom: '4px',
                            backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                        }}></span>
                    </span>
                </label>
                <span style={{ fontWeight: 'bold' }}>{config.enabled ? 'Açık' : 'Kapalı'}</span>
            </div>

            {config.enabled && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Bot Token</label>
                        <input
                            type="password"
                            value={config.botToken}
                            onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                            placeholder="123456789:ABCDefgh..."
                            style={{
                                width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                                color: '#fff', borderRadius: '8px', outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Chat ID</label>
                        <input
                            type="text"
                            value={config.chatId}
                            onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
                            placeholder="Örn: 987654321"
                            style={{
                                width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                                color: '#fff', borderRadius: '8px', outline: 'none'
                            }}
                        />
                        <a
                            href="https://t.me/userinfobot"
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '0.7rem', color: '#0088cc', marginTop: '5px', display: 'inline-block' }}
                        >
                            Chat ID'mi nasıl bulurum?
                        </a>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                        <button
                            onClick={handleSave}
                            className="btn"
                            style={{
                                flex: 1, background: saved ? 'var(--success)' : '#0088cc', color: '#fff',
                                border: 'none', padding: '10px'
                            }}
                        >
                            {saved ? '✓ Kaydedildi' : 'Kaydet'}
                        </button>
                        <button
                            onClick={sendTestMessage}
                            disabled={testLoading}
                            className="btn"
                            style={{
                                flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid #0088cc', color: '#0088cc',
                                padding: '10px'
                            }}
                        >
                            {testLoading ? '...' : 'Test Et'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
