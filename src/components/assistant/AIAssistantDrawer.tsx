import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Compass,
  Award,
  BookOpen
} from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: language === 'ta'
        ? `வணக்கம் ${user?.full_name || 'நண்பரே'}! நான் உங்கள் LearnX AI வழிகாட்டி. புதிய திறன் கற்றல், முன் அனுபவ அங்கீகாரம் (RPL) அல்லது சான்றுகள் பதிவேற்றம் தொடர்பாக உங்களுக்கு எவ்வாறு உதவ முடியும்?`
        : `Hello ${user?.full_name || 'there'}! I am your LearnX AI Intelligence Guide. Whether you are seeking a mentor in Path A, proving prior work experience in Path B, or preparing practical assessment evidence, how can I assist you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    setInput('');
    const newHistory = [...messages, { role: 'user' as const, content: text.trim() }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await apiRequest('/api/assistant/ask', {
        method: 'POST',
        body: JSON.stringify({ message: text.trim() })
      });

      setMessages([...newHistory, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      setMessages([...newHistory, {
        role: 'assistant',
        content: language === 'ta'
          ? 'மன்னிக்கவும், தகவல் பெறுவதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
          : 'Apologies, I encountered an issue retrieving guidance. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = language === 'ta' ? [
    'நிலை 4 சான்றிதழுக்கு சான்றுகளை எவ்வாறு தயார் செய்வது?',
    'நேரக் கடன்கள் எவ்வாறு செயல்படுகின்றன?',
    'எனது இலக்கிற்கான 4 வார பயிற்சி வரைபடம் கூறுங்கள்.',
    'முன் அனுபவ அங்கீகாரம் (RPL) எவ்வாறு செயல்படுகிறது?'
  ] : [
    'How should I prepare evidence for Level 4 certification?',
    'What is the difference between AI Assessed and Institution Verified?',
    'How do Time Credits work when I teach a peer?',
    'Suggest a 4-week practice roadmap for my learning goal.'
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#fcfaf6] border-l border-[#ebe0ce] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 theme-marine-brown">
      {/* Drawer Header */}
      <div className="p-4 bg-[#0c263d] text-white flex items-center justify-between shadow border-b border-[#194a73]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0d9488] via-[#123859] to-[#8a431c] flex items-center justify-center border border-[#f0a876]/40">
            <Sparkles className="w-4 h-4 text-[#f0a876]" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold">
              {language === 'ta' ? 'LearnX AI உதவியாளர்' : 'LearnX AI Intelligence'}
            </h3>
            <p className="text-[10px] text-[#f7cbac] font-semibold">
              {language === 'ta' ? 'மெரின் பிரவுன் சூழல் • சூழலறி நுண்ணறிவு' : 'Gemini 3.8 Flash • Context Aware'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#ded0bb] hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fcfaf6]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-[#0c263d] text-[#f0a876] border border-[#8a431c]/50 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#0c263d] text-white rounded-br-none'
                  : 'bg-white text-[#0c263d] border border-[#ebe0ce] rounded-bl-none shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-[#703616]">
            <div className="w-4 h-4 border-2 border-[#c4682e] border-t-transparent rounded-full animate-spin" />
            <span>{language === 'ta' ? 'தகவல் பகுப்பாய்வு செய்யப்படுகிறது...' : 'Analyzing your LearnX competency profile...'}</span>
          </div>
        )}
      </div>

      {/* Suggested Chips */}
      <div className="p-3 bg-[#f6efe3] border-t border-[#ebe0ce]">
        <p className="text-[10px] font-bold uppercase text-[#8a431c] mb-1.5">
          {language === 'ta' ? 'பரிந்துரைக்கப்பட்ட கேள்விகள்' : 'Recommended Questions'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[10px] font-medium px-2 py-1 rounded-lg bg-white hover:bg-[#ebe0ce] text-[#0c263d] border border-[#ebe0ce] transition cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-3 bg-white border-t border-[#ebe0ce] flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={language === 'ta' ? 'வழிகாட்டிகள், சான்றுகள் அல்லது சான்றிதழ்கள் பற்றி கேளுங்கள்...' : 'Ask about mentors, evidence, or certifications...'}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#ded0bb] bg-[#fcfaf6] text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-[#0c263d] hover:bg-[#123859] text-white text-xs font-bold transition flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-[#f0a876]" />
        </button>
      </form>
    </div>
  );
};

