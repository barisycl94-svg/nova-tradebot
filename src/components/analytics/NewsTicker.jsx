import React, { useState, useEffect } from 'react';
import { hermesService } from '../../services/HermesNewsService';

const NewsTicker = () => {
    const [news, setNews] = useState([]);

    useEffect(() => {
        const load = async () => {
            const data = await hermesService.fetchNews();
            setNews(data);
        };
        load();
        const timer = setInterval(load, 600000); // 10 dk
        return () => clearInterval(timer);
    }, []);

    if (news.length === 0) return null;

    return (
        <div className="news-ticker-container" style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderBottom: '1px solid rgba(0, 243, 255, 0.2)',
            padding: '8px 15px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative',
            backdropFilter: 'blur(10px)'
        }}>
            <div className="ticker-label" style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                background: '#00f3ff',
                color: '#000',
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '11px',
                zIndex: 2
            }}>
                EKSPRES HABER
            </div>

            <div style={{
                display: 'inline-block',
                paddingLeft: '100px',
                animation: 'ticker 40s linear infinite'
            }}>
                {news.map((item, idx) => (
                    <span key={idx} style={{ marginRight: '40px', fontSize: '12px', color: '#fff' }}>
                        <b style={{
                            color: item.sentiment === 'bullish' ? '#00ff88' : item.sentiment === 'bearish' ? '#ff4d4d' : '#888',
                            marginRight: '5px'
                        }}>
                            • {item.source}:
                        </b>
                        {item.title}
                    </span>
                ))}
            </div>

            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
};

export default NewsTicker;
