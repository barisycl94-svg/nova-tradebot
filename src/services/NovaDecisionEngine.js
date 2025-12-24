/**
 * NovaDecisionEngine.js
 * Nova TradeBot - Merkezi Karar Konseyi (BEYİN)
 * 
 * Tüm alt motorlardan (Orion, Atlas, Aether, Phoenix) gelen analizleri toplar,
 * ağırlıklandırır, veto mekanizmasını işletir ve nihai kararı verir.
 * 
 * 🧠 ÖĞRENEN SİSTEM: Başarı oranlarına göre ağırlıklar dinamik olarak ayarlanır
 * 🎯 TRADING MODLARI: Kullanıcı tercihine göre eşikler değişir
 */

import { NovaDecisionResult, DecisionTrace } from '../models/NovaTypes.js';
import { SignalAction, AssetType } from '../models/Models.js';

// Motorları İmport Et
import { OrionEngine } from './engines/OrionEngine.js';
import { AtlasEngine } from './engines/AtlasEngine.js';
import { AetherEngine } from './engines/AetherEngine.js';
import { PhoenixScenarioEngine } from './phoenix/PhoenixScenarioEngine.js';

// 🧠 Öğrenme Motorunu Lazy Import Et (Circular Dependency önlemi)
let learningEngine = null;
const getLearningEngine = async () => {
    if (!learningEngine) {
        try {
            const module = await import('./learning/LearningEngine.js');
            learningEngine = module.learningEngine;
        } catch (e) {
            console.warn('LearningEngine yüklenemedi:', e.message);
        }
    }
    return learningEngine;
};

// 🎯 Trading Konfigürasyonu
import { tradingConfig } from '../config/TradingConfig.js';
import { RiskCalculator } from './risk/RiskCalculator.js';

// ⏰ Zamanlama Motoru (Argus Cronos)
import { CronosEngine } from './timing/CronosEngine.js';

// 🔥 Phoenix Channel Analizi (Argus Phoenix)
import { PhoenixChannelAnalysis } from './phoenix/PhoenixChannelAnalysis.js';

// 🌾 Sektör Analizi (Argus Demeter - Kripto için uyarlandı)
import { DemeterCryptoSectorEngine } from './sector/DemeterCryptoSectorEngine.js';

// 🏛️ Piyasa Durumu (Argus Titan - Kripto için uyarlandı)
import { TitanMarketEngine } from './market/TitanMarketEngine.js';

// ⚔️ Faktör Analizi (Argus Athena - Kripto için uyarlandı)
import { AthenaCryptoFactorEngine } from './factors/AthenaCryptoFactorEngine.js';

// 📰 Haber Sentiment (Argus Hermes)
import { hermesService } from './HermesNewsService.js';

// 🤖 AutoPilot (ATR bazlı Stop/Target)
import { autoPilotEngine } from './autopilot/AutoPilotEngine.js';

// ⚠️ Gelişmiş Risk Yönetimi
import { advancedRiskManager } from './risk/AdvancedRiskManager.js';

// 🧠 Chiron Regime Engine (Dinamik Ağırlık Öğrenme)
import { chironRegimeEngine } from './chiron/ChironRegimeEngine.js';

export class NovaDecisionEngine {

    /**
     * Tüm verileri analiz ederek nihai yatırım kararını verir.
     * @param {string} symbol - analiz edilen varlık
     * @param {Object} multiTimeframeCandles - { '15m': [], '1h': [], '4h': [], '1d': [] }
     * @param {string} type - varlık tipi
     */
    static async makeDecision(symbol, multiTimeframeCandles, type = AssetType.CRYPTO, silent = false) {
        const traces = [];
        const candles1d = multiTimeframeCandles['1d'] || [];
        const candles1h = multiTimeframeCandles['1h'] || [];
        const candles15m = multiTimeframeCandles['15m'] || [];

        // --- 1. Aether (Makro Piyasa) Analizi ---
        // En önce makro duruma bakılır. Eğer kıyamet kopuyorsa diğer analizlerin önemi azalır.
        const aetherResult = await AetherEngine.calculateMarketRiskMultiplier();
        const marketRiskMultiplier = aetherResult.multiplier; // 0.5 (Kötü) - 1.0 (İyi)

        traces.push(new DecisionTrace('Aether',
            aetherResult.isBullish ? SignalAction.BUY : SignalAction.WAIT,
            `${aetherResult.reason} (Risk Çarpanı: ${marketRiskMultiplier})`,
            0.20, // %20 Ağırlık
            marketRiskMultiplier * 100 // Skor
        ));


        // --- 2. Orion (Teknik) Analizi - 4 KATMANLI ZAMAN DİLİMİ ---
        const orion1d = await OrionEngine.analyze(candles1d);
        const orion4h = multiTimeframeCandles['4h']?.length >= 20 ? await OrionEngine.analyze(multiTimeframeCandles['4h']) : { score: 50 };
        const orion1h = candles1h.length >= 20 ? await OrionEngine.analyze(candles1h) : { score: 50 };
        const orion15m = candles15m.length >= 20 ? await OrionEngine.analyze(candles15m) : { score: 50 };

        // Ağırlıklı teknik skor (1d:%40, 4s:%30, 1s:%20, 15m:%10)
        let orionScoreRaw = (orion1d.score * 0.4) + (orion4h.score * 0.3) + (orion1h.score * 0.2) + (orion15m.score * 0.1);

        // 📉 TREND UYUMSUZLUĞU KONTROLÜ (Trend Alignment Check)
        // Eğer Günlük (1d) ve Saatlik (1h) arasında ciddi fark varsa, güveni düşür.
        // Örn: Günlük AL (80), Saatlik SAT (30) ise -> Düzeltme geliyor olabilir. Bekle.
        const trendDiff = Math.abs(orion1d.score - orion1h.score);
        if (trendDiff > 30) {
            orionScoreRaw -= 10; // 10 Puan ceza (Kararsız piyasa)
            traces.push(new DecisionTrace('Nova (Trend Uyumsuzluğu)', SignalAction.WAIT,
                `⚠️ Zaman dilimleri çelişiyor (Fark: ${trendDiff.toFixed(0)}). Düzeltme riski.`,
                0.1, 45));
        }

        traces.push(new DecisionTrace('Multi-Timeframe', SignalAction.HOLD,
            `Matris: 1G:%${orion1d.score.toFixed(0)} | 4S:%${orion4h.score.toFixed(0)} | 1S:%${orion1h.score.toFixed(0)} | 15D:%${orion15m.score.toFixed(0)}`,
            0.1, orionScoreRaw));

        traces.push(...orion1d.traces);


        // --- 3. Atlas (Temel) Analizi ---
        const atlasResult = await AtlasEngine.analyze(symbol, type);
        const atlasScoreRaw = atlasResult.score;
        traces.push(...atlasResult.traces);


        // --- 4. Phoenix (Gelecek) Analizi ---
        const closes = candles1d.map(c => c.close);
        const phoenixResult = PhoenixScenarioEngine.analyze(closes);
        const phoenixScoreRaw = phoenixResult.score;
        traces.push(...phoenixResult.traces);

        // --- 5. CRONOS (Zamanlama) Analizi (Argus) ---
        const cronosResult = CronosEngine.analyze();
        const cronosMultiplier = CronosEngine.getTimingMultiplier();

        if (cronosResult.warnings.length > 0) {
            traces.push(new DecisionTrace('Cronos (Zamanlama)',
                cronosResult.score < 40 ? SignalAction.WAIT : SignalAction.HOLD,
                `⏰ ${cronosResult.details.month} - ${cronosResult.details.day}: ${cronosResult.warnings.join(', ')}`,
                0.05, cronosResult.score
            ));
        }

        // --- 6. PHOENIX CHANNEL (Kanal) Analizi (Argus) ---
        const phoenixChannelCandles = candles1h.length >= 60 ? candles1h : candles1d;
        if (phoenixChannelCandles.length >= 60) {
            const channelResult = PhoenixChannelAnalysis.analyze(phoenixChannelCandles);

            if (channelResult.status === 'ACTIVE') {
                traces.push(new DecisionTrace('Phoenix (Kanal)',
                    channelResult.mode === 'TREND' ? SignalAction.BUY : SignalAction.HOLD,
                    `🔥 ${channelResult.mode} Mode: ${channelResult.summary}`,
                    0.1, channelResult.score
                ));
            }
        }

        // --- 7. DEMETER (Sektör Rotasyonu) Analizi (Argus) ---
        let demeterScore = 50;
        try {
            const sectorResult = await DemeterCryptoSectorEngine.getScoreForCoin(symbol);
            demeterScore = sectorResult.score;

            if (sectorResult.sectorRank <= 2) {
                traces.push(new DecisionTrace('Demeter (Sektör)',
                    SignalAction.BUY,
                    `🌾 ${sectorResult.sector.name} sektörü lider! (${sectorResult.sectorRank}. sırada, ${sectorResult.sectorPerformance > 0 ? '+' : ''}${sectorResult.sectorPerformance.toFixed(1)}%)`,
                    0.08, demeterScore
                ));
            } else if (sectorResult.sectorRank >= 5) {
                traces.push(new DecisionTrace('Demeter (Sektör)',
                    SignalAction.WAIT,
                    `⚠️ ${sectorResult.sector.name} sektörü zayıf (${sectorResult.sectorRank}. sırada)`,
                    0.08, demeterScore
                ));
            }
        } catch (e) {
            // Demeter analizi başarısız - devam et
        }

        // --- 8. TITAN (Genel Piyasa) Analizi (Argus) ---
        let titanScore = 50;
        try {
            const marketResult = await TitanMarketEngine.getOverallMarketScore();
            titanScore = marketResult.overallScore;

            const marketSignal = titanScore >= 60 ? SignalAction.BUY :
                titanScore <= 40 ? SignalAction.WAIT : SignalAction.HOLD;

            traces.push(new DecisionTrace('Titan (Piyasa)',
                marketSignal,
                `🏛️ ${marketResult.summary} | Duygu: ${marketResult.sentiment.emoji} ${marketResult.sentiment.sentiment}`,
                0.1, titanScore
            ));
        } catch (e) {
            // Titan analizi başarısız - devam et
        }

        // --- 9. ATHENA (Faktör) Analizi (Argus) ---
        let athenaScore = 50;
        try {
            const factorResult = await AthenaCryptoFactorEngine.analyzeAll(candles1d);
            athenaScore = factorResult.overallScore;

            if (athenaScore >= 65 || athenaScore <= 35) {
                traces.push(new DecisionTrace('Athena (Faktör)',
                    athenaScore >= 65 ? SignalAction.BUY : SignalAction.WAIT,
                    `⚔️ ${factorResult.recommendation} | Güçlü: ${factorResult.strongest.name} (${factorResult.strongest.score})`,
                    0.1, athenaScore
                ));
            }
        } catch (e) {
            // Athena analizi başarısız - devam et
        }

        // --- 10. HERMES (Haber Sentiment) Analizi (Argus) ---
        let hermesScore = 50;
        try {
            const sentimentResult = await hermesService.analyzeForSymbol(symbol);
            hermesScore = sentimentResult.score;

            traces.push(new DecisionTrace('Hermes (Sentiment)',
                hermesScore >= 60 ? SignalAction.BUY : hermesScore <= 40 ? SignalAction.WAIT : SignalAction.HOLD,
                `📰 ${sentimentResult.emoji} ${sentimentResult.sentiment} | Bullish: ${sentimentResult.bullishCount}, Bearish: ${sentimentResult.bearishCount}`,
                0.05, hermesScore
            ));

            // Extreme Fear durumunda veto
            if (sentimentResult.sentiment === 'Extreme Fear') {
                traces.push(new DecisionTrace('Nova (Hermes Veto)',
                    SignalAction.WAIT,
                    `😱 Piyasada aşırı korku! Haber sentiment'i çok düşük`,
                    0.05, 25
                ));
            }
        } catch (e) {
            // Hermes analizi başarısız - devam et
        }


        // --- PUANLAMA VE AĞIRLIKLANDIRMA ---
        // 🧠 Dinamik ağırlıkları öğrenme motorundan veya skorlama stratejisinden al
        const dynamicWeights = learningEngine.getModuleWeights();

        // 📊 Core vs Pulse stratejik ağırlıkları al (Argus 12_argus.md)
        const strategyWeights = tradingConfig.getScoringWeights();
        const scoringMode = tradingConfig.getScoringStrategy();

        // Ana motorlar - Strateji ağırlıkları ile dinamik ağırlıkları karıştır
        const W_ORION = strategyWeights?.orion || dynamicWeights.Orion || 0.32;
        const W_ATLAS = strategyWeights?.atlas || dynamicWeights.Atlas || 0.18;
        const W_PHOENIX = strategyWeights?.phoenix || dynamicWeights.Phoenix || 0.15;
        const W_AETHER = strategyWeights?.aether || dynamicWeights.Aether || 0.15;

        // Argus yardımcı motorlar
        const W_DEMETER = strategyWeights?.demeter || 0.04;
        const W_TITAN = strategyWeights?.titan || 0.05;
        const W_ATHENA = strategyWeights?.athena || 0.05;
        const W_HERMES = strategyWeights?.hermes || 0.06;

        // Modül güvenilirliklerini traces'e ekle (debug için)
        const strategyLabel = scoringMode === 'core' ? '💎 Core (Yatırım)' : '⚡ Pulse (Trading)';
        traces.push(new DecisionTrace('NOVA-LEARNING', SignalAction.HOLD,
            `${strategyLabel} | Orion: ${(W_ORION * 100).toFixed(0)}%, Atlas: ${(W_ATLAS * 100).toFixed(0)}%, Phoenix: ${(W_PHOENIX * 100).toFixed(0)}%`,
            0, 50
        ));

        // Aether skoru: 1.0 ise 100 puan, 0.5 ise 50 puan gibi normalize edebiliriz.
        const aetherScoreRaw = marketRiskMultiplier * 100;

        // Ana skor hesaplaması (10 modül birleşik)
        let totalScore = (orionScoreRaw * W_ORION) +
            (atlasScoreRaw * W_ATLAS) +
            (phoenixScoreRaw * W_PHOENIX) +
            (aetherScoreRaw * W_AETHER) +
            (demeterScore * W_DEMETER) +
            (titanScore * W_TITAN) +
            (athenaScore * W_ATHENA) +
            (hermesScore * W_HERMES);

        // 🛡️ KALİTE KONTROL: Teknik (Orion) negatifse (50 altı), 
        // Atlas ve Aether'in skoru yukarı pompalamasına izin verme.
        if (orionScoreRaw < 50) {
            totalScore *= 0.90; // %10 Ceza
        }

        // 🏛️ TITAN VETO: Piyasa çok kötüyse (30 altı), toplam skoru düşür
        if (titanScore < 30) {
            totalScore *= 0.85; // %15 Ceza
            traces.push(new DecisionTrace('Nova (Titan Veto)',
                SignalAction.WAIT,
                `🚨 Piyasa çok zayıf! Titan skoru ${titanScore}/100 - tüm skor düşürüldü`,
                0.1, 30
            ));
        }

        // 📰 HERMES KORKU VETOsu: Extreme Fear durumunda ek ceza
        if (hermesScore < 25) {
            totalScore *= 0.90; // %10 Ceza
        }

        // 🧠 ÖĞRENİLMİŞ İNDİKATÖR PERFORMANSI ENTEGRASYONU
        // Nova, hangi indikatörlerin yalan söylediğini hatırlar.
        let indicatorAdjustment = 0;
        let learnedAdjustmentReason = "";

        // Orion'dan gelen tüm sinyalleri topla
        const allSignals = [
            ...(orion1d.masterResult?.signals || []).map(s => ({ ...s, name: s.name + '_1d' })),
            ...(orion4h.masterResult?.signals || []).map(s => ({ ...s, name: s.name + '_4h' })),
            ...(orion1h.masterResult?.signals || []).map(s => ({ ...s, name: s.name + '_1h' }))
        ];

        // Sadece sinyal verenleri (value != 0) kontrol et
        const activeSignals = allSignals.filter(s => s.value !== 0);

        if (activeSignals.length > 0) {
            let boostCount = 0;
            let penaltyCount = 0;

            for (const signal of activeSignals) {
                // LearningEngine'den bu indikatörün karnesini iste
                const stats = learningEngine.indicatorStats[signal.name];

                // En az 10 işlem görmüş olması lazım
                if (stats && stats.totalSignals >= 10) {
                    // Eğer başarılıysa ve bizim yönümüzde sinyal veriyorsa (Al için value > 0)
                    if (stats.successRate > 0.60 && signal.value > 0) {
                        indicatorAdjustment += 1.5; // +1.5 Puan ödül
                        boostCount++;
                    }
                    // Eğer başarısızsa (%40 altı) ve al diyorsa -> Cezalandır
                    else if (stats.successRate < 0.40 && signal.value > 0) {
                        indicatorAdjustment -= 2.0; // -2 Puan ceza (Yalancı çoban)
                        penaltyCount++;
                    }
                }
            }

            // Skoru güncelle
            if (indicatorAdjustment !== 0) {
                totalScore += indicatorAdjustment;
                learnedAdjustmentReason = `Öğrenilen İndikatör Ayarı: ${indicatorAdjustment > 0 ? '+' : ''}${indicatorAdjustment.toFixed(1)} (${boostCount} iyi, ${penaltyCount} kötü)`;

                // Trace ekle
                traces.push(new DecisionTrace('Nova (Hafıza)',
                    indicatorAdjustment > 0 ? SignalAction.BUY : SignalAction.WAIT,
                    learnedAdjustmentReason,
                    0.1, 50 + indicatorAdjustment));
            }
        }

        // --- KONSEY TARTIŞMASI (Dialogue Construction) ---
        const councilTraces = [];

        // 1. Orion (Teknik Uzman)
        const orionMaster = orion1d.masterResult || {};
        councilTraces.push(new DecisionTrace('Orion (Teknik Uzman)',
            orionScoreRaw >= 60 ? SignalAction.BUY : orionScoreRaw <= 40 ? SignalAction.SELL : SignalAction.HOLD,
            `250'den fazla teknik indikatörü taradım. ${orionMaster.bullishSignals || 0} gösterge yükseliş, ${orionMaster.bearishSignals || 0} gösterge düşüş işareti veriyor. Momentum ve trend analizi sonucu teknik skorumuz: %${orionScoreRaw.toFixed(0)}.`,
            0.6, orionScoreRaw));

        // 2. Atlas (Hacim & Momentum Analisti)
        councilTraces.push(new DecisionTrace('Atlas (Veri Analisti)',
            atlasScoreRaw >= 60 ? SignalAction.BUY : atlasScoreRaw <= 40 ? SignalAction.SELL : SignalAction.HOLD,
            `Piyasadaki para akışını ve hacim değişimlerini inceledim. ${symbol} için 24 saatlik hacim ve fiyat range analizi sonuçlarıma göre güven endeksimiz: %${atlasScoreRaw.toFixed(0)}.`,
            0.5, atlasScoreRaw));

        // 3. Phoenix (İstatistik/Gelecek Uzmanı)
        councilTraces.push(new DecisionTrace('Phoenix (Gelecek Uzmanı)',
            phoenixScoreRaw >= 60 ? SignalAction.BUY : phoenixScoreRaw <= 40 ? SignalAction.SELL : SignalAction.HOLD,
            `Mum formasyonları ve istatistiksel olasılıkları simüle ettim. Geçmiş benzer hareketlerin %${phoenixScoreRaw.toFixed(0)} oranında bu yönde sonuçlandığını görüyorum.`,
            0.4, phoenixScoreRaw));

        // 4. Aether (Makro Risk Sorumlusu)
        councilTraces.push(new DecisionTrace('Aether (Makro Risk)',
            marketRiskMultiplier >= 0.8 ? SignalAction.BUY : marketRiskMultiplier <= 0.5 ? SignalAction.SELL : SignalAction.HOLD,
            `Global kripto piyasası ve Bitcoin korelasyonunu kontrol ettim. Mevcut piyasa risk çarpanımız: ${marketRiskMultiplier.toFixed(2)}. ${marketRiskMultiplier < 0.6 ? 'Piyasa şu an oldukça riskli, temkinli olmalıyız.' : 'Piyasa koşulları şu an stabil görünüyor.'}`,
            0.3, aetherScoreRaw));

        // --- VETO MEKANİZMASI ---
        let vetoTriggered = false;
        let vetoReason = "";

        // Kural 1: Trend Uyumu (Trend Harmony)
        if (orion4h.score < 40 && totalScore > buyThreshold - 10) {
            totalScore *= 0.85;
            vetoTriggered = true;
            vetoReason = "Trend Uyumu Hatası: Üst zaman dilimi (4S) zayıf.";
            councilTraces.push(new DecisionTrace('Nova (Trend Filtresi)', SignalAction.WAIT, '✋ DURUN! Kısa vadeli yükseliş görsem de 4 saatlik trend hala çok zayıf. Tuzak olabilir.', 1, totalScore));
        }

        // Kural 2: Zaman Filtresi (Time Filter)
        const now = new Date();
        const hour = now.getUTCHours();
        const day = now.getUTCDay();
        const isWeekend = (day === 0 || day === 6);
        const isLowLiquidityHours = (hour >= 23 || hour <= 3);

        if (isWeekend && isLowLiquidityHours && totalScore > buyThreshold - 5) {
            totalScore *= 0.88;
            vetoTriggered = true;
            vetoReason = "Düşük Likidite Saati";
            councilTraces.push(new DecisionTrace('Nova (Zaman Filtresi)', SignalAction.WAIT, '✋ DURUN! Hafta sonu gece yarısı manipülasyon riski yüksek. Pazartesi açılışını beklemek daha güvenli.', 1, totalScore));
        }

        // Kural 3: Makro piyasa çok kötüyse (Aether Veto)
        if (marketRiskMultiplier < 0.7 && totalScore > 55) {
            const reduction = 1 - (0.7 - marketRiskMultiplier);
            totalScore *= reduction;
            vetoTriggered = true;
            vetoReason = "Makro riskler nedeniyle alım sinyali baskılandı.";
            councilTraces.push(new DecisionTrace('Nova (Baş Karar Verici)', SignalAction.WAIT, '✋ DURUN! Makro piyasa verileri şu an çok riskli, frene basıyorum.', 1, totalScore));
        }

        // Kural 4: FOMO Engelleyici (Peak Rejection)
        // Eğer coin son 24 saatin zirvesine çok yakınsa (%95+), alım yapma.
        if (candles1h.length >= 24) {
            const last24h = candles1h.slice(-24);
            const high24h = Math.max(...last24h.map(c => c.high));
            const low24h = Math.min(...last24h.map(c => c.low));
            const curPrice = candles1h[candles1h.length - 1].close;
            const rangePos = ((curPrice - low24h) / (high24h - low24h || 1)) * 100;

            if (rangePos > 95 && totalScore > buyThreshold - 5) {
                totalScore *= 0.80; // %20 Ceza
                vetoTriggered = true;
                vetoReason = "Zirve Reddi: Coin 24s zirvesinde, düzeltme beklenebilir.";
                councilTraces.push(new DecisionTrace('Nova (FOMO Filtresi)', SignalAction.WAIT, `✋ DURUN! Fiyat şu an son 24 saatin zirvesinde (%${rangePos.toFixed(0)} range). Düzeltme gelmeden tepeden almayalım.`, 1, totalScore));
            }
        }

        // --- NİHAİ KARAR ---

        let finalDecision = SignalAction.HOLD;
        let confidence = totalScore; // Güven skoru başlangıçta toplam skor olarak alınır.

        // 🎯 DİNAMİK EŞİKLER (Trading Modundan)
        const buyThreshold = tradingConfig.getBuyThreshold();
        const sellThreshold = tradingConfig.getSellThreshold();
        const currentMode = tradingConfig.getModeConfig();

        if (totalScore >= buyThreshold) {
            // ALIM SİNYALİ - Eşik değere ulaştı
            finalDecision = SignalAction.BUY;
        } else if (totalScore <= sellThreshold) {
            // SATIŞ SİNYALİ - Düşük skor
            finalDecision = SignalAction.SELL;
        } else if (totalScore >= buyThreshold - 5) {
            // Eşiğe yakın ama yeterli değil - BEKLE/HOLD
            finalDecision = SignalAction.HOLD;
        } else {
            // Nötr bölge
            if (marketRiskMultiplier < 0.8) {
                finalDecision = SignalAction.WAIT;
            } else {
                finalDecision = SignalAction.HOLD;
            }
        }

        // 🔍 DETAYLI ANALİZ LOGU (Karar sonrası)
        const decisionLabel = finalDecision === SignalAction.BUY ? '🚀 AL' : (finalDecision === SignalAction.SELL ? '🔻 SAT' : '⏳ BEKLE');

        if (!silent) {
            console.log(`📊 ${symbol} [${currentMode.name}]: Skor=${totalScore.toFixed(1)} | Karar=${decisionLabel} | ` +
                `Orion:${orionScoreRaw.toFixed(0)} | Atlas:${atlasResult.score.toFixed(0)} | ` +
                `Phoenix:${phoenixResult.score.toFixed(0)} | Aether:${aetherScoreRaw.toFixed(0)}`);
        }

        // Nova'nın Nihai Karar Mesajı
        let novaSaying = "";
        if (finalDecision === SignalAction.BUY) {
            novaSaying = `📢 Karar verildi: Çoğunluk ALIM yönünde hemfikir. Teknik skor %${totalScore.toFixed(0)} ile eşik değerini aştı. Pozisyon açılıyor!`;
        } else if (finalDecision === SignalAction.SELL) {
            novaSaying = `📢 Karar verildi: Piyasa verileri zayıf, SATIŞ veya Nakite Geçiş yapılması kararlaştırıldı.`;
        } else {
            novaSaying = `📢 Karar verildi: Belirgin bir fırsat görülmedi. BEKLEMEDE kalıyoruz. Veri takibi devam ediyor.`;
        }

        councilTraces.push(new DecisionTrace('Nova (Nihai Karar)', finalDecision, novaSaying, 1, totalScore));

        // Güven Skoru normalizasyonu (0-100)
        // 50'den ne kadar uzaksa o kadar eminiz.
        const confidenceScore = Math.abs(totalScore - 50) * 2;

        const result = new NovaDecisionResult(
            symbol,
            atlasScoreRaw,
            orionScoreRaw,
            aetherScoreRaw, // Aether Score
            0, // Hermes (Şimdilik 0)
            finalDecision,
            confidenceScore
        );

        // Tüm izleri birleştir (Öğrenme için raw + UI için Konsey)
        const allTraces = [...councilTraces, ...traces];

        // Debug/UI için ek verileri objeye iliştir
        result.totalScore = totalScore;
        result.reason = novaSaying;
        result.traces = allTraces;
        result.phoenixProjection = phoenixResult.projection;

        // 🔬 ÖĞRENME MOTORU İÇİN RAW VERİLER
        // Orion'dan gelen tüm zaman dilimlerindeki indikatör sinyallerini topluyoruz.
        // Backtest'te 1d verisi bazen oluşmayabilir (yetersiz veri), bu yüzden 4h ve 1h sinyalleri kritiktir.
        result.rawIndicatorResults = [];

        if (orion1d.masterResult && orion1d.masterResult.signals) {
            result.rawIndicatorResults.push(...orion1d.masterResult.signals.map(s => ({ ...s, name: s.name + '_1d' })));
        }
        if (orion4h.masterResult && orion4h.masterResult.signals) {
            result.rawIndicatorResults.push(...orion4h.masterResult.signals.map(s => ({ ...s, name: s.name + '_4h' })));
        }
        if (orion1h.masterResult && orion1h.masterResult.signals) {
            result.rawIndicatorResults.push(...orion1h.masterResult.signals.map(s => ({ ...s, name: s.name + '_1h' })));
        }

        // --- 5. RİSK YÖNETİMİ & SEVİYELER (AutoPilot) ---
        // Argus AutoPilot mantığı: ATR bazlı dinamik SL/TP
        if (finalDecision === SignalAction.BUY || finalDecision === SignalAction.SELL) {
            // ATR hesapla (1 saatlik mumlar tercih edilir, yoksa günlük)
            const atrCandles = candles1h.length >= 15 ? candles1h : candles1d;
            const atr = RiskCalculator.calculateATR(atrCandles, 14);
            const currentPrice = candles1h.length > 0 ? candles1h[candles1h.length - 1].close : (candles1d.length > 0 ? candles1d[candles1d.length - 1].close : 0);

            if (atr > 0 && currentPrice > 0) {
                const tradeLevels = RiskCalculator.calculateTradeLevels(finalDecision, currentPrice, atr);
                if (tradeLevels) {
                    result.tradeLevels = tradeLevels;
                    result.atr = atr;

                    // Trace'e ekle
                    traces.push(new DecisionTrace('Nova (Risk Yöneticisi)', finalDecision,
                        `Dynamic Levels: Stop Loss: ${tradeLevels.stopLoss.toFixed(4)}, Target: ${tradeLevels.targetPrice.toFixed(4)} (2 ATR Risk)`,
                        0.1, 100));
                }
            }
        }

        return result;
    }
}
