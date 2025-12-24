import React, { useState } from 'react';
import './App.css';
import { PortfolioView } from './views/portfolio/PortfolioView';
import { MarketView } from './views/search/MarketView';
import { StockDetailView } from './views/detail/StockDetailView';
import { SettingsView } from './views/settings/SettingsView';
import { HistoryView } from './views/history/HistoryView';
import LiveScannerView from './components/scanner/LiveScannerView';
import { AnalyticsView } from './views/analytics/AnalyticsView';
import { ToastContainer, toastService } from './components/ToastService';
import NewsTicker from './components/analytics/NewsTicker';
import novaLogo from './assets/nova_logo.svg';
import { CyberPortfolioIcon, CyberMarketIcon, CyberHistoryIcon, CyberSettingsIcon, CyberScanIcon, CyberAnalyticsIcon } from './components/ui/CyberBadgeIcons';

// Premium Cyberpunk İkonlar
const Icons = {
  Portfolio: CyberPortfolioIcon,
  Market: CyberMarketIcon,
  History: CyberHistoryIcon,
  Settings: CyberSettingsIcon,
  Scan: CyberScanIcon,
  Analytics: CyberAnalyticsIcon
};

function App() {
  const [activeTab, setActiveTab] = useState('portfolio');

  // Force Update log
  console.log("NOVA UI: Premium Version Loaded " + new Date().toLocaleTimeString());
  const [selectedStock, setSelectedStock] = useState(null);

  // Navigasyon Mantığı
  const renderContent = () => {
    if (selectedStock) {
      return (
        <StockDetailView
          symbol={selectedStock}
          onBack={() => setSelectedStock(null)}
        />
      );
    }

    switch (activeTab) {
      case 'portfolio':
        return <PortfolioView />;
      case 'market':
        return <MarketView onSelectStock={(symbol) => setSelectedStock(symbol)} />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
      case 'scanner':
        return <LiveScannerView />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <PortfolioView />;
    }
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* Toast Bildirimleri */}
      <ToastContainer service={toastService} />

      {/* Üst Bar (Logo) */}
      <header style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 30px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(3, 3, 11, 0.7)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={novaLogo} alt="Nova Logo" style={{
            width: '42px',
            height: '42px',
            filter: 'drop-shadow(0 0 10px var(--primary-glow))'
          }} />
          <h2 style={{
            margin: 0,
            fontSize: '1.8rem',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(to right, #fff, var(--text-muted))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            NOVA <span style={{
              background: 'var(--gradient-premium)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '800'
            }}>TRADEBOT</span>
          </h2>
        </div>
      </header>

      {/* 🚀 Pro Haber Akışı */}
      <NewsTicker />

      {/* Ana İçerik Alanı */}
      <main style={{
        paddingBottom: '90px',
        minHeight: 'calc(100vh - 80px)',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        {renderContent()}
      </main>

      {/* Alt Tab Bar */}
      {!selectedStock && (
        <nav className="nav-glass-bar">
          <TabButton
            active={activeTab === 'portfolio'}
            onClick={() => setActiveTab('portfolio')}
            icon={<Icons.Portfolio />}
            label="Portföy"
          />
          <TabButton
            active={activeTab === 'market'}
            onClick={() => setActiveTab('market')}
            icon={<Icons.Market />}
            label="Piyasa"
          />
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={<Icons.History />}
            label="Geçmiş"
          />
          <TabButton
            active={activeTab === 'scanner'}
            onClick={() => setActiveTab('scanner')}
            icon={<Icons.Scan />}
            label="Tarama"
          />
          <TabButton
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon={<Icons.Analytics />}
            label="Analiz"
          />
          <TabButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Icons.Settings />}
            label="Ayarlar"
          />
        </nav>
      )}
    </div>
  );
}

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`nav-tab-btn ${active ? 'active' : ''}`}
  >
    {active && <div className="active-indicator" />}
    <div className="icon-wrapper">
      {icon}
    </div>
    <span className="label">{label}</span>
  </button>
);

export default App;
