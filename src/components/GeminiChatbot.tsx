import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Send,
  X,
  RefreshCw,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Flame,
  Gift,
  HeartPulse,
  UtensilsCrossed,
  Info,
  Loader2,
  Sparkle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resolveProductImage } from '../utils/productImageResolver';
import { Product } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelUsed?: string;
  recommendedProductIds?: string[];
}

export type BotRole = 'sommelier' | 'health' | 'gifting' | 'culinary';
export type BotModel = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';

const ROLE_PRESETS = [
  {
    id: 'sommelier' as BotRole,
    label: 'AI Sommelier',
    icon: Sparkles,
    desc: 'Expert guide on harvests, grading, aroma & origins',
    color: 'from-amber-600 to-amber-700',
  },
  {
    id: 'health' as BotRole,
    label: 'Health & Wellness',
    icon: HeartPulse,
    desc: 'Ayurvedic nutrition, heart health & immunity routines',
    color: 'from-emerald-600 to-emerald-700',
  },
  {
    id: 'gifting' as BotRole,
    label: 'Royal Gifting',
    icon: Gift,
    desc: 'Custom hampers, corporate gifts & festive collections',
    color: 'from-purple-600 to-purple-700',
  },
  {
    id: 'culinary' as BotRole,
    label: 'Culinary Recipes',
    icon: UtensilsCrossed,
    desc: 'Authentic pairing, biryani, kheer & spice secrets',
    color: 'from-orange-600 to-orange-700',
  },
];

const STARTER_PROMPTS = [
  {
    role: 'sommelier' as BotRole,
    prompt: 'What makes Iranian Mamra Almonds better than regular California almonds?',
    badge: 'Harvest Grade',
  },
  {
    role: 'sommelier' as BotRole,
    prompt: 'How can I identify 100% pure Kashmiri Mongra Grade A1 Saffron (Kesar)?',
    badge: 'GI Tag Quality',
  },
  {
    role: 'gifting' as BotRole,
    prompt: 'Recommend an exquisite handcrafted dry fruit gift box under ₹3,000 for a wedding.',
    badge: 'Royal Gifting',
  },
  {
    role: 'health' as BotRole,
    prompt: 'What is the ideal daily morning routine of soaked nuts and seeds for heart & brain power?',
    badge: 'Wellness',
  },
  {
    role: 'culinary' as BotRole,
    prompt: 'How do I brew royal Saffron Kahwa tea using your whole cardamom and Kashmiri almonds?',
    badge: 'Royal Recipe',
  },
];

export const GeminiChatbot: React.FC = () => {
  const { products, setQuickViewProduct, formatPrice, addToCart, showToast, isChatbotOpen, setIsChatbotOpen } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('baagfresh_gemini_chat_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading chat history', e);
    }
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: 'Namaste! Welcome to BAAGFRESH Royal Concierge. I am your personal Dry Fruits, Spices & Gifting Sommelier. How may I guide your palate and wellness today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProductIds: ['mamra-almonds', 'kashmiri-saffron', 'festive-wooden-box'],
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<BotRole>('sommelier');
  const [activeModel, setActiveModel] = useState<BotModel>('gemini-3.5-flash');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isChatbotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatbotOpen, isLoading]);

  // Persist conversation history
  useEffect(() => {
    try {
      localStorage.setItem('baagfresh_gemini_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save chat history', e);
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isChatbotOpen) {
      setHasUnread(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isChatbotOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call server-side API proxy for Gemini
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          role: activeRole,
          model: activeModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: data.text || 'Namaste! How else may I assist your royal order with BaagFresh?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || activeModel,
        recommendedProductIds: data.recommendedProductIds || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (!isChatbotOpen) {
        setHasUnread(true);
      }
    } catch (error: any) {
      console.warn('Chat API error, fallback:', error);
      // Helpful fallback response
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: `Namaste! Regarding your query on "${text}":\n\n• **Royal Iranian Mamra Almonds** [PRODUCT:mamra-almonds] and **Grade A1 Kashmiri Saffron** [PRODUCT:kashmiri-saffron] are 100% natural, farm-tested harvests.\n• For festive gifting, explore the **Shahi Festive Wooden Box** [PRODUCT:festive-wooden-box].\n\n*Our concierge is available on WhatsApp / Call at +91 87076 71319.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'local-concierge',
        recommendedProductIds: ['mamra-almonds', 'kashmiri-saffron', 'festive-wooden-box'],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const defaultMsg: ChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      role: 'assistant',
      text: 'Conversation reset. Welcome back to BAAGFRESH Royal Concierge! Ask me anything about our Kashmiri saffron, Mamra almonds, royal spices, or custom hampers.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recommendedProductIds: ['mamra-almonds', 'kashmiri-saffron'],
    };
    setMessages([defaultMsg]);
    showToast('Chat history cleared', 'info');
  };

  const handleCopyText = (id: string, text: string) => {
    // Strip [PRODUCT:xyz] tags when copying
    const cleanText = text.replace(/\[PRODUCT:[a-z0-9-]+\]/gi, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    showToast('Copied answer to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech synthesis not supported in this browser.', 'info');
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/\[PRODUCT:[a-z0-9-]+\]/gi, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  // Find product by id from product list
  const getProductById = (id: string): Product | undefined => {
    return products.find(
      (p) =>
        p.id.toLowerCase() === id.toLowerCase() ||
        p.name.toLowerCase().replace(/[^a-z0-9]/g, '-').includes(id.toLowerCase())
    );
  };

  // Parse and render formatted text
  const renderMessageContent = (text: string) => {
    // Strip product tags from plain text as they are rendered separately as cards
    const cleanText = text.replace(/\[PRODUCT:[a-z0-9-]+\]/gi, '');

    const lines = cleanText.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
            const content = line.trim().replace(/^[•\-*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-[#c79a1f] dark:text-[#fed65b] font-bold text-sm shrink-0 mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatBoldAndItalic(content) }} />
              </div>
            );
          }

          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: formatBoldAndItalic(line) }}
              className="text-slate-800 dark:text-slate-100"
            />
          );
        })}
      </div>
    );
  };

  const formatBoldAndItalic = (text: string) => {
    // replace **bold** with <strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#012d1d] dark:text-[#fed65b]">$1</strong>');
    // replace *italic* with <em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="text-slate-500 dark:text-slate-300 italic">$1</em>');
    return formatted;
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isChatbotOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 animate-bounce-subtle">
          {hasUnread && (
            <div className="bg-[#012d1d] text-[#fed65b] border border-[#fed65b] px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
              1 New Recommendation!
            </div>
          )}
          <button
            id="gemini-chatbot-launcher-btn"
            onClick={() => setIsChatbotOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-[#012d1d] via-[#163a2c] to-[#012d1d] text-[#fed65b] rounded-full shadow-2xl hover:shadow-[0_10px_25px_rgba(254,214,91,0.35)] border-2 border-[#fed65b] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Chat with Us"
          >
            <div className="relative shrink-0">
              <img
                src="/support-agent-avatar.svg"
                alt="Support Agent"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-[#fed65b]/60 bg-white p-0.5 shadow-sm group-hover:scale-110 transition-transform"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#012d1d] animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#012d1d]" />
            </div>
            <div className="text-left pr-1">
              <span className="block text-xs font-cinzel font-black tracking-wider uppercase">
                Chat with Us
              </span>
              <span className="block text-[9px] text-[#fed65b]/80 font-medium">
                Online • AI & Live Support
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Main Chatbot Interface Dialog / Drawer */}
      {isChatbotOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isExpanded
              ? 'inset-2 sm:inset-6 flex flex-col bg-white dark:bg-[#07130d] rounded-3xl shadow-2xl border border-[#d6caba] dark:border-[#275943] overflow-hidden'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[440px] h-[600px] max-h-[88vh] flex flex-col bg-white dark:bg-[#07130d] rounded-3xl shadow-2xl border-2 border-[#fed65b]/80 dark:border-[#fed65b]/50 overflow-hidden'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#012d1d] via-[#163a2c] to-[#012d1d] text-[#FAF3E0] px-4 py-3.5 flex items-center justify-between border-b border-[#fed65b]/30 shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src="/support-agent-avatar.svg"
                  alt="Support Agent"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#fed65b] bg-white p-0.5 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute 0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#012d1d]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-cinzel text-sm font-bold text-white tracking-wide">
                    BAAGFRESH Concierge
                  </h3>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#fed65b] text-[#012d1d]">
                    Gemini AI
                  </span>
                </div>
                <p className="text-[10px] text-[#fed65b]/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Online • Dry Fruits, Spices & Support Sommelier
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 text-slate-300 hover:text-[#fed65b] hover:bg-[#1b4332] rounded-lg transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-300 hover:text-[#fed65b] hover:bg-[#1b4332] rounded-lg transition-colors hidden sm:block"
                title={isExpanded ? 'Minimize' : 'Expand full view'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsChatbotOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-red-950/40 rounded-lg transition-colors"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Role & Persona Switcher Bar */}
          <div className="bg-amber-50/60 dark:bg-[#0c2017] px-3 py-2 border-b border-[#d6caba]/60 dark:border-[#1b4332] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
            <div className="flex items-center gap-1.5">
              {ROLE_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isActive = activeRole === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setActiveRole(preset.id);
                      showToast(`Switched persona to ${preset.label}`, 'info');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#012d1d] text-[#fed65b] shadow-sm border border-[#fed65b]/50'
                        : 'bg-white/80 dark:bg-[#162f22] text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-[#1d3d2c] border border-slate-200 dark:border-[#275943]'
                    }`}
                    title={preset.desc}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Model Select */}
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value as BotModel)}
              className="text-[10px] font-bold bg-white dark:bg-[#162f22] text-[#012d1d] dark:text-[#fed65b] border border-slate-300 dark:border-[#275943] rounded-lg px-2 py-1 focus:outline-none shrink-0"
              title="Select Gemini Engine"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
            </select>
          </div>

          {/* Conversation Thread */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-[#07130d]">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 border ${
                      isUser
                        ? 'bg-[#012d1d] text-[#fed65b] border-[#fed65b]/40'
                        : 'bg-gradient-to-br from-[#fed65b] to-[#c79a1f] text-[#012d1d] border-[#012d1d]/20 shadow-xs'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] sm:max-w-[80%] space-y-2`}>
                    <div
                      className={`p-3.5 rounded-2xl shadow-sm text-left ${
                        isUser
                          ? 'bg-[#012d1d] text-white rounded-tr-none border border-[#1b4332]'
                          : 'bg-white dark:bg-[#11241a] text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-[#275943]'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-xs sm:text-sm font-medium">{msg.text}</p>
                      ) : (
                        renderMessageContent(msg.text)
                      )}

                      {/* Message Footer Actions */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-[#1b4332] text-[10px] text-slate-400">
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <div className="flex items-center gap-2">
                            {msg.modelUsed && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#193828] text-slate-500 dark:text-slate-300 font-mono">
                                {msg.modelUsed.replace('gemini-', '')}
                              </span>
                            )}
                            <button
                              onClick={() => handleToggleSpeech(msg.id, msg.text)}
                              className="p-1 hover:text-[#012d1d] dark:hover:text-[#fed65b] transition-colors"
                              title="Listen aloud"
                            >
                              {speakingId === msg.id ? (
                                <VolumeX className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopyText(msg.id, msg.text)}
                              className="p-1 hover:text-[#012d1d] dark:hover:text-[#fed65b] transition-colors"
                              title="Copy answer"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interactive Product Recommendations Cards */}
                    {msg.recommendedProductIds && msg.recommendedProductIds.length > 0 && (
                      <div className="pt-1 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                          Recommended Harvests
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {msg.recommendedProductIds.map((pId) => {
                            const product = getProductById(pId);
                            if (!product) return null;
                            const mainImg = resolveProductImage(product);
                            return (
                              <div
                                key={product.id}
                                className="p-2.5 rounded-xl bg-white dark:bg-[#142e21] border border-amber-200/70 dark:border-[#275943] shadow-xs flex items-center justify-between gap-3 hover:border-[#fed65b] transition-all"
                              >
                                <div
                                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                                  onClick={() => setQuickViewProduct(product)}
                                >
                                  <img
                                    src={mainImg}
                                    alt={product.name}
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-[#275943] shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-[#012d1d] dark:text-[#fed65b] truncate">
                                      {product.name}
                                    </h4>
                                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                      {formatPrice(product.basePrice)}
                                      {product.packOptions?.[0] && (
                                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                                          ({product.packOptions[0].weight})
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => setQuickViewProduct(product)}
                                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c402e] text-[11px] font-medium cursor-pointer"
                                    title="View Product Details"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const defaultWeight = product.packOptions?.[0]?.weight || '250g';
                                      addToCart(product, defaultWeight, 1);
                                      showToast(`Added ${product.name} to bag!`, 'success');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#012d1d] hover:bg-[#1b4332] text-[#fed65b] font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                                  >
                                    <ShoppingBag className="w-3 h-3" />
                                    <span>Bag</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing / Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5 animate-fadeIn">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#fed65b] to-[#c79a1f] text-[#012d1d] flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-none bg-white dark:bg-[#11241a] border border-slate-200 dark:border-[#275943] flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#012d1d] dark:text-[#fed65b]" />
                  <span>Consulting BaagFresh Sommelier...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="px-3 py-2 bg-slate-100/70 dark:bg-[#0a1d13] border-t border-slate-200 dark:border-[#1b4332] overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider shrink-0 flex items-center gap-1">
              <Sparkle className="w-2.5 h-2.5 text-[#c79a1f]" /> Quick:
            </span>
            {STARTER_PROMPTS.map((starter, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(starter.prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-[#162f22] hover:bg-amber-100 dark:hover:bg-[#1f4230] border border-slate-200 dark:border-[#275943] text-[10px] font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap transition-colors cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
              >
                {starter.badge}: {starter.prompt.slice(0, 32)}...
              </button>
            ))}
          </div>

          {/* Input Box Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-[#07130d] border-t border-slate-200 dark:border-[#275943] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask ${ROLE_PRESETS.find((r) => r.id === activeRole)?.label || 'AI Sommelier'}...`}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-slate-50 dark:bg-[#12271c] text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012d1d] disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 rounded-xl bg-[#012d1d] hover:bg-[#163a2c] text-[#fed65b] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-md active:scale-95"
              aria-label="Send message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
};
