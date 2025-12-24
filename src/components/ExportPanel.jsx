import React from 'react';
import { exportService } from '../services/ExportService.js';

/**
 * ExportPanel - Veri Dışa Aktarma Paneli
 */
const ExportPanel = ({ trades = [], portfolio = {} }) => {
    const [exporting, setExporting] = React.useState(null);
    const [message, setMessage] = React.useState(null);

    const handleExport = async (type) => {
        setExporting(type);
        setMessage(null);

        try {
            let success = false;

            switch (type) {
                case 'trades-csv':
                    success = exportService.exportTradesToCSV(trades);
                    break;
                case 'trades-excel':
                    success = exportService.exportToExcel(trades);
                    break;
                case 'portfolio-csv':
                    success = exportService.exportPortfolioToCSV(portfolio);
                    break;
                case 'all-json':
                    success = exportService.exportToJSON({ trades, portfolio }, 'nova_data');
                    break;
                case 'backup':
                    const settings = JSON.parse(localStorage.getItem('novaTradeBot_settings') || '{}');
                    success = exportService.exportFullBackup(trades, portfolio, settings);
                    break;
                case 'report':
                    const report = exportService.generatePerformanceReport(trades);
                    if (report.error) {
                        setMessage({ type: 'error', text: report.error });
                    } else {
                        success = exportService.exportToJSON(report, 'nova_performance_report');
                    }
                    break;
            }

            if (success) {
                setMessage({ type: 'success', text: 'Dosya başarıyla indirildi!' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Hata: ' + error.message });
        }

        setExporting(null);
        setTimeout(() => setMessage(null), 3000);
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
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
        },
        card: {
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '1px solid rgba(100,100,150,0.2)'
        },
        cardIcon: {
            fontSize: '32px',
            marginBottom: '12px'
        },
        cardTitle: {
            fontWeight: 'bold',
            marginBottom: '8px'
        },
        cardDesc: {
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)'
        },
        message: {
            marginTop: '20px',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            textAlign: 'center'
        },
        stats: {
            display: 'flex',
            gap: '20px',
            marginBottom: '24px',
            flexWrap: 'wrap'
        },
        stat: {
            background: 'rgba(0,212,255,0.1)',
            padding: '12px 20px',
            borderRadius: '10px'
        }
    };

    const exportOptions = [
        {
            id: 'trades-csv',
            icon: '📊',
            title: 'İşlemler (CSV)',
            desc: 'Tüm işlem geçmişi CSV formatında',
            color: '#00d4ff'
        },
        {
            id: 'trades-excel',
            icon: '📗',
            title: 'İşlemler (Excel)',
            desc: 'Excel uyumlu format (UTF-8)',
            color: '#22c55e'
        },
        {
            id: 'portfolio-csv',
            icon: '💼',
            title: 'Portföy (CSV)',
            desc: 'Mevcut pozisyonlar',
            color: '#8b5cf6'
        },
        {
            id: 'all-json',
            icon: '📦',
            title: 'Tüm Veriler (JSON)',
            desc: 'İşlemler + Portföy JSON',
            color: '#f97316'
        },
        {
            id: 'backup',
            icon: '💾',
            title: 'Tam Yedek',
            desc: 'Ayarlar dahil tam yedek',
            color: '#ec4899'
        },
        {
            id: 'report',
            icon: '📈',
            title: 'Performans Raporu',
            desc: 'Detaylı analiz raporu',
            color: '#eab308'
        }
    ];

    const closedTrades = trades.filter(t => !t.isOpen);
    const openTrades = trades.filter(t => t.isOpen);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={{ fontSize: '28px' }}>📤</span>
                <div>
                    <div style={styles.title}>Veri Dışa Aktarma</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                        İşlem geçmişi ve portföyü dışa aktar
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={styles.stats}>
                <div style={styles.stat}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Toplam İşlem</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{trades.length}</div>
                </div>
                <div style={styles.stat}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Kapalı</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff88' }}>{closedTrades.length}</div>
                </div>
                <div style={styles.stat}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Açık</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00d4ff' }}>{openTrades.length}</div>
                </div>
                <div style={styles.stat}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Pozisyon</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {portfolio.positions?.length || 0}
                    </div>
                </div>
            </div>

            {/* Export Options */}
            <div style={styles.grid}>
                {exportOptions.map(option => (
                    <div
                        key={option.id}
                        style={{
                            ...styles.card,
                            opacity: exporting === option.id ? 0.7 : 1,
                            borderColor: `${option.color}44`
                        }}
                        onClick={() => handleExport(option.id)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${option.color}22`;
                            e.currentTarget.style.borderColor = option.color;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = `${option.color}44`;
                        }}
                    >
                        <div style={styles.cardIcon}>{option.icon}</div>
                        <div style={{ ...styles.cardTitle, color: option.color }}>{option.title}</div>
                        <div style={styles.cardDesc}>{option.desc}</div>
                        {exporting === option.id && (
                            <div style={{ marginTop: '10px', fontSize: '12px', color: option.color }}>
                                ⏳ İndiriliyor...
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    ...styles.message,
                    background: message.type === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)'}`,
                    color: message.type === 'success' ? '#00ff88' : '#ff4444'
                }}>
                    {message.text}
                </div>
            )}
        </div>
    );
};

export default ExportPanel;
