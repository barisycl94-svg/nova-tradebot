/**
 * OrionEngine.js
 * Nova TradeBot - Teknik Analiz Motoru (Enhanced)
 * 
 * 100+ teknik indikatörü kullanarak analiz yapar.
 */

import { NovaDecisionResult, DecisionTrace } from '../../models/NovaTypes.js';
import { SignalAction } from '../../models/Models.js';
import { MasterIndicatorAnalyzer } from '../indicators/MasterIndicatorAnalyzer.js';
import { learningEngine } from '../learning/LearningEngine.js';

export class OrionEngine {

    /**
     * 100+ indikatörü çalıştırarak teknik puan (0-100) ve analiz detayları üretir.
     * @param {Candle[]} candles - Tarihsel mum verileri
     * @returns {Object} { score: number, traces: DecisionTrace[] }
     */
    static async analyze(candles) {
        if (!candles || candles.length < 50) {
            return {
                score: 50,
                traces: [new DecisionTrace('Orion', SignalAction.WAIT, 'Yetersiz veri (min 50 mum gerekli)', 0.4)]
            };
        }

        // 🧠 Öğrenilmiş istatistikleri al (Fine-grained Learning)
        const indicatorStats = learningEngine.indicatorStats;

        // Initialize traces and a temporary score for pre-MasterIndicatorAnalyzer calculations
        const traces = [];
        let tempScoreAdjustment = 0; // This will adjust the final score

        // Prepare data for technical indicators
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);

        // 5. VOLATİLİTE SIKIŞMASI (Bollinger & Keltner Squeeze) - YENİ
        try {
            const { BollingerBands, KeltnerChannels } = (await import('../indicators/IndicatorLibrary2.js')).default || await import('../indicators/IndicatorLibrary2.js');

            const bb = BollingerBands(closes, 20, 2);
            const kc = KeltnerChannels(highs, lows, closes, 20, 10, 1.5);

            // Eğer Bollinger bantları Keltner kanallarının içindeyse SQUEEZE (sıkışma) vardır
            const lastBB_U = bb.upper[bb.upper.length - 1];
            const lastBB_L = bb.lower[bb.lower.length - 1];
            const lastKC_U = kc.upper[kc.upper.length - 1];
            const lastKC_L = kc.lower[kc.lower.length - 1];

            const isSqueezed = lastBB_U < lastKC_U && lastBB_L > lastKC_L;

            if (isSqueezed) {
                traces.push(new DecisionTrace('Volatility Squeeze', SignalAction.HOLD,
                    'Piyasa yay gibi gerildi (Squeeze). Büyük bir patlama yaklaşıyor.', 0.1, 50));
            } else if (bb.upper[bb.upper.length - 2] < kc.upper[kc.upper.length - 2] && lastBB_U > lastKC_U) {
                // Sıkışma yukarı yönlü bozuluyor
                tempScoreAdjustment += 15;
                traces.push(new DecisionTrace('Squeeze Breakout', SignalAction.BUY,
                    'Sıkışma YUKARI yönlü bozuldu! Patlama başlıyor.', 0.2, 85));
            }
        } catch (e) {
            // Dinamik import hatası veya veri eksikliği
        }

        // 100+ indikatör analizi - Artık başarı oranlarını dikkate alıyor
        const masterResult = MasterIndicatorAnalyzer.analyze(candles, indicatorStats);

        // Ana sonuç
        let signal = SignalAction.HOLD;
        const finalScore = Math.max(0, Math.min(100, masterResult.score + tempScoreAdjustment));

        if (finalScore >= 65) signal = SignalAction.BUY;
        else if (finalScore <= 35) signal = SignalAction.SELL;
        else if (finalScore >= 55) signal = SignalAction.HOLD;
        else signal = SignalAction.WAIT;

        traces.push(new DecisionTrace(
            'Orion-Master',
            signal,
            `${masterResult.totalIndicators} indikatör analiz edildi. Skor: ${finalScore}/100. Güven: %${masterResult.confidence}`,
            0.4,
            finalScore
        ));

        // Bullish/Bearish özet
        const summaryScore = masterResult.bullishSignals > masterResult.bearishSignals ? 70 : 30;
        traces.push(new DecisionTrace(
            'Orion-Summary',
            masterResult.bullishSignals > masterResult.bearishSignals ? SignalAction.BUY : SignalAction.SELL,
            `Bullish: ${masterResult.bullishSignals} | Bearish: ${masterResult.bearishSignals} | Nötr: ${masterResult.neutralSignals}`,
            0.3,
            summaryScore
        ));

        // 🎯 Fine-grained Tracking: Tüm indikatörleri öğrenme motoru için izle
        masterResult.signals.forEach(sig => {
            if (sig.value !== 0) {
                traces.push(new DecisionTrace(
                    `Ind-${sig.name}`,
                    sig.value > 0 ? SignalAction.BUY : SignalAction.SELL,
                    `${sig.name} sinyali`,
                    0.0,
                    sig.value > 0 ? 100 : 0
                ));
            }
        });

        // Detay logları (UI için sınırlı sayıda)
        masterResult.details.slice(0, 5).forEach(detail => {
            traces.push(new DecisionTrace('Orion-Detail', SignalAction.HOLD, detail, 0.1, 50));
        });

        return {
            score: finalScore,
            traces,
            masterResult
        };
    }
}
