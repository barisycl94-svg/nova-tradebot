import React, { useState, useEffect } from 'react';

/**
 * BackgroundServicePanel - Arka Plan Modu Ayarları
 * GitHub Actions ile ücretsiz 7/24 analiz
 */
const BackgroundServicePanel = () => {
    const [status, setStatus] = useState(null);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const checkStatus = async () => {
        try {
            const response = await fetch('/api/analyze');
            const data = await response.json();
            setStatus({
                connected: data.success,
                lastRun: data.timestamp,
                signals: data.signals
            });
        } catch (e) {
            setStatus({ connected: false, error: e.message });
        }
    };

    const runManualAnalysis = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const response = await fetch('/api/analyze');
            const data = await response.json();
            setTestResult({
                success: true,
                data: data
            });
        } catch (e) {
            setTestResult({
                success: false,
                error: e.message
            });
        }
        setTesting(false);
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const styles = {
        container: {
            background: 'linear-gradient(135deg, rgba(20,20,35,0.95) 0%, rgba(30,30,50,0.95) 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: '#fff',
            border: '1px solid rgba(100,100,150,0.3)',
            marginBottom: '20px'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold'
        },
        section: {
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            marginBottom: '16px'
        },
        sectionTitle: {
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        button: {
            padding: '12px 24px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
        },
        methodCard: {
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
        },
        infoBox: {
            padding: '16px',
            borderRadius: '12px',
            marginTop: '16px'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={{ fontSize: '28px' }}>⚡</span>
                <div>
                    <div style={styles.title}>Arka Plan Modu</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                        Site kapalıyken bile 7/24 analiz ve bildirim
                    </div>
                </div>
            </div>

            {/* Önerilen Yöntem: GitHub Actions */}
            <div style={{
                ...styles.methodCard,
                background: 'rgba(0,255,136,0.1)',
                border: '2px solid rgba(0,255,136,0.3)'
            }}>
                <div style={{ fontSize: '32px' }}>🐙</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#00ff88', marginBottom: '8px' }}>
                        ⭐ GitHub Actions (Önerilen)
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>
                        Tamamen ücretsiz, her 15 dakikada bir analiz. Telegram'a otomatik bildirim.
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 10px', background: 'rgba(0,255,136,0.2)', borderRadius: '4px', fontSize: '11px' }}>
                            ✅ Ücretsiz
                        </span>
                        <span style={{ padding: '4px 10px', background: 'rgba(0,255,136,0.2)', borderRadius: '4px', fontSize: '11px' }}>
                            ⏰ 15 dk aralık
                        </span>
                        <span style={{ padding: '4px 10px', background: 'rgba(0,255,136,0.2)', borderRadius: '4px', fontSize: '11px' }}>
                            📱 Telegram
                        </span>
                    </div>
                </div>
            </div>

            {/* Kurulum Adımları */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>
                    <span>📋</span> GitHub Actions Kurulumu
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '2' }}>
                    <li>Projeyi GitHub'a yükle (push)</li>
                    <li>GitHub repo → Settings → Secrets → Actions</li>
                    <li><code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>TELEGRAM_BOT_TOKEN</code> ekle</li>
                    <li><code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>TELEGRAM_CHAT_ID</code> ekle</li>
                    <li>Actions sekmesinde workflow'u aktif et</li>
                </ol>
            </div>

            {/* Alternatifler */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>
                    <span>🔄</span> Diğer Yöntemler
                </div>

                <div style={{
                    ...styles.methodCard,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '24px' }}>▲</div>
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Vercel Cron</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                            Hobby: Günde 1 kez | Pro ($20/ay): Dakikalık
                        </div>
                    </div>
                </div>

                <div style={{
                    ...styles.methodCard,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '24px' }}>🚂</div>
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Railway.app</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                            $5/ay kredi ücretsiz, 7/24 Node.js sunucu
                        </div>
                    </div>
                </div>
            </div>

            {/* Manuel Test */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>
                    <span>🧪</span> Manuel Test
                </div>
                <button
                    style={{
                        ...styles.button,
                        background: testing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
                        color: '#fff',
                        width: '100%'
                    }}
                    onClick={runManualAnalysis}
                    disabled={testing}
                >
                    {testing ? '⏳ Analiz Yapılıyor...' : '▶️ Şimdi Analiz Yap (API Test)'}
                </button>

                {testResult && (
                    <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        borderRadius: '10px',
                        background: testResult.success ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
                        border: testResult.success ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,68,68,0.3)'
                    }}>
                        {testResult.success ? (
                            <>
                                <div style={{ fontWeight: 'bold', color: '#00ff88', marginBottom: '8px' }}>
                                    ✅ {testResult.data.total} coin analiz edildi
                                </div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                                    {testResult.data.signals} sinyal bulundu
                                </div>
                            </>
                        ) : (
                            <div style={{ color: '#ff4444' }}>❌ Hata: {testResult.error}</div>
                        )}
                    </div>
                )}
            </div>

            {/* Bilgi */}
            <div style={{
                ...styles.infoBox,
                background: 'rgba(0,212,255,0.1)',
                border: '1px solid rgba(0,212,255,0.2)'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00d4ff' }}>
                    💡 Nasıl Çalışır?
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
                    GitHub Actions, her 15 dakikada bir otomatik olarak çalışır. Top 10 coin analiz edilir.
                    Güçlü sinyal bulunursa (skor ≥75 veya ≤25), Telegram'a bildirim gönderilir.
                    Her 4 saatte bir özet rapor da gönderilir.
                </div>
            </div>
        </div>
    );
};

export default BackgroundServicePanel;
