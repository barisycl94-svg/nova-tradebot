import React from 'react';

/**
 * ShimmerLoading - Premium loading efekti
 * Argus 16_animations.md'den uyarlandı
 */

export const ShimmerBox = ({ width = '100%', height = 20, className = '' }) => {
    return (
        <div
            className={`shimmer-box ${className}`}
            style={{
                width,
                height,
                borderRadius: 8,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite'
            }}
        />
    );
};

export const ShimmerCard = ({ lines = 3 }) => {
    return (
        <div className="glass-panel p-5 mb-4">
            <div className="flex items-center gap-3 mb-4">
                <ShimmerBox width={40} height={40} />
                <div className="flex-1">
                    <ShimmerBox width="60%" height={16} className="mb-2" />
                    <ShimmerBox width="40%" height={12} />
                </div>
            </div>
            <div className="space-y-3">
                {Array.from({ length: lines }).map((_, i) => (
                    <ShimmerBox
                        key={i}
                        width={`${90 - i * 10}%`}
                        height={14}
                    />
                ))}
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

export const ShimmerTable = ({ rows = 5, cols = 4 }) => {
    return (
        <div className="glass-panel p-4">
            {/* Header */}
            <div className="flex gap-4 mb-4 pb-3 border-b border-white/10">
                {Array.from({ length: cols }).map((_, i) => (
                    <ShimmerBox key={i} width={`${100 / cols}%`} height={16} />
                ))}
            </div>

            {/* Rows */}
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, rowIdx) => (
                    <div key={rowIdx} className="flex gap-4">
                        {Array.from({ length: cols }).map((_, colIdx) => (
                            <ShimmerBox
                                key={colIdx}
                                width={`${100 / cols}%`}
                                height={14}
                            />
                        ))}
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

export const ShimmerPrice = () => {
    return (
        <div className="flex items-center gap-2">
            <ShimmerBox width={80} height={28} />
            <ShimmerBox width={60} height={20} />
        </div>
    );
};

export default ShimmerCard;
