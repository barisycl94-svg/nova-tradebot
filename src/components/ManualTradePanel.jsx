import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';
import { tradingViewModel } from '../viewmodels/TradingViewModel';
import { realMarketDataService } from '../services/RealMarketDataProvider';

/**
 * ManualTradePanel - Manuel alım/satım paneli
 * Argus 21_broker_api.md'den uyarlandı
 */
export const ManualTradePanel = ({ onTradeComplete }) => {
    const [symbol, setSymbol] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Popüler coinler için hızlı butonlar
    const quickSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'];

    const handleBuy = async () => {
        if (!symbol || !amount) {
            setError('Sembol ve tutar giriniz');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const symbolUpper = symbol.toUpperCase();
            const tradeAmount = parseFloat(amount);

            if (isNaN(tradeAmount) || tradeAmount <= 0) {
                throw new Error('Geçersiz tutar');
            }

            // Mevcut fiyatı al
            const prices = realMarketDataService.getLatestPrices();
            const currentPrice = prices[symbolUpper]?.price;

            if (!currentPrice) {
                throw new Error(`${symbolUpper} için fiyat bulunamadı`);
            }

            // Manuel alım yap
            const result = await tradingViewModel.manualBuy(symbolUpper, tradeAmount, currentPrice);

            if (result.success) {
                setSuccess(`✅ ${symbolUpper} başarıyla alındı! (${tradeAmount.toFixed(2)} USDT)`);
                setSymbol('');
                setAmount('');
                if (onTradeComplete) onTradeComplete();
            } else {
                throw new Error(result.error || 'İşlem başarısız');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickSelect = (sym) => {
        setSymbol(sym);
        setError('');
    };

    return (
        <div className="glass-panel p-5 mb-6" style={{
            background: 'linear-gradient(135deg, rgba(15, 17, 38, 0.95) 0%, rgba(10, 8, 25, 0.98) 100%)',
            borderLeft: '4px solid var(--primary)'
        }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Manuel İşlem</h3>
                    <p className="text-xs text-gray-500">Hızlı alım yapın</p>
                </div>
            </div>

            {/* Quick Symbol Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                {quickSymbols.map(sym => (
                    <button
                        key={sym}
                        onClick={() => handleQuickSelect(sym)}
                        className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${symbol === sym
                                ? 'bg-primary/30 text-white border border-primary/50'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {sym.replace('USDT', '')}
                    </button>
                ))}
            </div>

            {/* Input Fields */}
            <div className="flex gap-3 mb-4">
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Sembol</label>
                    <input
                        type="text"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        placeholder="BTCUSDT"
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white font-mono text-sm focus:border-primary/50 focus:outline-none"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Tutar (USDT)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="100"
                            className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white font-mono text-sm focus:border-primary/50 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mb-4">
                {[25, 50, 100, 250].map(amt => (
                    <button
                        key={amt}
                        onClick={() => setAmount(amt.toString())}
                        className="flex-1 py-1.5 text-xs font-mono bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                    >
                        ${amt}
                    </button>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleBuy}
                    disabled={isLoading || !symbol || !amount}
                    className="flex-1 py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <TrendingUp className="w-5 h-5" />
                            AL
                        </>
                    )}
                </button>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                </div>
            )}
            {success && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <span className="text-green-400 text-sm">{success}</span>
                </div>
            )}

            {/* Disclaimer */}
            <p className="mt-4 text-xs text-gray-600 text-center">
                ⚠️ Paper trading - Gerçek para kullanılmaz
            </p>
        </div>
    );
};

export default ManualTradePanel;
