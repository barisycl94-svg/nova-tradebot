import React, { useState, useEffect } from 'react';
import { tradingViewModel } from '../../viewmodels/TradingViewModel';

const LiveScannerView = () => {
    const [scanResults, setScanResults] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

    useEffect(() => {
        const updateData = () => {
            setScanResults([...tradingViewModel.scanResults]);
        };

        updateData();

        let removeListener = () => { };
        if (tradingViewModel.subscribe) {
            removeListener = tradingViewModel.subscribe(updateData);
        } else {
            const interval = setInterval(updateData, 200);
            removeListener = () => clearInterval(interval);
        }

        return () => {
            removeListener();
        };
    }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedResults = [...scanResults].sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Decision objesi ise label üzerinden sırala
        if (sortConfig.key === 'decision') {
            valA = (typeof a.decision === 'object' ? a.decision.label : a.decision) || '';
            valB = (typeof b.decision === 'object' ? b.decision.label : b.decision) || '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const getDecisionColor = (decision) => {
        // Obje veya string gelebilir, stringe çevir
        const val = (typeof decision === 'object' ? (decision.label || decision.id) : decision) || '';

        // Türkçe veya İngilizce kontrolü (Büyük/Küçük harf duyarlılığını kaldırmak için upperCase)
        const v = val.toUpperCase();
        if (v.includes('BUY') || v.includes('AL')) return '#00ff41';
        if (v.includes('SELL') || v.includes('SAT')) return '#ff0055';
        if (v.includes('WAIT') || v.includes('BEKLE')) return '#e6b800'; // Sarı
        return '#888';
    };

    const containerStyle = {
        padding: '20px',
        height: '100vh',
        backgroundColor: '#050511',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Courier New', Courier, monospace",
        color: '#00ff41',
        overflow: 'hidden'
    };

    const headerStyle = {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        textShadow: '0 0 10px rgba(0,255,65,0.5)',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
    };

    const tableContainerStyle = {
        flex: 1,
        overflowY: 'auto',
        border: '1px solid #333',
        backgroundColor: '#000'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    };

    const thStyle = {
        textAlign: 'left',
        padding: '10px',
        borderBottom: '1px solid #333',
        color: '#666'
    };

    const tdStyle = {
        padding: '8px 10px',
        borderBottom: '1px solid #111',
        color: '#ddd'
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                CANLI_TARAMA_V1.0
            </div>

            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('timestamp')}>
                                ZAMAN {sortConfig.key === 'timestamp' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('symbol')}>
                                SEMBOL {sortConfig.key === 'symbol' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('price')}>
                                FİYAT {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('score')}>
                                PUAN {sortConfig.key === 'score' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('decision')}>
                                KARAR {sortConfig.key === 'decision' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedResults.map((row, index) => (
                            <tr key={`${row.symbol}-${index}`} style={{
                                backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.5)' : 'rgba(10,10,10,0.5)'
                            }}>
                                <td style={{ ...tdStyle, color: '#555' }}>
                                    {new Date(row.timestamp).toLocaleTimeString()}
                                </td>
                                <td style={{ ...tdStyle, color: '#fff', fontWeight: 'bold' }}>
                                    {row.symbol}
                                </td>
                                <td style={tdStyle}>
                                    ${parseFloat(row.price).toFixed(row.price < 1 ? 4 : 2)}
                                </td>
                                <td style={{
                                    ...tdStyle,
                                    color: row.score > 70 ? '#00ff41' : row.score < 30 ? '#ff0055' : '#888'
                                }}>
                                    {row.score}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        border: `1px solid ${getDecisionColor(row.decision)}`,
                                        color: getDecisionColor(row.decision),
                                        padding: '2px 8px',
                                        fontSize: '10px',
                                        borderRadius: '4px',
                                        fontWeight: 'bold'
                                    }}>
                                        {typeof row.decision === 'object' ? (row.decision.label || row.decision.id) : row.decision}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedResults.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#444' }}>
                        / SİNYAL ARANIYOR... /
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveScannerView;
