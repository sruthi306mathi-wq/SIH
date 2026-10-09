import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import { Conversation, ChatMessage } from '../../types';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  Sparkles,
  CheckCheck
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const { user, onRealtimeEvent } = useAuth();
  const { language, t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest('/api/chat/conversations');
      setConversations(res.conversations || []);
      if (!activeConvId && res.conversations?.length > 0) {
        setActiveConvId(res.conversations[0].id);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await apiRequest(`/api/chat/conversations/${convId}/messages`);
      setMessages(res.messages || []);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to real-time incoming messages via SSE
  useEffect(() => {
    if (!onRealtimeEvent) return;
    const unsubscribe = onRealtimeEvent((eventName, payload) => {
      if (eventName === 'NEW_CHAT_MESSAGE') {
        if (payload.conversation_id === activeConvId) {
          setMessages(prev => [...prev, payload]);
        }
        fetchConversations();
      }
    });
    return unsubscribe;
  }, [onRealtimeEvent, activeConvId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await apiRequest(`/api/chat/conversations/${activeConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      setMessages(prev => [...prev, res.message]);
      fetchConversations();
    } catch (err: any) {
      alert(err.message || (language === 'ta' ? 'செய்தி அனுப்ப முடியவில்லை.' : 'Failed to send message.'));
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConvId);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 theme-marine-brown">
      {/* Header */}
      <div className="pb-4 border-b border-[#ebe0ce]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
          {language === 'ta' ? 'நேரலைத் தொடர்பு' : 'Real-Time Communication'}
        </span>
        <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
          {language === 'ta' ? 'நேரலை அரட்டை & வழிகாட்டல்' : 'Peer Learning Messenger'}
        </h1>
        <p className="text-sm text-[#703616] mt-1">
          {language === 'ta'
            ? 'மாணவர்கள் மற்றும் வழிகாட்டிகளிடையே நேரடி 1-on-1 செய்திப் பரிமாற்றம். நேரலை நிகழ்வுகள் மூலம் ஒருங்கிணைக்கப்படுகிறது.'
            : 'Direct 1-on-1 messaging between learners and mentors. Synchronized via real-time events.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#ebe0ce] shadow-sm flex flex-col md:flex-row h-[600px] overflow-hidden">
        {/* Left: Conversation List */}
        <div className="w-full md:w-80 border-r border-[#ebe0ce] flex flex-col">
          <div className="p-4 border-b border-[#ebe0ce] bg-[#f6efe3]">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0c263d]">
              {language === 'ta' ? 'உரையாடல்கள்' : 'Conversations'} ({conversations.length})
            </p>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-[#ebe0ce]">
            {conversations.length > 0 ? (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`w-full p-4 text-left flex items-start space-x-3 transition ${
                    activeConvId === c.id
                      ? 'bg-[#f6efe3] border-l-4 border-[#8a431c]'
                      : 'hover:bg-[#fcfaf6]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#0c263d] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {c.otherUserName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#0c263d] truncate">{c.otherUserName}</p>
                      <span className="text-[10px] text-[#8a431c]">
                        {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#703616] truncate mt-0.5">{c.lastMessage}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#8a431c] text-white text-[9px] font-bold flex items-center justify-center">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-[#703616]">
                <MessageSquare className="w-8 h-8 text-[#ded0bb] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#0c263d]">
                  {language === 'ta' ? 'உரையாடல்கள் எதுவும் இல்லை' : 'No conversations yet'}
                </p>
                <p className="text-[11px] text-[#703616] mt-1">
                  {language === 'ta' ? 'வழிகாட்டல் கோரிக்கையை ஏற்று அரட்டையைத் தொடங்குங்கள்.' : 'Accept a mentorship request to open a channel.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Message Stream */}
        <div className="flex-1 flex flex-col bg-[#fcfaf6]">
          {activeConversation ? (
            <>
              {/* Channel Header */}
              <div className="p-4 border-b border-[#ebe0ce] bg-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#8a431c] text-white flex items-center justify-center font-bold text-xs">
                    {activeConversation.otherUserName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[#0c263d]">
                      {activeConversation.otherUserName}
                    </h3>
                    <p className="text-[10px] text-[#0d9488] font-semibold">
                      {language === 'ta' ? 'நேரலை அரட்டை சேனல்' : 'Active Real-Time Channel'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#0c263d] text-white rounded-br-none'
                            : 'bg-white text-[#0c263d] border border-[#ebe0ce] rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p>{m.content}</p>
                      </div>
                      <span className="text-[9px] text-[#8a431c] mt-1 px-1">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#ebe0ce] flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={language === 'ta' ? 'செய்தியைத் தட்டச்சு செய்க...' : 'Type your message...'}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#ebe0ce] bg-[#fcfaf6] text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#0c263d] hover:bg-[#123859] text-white text-xs font-bold transition flex items-center space-x-1 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'அனுப்பு' : 'Send'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#703616]">
              <MessageSquare className="w-10 h-10 text-[#ded0bb] mb-2" />
              <p className="text-xs font-bold text-[#0c263d]">
                {language === 'ta' ? 'செய்தி அனுப்ப உரையாடலைத் தேர்ந்தெடுக்கவும்' : 'Select a conversation to start messaging'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
