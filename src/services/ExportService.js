/**
 * ExportService - Trade Geçmişi Dışa Aktarma
 * CSV ve JSON export özellikleri
 */

class ExportService {

    // ==========================================
    // CSV EXPORT
    // ==========================================

    exportTradesToCSV(trades, filename = 'nova_trades') {
        if (!trades || trades.length === 0) {
            console.error('Dışa aktarılacak işlem yok');
            return false;
        }

        const headers = [
            'ID',
            'Sembol',
            'Tip',
            'Miktar',
            'Giriş Fiyatı',
            'Çıkış Fiyatı',
            'Giriş Tarihi',
            'Çıkış Tarihi',
            'P/L ($)',
            'P/L (%)',
            'Durum',
            'Stop Loss',
            'Take Profit',
            'Not'
        ];

        const rows = trades.map(t => [
            t.id || '',
            t.symbol || '',
            t.side || t.type || '',
            t.quantity || t.amount || 0,
            t.entryPrice || 0,
            t.exitPrice || t.closePrice || '',
            this.formatDate(t.openDate || t.entryDate || t.createdAt),
            this.formatDate(t.closeDate || t.exitDate),
            t.pnl?.toFixed(2) || '',
            t.pnlPercent?.toFixed(2) || '',
            t.isOpen ? 'Açık' : 'Kapalı',
            t.stopLoss || '',
            t.takeProfit || '',
            t.note || t.reason || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        this.downloadFile(csvContent, `${filename}_${this.getDateString()}.csv`, 'text/csv;charset=utf-8;');
        return true;
    }

    exportPortfolioToCSV(portfolio, filename = 'nova_portfolio') {
        if (!portfolio.positions || portfolio.positions.length === 0) {
            console.error('Dışa aktarılacak pozisyon yok');
            return false;
        }

        const headers = [
            'Sembol',
            'Miktar',
            'Ortalama Maliyet',
            'Güncel Fiyat',
            'Piyasa Değeri',
            'P/L ($)',
            'P/L (%)',
            'Ağırlık (%)'
        ];

        const totalValue = portfolio.totalValue || portfolio.positions.reduce((acc, p) => acc + (p.marketValue || 0), 0);

        const rows = portfolio.positions.map(p => [
            p.symbol || '',
            p.quantity || p.shares || 0,
            p.avgCost?.toFixed(8) || 0,
            p.currentPrice?.toFixed(8) || 0,
            p.marketValue?.toFixed(2) || 0,
            p.pnl?.toFixed(2) || 0,
            p.pnlPercent?.toFixed(2) || 0,
            ((p.marketValue / totalValue) * 100).toFixed(2)
        ]);

        const csvContent = [
            `# Nova TradeBot Portfolio Export - ${new Date().toLocaleString('tr-TR')}`,
            `# Toplam Değer: $${totalValue.toFixed(2)}`,
            '',
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        this.downloadFile(csvContent, `${filename}_${this.getDateString()}.csv`, 'text/csv;charset=utf-8;');
        return true;
    }

    // ==========================================
    // JSON EXPORT
    // ==========================================

    exportToJSON(data, filename = 'nova_export') {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `${filename}_${this.getDateString()}.json`, 'application/json');
        return true;
    }

    exportFullBackup(trades, portfolio, settings) {
        const backup = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            app: 'Nova TradeBot',
            data: {
                trades: trades || [],
                portfolio: portfolio || {},
                settings: settings || {}
            }
        };

        return this.exportToJSON(backup, 'nova_backup');
    }

    // ==========================================
    // EXCEL-COMPATIBLE EXPORT
    // ==========================================

    exportToExcel(trades, filename = 'nova_trades') {
        // Excel-uyumlu CSV (BOM ile UTF-8)
        const BOM = '\uFEFF';

        const headers = [
            'Tarih',
            'Sembol',
            'İşlem',
            'Miktar',
            'Fiyat',
            'Toplam',
            'P/L',
            'Durum'
        ];

        const rows = trades.map(t => [
            this.formatDate(t.openDate || t.entryDate),
            t.symbol,
            t.side === 'buy' ? 'ALIM' : 'SATIM',
            t.quantity,
            t.entryPrice,
            (t.quantity * t.entryPrice).toFixed(2),
            t.pnl?.toFixed(2) || '-',
            t.isOpen ? 'Açık' : 'Kapalı'
        ]);

        const csvContent = BOM + [
            headers.join(';'), // Excel için noktalı virgül
            ...rows.map(row => row.join(';'))
        ].join('\n');

        this.downloadFile(csvContent, `${filename}_${this.getDateString()}.csv`, 'text/csv;charset=utf-8;');
        return true;
    }

    // ==========================================
    // PERFORMANCE REPORT
    // ==========================================

    generatePerformanceReport(trades) {
        const closedTrades = trades.filter(t => !t.isOpen);

        if (closedTrades.length === 0) {
            return { error: 'Kapatılmış işlem yok' };
        }

        const wins = closedTrades.filter(t => t.pnl > 0);
        const losses = closedTrades.filter(t => t.pnl <= 0);

        const report = {
            reportDate: new Date().toISOString(),
            summary: {
                totalTrades: closedTrades.length,
                winningTrades: wins.length,
                losingTrades: losses.length,
                winRate: ((wins.length / closedTrades.length) * 100).toFixed(2) + '%',
                totalPnL: closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0).toFixed(2),
                avgWin: wins.length > 0 ? (wins.reduce((a, t) => a + t.pnl, 0) / wins.length).toFixed(2) : 0,
                avgLoss: losses.length > 0 ? (losses.reduce((a, t) => a + t.pnl, 0) / losses.length).toFixed(2) : 0,
                largestWin: Math.max(...closedTrades.map(t => t.pnl || 0)).toFixed(2),
                largestLoss: Math.min(...closedTrades.map(t => t.pnl || 0)).toFixed(2)
            },
            bySymbol: this.groupBySymbol(closedTrades),
            monthly: this.groupByMonth(closedTrades)
        };

        return report;
    }

    groupBySymbol(trades) {
        const grouped = {};
        for (const trade of trades) {
            if (!grouped[trade.symbol]) {
                grouped[trade.symbol] = { trades: 0, pnl: 0, wins: 0 };
            }
            grouped[trade.symbol].trades++;
            grouped[trade.symbol].pnl += trade.pnl || 0;
            if (trade.pnl > 0) grouped[trade.symbol].wins++;
        }
        return grouped;
    }

    groupByMonth(trades) {
        const grouped = {};
        for (const trade of trades) {
            const date = new Date(trade.closeDate || trade.openDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!grouped[key]) {
                grouped[key] = { trades: 0, pnl: 0 };
            }
            grouped[key].trades++;
            grouped[key].pnl += trade.pnl || 0;
        }
        return grouped;
    }

    // ==========================================
    // HELPERS
    // ==========================================

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    formatDate(dateInput) {
        if (!dateInput) return '';
        const date = new Date(dateInput);
        return date.toLocaleString('tr-TR');
    }

    getDateString() {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    }
}

export const exportService = new ExportService();
export default ExportService;
