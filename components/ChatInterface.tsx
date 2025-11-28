"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    Send, Sparkles, User, Bot, Mic, Image as ImageIcon,
    Plus, Folder, Settings, MessageSquare, ChevronDown, PanelLeftClose, X, LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";
import UserAvatar from "./UserAvatar";
import SignInModal from "./SignInModal";
import ThinkingIndicator, { THINKING_PHRASES } from "./ThinkingIndicator";
import ShootingStars from "@/components/ui/shooting-stars";
import StarBackground from "@/components/ui/stars-background";

// Type declarations for Speech Recognition API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

const PRE_PROMPTS = [
    "How should I invest my freelance income?",
    "What's a good savings plan for irregular income?",
    "Explain compound interest simply",
    "Best tax saving tips for gig workers"
];

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    image?: string; // base64 encoded image
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const { data: session, status } = useSession();
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [thinkingPhraseIndex, setThinkingPhraseIndex] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isTyping) {
            setThinkingPhraseIndex(0);
            return;
        }
        const interval = setInterval(() => {
            setThinkingPhraseIndex((prev) => (prev + 1) % THINKING_PHRASES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [isTyping]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    const transcript = event.results[0][0].transcript;
                    setInput((prev) => prev + transcript);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            } else {
                console.warn('Speech recognition not supported in this browser.');
            }
        }
    }, []);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setSelectedImage(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = async () => {
        if (status === "unauthenticated") {
            setIsSignInModalOpen(true);
            return;
        }
        if (!input.trim() && !selectedImage) return;

        const userMsg: Message = {
            id: Date.now(),
            role: "user",
            content: input,
            image: selectedImage || undefined
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsTyping(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    image: userMsg.image,
                    userId: session?.user?.email // Send explicit userId as backup
                }),
            });

            if (!res.ok) throw new Error('Failed to send message');

            // Poll for response
            const pollInterval = setInterval(async () => {
                try {
                    const pollUrl = session?.user?.email
                        ? `/api/chat?userId=${encodeURIComponent(session.user.email)}`
                        : '/api/chat';
                    const pollRes = await fetch(pollUrl);
                    const data = await pollRes.json();

                    if (data.messages && data.messages.length > 0) {
                        const lastMsg = data.messages[data.messages.length - 1];
                        if (lastMsg.sender === 'assistant' && lastMsg.timestamp > new Date(userMsg.id).toISOString()) {
                            setMessages((prev) => {
                                // Check if we already have this message to avoid duplicates
                                if (prev.some(m => m.content === lastMsg.text && m.role === 'assistant')) {
                                    return prev;
                                }
                                clearInterval(pollInterval);
                                setIsTyping(false);
                                return [...prev, {
                                    id: Date.now(),
                                    role: 'assistant',
                                    content: lastMsg.text
                                }];
                            });
                        }
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 2000);

            // Stop polling after 60 seconds to prevent infinite loops
            setTimeout(() => {
                clearInterval(pollInterval);
                setIsTyping(false);
            }, 60000);

        } catch (error) {
            console.error(error);
            setIsTyping(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-gray-100 font-sans overflow-hidden relative">

            {/* Background Animations - Fixed to prevent stretching */}
            <div className="fixed inset-0 z-0 bg-[#0a0a0a]">
                <ShootingStars />
                <StarBackground starDensity={0.0002} allStarsTwinkle={true} twinkleProbability={0.8} minTwinkleSpeed={0.6} maxTwinkleSpeed={1.2} />
            </div>

            {/* Sidebar */}
            <motion.div
                initial={{ width: 256, opacity: 1 }}
                animate={{
                    width: isSidebarOpen ? 256 : 0,
                    opacity: isSidebarOpen ? 1 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-[#0a0a0a] border-r border-white/5 flex flex-col z-20 overflow-hidden shrink-0"
            >
                {/* Sidebar Header (Visible when open) */}
                <div className="flex items-start pt-3 pl-2 pr-4 min-w-[256px] justify-between">
                    <div className="-mt-3 w-15 h-15 relative shrink-0">
                        <img
                            src="/logo.png"
                            alt="Fingenie"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-[#1a1a1a] rounded-lg mt-1"
                        aria-label="Close sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="px-3 mb-6 min-w-[256px]">
                    <button className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white py-2.5 rounded-lg border border-white/5 transition-all duration-200 shadow-sm group">
                        <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        <span className="text-sm font-medium">New Chat</span>
                    </button>
                </div>

                {/* Workspace List */}
                <div className="flex-1 overflow-y-auto px-3 space-y-1 min-w-[256px]">
                    <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workspace
                    </div>
                    {["New Project", "Pricing Section", "Design Guidelines", "Design Brief", "Marketing"].map((item, i) => (
                        <button
                            key={i}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors group"
                        >
                            <Folder className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                            <span>{item}</span>
                        </button>
                    ))}
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-white/5 min-w-[256px]">
                    {status === "authenticated" ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="w-full flex items-center gap-3 px-2 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-white/10">
                                    {session.user?.image ? (
                                        <img
                                            src={session.user.image}
                                            alt={session.user?.name || "User"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-medium text-white">
                                            {session.user?.name?.[0] || "U"}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {session.user?.name || "User"}
                                    </p>

                                </div>
                                <Settings className="w-4 h-4 text-gray-500" />
                            </button>

                            {/* User Menu Dropdown */}
                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute bottom-full left-0 w-full mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                                        >
                                            <div className="p-1">
                                                <button
                                                    onClick={() => signOut()}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsSignInModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 relative flex flex-col min-w-0 z-10">

                {/* Open Sidebar Button */}
                <AnimatePresence>
                    {!isSidebarOpen && (
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsSidebarOpen(true)}
                            className="absolute top-4 left-4 z-50 p-1.5 text-gray-500 hover:text-white bg-[#1a1a1a]/50 hover:bg-[#1a1a1a] backdrop-blur-md rounded-lg border border-white/5 transition-colors"
                        >
                            <PanelLeftClose className="w-4 h-4 rotate-180" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Main Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30">
                    <motion.div
                        animate={{ x: isSidebarOpen ? 0 : 44 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex items-center gap-2"
                    >
                        <span className="font-semibold text-lg tracking-tight text-white/90">FinGenie</span>
                    </motion.div>
                </div>

                {/* Chat Container */}
                <div className="flex-1 overflow-y-auto scrollbar-hide z-10 relative w-full">
                    <div className="max-w-3xl mx-auto px-4 pt-20 pb-40 min-h-full flex flex-col justify-end">
                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 pb-20">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="space-y-2"
                                >
                                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-b from-white to-white/40 tracking-tight">
                                        How can I help, {session?.user?.name?.split(' ')[0] || 'User'}?
                                    </h1>
                                    <p className="text-gray-400 text-lg">
                                        Ready to analyze your finances.
                                    </p>
                                </motion.div>
                            </div>
                        ) : (
                            <AnimatePresence initial={false} mode="popLayout">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                                        className={`flex mb-8 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`flex max-w-[85%] gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                            {/* Avatar */}
                                            <div className="shrink-0 mt-1">
                                                {msg.role === "user" ? (
                                                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center shadow-sm">
                                                        <User className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-sm">
                                                        <Bot className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Message Bubble */}
                                            <div
                                                className={`px-6 py-4 rounded-3xl shadow-md leading-relaxed text-[15px] backdrop-blur-sm ${msg.role === "user"
                                                    ? "bg-[#1a1a1a]/80 text-gray-100 border border-white/5"
                                                    : "bg-transparent text-gray-200 pl-0"
                                                    }`}
                                            >
                                                {msg.image && (
                                                    <div className="mb-4">
                                                        <img
                                                            src={msg.image}
                                                            alt="Attached image"
                                                            className="max-w-full h-auto rounded-xl border border-white/10"
                                                        />
                                                    </div>
                                                )}
                                                <div className="prose prose-invert max-w-none prose-p:leading-7 prose-pre:bg-[#111] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            code({ node, inline, className, children, ...props }: { node?: any; inline?: boolean; className?: string; children?: React.ReactNode;[key: string]: any }) {
                                                                const match = /language-(\w+)/.exec(className || "");
                                                                return !inline && match ? (
                                                                    <SyntaxHighlighter
                                                                        style={vscDarkPlus}
                                                                        language={match[1]}
                                                                        PreTag="div"
                                                                        {...props}
                                                                    >
                                                                        {String(children).replace(/\n$/, "")}
                                                                    </SyntaxHighlighter>
                                                                ) : (
                                                                    <code className="bg-white/10 rounded px-1.5 py-0.5 text-blue-200 text-sm font-mono" {...props}>
                                                                        {children}
                                                                    </code>
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start mb-8"
                            >
                                <ThinkingIndicator thinkingPhraseIndex={thinkingPhraseIndex} />
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-linear-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none">
                    <div className="max-w-3xl mx-auto px-4 pointer-events-auto">
                        {/* Input Pill */}
                        <div className="relative w-full">
                            <div className="relative flex items-center bg-[#1a1a1a]/90 backdrop-blur-xl rounded-[32px] ring-1 ring-white/10 focus-within:ring-white/20 p-2 shadow-2xl shadow-black/50 transition-all duration-200 group">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/5"
                                    aria-label="Attach image"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    aria-label="Select image to attach"
                                />

                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Ask anything..."
                                    rows={1}
                                    className="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 px-4 py-2 resize-none max-h-[200px] scrollbar-hide text-[15px] leading-relaxed"
                                />

                                <div className="flex items-center gap-3 pr-1">
                                    <button
                                        onClick={isListening ? stopListening : startListening}
                                        className={`p-2 transition-colors rounded-full hover:bg-white/5 ${isListening ? 'text-red-400 hover:text-red-300' : 'text-gray-500 hover:text-white'}`}
                                        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                                    >
                                        <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSend}
                                        disabled={!input.trim() && !selectedImage}
                                        className={`p-2 rounded-full transition-all duration-200 ${(input.trim() || selectedImage)
                                            ? "bg-white text-black shadow-lg shadow-white/10"
                                            : "bg-[#2a2a2a] text-gray-600 cursor-not-allowed"
                                            }`}
                                    >
                                        <Send className="w-5 h-5 ml-0.5" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Image Preview */}
                            {selectedImage && (
                                <div className="relative w-full max-w-3xl mx-auto mt-4">
                                    <div className="relative inline-block">
                                        <img
                                            src={selectedImage}
                                            alt="Selected image"
                                            className="max-w-32 max-h-32 rounded-xl border border-white/10 object-cover"
                                        />
                                        <button
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                                            aria-label="Remove image"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Pre-prompts (Below Input) */}
                            {messages.length < 3 && (
                                <div className="relative w-full max-w-3xl mx-auto mt-4">
                                    {/* Vignette Overlay */}
                                    <div
                                        className="absolute inset-0 z-10 pointer-events-none"
                                        style={{
                                            background: "linear-gradient(to right, #0a0a0a 0%, transparent 2%, transparent 98%, #0a0a0a 100%)"
                                        }}
                                    />
                                    <div
                                        className="flex gap-2 overflow-x-auto pb-2 px-12 scrollbar-hide relative z-0"
                                        style={{
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none'
                                        }}
                                    >
                                        <style jsx>{`
                                        .scrollbar-hide::-webkit-scrollbar {
                                            display: none;
                                        }
                                    `}</style>
                                        {PRE_PROMPTS.map((prompt, i) => (
                                            <motion.button
                                                key={i}
                                                whileHover={{ scale: 1.02, backgroundColor: "#222" }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setInput(prompt)}
                                                className="whitespace-nowrap px-4 py-2 bg-[#1a1a1a]/80 backdrop-blur-md border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-colors duration-200 shadow-sm shrink-0"
                                            >
                                                {prompt}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="text-center mt-3">
                                <p className="text-[10px] text-gray-600 tracking-wide font-medium">
                                    FINGENIE MAY DISPLAY INACCURATE INFO
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <SignInModal
                isOpen={isSignInModalOpen}
                onClose={() => setIsSignInModalOpen(false)}
            />
        </div>
    );
}
