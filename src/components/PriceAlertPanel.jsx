import React, { useState } from 'react';
import { Bell, Plus, Trash2, Check, X } from 'lucide-react';
import { priceAlertService } from '../services/alerts/PriceAlertService';

/**
 * PriceAlertPanel - Fiyat uyarı yönetim paneli
 */
export const PriceAlertPanel = () => {
    const [alerts, setAlerts] = useState(priceAlertService.getAllAlerts());
    const [showForm, setShowForm] = useState(false);
    const [newAlert, setNewAlert] = useState({
        symbol: '',
        targetPrice: '',
        type: 'above',
        note: ''
    });

    const refreshAlerts = () => {
        setAlerts(priceAlertService.getAllAlerts());
    };

    const handleCreateAlert = () => {
        if (!newAlert.symbol || !newAlert.targetPrice) return;

        priceAlertService.createAlert(
            newAlert.symbol,
            parseFloat(newAlert.targetPrice),
            newAlert.type,
            newAlert.note
        );

        setNewAlert({ symbol: '', targetPrice: '', type: 'above', note: '' });
        setShowForm(false);
        refreshAlerts();
    };

    const handleDeleteAlert = (alertId) => {
        priceAlertService.deleteAlert(alertId);
        refreshAlerts();
    };

    const activeAlerts = alerts.filter(a => a.isActive && !a.triggered);
    const triggeredAlerts = alerts.filter(a => a.triggered);

    return (
        <div className="glass-panel p-5 mb-6" style={{
            background: 'linear-gradient(135deg, rgba(15, 17, 38, 0.95) 0%, rgba(10, 8, 25, 0.98) 100%)',
            borderLeft: '4px solid #06b6d4'
        }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Fiyat Uyarıları</h3>
                        <p className="text-xs text-gray-500">{activeAlerts.length} aktif uyarı</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-all"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* New Alert Form */}
            {showForm && (
                <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Sembol (BTCUSDT)"
                            value={newAlert.symbol}
                            onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm font-mono"
                        />
                        <input
                            type="number"
                            placeholder="Hedef Fiyat"
                            value={newAlert.targetPrice}
                            onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm font-mono"
                        />
                    </div>

                    <div className="flex gap-3 mb-3">
                        <button
                            onClick={() => setNewAlert({ ...newAlert, type: 'above' })}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${newAlert.type === 'above'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : 'bg-white/5 text-gray-400'
                                }`}
                        >
                            📈 Üstüne Çıkarsa
                        </button>
                        <button
                            onClick={() => setNewAlert({ ...newAlert, type: 'below' })}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${newAlert.type === 'below'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                : 'bg-white/5 text-gray-400'
                                }`}
                        >
                            📉 Altına Düşerse
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleCreateAlert}
                            className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" /> Oluştur
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-400 rounded-lg transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Active Alerts */}
            {activeAlerts.length > 0 ? (
                <div className="space-y-2">
                    {activeAlerts.map(alert => (
                        <div
                            key={alert.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{alert.type === 'above' ? '📈' : '📉'}</span>
                                <div>
                                    <span className="font-mono font-bold text-white">{alert.symbol}</span>
                                    <span className="text-gray-400 text-sm ml-2">
                                        {alert.type === 'above' ? '>' : '<'} ${alert.targetPrice}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteAlert(alert.id)}
                                className="p-2 text-gray-500 hover:text-red-400 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Henüz uyarı yok</p>
                    <p className="text-xs">Yukarıdaki + butonuyla uyarı ekleyin</p>
                </div>
            )}

            {/* Triggered Alerts */}
            {triggeredAlerts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Tetiklenen Uyarılar</p>
                    {triggeredAlerts.slice(0, 3).map(alert => (
                        <div key={alert.id} className="text-xs text-gray-500 py-1">
                            ✅ {alert.symbol} ${alert.triggeredPrice?.toFixed(2)} - {new Date(alert.triggeredAt).toLocaleString()}
                        </div>
                    ))}
                    {triggeredAlerts.length > 3 && (
                        <p className="text-xs text-gray-600">+{triggeredAlerts.length - 3} daha</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default PriceAlertPanel;
