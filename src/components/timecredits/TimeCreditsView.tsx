import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import { TimeCreditTransaction } from '../../types';
import {
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Send
} from 'lucide-react';

export const TimeCreditsView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [summary, setSummary] = useState<any>({ balance: 0, totalEarned: 0, totalSpent: 0, transactions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [transferAmount, setTransferAmount] = useState(1);
  const [transferNote, setTransferNote] = useState('Appreciation for mentoring session');
  const [isTransferring, setIsTransferring] = useState(false);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest('/api/timecredits/summary');
      setSummary(res);
    } catch (e) {
      console.error('Failed to load Time Credits summary:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [user]);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsTransferring(true);
      await apiRequest('/api/timecredits/transfer', {
        method: 'POST',
        body: JSON.stringify({
          recipientId,
          amount: transferAmount,
          note: transferNote
        })
      });
      setShowTransferModal(false);
      setRecipientId('');
      fetchSummary();
    } catch (err: any) {
      alert(err.message || (language === 'ta' ? 'பரிமாற்றம் தோல்வியடைந்தது.' : 'Transfer failed.'));
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 theme-marine-brown">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ebe0ce]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
            {language === 'ta' ? 'சக ஊழியர் நேர வங்கிப் பொருளாதாரம்' : 'Peer-to-Peer Economy'}
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
            {t('time.title')}
          </h1>
          <p className="text-sm text-[#703616] mt-1">
            {language === 'ta'
              ? 'LearnX சமமான நேரக் கடன் பரிமாற்றத்தில் இயங்குகிறது. 1 மணிநேரம் கற்பித்தல் = 1 நேரக் கடன்.'
              : 'LearnX functions on an equitable Time Credit exchange. 1 hour of teaching equals 1 Time Credit.'}
          </p>
        </div>

        <button
          onClick={() => setShowTransferModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0c263d] via-[#123859] to-[#8a431c] hover:opacity-95 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow cursor-pointer"
        >
          <Gift className="w-4 h-4 text-[#f0a876]" />
          <span>{language === 'ta' ? 'நேரக் கடன் வெகுமதி அனுப்புக' : 'Send Credit Reward'}</span>
        </button>
      </div>

      {/* Metrics Banner in Marine Brown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c263d] via-[#123859] to-[#703616] text-white shadow-lg space-y-2">
          <div className="flex items-center justify-between text-[#f0a876]">
            <Clock className="w-5 h-5 text-[#f0a876]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ta' ? 'தற்போதைய கையிருப்பு' : 'Available Balance'}
            </span>
          </div>
          <div className="font-heading text-4xl font-black text-white">
            {summary.balance} <span className="text-lg font-normal text-[#ded0bb]">{language === 'ta' ? 'கடன்கள்' : 'Credits'}</span>
          </div>
          <p className="text-xs text-[#ded0bb] pt-1">
            {language === 'ta'
              ? `${summary.balance} முழு 1-on-1 வழிகாட்டல் அமர்வுகளுக்கு போதுமானது`
              : `Sufficient for ${summary.balance} full 1-on-1 mentorship session(s)`}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ta' ? 'மொத்தம் ஈட்டியது' : 'Lifetime Earned'}
            </span>
          </div>
          <div className="font-heading text-4xl font-black text-[#0c263d]">
            {summary.totalEarned} <span className="text-lg font-normal text-[#703616]">{language === 'ta' ? 'கடன்கள்' : 'Credits'}</span>
          </div>
          <p className="text-xs text-[#703616] pt-1">
            {language === 'ta' ? 'கற்பித்தல் & தொடக்க மானியம் மூலம் பெறப்பட்டது' : 'Earned by teaching mentees & starter grant'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#8a431c]">
            <ArrowDownLeft className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ta' ? 'மொத்தம் செலவிடப்பட்டது' : 'Lifetime Spent'}
            </span>
          </div>
          <div className="font-heading text-4xl font-black text-[#0c263d]">
            {summary.totalSpent} <span className="text-lg font-normal text-[#703616]">{language === 'ta' ? 'கடன்கள்' : 'Credits'}</span>
          </div>
          <p className="text-xs text-[#703616] pt-1">
            {language === 'ta' ? 'நிபுணர்களிடம் கற்க முதலீடு செய்யப்பட்டது' : 'Invested into receiving 1-on-1 expert coaching'}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-6 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#0c263d] flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-[#8a431c]" />
          <span>{language === 'ta' ? 'நேரலை தணிக்கைக் கணக்கேடு' : 'Real-Time Audit Ledger'}</span>
        </h2>

        {summary.transactions && summary.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6efe3] text-[#8a431c] uppercase font-bold text-[10px] tracking-wider border-b border-[#ebe0ce]">
                <tr>
                  <th className="py-3 px-4">{language === 'ta' ? 'பரிவர்த்தனை எண்' : 'Transaction ID'}</th>
                  <th className="py-3 px-4">{language === 'ta' ? 'வகை' : 'Type'}</th>
                  <th className="py-3 px-4">{language === 'ta' ? 'விளக்கம்' : 'Description'}</th>
                  <th className="py-3 px-4">{language === 'ta' ? 'அளவு' : 'Amount'}</th>
                  <th className="py-3 px-4">{language === 'ta' ? 'நேரம்' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe0ce]">
                {summary.transactions.map((tx: TimeCreditTransaction) => (
                  <tr key={tx.id} className="hover:bg-[#fcfaf6] transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#703616]/70">{tx.id}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.amount > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#0c263d] font-medium">{tx.description}</td>
                    <td className={`py-3 px-4 font-heading font-black text-sm ${
                      tx.amount > 0 ? 'text-emerald-700' : 'text-[#8a431c]'
                    }`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                    <td className="py-3 px-4 text-[#703616] text-[11px]">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-[#703616]">
            <Clock className="w-8 h-8 text-[#ded0bb] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#0c263d]">
              {language === 'ta' ? 'பரிவர்த்தனைகள் எதுவும் இன்னும் பதிவு செய்யப்படவில்லை' : 'No transactions recorded yet'}
            </p>
          </div>
        )}
      </div>

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-[#0c263d]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcfaf6] rounded-2xl border border-[#ebe0ce] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#ebe0ce]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
                  {language === 'ta' ? 'சக ஊழியர் பரிமாற்றம்' : 'Peer Economy'}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#0c263d]">
                  {language === 'ta' ? 'நேரக் கடன்களை மாற்றுதல்' : 'Transfer Time Credits'}
                </h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-[#8a431c] hover:text-[#0c263d] font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                  {language === 'ta' ? 'பெறுநர் பயனர் ID *' : 'Recipient User ID *'}
                </label>
                <input
                  type="text"
                  required
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="e.g. usr_sarah_mentor"
                  className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                  {language === 'ta' ? 'அளவு (மணிநேரம் / கடன்கள்) *' : 'Amount (Hours / Credits) *'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={summary.balance || 10}
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                  {language === 'ta' ? 'பரிமாற்றக் குறிப்பு' : 'Transfer Note'}
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder={language === 'ta' ? 'வழிகாட்டல் அமர்வுக்கான பாராட்டு' : 'Appreciation for mentoring session'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#ded0bb] text-xs font-bold text-[#703616] hover:bg-[#f6efe3] cursor-pointer"
                >
                  {t('action.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0c263d] to-[#8a431c] hover:opacity-95 text-white text-xs font-bold shadow disabled:opacity-50 cursor-pointer"
                >
                  {isTransferring ? (language === 'ta' ? 'பரிமாற்றம் செய்யப்படுகிறது...' : 'Transferring...') : (language === 'ta' ? 'கடன்களை அனுப்புக' : 'Send Credits')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
