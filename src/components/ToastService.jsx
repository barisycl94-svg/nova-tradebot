/**
 * ToastService.js & ToastContainer.jsx
 * Nova TradeBot - Şık Bildirim Sistemi
 * Toast'lar kalıcıdır ve kullanıcı X'e basana kadar kaybolmaz
 */
import React, { useState, useEffect } from 'react';
import { makeAutoObservable } from 'mobx';

class ToastService {
    constructor() {
        this.toasts = [];
        makeAutoObservable(this);
    }

    show(message, type = 'info', details = null) {
        const id = Date.now();
        this.toasts.push({ id, message, type, details, timestamp: new Date() });
        // Otomatik kaldırma yok - kullanıcı X'e basana kadar kalır
    }

    remove(id) {
        this.toasts = this.toasts.filter(t => t.id !== id);
    }

    clearAll() {
        this.toasts = [];
    }
}

export const toastService = new ToastService();

export const ToastContainer = ({ service }) => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (service.toasts.length !== toasts.length ||
                (service.toasts.length > 0 && service.toasts[0].id !== toasts[0]?.id)) {
                setToasts([...service.toasts]);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [service, toasts]);

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '60px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '420px',
            width: '100%'
        }}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="glass-panel"
                    style={{
                        padding: '16px 20px',
                        paddingRight: '45px',
                        borderLeft: `4px solid ${getColor(toast.type)}`,
                        background: 'rgba(5, 5, 17, 0.98)',
                        color: '#fff',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        borderRadius: '12px',
                        position: 'relative',
                        animation: 'slideIn 0.3s ease-out'
                    }}
                >
                    {/* Kapatma butonu */}
                    <button
                        onClick={() => service.remove(toast.id)}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'rgba(255,255,255,0.6)',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,0,85,0.3)';
                            e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.1)';
                            e.target.style.color = 'rgba(255,255,255,0.6)';
                        }}
                    >
                        ×
                    </button>

                    {/* İkon ve başlık */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '1.5rem', marginTop: '2px' }}>{getIcon(toast.type)}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                marginBottom: toast.details ? '8px' : 0,
                                lineHeight: 1.4
                            }}>
                                {toast.message}
                            </div>

                            {/* Detaylar (neden) */}
                            {toast.details && (
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'rgba(255,255,255,0.7)',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    lineHeight: 1.5,
                                    marginTop: '8px'
                                }}>
                                    {toast.details}
                                </div>
                            )}

                            {/* Zaman */}
                            <div style={{
                                fontSize: '0.7rem',
                                color: 'rgba(255,255,255,0.4)',
                                marginTop: '8px'
                            }}>
                                {toast.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Tümünü temizle butonu */}
            {toasts.length > 1 && (
                <button
                    onClick={() => service.clearAll()}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        textAlign: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255,0,85,0.1)';
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.color = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.05)';
                        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.target.style.color = 'rgba(255,255,255,0.5)';
                    }}
                >
                    🗑️ Tüm Bildirimleri Temizle ({toasts.length})
                </button>
            )}
        </div>
    );
};

// Helper Styles
const getColor = (type) => {
    switch (type) {
        case 'success': return 'var(--success)';
        case 'error': return 'var(--accent)';
        case 'warning': return 'var(--warning)';
        default: return 'var(--primary)';
    }
};

const getIcon = (type) => {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '🛑';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
    }
};

// CSS Animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes slideIn {
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
}
`;
document.head.appendChild(styleSheet);
