import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * ThemeContext - Dark/Light Tema Yönetimi
 */

const ThemeContext = createContext();

export const themes = {
    dark: {
        name: 'dark',
        label: '🌙 Karanlık',
        colors: {
            background: '#0a0a0f',
            backgroundSecondary: '#141420',
            backgroundCard: '#1a1a2e',
            text: '#ffffff',
            textSecondary: 'rgba(255,255,255,0.7)',
            textMuted: 'rgba(255,255,255,0.5)',
            primary: '#00d4ff',
            primaryGlow: 'rgba(0,212,255,0.3)',
            success: '#00ff88',
            danger: '#ff4444',
            warning: '#ffaa00',
            border: 'rgba(100,100,150,0.3)',
            gradient: 'linear-gradient(135deg, rgba(20,20,35,0.95) 0%, rgba(30,30,50,0.95) 100%)'
        }
    },
    light: {
        name: 'light',
        label: '☀️ Aydınlık',
        colors: {
            background: '#f5f5f7',
            backgroundSecondary: '#ffffff',
            backgroundCard: '#ffffff',
            text: '#1a1a2e',
            textSecondary: 'rgba(0,0,0,0.7)',
            textMuted: 'rgba(0,0,0,0.5)',
            primary: '#0066cc',
            primaryGlow: 'rgba(0,102,204,0.2)',
            success: '#00aa55',
            danger: '#dd2222',
            warning: '#cc8800',
            border: 'rgba(0,0,0,0.1)',
            gradient: 'linear-gradient(135deg, #f5f5f7 0%, #e5e5ea 100%)'
        }
    },
    midnight: {
        name: 'midnight',
        label: '🌌 Gece Mavisi',
        colors: {
            background: '#0d1117',
            backgroundSecondary: '#161b22',
            backgroundCard: '#21262d',
            text: '#c9d1d9',
            textSecondary: '#8b949e',
            textMuted: '#6e7681',
            primary: '#58a6ff',
            primaryGlow: 'rgba(88,166,255,0.3)',
            success: '#3fb950',
            danger: '#f85149',
            warning: '#d29922',
            border: '#30363d',
            gradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)'
        }
    },
    cyberpunk: {
        name: 'cyberpunk',
        label: '🌆 Cyberpunk',
        colors: {
            background: '#0a0014',
            backgroundSecondary: '#1a0028',
            backgroundCard: '#2a0040',
            text: '#ff00ff',
            textSecondary: '#cc00cc',
            textMuted: '#990099',
            primary: '#00ffff',
            primaryGlow: 'rgba(0,255,255,0.3)',
            success: '#00ff00',
            danger: '#ff0066',
            warning: '#ffff00',
            border: 'rgba(255,0,255,0.3)',
            gradient: 'linear-gradient(135deg, #0a0014 0%, #1a0028 50%, #2a0040 100%)'
        }
    }
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('nova_theme');
        return saved && themes[saved] ? saved : 'dark';
    });

    useEffect(() => {
        localStorage.setItem('nova_theme', theme);
        applyTheme(themes[theme]);
    }, [theme]);

    const applyTheme = (themeConfig) => {
        const root = document.documentElement;
        const colors = themeConfig.colors;

        root.style.setProperty('--bg-primary', colors.background);
        root.style.setProperty('--bg-secondary', colors.backgroundSecondary);
        root.style.setProperty('--bg-card', colors.backgroundCard);
        root.style.setProperty('--text-primary', colors.text);
        root.style.setProperty('--text-secondary', colors.textSecondary);
        root.style.setProperty('--text-muted', colors.textMuted);
        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-primary-glow', colors.primaryGlow);
        root.style.setProperty('--color-success', colors.success);
        root.style.setProperty('--color-danger', colors.danger);
        root.style.setProperty('--color-warning', colors.warning);
        root.style.setProperty('--border-color', colors.border);

        // Body background
        document.body.style.background = colors.background;
        document.body.style.color = colors.text;
    };

    const toggleTheme = () => {
        const themeKeys = Object.keys(themes);
        const currentIndex = themeKeys.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        setTheme(themeKeys[nextIndex]);
    };

    const value = {
        theme,
        setTheme,
        toggleTheme,
        currentTheme: themes[theme],
        themes
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

// Theme Selector Component
export const ThemeSelector = () => {
    const { theme, setTheme, themes: themeOptions } = useTheme();

    const styles = {
        container: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
        },
        button: {
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        }
    };

    return (
        <div style={styles.container}>
            {Object.values(themeOptions).map(t => (
                <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    style={{
                        ...styles.button,
                        background: theme === t.name ? t.colors.primary + '33' : 'rgba(255,255,255,0.05)',
                        color: theme === t.name ? t.colors.primary : 'rgba(255,255,255,0.6)',
                        border: theme === t.name ? `2px solid ${t.colors.primary}` : '2px solid transparent'
                    }}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
};

// Quick Theme Toggle Button
export const ThemeToggle = () => {
    const { theme, toggleTheme, currentTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 16px',
                cursor: 'pointer',
                color: currentTheme.colors.text,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
            }}
            title="Tema Değiştir"
        >
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : theme === 'midnight' ? '🌌' : '🌆'}
            <span style={{ fontSize: '12px' }}>Tema</span>
        </button>
    );
};

export default ThemeContext;
