import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, BookOpen, Sparkles } from 'lucide-react';
import { SOUND_THEMES } from '@/utils/constants';

const QUICK_PROMPTS = [
    "Who are the main characters?",
    "Summarize the plot so far",
    "What are the key themes?",
];

const BookCompanionChat = ({ book, currentTheme, open, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const panelRef = useRef(null);

    const themeUI = SOUND_THEMES[currentTheme]?.ui || {};
    const accent = themeUI.accent || '#A68A64';
    const textColor = themeUI.text || '#2C2A27';
    const paperBg = themeUI.paper || 'rgba(255, 255, 255, 0.95)';
    const isDarkTheme = ['Horror', 'SciFi', 'Cyberpunk', 'Storm', 'Thriller', 'Epic'].includes(currentTheme);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    const sendMessage = useCallback(async (question) => {
        if (!question.trim() || isStreaming) return;

        const userMsg = { role: 'user', content: question.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsStreaming(true);

        // Add a placeholder for the assistant response
        const assistantMsgIndex = messages.length + 1;
        setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

        try {
            const token = localStorage.getItem('session_token');
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                credentials: 'include',
                body: JSON.stringify({
                    book_id: book.book_id,
                    question: question.trim(),
                    history: messages.filter(m => !m.streaming).map(m => ({ role: m.role, content: m.content })),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.text) {
                                fullText += data.text;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[assistantMsgIndex] = { role: 'assistant', content: fullText, streaming: true };
                                    return updated;
                                });
                            }
                            if (data.done) {
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[assistantMsgIndex] = { role: 'assistant', content: fullText, streaming: false };
                                    return updated;
                                });
                            }
                            if (data.error) {
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[assistantMsgIndex] = {
                                        role: 'assistant',
                                        content: data.error,
                                        streaming: false,
                                        error: true,
                                    };
                                    return updated;
                                });
                                setIsStreaming(false);
                                return; // Stop processing
                            }
                        } catch (parseErr) {
                            // Skip malformed lines
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => {
                const updated = [...prev];
                updated[assistantMsgIndex] = {
                    role: 'assistant',
                    content: error.message || "I couldn't reach my thoughts right now. Please try again in a moment.",
                    streaming: false,
                    error: true,
                };
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    }, [book, messages, isStreaming]);

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Chat Panel */}
            <div
                ref={panelRef}
                className="fixed z-50 bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto md:w-[400px] 
                   flex flex-col animate-in slide-in-from-bottom-8 duration-300"
                style={{
                    maxHeight: '75vh',
                    borderRadius: '20px 20px 0 0',
                    backgroundColor: paperBg,
                    boxShadow: `0 -8px 40px rgba(0,0,0,0.15)`,
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 border-b shrink-0"
                    style={{ borderColor: accent + '30' }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: accent + '20' }}>
                            <BookOpen className="w-4 h-4" style={{ color: accent }} />
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold text-sm truncate" style={{ color: textColor, fontFamily: 'Playfair Display, serif' }}>
                                Ask the Book
                            </div>
                            <div className="text-[10px] truncate opacity-60" style={{ color: textColor }}>
                                {book?.title}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80 shrink-0"
                        style={{ backgroundColor: accent + '15', color: textColor }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0" style={{ scrollbarWidth: 'none' }}>
                    {messages.length === 0 && (
                        <div className="text-center py-8">
                            <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-30" style={{ color: accent }} />
                            <p className="text-sm font-medium mb-1" style={{ color: textColor, fontFamily: 'Playfair Display, serif' }}>
                                Your Literary Companion
                            </p>
                            <p className="text-xs opacity-50 mb-6" style={{ color: textColor }}>
                                Ask anything about "{book?.title}"
                            </p>

                            {/* Quick Prompts */}
                            <div className="space-y-2">
                                {QUICK_PROMPTS.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(prompt)}
                                        disabled={isStreaming}
                                        className="w-full text-left px-4 py-3 rounded-xl text-xs border transition-all active:scale-[0.98] disabled:opacity-50"
                                        style={{
                                            borderColor: accent + '30',
                                            color: textColor,
                                            fontFamily: 'Lora, serif',
                                        }}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div
                                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'rounded-2xl rounded-br-md'
                                    : 'rounded-2xl rounded-bl-md'
                                    } ${msg.error ? 'opacity-60' : ''}`}
                                style={{
                                    backgroundColor: msg.role === 'user'
                                        ? accent
                                        : (isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'),
                                    color: msg.role === 'user'
                                        ? (isDarkTheme ? '#1e293b' : 'white')
                                        : textColor,
                                    fontFamily: 'Lora, serif',
                                }}
                            >
                                {msg.content}
                                {msg.streaming && !msg.content && (
                                    <div className="flex items-center gap-1.5 py-1">
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent, animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent, animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent, animationDelay: '300ms' }} />
                                    </div>
                                )}
                                {msg.streaming && msg.content && (
                                    <span className="inline-block w-1 h-4 ml-0.5 animate-pulse" style={{ backgroundColor: accent }} />
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    className="shrink-0 flex items-center gap-2 px-4 py-3 border-t"
                    style={{ borderColor: accent + '20' }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about the book..."
                        disabled={isStreaming}
                        className="flex-1 py-3 px-4 rounded-xl text-sm border-none outline-none disabled:opacity-50"
                        style={{
                            backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                            color: textColor,
                            fontFamily: 'Lora, serif',
                            minHeight: '44px',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isStreaming}
                        className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 shrink-0 disabled:opacity-30"
                        style={{
                            backgroundColor: accent,
                            color: isDarkTheme ? '#1e293b' : 'white',
                        }}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </>
    );
};

export default BookCompanionChat;
