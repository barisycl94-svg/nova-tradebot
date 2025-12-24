import React from 'react';
import { telegramBot } from '../../services/telegram/TelegramBotService.js';

/**
 * TelegramSettingsPanel - Telegram Bot Ayarları UI
 */
const TelegramSettingsPanel = () => {
    const [botToken, setBotToken] = React.useState(localStorage.getItem('telegram_bot_token') || '');
    const [chatId, setChatId] = React.useState(localStorage.getItem('telegram_chat_id') || '');
    const [enabled, setEnabled] = React.useState(localStorage.getItem('telegram_enabled') === 'true');
    const [testing, setTesting] = React.useState(false);
    const [testResult, setTestResult] = React.useState(null);

    const handleSave = () => {
        telegramBot.configure(botToken, chatId);
        if (enabled) {
            telegramBot.enable();
        } else {
            telegramBot.disable();
        }
        setTestResult({ success: true, message: 'Ayarlar kaydedildi!' });
        setTimeout(() => setTestResult(null), 3000);
    };

    const handleTest = async () => {
        if (!botToken || !chatId) {
            setTestResult({ success: false, message: 'Bot Token ve Chat ID gerekli!' });
            return;
        }

        setTesting(true);
        telegramBot.configure(botToken, chatId);
        telegramBot.enable();

        const success = await telegramBot.testConnection();

        setTestResult({
            success,
            message: success ? '✅ Bağlantı başarılı! Telegram grubunuzu kontrol edin.' : '❌ Bağlantı başarısız. Token ve Chat ID kontrol edin.'
        });
        setTesting(false);
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
            marginBottom: '24px'
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold'
        },
        inputGroup: {
            marginBottom: '20px'
        },
        label: {
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            color: 'rgba(255,255,255,0.8)'
        },
        input: {
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(100,100,150,0.3)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: '14px',
            boxSizing: 'border-box'
        },
        hint: {
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '6px'
        },
        toggle: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            marginBottom: '20px'
        },
        switch: {
            width: '50px',
            height: '26px',
            borderRadius: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
        },
        switchKnob: {
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '2px',
            transition: 'all 0.2s'
        },
        buttons: {
            display: 'flex',
            gap: '12px',
            marginTop: '24px'
        },
        button: {
            flex: 1,
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
        },
        result: {
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '14px'
        },
        infoBox: {
            background: 'rgba(0,212,255,0.1)',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '24px'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={{ fontSize: '28px' }}>📱</span>
                <div>
                    <div style={styles.title}>Telegram Bildirimleri</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                        Trade sinyalleri ve uyarıları Telegram'a gönder
                    </div>
                </div>
            </div>

            {/* Enable Toggle */}
            <div style={styles.toggle}>
                <div
                    onClick={() => setEnabled(!enabled)}
                    style={{
                        ...styles.switch,
                        background: enabled ? '#00ff88' : 'rgba(255,255,255,0.2)'
                    }}
                >
                    <div style={{
                        ...styles.switchKnob,
                        left: enabled ? '26px' : '2px'
                    }} />
                </div>
                <div>
                    <div style={{ fontWeight: '600' }}>Telegram Bildirimleri</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        {enabled ? 'Aktif - Bildirimler gönderilecek' : 'Kapalı'}
                    </div>
                </div>
            </div>

            {/* Bot Token */}
            <div style={styles.inputGroup}>
                <label style={styles.label}>Bot Token</label>
                <input
                    type="password"
                    style={styles.input}
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                />
                <div style={styles.hint}>
                    @BotFather'dan aldığınız bot token'ı
                </div>
            </div>

            {/* Chat ID */}
            <div style={styles.inputGroup}>
                <label style={styles.label}>Chat ID</label>
                <input
                    type="text"
                    style={styles.input}
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="-1001234567890 veya 123456789"
                />
                <div style={styles.hint}>
                    Grup için "-100" ile başlayan ID, kişisel için sayısal ID
                </div>
            </div>

            {/* Buttons */}
            <div style={styles.buttons}>
                <button
                    style={{
                        ...styles.button,
                        background: 'rgba(0,212,255,0.2)',
                        color: '#00d4ff'
                    }}
                    onClick={handleTest}
                    disabled={testing}
                >
                    {testing ? '⏳ Test Ediliyor...' : '🔗 Bağlantıyı Test Et'}
                </button>
                <button
                    style={{
                        ...styles.button,
                        background: '#00ff88',
                        color: '#000'
                    }}
                    onClick={handleSave}
                >
                    💾 Kaydet
                </button>
            </div>

            {/* Test Result */}
            {testResult && (
                <div style={{
                    ...styles.result,
                    background: testResult.success ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
                    border: `1px solid ${testResult.success ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)'}`,
                    color: testResult.success ? '#00ff88' : '#ff4444'
                }}>
                    {testResult.message}
                </div>
            )}

            {/* Info Box */}
            <div style={styles.infoBox}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#00d4ff' }}>
                    📌 Telegram Bot Nasıl Kurulur?
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                    <li>Telegram'da @BotFather ile konuşun</li>
                    <li>/newbot komutu ile yeni bot oluşturun</li>
                    <li>Bot token'ı kopyalayın</li>
                    <li>Botu grubunuza ekleyin veya direkt mesaj atın</li>
                    <li>@userinfobot veya @raw_data_bot ile Chat ID öğrenin</li>
                    <li>Yukarıdaki alanlara yapıştırın ve test edin</li>
                </ol>
            </div>
        </div>
    );
};

export default TelegramSettingsPanel;
