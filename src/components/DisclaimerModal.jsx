import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Check, ChevronRight } from 'lucide-react';

const DisclaimerModal = ({ onAccept }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [checks, setChecks] = useState({
        notAdvice: false,
        acceptRisk: false,
        readDisclaimer: false
    });

    useEffect(() => {
        const hasAccepted = localStorage.getItem('hasAcceptedDisclaimer');
        if (!hasAccepted) {
            setIsOpen(true);
        }
    }, []);

    const handleCheck = (key) => {
        setChecks(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAccept = () => {
        localStorage.setItem('hasAcceptedDisclaimer', 'true');
        setIsOpen(false);
        if (onAccept) onAccept();
    };

    const allChecked = checks.notAdvice && checks.acceptRisk && checks.readDisclaimer;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f111a] border border-orange-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-orange-900/20 to-transparent border-b border-orange-500/20 flex flex-col items-center text-center">
                    <AlertTriangle className="w-16 h-16 text-orange-500 mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-white mb-2">YASAL UYARI & SORUMLULUK REDDİ</h2>
                    <p className="text-gray-400 text-sm">Uygulamayı kullanmaya başlamadan önce lütfen okuyunuz</p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-300 text-sm leading-relaxed custom-scrollbar">
                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
                        <h3 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            YATIRIM TAVSİYESİ DEĞİLDİR
                        </h3>
                        <p className="mb-2">
                            Nova TradeBot ve ilgili tüm modülleri <strong>yalnızca eğitim ve araştırma amaçlıdır</strong>.
                        </p>
                        <p>
                            Bu sistem yatırım tavsiyesi, alım-satım önerisi veya finansal danışmanlık sağlamaz. Üretilen skorlar, sinyaller ve analizler bilgi amaçlıdır ve alım-satım emri olarak değerlendirilmemelidir.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-red-400 font-bold mb-2">🚫 GERÇEK PARA RİSKİ</h3>
                        <p>
                            Bu sistem paper trading (simülasyon) için optimize edilmiştir. Gerçek para ile yapılan işlemlerin <strong>tüm riski size aittir</strong>. Geliştirici, gerçek para kayıplarından hiçbir şekilde sorumlu tutulamaz.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-blue-400 font-bold mb-2">📊 GEÇMİŞ PERFORMANS</h3>
                        <p>
                            Backtest sonuçları geçmiş verilere dayanır. Geçmiş performans, **gelecekteki sonuçları garanti etmez**. Piyasa koşulları sürekli değişir ve herhangi bir trading stratejisi her zaman kârlı olamaz.
                        </p>
                    </div>

                    <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
                        Bu yazılımı kullanarak tüm sorumluluğu kabul etmiş sayılırsınız. Finansal piyasalarda işlem yapmak yüksek risk içerir. Kaybetmeyi göze alamayacağınız paralarla işlem yapmayınız.
                    </div>
                </div>

                {/* Action Area */}
                <div className="p-6 bg-[#0a0c12] border-t border-gray-800 space-y-4">
                    <div className="space-y-3">
                        <CheckboxRow
                            checked={checks.notAdvice}
                            onChange={() => handleCheck('notAdvice')}
                            text="Bu yazılımın yatırım tavsiyesi olmadığını anlıyorum"
                        />
                        <CheckboxRow
                            checked={checks.acceptRisk}
                            onChange={() => handleCheck('acceptRisk')}
                            text="Tüm finansal risklerin bana ait olduğunu kabul ediyorum"
                        />
                        <CheckboxRow
                            checked={checks.readDisclaimer}
                            onChange={() => handleCheck('readDisclaimer')}
                            text="Sorumluluk reddi metnini okudum ve onaylıyorum"
                        />
                    </div>

                    <button
                        onClick={handleAccept}
                        disabled={!allChecked}
                        className={`w-full py-4 text-center rounded-xl font-bold transition-all duration-300 ${allChecked
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/20 scale-[1.02]'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        KABUL EDİYORUM VE DEVAM ETMEK İSTİYORUM
                    </button>
                </div>
            </div>
        </div>
    );
};

const CheckboxRow = ({ checked, onChange, text }) => (
    <div
        onClick={onChange}
        className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded-lg transition-colors"
    >
        <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${checked ? 'bg-orange-500 border-orange-500' : 'border-gray-600 group-hover:border-gray-500'
            }`}>
            {checked && <Check className="w-4 h-4 text-white" />}
        </div>
        <span className={`text-sm ${checked ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
            {text}
        </span>
    </div>
);

export default DisclaimerModal;
