import React from 'react';

// Neon Stop Loss Icon (Futuristic Shield/Warning)
export const CyberStopLossIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="sl-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="sl-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff0055" />
                <stop offset="100%" stopColor="#ff4b1f" />
            </linearGradient>
        </defs>

        {/* Shield Shape */}
        <path d="M12 2L4 5V11C4 16.55 7.4 21.74 12 23C16.6 21.74 20 16.55 20 11V5L12 2Z"
            fill="rgba(255, 0, 85, 0.15)" stroke="url(#sl-grad)" strokeWidth="1.5" filter="url(#sl-glow)" />

        {/* Inner Warning Line (Minus) */}
        <path d="M8 12H16" stroke="#fff" strokeWidth="2" strokeLinecap="round" filter="url(#sl-glow)" />
    </svg>
);

// Neon Take Profit Icon (Futuristic Target/Ascend)
export const CyberTakeProfitIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="tp-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="tp-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00ff9d" />
                <stop offset="100%" stopColor="#00cec9" />
            </linearGradient>
        </defs>

        {/* Target Box Shape */}
        <rect x="3" y="3" width="18" height="18" rx="5"
            fill="rgba(0, 255, 157, 0.15)" stroke="url(#tp-grad)" strokeWidth="1.5" filter="url(#tp-glow)" />

        {/* Checkmark / Upward Trend */}
        <path d="M8 12L11 15L16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#tp-glow)" />
    </svg>
);

// Neon Insight Icon (Premium Star/Sparkle for AI)
export const CyberInsightIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="insight-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="insight-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#ff9900" />
            </linearGradient>
        </defs>

        {/* Central Sparkle */}
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
            fill="url(#insight-grad)" filter="url(#insight-glow)" />

        {/* Tiny floating particles */}
        <circle cx="18" cy="6" r="1.5" fill="#00f3ff" filter="url(#insight-glow)" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="6" cy="18" r="1.5" fill="#00f3ff" filter="url(#insight-glow)" opacity="0.8">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
    </svg>
);

// Neon Brain Icon (Deep Learning/AI)
export const CyberBrainIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="brain-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="brain-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff00cc" />
                <stop offset="100%" stopColor="#aa49ff" />
            </linearGradient>
        </defs>
        <path d="M12 4C9 4 7 5.5 6 7.5C4.5 8 3 9.5 3 12C3 15 5 17 7 17.5V19C7 19.55 7.45 20 8 20H16C16.55 20 17 19.55 17 19V17.5C19 17 21 15 21 12C21 9.5 19.5 8 18 7.5C17 5.5 15 4 12 4ZM12 6C13.5 6 14.5 7 15 8C14 8.5 13.5 9.5 13.5 10.5C13.5 11.5 14.5 12 15 12C14.5 13 13.5 13.5 12 13.5C10.5 13.5 9.5 13 9 12C9.5 12 10.5 11.5 10.5 10.5C10.5 9.5 10 8.5 9 8C9.5 7 10.5 6 12 6Z"
            fill="rgba(255, 0, 204, 0.15)" stroke="url(#brain-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#brain-glow)" />
        <circle cx="9" cy="10" r="1" fill="#fff" filter="url(#brain-glow)" />
        <circle cx="15" cy="10" r="1" fill="#fff" filter="url(#brain-glow)" />
        <path d="M12 15V17" stroke="url(#brain-grad)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 19L15 19" stroke="url(#brain-grad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// Neon Settings/Gear Icon
export const CyberSettingsIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="gear-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="gear-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e0e0e0" />
                <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
        </defs>
        <path d="M19.14 12.94C19.16 12.63 19.16 12.32 19.14 12.01L21.41 10.24C21.61 10.08 21.67 9.8 21.53 9.57L19.38 5.84C19.25 5.61 18.97 5.53 18.73 5.62L16.03 6.7C15.47 6.27 14.86 5.91 14.2 5.64L13.79 2.77C13.75 2.52 13.54 2.34 13.28 2.34H8.97C8.72 2.34 8.5 2.52 8.46 2.77L8.06 5.62C7.4 5.89 6.78 6.25 6.22 6.69L3.52 5.61C3.28 5.51 3 5.59 2.87 5.83L0.72 9.56C0.59 9.79 0.64 10.07 0.84 10.23L3.11 12C3.09 12.31 3.09 12.63 3.11 12.94L0.84 14.71C0.64 14.87 0.59 15.15 0.72 15.38L2.87 19.11C3 19.34 3.28 19.42 3.52 19.33L6.22 18.25C6.78 18.68 7.39 19.04 8.05 19.31L8.46 22.18C8.5 22.42 8.71 22.61 8.97 22.61H13.28C13.53 22.61 13.75 22.42 13.78 22.18L14.19 19.32C14.85 19.05 15.46 18.69 16.02 18.26L18.73 19.34C18.97 19.43 19.25 19.35 19.38 19.12L21.53 15.39C21.67 15.16 21.61 14.88 21.41 14.72L19.14 12.94ZM11.13 15.39C9.25 15.39 7.73 13.87 7.73 11.99C7.73 10.11 9.25 8.59 11.13 8.59C13.01 8.59 14.53 10.11 14.53 11.99C14.53 13.87 13.01 15.39 11.13 15.39Z"
            fill="rgba(255,255,255,0.1)" stroke="url(#gear-grad)" strokeWidth="1.5" filter="url(#gear-glow)">
            <animateTransform attributeName="transform" type="rotate" from="0 11.13 11.99" to="360 11.13 11.99" dur="10s" repeatCount="indefinite" />
        </path>
    </svg>
);

// Neon Robot/Autopilot Icon
export const CyberRobotIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="bot-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="bot-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00f3ff" />
                <stop offset="100%" stopColor="#0066ff" />
            </linearGradient>
        </defs>
        <rect x="4" y="8" width="16" height="12" rx="3"
            fill="rgba(0, 243, 255, 0.1)" stroke="url(#bot-grad)" strokeWidth="1.5" filter="url(#bot-glow)" />
        <path d="M8 8V5C8 3.5 10 2 12 2C14 2 16 3.5 16 5V8" stroke="url(#bot-grad)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="13" r="1.5" fill="#fff" filter="url(#bot-glow)" />
        <circle cx="15" cy="13" r="1.5" fill="#fff" filter="url(#bot-glow)" />
        <path d="M9 17H15" stroke="url(#bot-grad)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 12H4" stroke="url(#bot-grad)" strokeWidth="1.5" />
        <path d="M20 12H22" stroke="url(#bot-grad)" strokeWidth="1.5" />
    </svg>
);

// Neon Telegram Icon
export const CyberTelegramIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="tele-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="tele-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0088cc" />
                <stop offset="100%" stopColor="#00bfff" />
            </linearGradient>
        </defs>
        <path d="M21.5 2L2 9.5L9 12.5L18.5 6.5L11 13.5L11 19L15.5 15L21.5 19L23 2L21.5 2Z"
            fill="rgba(0, 136, 204, 0.15)" stroke="url(#tele-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#tele-glow)" />
        <circle cx="21" cy="3" r="1" fill="#fff" filter="url(#tele-glow)">
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </circle>
    </svg>
);

// Neon Shield Icon (Blue/Protection)
export const CyberRiskShieldIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="shield-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="shield-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00a8ff" />
                <stop offset="100%" stopColor="#004e92" />
            </linearGradient>
        </defs>
        <path d="M12 2L4 5V11C4 16.55 7.4 21.74 12 23C16.6 21.74 20 16.55 20 11V5L12 2Z"
            fill="rgba(0, 168, 255, 0.15)" stroke="url(#shield-grad)" strokeWidth="1.5" filter="url(#shield-glow)" />
        <path d="M12 6V11H17" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
);

// Neon Bell Icon (Notification)
export const CyberBellIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="bell-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="bell-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#ffaa00" />
            </linearGradient>
        </defs>
        <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
            fill="rgba(255, 215, 0, 0.15)" stroke="url(#bell-grad)" strokeWidth="1.5" filter="url(#bell-glow)" />
        <circle cx="18" cy="5" r="2" fill="#ff4b1f" filter="url(#bell-glow)">
            <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
    </svg>
);

// Neon Warning Icon (Danger Zone)
export const CyberWarningIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="warn-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="warn-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff4b1f" />
                <stop offset="100%" stopColor="#ff9068" />
            </linearGradient>
        </defs>
        <path d="M1 21H23L12 2L1 21Z"
            fill="rgba(255, 75, 31, 0.1)" stroke="url(#warn-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#warn-glow)" />
        <path d="M12 9V13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.5" fill="#fff" />
    </svg>
);

// Neon Portfolio Icon (Briefcase/Wealth)
export const CyberPortfolioIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="port-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="port-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#ffaa00" />
            </linearGradient>
        </defs>
        <rect x="2" y="7" width="20" height="14" rx="2"
            fill="rgba(255, 215, 0, 0.1)" stroke="url(#port-grad)" strokeWidth="1.5" filter="url(#port-glow)" />
        <path d="M16 7V4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4V7" stroke="url(#port-grad)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 11V14" stroke="url(#port-grad)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12.5" r="0.5" fill="#fff" filter="url(#port-glow)" />
    </svg>
);

// Neon Market Icon (Candlestick Chart)
export const CyberMarketIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="market-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="market-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00f3ff" />
                <stop offset="100%" stopColor="#0066ff" />
            </linearGradient>
        </defs>
        <path d="M3 3V21H21" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="7" y="10" width="3" height="8" rx="1" fill="rgba(0, 243, 255, 0.2)" stroke="url(#market-grad)" strokeWidth="1.5" filter="url(#market-glow)" />
        <line x1="8.5" y1="8" x2="8.5" y2="10" stroke="url(#market-grad)" strokeWidth="1.5" />
        <rect x="14" y="6" width="3" height="10" rx="1" fill="rgba(0, 243, 255, 0.2)" stroke="url(#market-grad)" strokeWidth="1.5" filter="url(#market-glow)" />
        <line x1="15.5" y1="4" x2="15.5" y2="6" stroke="url(#market-grad)" strokeWidth="1.5" />
        <line x1="15.5" y1="16" x2="15.5" y2="18" stroke="url(#market-grad)" strokeWidth="1.5" />
    </svg>
);

// Neon History Icon (Scroll/List)
export const CyberHistoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="hist-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="hist-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e100ff" />
                <stop offset="100%" stopColor="#7f00ff" />
            </linearGradient>
        </defs>
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
            fill="rgba(225, 0, 255, 0.1)" stroke="url(#hist-grad)" strokeWidth="1.5" filter="url(#hist-glow)" />
        <path d="M14 2V8H20" stroke="url(#hist-grad)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 13H16" stroke="url(#hist-grad)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 17H12" stroke="url(#hist-grad)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="17" r="1.5" fill="#fff" filter="url(#hist-glow)" opacity="0.8">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
        </circle>
    </svg>
);

// Neon Scan Icon (Radar/Satellite)
export const CyberScanIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="scan-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="scan-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00ff9d" />
                <stop offset="100%" stopColor="#00cec9" />
            </linearGradient>
        </defs>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="url(#scan-grad)" strokeWidth="1.5" strokeOpacity="0.5" />
        <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z"
            stroke="url(#scan-grad)" strokeWidth="1.5" strokeOpacity="0.8" />
        <circle cx="12" cy="12" r="2" fill="#fff" filter="url(#scan-glow)" />
        <path d="M12 12L19 5" stroke="url(#scan-grad)" strokeWidth="1.5" strokeLinecap="round" filter="url(#scan-glow)">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="4s" repeatCount="indefinite" />
        </path>
    </svg>
);

// Neon Analytics Icon (Chart with Pulse)
export const CyberAnalyticsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="analytics-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <linearGradient id="analytics-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="50%" stopColor="#ffd93d" />
                <stop offset="100%" stopColor="#6bcb77" />
            </linearGradient>
        </defs>
        <path d="M3 3V21H21" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 16L10 12L14 15L21 8"
            stroke="url(#analytics-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#analytics-glow)">
            <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" repeatCount="1" fill="freeze" />
        </path>
        <circle cx="21" cy="8" r="2.5" fill="url(#analytics-grad)" filter="url(#analytics-glow)">
            <animate attributeName="r" values="2;3;2" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="6" cy="16" r="2" fill="#ff6b6b" filter="url(#analytics-glow)" opacity="0.8" />
        <circle cx="10" cy="12" r="2" fill="#ffd93d" filter="url(#analytics-glow)" opacity="0.8" />
        <circle cx="14" cy="15" r="2" fill="#6bcb77" filter="url(#analytics-glow)" opacity="0.8" />
    </svg>
);

