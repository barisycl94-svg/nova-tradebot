import React, { useMemo } from 'react';

/**
 * CandlestickChart - Kripto mum grafiği
 * Argus 15_components.md'den uyarlandı
 */

export const CandlestickChart = ({
    candles = [],
    height = 300,
    visibleBars = 60,
    showVolume = true
}) => {

    const chartData = useMemo(() => {
        if (!candles || candles.length === 0) return null;

        const visible = candles.slice(-visibleBars);

        const prices = visible.flatMap(c => [c.high, c.low]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;

        const volumes = visible.map(c => c.volume || 0);
        const maxVolume = Math.max(...volumes) || 1;

        return { visible, minPrice, maxPrice, priceRange, maxVolume };
    }, [candles, visibleBars]);

    if (!chartData) {
        return (
            <div
                className="flex items-center justify-center bg-white/5 rounded-xl"
                style={{ height }}
            >
                <span className="text-gray-500">Veri yok</span>
            </div>
        );
    }

    const { visible, minPrice, maxPrice, priceRange, maxVolume } = chartData;
    const candleWidth = 100 / (visible.length + 1);
    const chartHeight = showVolume ? height * 0.75 : height;
    const volumeHeight = showVolume ? height * 0.2 : 0;

    const priceToY = (price) => {
        return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    return (
        <div className="relative w-full" style={{ height }}>
            {/* Price Labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 font-mono" style={{ width: 50 }}>
                <span>${maxPrice.toFixed(2)}</span>
                <span>${((maxPrice + minPrice) / 2).toFixed(2)}</span>
                <span>${minPrice.toFixed(2)}</span>
            </div>

            {/* Main Chart Area */}
            <div className="absolute left-12 right-0 top-0" style={{ height: chartHeight }}>
                <svg width="100%" height="100%" viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                        <line
                            key={i}
                            x1="0"
                            y1={chartHeight * ratio}
                            x2="100"
                            y2={chartHeight * ratio}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="0.5"
                        />
                    ))}

                    {/* Candles */}
                    {visible.map((candle, index) => {
                        const isBullish = candle.close >= candle.open;
                        const color = isBullish ? '#22c55e' : '#ef4444';

                        const x = (index + 0.5) * candleWidth;
                        const bodyTop = priceToY(Math.max(candle.open, candle.close));
                        const bodyBottom = priceToY(Math.min(candle.open, candle.close));
                        const bodyHeight = Math.max(0.5, bodyBottom - bodyTop);

                        const wickTop = priceToY(candle.high);
                        const wickBottom = priceToY(candle.low);

                        return (
                            <g key={index}>
                                {/* Wick */}
                                <line
                                    x1={x}
                                    y1={wickTop}
                                    x2={x}
                                    y2={wickBottom}
                                    stroke={color}
                                    strokeWidth="0.3"
                                />
                                {/* Body */}
                                <rect
                                    x={x - candleWidth * 0.35}
                                    y={bodyTop}
                                    width={candleWidth * 0.7}
                                    height={bodyHeight}
                                    fill={color}
                                    rx="0.2"
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Volume Bars */}
            {showVolume && (
                <div
                    className="absolute left-12 right-0 bottom-0 border-t border-white/10"
                    style={{ height: volumeHeight }}
                >
                    <svg width="100%" height="100%" viewBox={`0 0 100 ${volumeHeight}`} preserveAspectRatio="none">
                        {visible.map((candle, index) => {
                            const isBullish = candle.close >= candle.open;
                            const color = isBullish ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
                            const x = (index + 0.5) * candleWidth;
                            const barHeight = ((candle.volume || 0) / maxVolume) * volumeHeight;

                            return (
                                <rect
                                    key={index}
                                    x={x - candleWidth * 0.35}
                                    y={volumeHeight - barHeight}
                                    width={candleWidth * 0.7}
                                    height={barHeight}
                                    fill={color}
                                />
                            );
                        })}
                    </svg>
                </div>
            )}

            {/* Current Price Line */}
            {visible.length > 0 && (
                <div
                    className="absolute left-12 right-0 border-t border-dashed border-cyan-500/50"
                    style={{ top: priceToY(visible[visible.length - 1].close) }}
                >
                    <span className="absolute right-0 -top-2.5 px-1.5 py-0.5 bg-cyan-500 text-white text-xs font-mono rounded">
                        ${visible[visible.length - 1].close.toFixed(2)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default CandlestickChart;
