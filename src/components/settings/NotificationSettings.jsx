/**
 * NotificationSettings.jsx
 * Nova TradeBot - Tarayıcı Bildirim Ayarları
 */

import React, { useState, useEffect } from 'react';
import { CyberBellIcon } from '../ui/CyberBadgeIcons.jsx';

export const NotificationSettings = () => {
    const [permissionStatus, setPermissionStatus] = useState('default');
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        // Tarayıcı desteğini kontrol et
        if (typeof window === 'undefined' || !('Notification' in window)) {
            setIsSupported(false);
            return;
        }
        setPermissionStatus(Notification.permission);
    }, []);

    const requestPermission = async () => {
        if (!isSupported) return;

        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission === 'granted') {
                // Test bildirimi gönder
                new Notification('🎉 Nova TradeBot', {
                    body: 'Bildirimler başarıyla aktifleştirildi! Artık işlem açılıp kapandığında bildirim alacaksınız.',
                    icon: '/nova-icon.png'
                });
            }
        } catch (error) {
            console.error('Bildirim izni hatası:', error);
        }
    };

    const getStatusInfo = () => {
        switch (permissionStatus) {
            case 'granted':
                return {
                    color: 'var(--success)',
                    icon: '✅',
                    text: 'Bildirimler Aktif',
                    description: 'İşlem açıldığında ve kapandığında tarayıcı bildirimi alacaksınız.'
                };
            case 'denied':
                return {
                    color: 'var(--accent)',
                    icon: '🚫',
                    text: 'Bildirimler Engellendi',
                    description: 'Tarayıcı ayarlarından bildirimlere izin vermeniz gerekiyor.'
                };
            default:
                return {
                    color: 'var(--warning)',
                    icon: '🔔',
                    text: 'Bildirimler Beklemede',
                    description: 'Bildirimleri aktifleştirmek için aşağıdaki butona tıklayın.'
                };
        }
    };

    if (!isSupported) {
        return (
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--text-muted)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🔔</span> Tarayıcı Bildirimleri
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Bu tarayıcı bildirimleri desteklemiyor.
                </p>
            </div>
        );
    }

    const statusInfo = getStatusInfo();

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: `4px solid ${statusInfo.color}` }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CyberBellIcon />
                <span style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))'
                }}>
                    TARAYICI BİLDİRİMLERİ
                </span>
            </h3>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                marginBottom: '1rem'
            }}>
                <div style={{ fontSize: '1.5rem' }}>{statusInfo.icon}</div>
                <div>
                    <div style={{ fontWeight: 'bold', color: statusInfo.color }}>{statusInfo.text}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{statusInfo.description}</div>
                </div>
            </div>

            {permissionStatus === 'default' && (
                <button
                    onClick={requestPermission}
                    style={{
                        width: '100%',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark, #00c3d0))',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#000',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <span>🔔</span> Bildirimleri Aktifleştir
                </button>
            )}

            {permissionStatus === 'denied' && (
                <div style={{
                    padding: '12px',
                    background: 'rgba(255, 0, 85, 0.1)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--accent)'
                }}>
                    <strong>Bildirimlere izin vermek için:</strong>
                    <ol style={{ margin: '8px 0 0 20px', padding: 0 }}>
                        <li>Adres çubuğundaki 🔒 simgesine tıklayın</li>
                        <li>"Site Ayarları" veya "İzinler" seçin</li>
                        <li>"Bildirimler" için "İzin Ver" seçin</li>
                        <li>Sayfayı yenileyin</li>
                    </ol>
                </div>
            )}

            {permissionStatus === 'granted' && (
                <button
                    onClick={() => {
                        new Notification('🧪 Test Bildirimi', {
                            body: 'Bu bir test bildirimidir. Her şey çalışıyor!',
                            icon: '/nova-icon.png'
                        });
                    }}
                    style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: 'rgba(0, 255, 157, 0.1)',
                        border: '1px solid var(--success)',
                        borderRadius: '8px',
                        color: 'var(--success)',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>🧪</span> Test Bildirimi Gönder
                </button>
            )}
        </div>
    );
};

export default NotificationSettings;
