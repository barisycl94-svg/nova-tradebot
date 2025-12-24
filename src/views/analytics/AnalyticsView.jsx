import React, { useState } from 'react';
import { BacktestPanel } from '../../components/BacktestPanel.jsx';
import { SectorAnalysisCard } from '../../components/SectorAnalysisCard.jsx';
import { MarketOverviewCard } from '../../components/MarketOverviewCard.jsx';
import { PriceAlertPanel } from '../../components/PriceAlertPanel.jsx';
import RiskDashboard from '../../components/RiskDashboard.jsx';
import AutoPilotCard from '../../components/AutoPilotCard.jsx';
import CryptoHeatmap from '../../components/CryptoHeatmap.jsx';
import FearGreedIndex from '../../components/FearGreedIndex.jsx';
import PerformanceDashboard from '../../components/PerformanceDashboard.jsx';
import ExportPanel from '../../components/ExportPanel.jsx';

/**
 * AnalyticsView - Analiz araçları sayfası
 * Backtest, Sektör, Piyasa, Risk, AutoPilot, Heatmap, Fear&Greed, Performance, Export
 */
export const AnalyticsView = () => {
    const [activeSection, setActiveSection] = useState('heatmap');

    const sections = [
        { id: 'heatmap', label: '🔥 Heatmap', icon: '🗺️' },
        { id: 'feargreed', label: '😱 Fear/Greed', icon: '📊' },
        { id: 'market', label: '🏛️ Piyasa', icon: '📈' },
        { id: 'sector', label: '🌾 Sektör', icon: '🎯' },
        { id: 'risk', label: '⚠️ Risk', icon: '🛡️' },
        { id: 'autopilot', label: '🤖 AutoPilot', icon: '🚀' },
        { id: 'performance', label: '📈 Performans', icon: '💹' },
        { id: 'backtest', label: '🧪 Backtest', icon: '⚗️' },
        { id: 'alerts', label: '🔔 Uyarılar', icon: '⏰' },
        { id: 'export', label: '📤 Export', icon: '💾' }
    ];

    const styles = {
        container: {
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto'
        },
        header: {
            marginBottom: '24px'
        },
        title: {
            fontSize: '28px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00f3ff 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
        },
        subtitle: {
            fontSize: '14px',
            color: 'var(--text-muted)'
        },
        tabs: {
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            flexWrap: 'wrap'
        },
        tab: {
            padding: '10px 16px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        tabActive: {
            background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            color: '#fff',
            border: '1px solid rgba(0, 243, 255, 0.3)'
        },
        tabInactive: {
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-muted)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        },
        content: {
            animation: 'fadeIn 0.3s ease-out'
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'heatmap':
                return <CryptoHeatmap />;
            case 'feargreed':
                return <FearGreedIndex />;
            case 'market':
                return <MarketOverviewCard />;
            case 'sector':
                return <SectorAnalysisCard />;
            case 'risk':
                return <RiskDashboard />;
            case 'autopilot':
                return <AutoPilotCard currentPrice={45000} candles={[]} signal="BUY" symbol="BTC" />;
            case 'performance':
                return <PerformanceDashboard trades={[]} portfolio={{}} />;
            case 'backtest':
                return <BacktestPanel />;
            case 'alerts':
                return <PriceAlertPanel />;
            case 'export':
                return <ExportPanel trades={[]} portfolio={{}} />;
            default:
                return <CryptoHeatmap />;
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>📊 Analiz Merkezi</h1>
                <p style={styles.subtitle}>
                    Argus motorlarından detaylı piyasa analizi ve araçlar
                </p>
            </div>

            {/* Tabs */}
            <div style={styles.tabs}>
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        style={{
                            ...styles.tab,
                            ...(activeSection === section.id ? styles.tabActive : styles.tabInactive)
                        }}
                    >
                        <span>{section.icon}</span>
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={styles.content}>
                {renderContent()}
            </div>
        </div>
    );
};

export default AnalyticsView;
