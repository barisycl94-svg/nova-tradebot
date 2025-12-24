import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedCounter - Sayıları animasyonlu şekilde gösterir
 * Argus 16_animations.md'den uyarlandı
 */
export const AnimatedCounter = ({
    value,
    duration = 1000,
    decimals = 0,
    prefix = '',
    suffix = '',
    colorize = false, // true ise değere göre renk verir
    className = ''
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);
    const animationRef = useRef(null);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);

            const current = startValue + (endValue - startValue) * eased;
            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    const formattedValue = displayValue.toFixed(decimals);

    // Renklendirme
    let color = 'inherit';
    if (colorize) {
        if (displayValue >= 70) color = 'var(--success)';
        else if (displayValue >= 50) color = 'var(--warning)';
        else color = 'var(--accent)';
    }

    return (
        <span
            className={`animated-counter ${className}`}
            style={{
                color,
                fontFamily: 'JetBrains Mono, monospace',
                transition: 'color 0.3s ease'
            }}
        >
            {prefix}{formattedValue}{suffix}
        </span>
    );
};

/**
 * AnimatedPercentage - Yüzdelik değerleri + veya - ile gösterir
 */
export const AnimatedPercentage = ({ value, duration = 800 }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setDisplayValue(startValue + (endValue - startValue) * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    const isPositive = displayValue >= 0;
    const formatted = `${isPositive ? '+' : ''}${displayValue.toFixed(2)}%`;

    return (
        <span style={{
            color: isPositive ? 'var(--success)' : 'var(--accent)',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600
        }}>
            {formatted}
        </span>
    );
};

/**
 * PulseGlow - "Neural Pulse" glow efekti
 */
export const PulseGlow = ({ color = '#00d4ff', intensity = 1, size = 100, children }) => {
    return (
        <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Animated rings */}
            <div style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}${Math.round(0.3 * intensity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                animation: 'pulse-glow 2s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                width: size * 0.7,
                height: size * 0.7,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}${Math.round(0.5 * intensity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                animation: 'pulse-glow 2s ease-in-out infinite 0.3s'
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>

            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default AnimatedCounter;
