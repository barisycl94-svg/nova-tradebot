import React from 'react';

export const CyberEye = ({ isActive }) => {
    return (
        <div className="cyber-eye-container">
            <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: isActive ? 'drop-shadow(0 0 8px currentColor)' : 'none' }}
            >
                {/* Dış Çerçeve (HUD) */}
                <path
                    d="M2 12C2 7.5 5 3.5 12 2C19 3.5 22 7.5 22 12C22 16.5 19 20.5 12 22C5 20.5 2 16.5 2 12Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isActive ? 'eye-frame-active' : ''}
                    style={{ opacity: 0.7 }}
                />

                {/* İris Halkası */}
                <circle
                    cx="12"
                    cy="12"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={isActive ? 'iris-pulse' : ''}
                />

                {/* Göz Bebeği */}
                <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill="currentColor"
                    className={isActive ? 'pupil-scan' : ''}
                />

                {/* Tarama Çizgisi (Sadece aktifken) */}
                {isActive && (
                    <rect
                        x="0"
                        y="0"
                        width="24"
                        height="2"
                        fill="currentColor"
                        className="scan-line"
                        opacity="0.5"
                    />
                )}
            </svg>

            <style>{`
        .cyber-eye-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes irisPulse {
          0% { r: 6; stroke-width: 1.5; opacity: 1; }
          50% { r: 7.5; stroke-width: 0.5; opacity: 0.5; }
          100% { r: 6; stroke-width: 1.5; opacity: 1; }
        }

        .iris-pulse {
          animation: irisPulse 2s infinite ease-in-out;
        }

        @keyframes pupilScan {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.6); }
        }

        .pupil-scan {
          transform-origin: center;
          animation: pupilScan 3s infinite ease-in-out;
        }

        @keyframes scanLineMove {
          0% { transform: translateY(2px); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(22px); opacity: 0; }
        }

        .scan-line {
          animation: scanLineMove 1.5s infinite linear;
        }
        
        @keyframes frameGlow {
            0% { stroke-opacity: 0.5; }
            50% { stroke-opacity: 1; filter: drop-shadow(0 0 2px currentColor); }
            100% { stroke-opacity: 0.5; }
        }
        
        .eye-frame-active {
            animation: frameGlow 2s infinite alternate;
        }
      `}</style>
        </div>
    );
};
