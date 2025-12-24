import React, { useState } from 'react';
import { Play, Loader2, TrendingUp, TrendingDown, BarChart3, Target, AlertTriangle } from 'lucide-react';
import { BacktestEngine } from '../services/backtest/BacktestEngine';
import { realMarketDataService } from '../services/RealMarketDataProvider';

/**
 * BacktestPanel - Strateji backtesting paneli
 * Argus 13_backtest.md'den uyarlandı
 */
export const BacktestPanel = () => {
    const [config, setConfig] = useState({
        symbol: 'BTCUSDT',
        strategy: 'ORION',
        initialCapital: 1000,
        slPercent: 5,
        tpPercent: 15
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const strategies = [
        { id: 'ORION', name: 'Orion (Teknik)', desc: 'Trend + Momentum' },
        { id: 'SMA_CROSS', name: 'SMA Crossover', desc: 'SMA20/50 kesişimi' },
        { id: 'RSI', name: 'RSI', desc: 'Aşırı alım/satım' }
    ];

    const popularCoins = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

    const runBacktest = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Geçmiş veri al
            const candles = await realMarketDataService.getCandles(config.symbol, '1d', 365);

            if (!candles || candles.length < 60) {
                throw new Error('Yetersiz veri. En az 60 günlük veri gerekli.');
            }

            const backtestResult = await BacktestEngine.runBacktest({
                ...config,
                candles
            });

            if (backtestResult.error) {
                throw new Error(backtestResult.error);
            }

            setResult(backtestResult);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-5 mb-6" style={{
            background: 'linear-gradient(135deg, rgba(15, 17, 38, 0.95) 0%, rgba(10, 8, 25, 0.98) 100%)',
            borderLeft: '4px solid #10b981'
        }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Strateji Backtest</h3>
                    <p className="text-xs text-gray-500">Geçmiş veride test et</p>
                </div>
            </div>

            {/* Config Form */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Symbol */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Coin</label>
                    <select
                        value={config.symbol}
                        onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm"
                    >
                        {popularCoins.map(coin => (
                            <option key={coin} value={coin}>{coin.replace('USDT', '')}</option>
                        ))}
                    </select>
                </div>

                {/* Strategy */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Strateji</label>
                    <select
                        value={config.strategy}
                        onChange={(e) => setConfig({ ...config, strategy: e.target.value })}
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm"
                    >
                        {strategies.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Initial Capital */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Başlangıç ($)</label>
                    <input
                        type="number"
                        value={config.initialCapital}
                        onChange={(e) => setConfig({ ...config, initialCapital: parseFloat(e.target.value) || 1000 })}
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm font-mono"
                    />
                </div>

                {/* SL/TP */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">SL %</label>
                        <input
                            type="number"
                            value={config.slPercent}
                            onChange={(e) => setConfig({ ...config, slPercent: parseFloat(e.target.value) || 5 })}
                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm font-mono"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">TP %</label>
                        <input
                            type="number"
                            value={config.tpPercent}
                            onChange={(e) => setConfig({ ...config, tpPercent: parseFloat(e.target.value) || 15 })}
                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* Run Button */}
            <button
                onClick={runBacktest}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
                {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Test Ediliyor...</>
                ) : (
                    <><Play className="w-5 h-5" /> Backtest Başlat</>
                )}
            </button>

            {/* Error */}
            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="mt-4 space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className={`p-3 rounded-xl text-center ${result.totalReturn >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <div className={`text-2xl font-bold ${result.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                            </div>
                            <div className="text-xs text-gray-500">Toplam Getiri</div>
                        </div>
                        <div className="p-3 rounded-xl text-center bg-white/5">
                            <div className="text-2xl font-bold text-cyan-400">{result.winRate.toFixed(0)}%</div>
                            <div className="text-xs text-gray-500">Win Rate</div>
                        </div>
                        <div className="p-3 rounded-xl text-center bg-orange-500/10">
                            <div className="text-2xl font-bold text-orange-400">{result.maxDrawdown.toFixed(1)}%</div>
                            <div className="text-xs text-gray-500">Max DD</div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between p-2 bg-white/5 rounded-lg">
                            <span className="text-gray-400">İşlem Sayısı</span>
                            <span className="text-white font-mono">{result.tradeCount}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-white/5 rounded-lg">
                            <span className="text-gray-400">Ort. Kazanç</span>
                            <span className="text-green-400 font-mono">+{result.avgWin.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-white/5 rounded-lg">
                            <span className="text-gray-400">Ort. Kayıp</span>
                            <span className="text-red-400 font-mono">-{result.avgLoss.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-white/5 rounded-lg">
                            <span className="text-gray-400">Sharpe</span>
                            <span className="text-white font-mono">{result.sharpeRatio}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-white/5 rounded-lg col-span-2">
                            <span className="text-gray-400">Final Bakiye</span>
                            <span className={`font-mono font-bold ${result.finalCapital >= config.initialCapital ? 'text-green-400' : 'text-red-400'}`}>
                                ${result.finalCapital.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Period */}
                    <div className="text-xs text-gray-500 text-center">
                        Test Periyodu: {result.startDate && new Date(result.startDate).toLocaleDateString()} - {result.endDate && new Date(result.endDate).toLocaleDateString()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BacktestPanel;
