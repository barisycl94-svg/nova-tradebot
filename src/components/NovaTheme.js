/**
 * NovaTheme.js
 * Nova TradeBot - Tema ve Tasarım Sabitleri
 * 
 * CSS Variable'larının JS karşılıkları ve ortak stil objeleri.
 * (Asıl stil tanımları index.css içinde yapılmıştı, burası JS içi kullanım için helper)
 */

export const Colors = {
    bgDark: '#050511',
    primary: '#00f3ff',
    success: '#00ff9d',
    danger: '#ff0055',
    warning: '#ffd700',
    text: '#ffffff',
    textMuted: '#a0a5b9',
    panel: 'rgba(15, 17, 38, 0.7)'
};

export const Gradients = {
    main: 'linear-gradient(135deg, #050511 0%, #1a1b3a 100%)',
    glass: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.0) 100%)'
};

// React componentlerinde kullanılacak inline-style veya class'lar
export const CardStyle = {
    background: 'var(--bg-panel-transparent)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem',
    marginBottom: '1rem'
};
