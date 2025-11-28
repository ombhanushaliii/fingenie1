"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    Send, Sparkles, User, Bot, Mic, Image as ImageIcon,
    Plus, Folder, Settings, MessageSquare, ChevronDown, PanelLeftClose
} from "lucide-react";
import UserAvatar from "./UserAvatar";
import TypingIndicator from "./TypingIndicator";
import ShootingStars from "@/components/ui/shooting-stars";
import StarBackground from "@/components/ui/stars-background";

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
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            role: "user",
            content: "I'm working on the Problem slide for my pitch deck. Can you help me make it more visual?"
        },
        {
            id: 2,
            role: "assistant",
            content: "Of course! A strong visual can really make the problem resonate.\n\nHere's a concept you might like:\n\n**Imagine a freelancer at a chaotic desk, overwhelmed by multiple floating tools — invoices, chats, spreadsheets, payment apps — all fighting for attention.**"
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now(), role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulate bot delay
        setTimeout(() => {
            const botMsg: Message = {
                id: Date.now() + 1,
                role: "assistant",
                content: "I'm processing your request. This is a simulated response to demonstrate the UI animations and markdown rendering.\n\n```javascript\nconsole.log('Hello Fingenie!');\n```\n\n- Point 1\n- Point 2"
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 2000);
    };

    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-gray-100 font-sans overflow-hidden">

            {/* Sidebar */}
            <div className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col z-20">
                {/* Sidebar Header */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-white" />
                        <span className="font-semibold text-sm tracking-wide text-white">Fingenie</span>
                    </div>
                    <button className="text-gray-500 hover:text-white transition-colors">
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="px-3 mb-6">
                    <button className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white py-2.5 rounded-lg border border-white/5 transition-all duration-200 shadow-sm group">
                        <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        <span className="text-sm font-medium">New Chat</span>
                    </button>
                </div>

                {/* Workspace List */}
                <div className="flex-1 overflow-y-auto px-3 space-y-1">
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
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-2 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                        <UserAvatar />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">User</p>
                            <p className="text-xs text-gray-500 truncate">Pro Plan</p>
                        </div>
                        <Settings className="w-4 h-4 text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative flex flex-col min-w-0">
                {/* Background Animations */}
                <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
                    <ShootingStars />
                    <StarBackground starDensity={0.0002} allStarsTwinkle={true} twinkleProbability={0.8} minTwinkleSpeed={0.6} maxTwinkleSpeed={1.2} />
                </div>

                {/* Chat Container */}
                <div className="flex-1 overflow-y-auto scrollbar-hide z-10 relative w-full">
                    <div className="max-w-3xl mx-auto px-4 pt-10 pb-40 min-h-full flex flex-col justify-end">
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
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-sm">
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

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start pl-14 mb-8"
                            >
                                <TypingIndicator />
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none">
                    <div className="max-w-3xl mx-auto pointer-events-auto">
                        {/* Input Pill */}
                        <div className="relative w-full">
                            <div className="relative flex items-center bg-[#1a1a1a]/90 backdrop-blur-xl rounded-[32px] ring-1 ring-white/10 focus-within:ring-white/20 p-2 shadow-2xl shadow-black/50 transition-all duration-200 group">
                                <button className="p-3 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/5">
                                    <ImageIcon className="w-5 h-5" />
                                </button>

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
                                    className="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 px-4 py-3 resize-none max-h-[200px] scrollbar-hide text-[15px] leading-relaxed"
                                />

                                <div className="flex items-center gap-3 pr-1">
                                    <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/5">
                                        <Mic className="w-5 h-5" />
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSend}
                                        disabled={!input.trim()}
                                        className={`p-2 rounded-full transition-all duration-200 ${input.trim()
                                                ? "bg-white text-black shadow-lg shadow-white/10"
                                                : "bg-[#2a2a2a] text-gray-600 cursor-not-allowed"
                                            }`}
                                    >
                                        <Send className="w-5 h-5 ml-0.5" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>

                        {/* Pre-prompts (Below Input) */}
                        {messages.length < 3 && (
                            <div className="flex gap-2 overflow-x-auto pt-4 pb-2 scrollbar-hide justify-center">
                                {PRE_PROMPTS.map((prompt, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ scale: 1.02, backgroundColor: "#222" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setInput(prompt)}
                                        className="whitespace-nowrap px-4 py-2 bg-[#1a1a1a]/80 backdrop-blur-md border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-colors duration-200 shadow-sm"
                                    >
                                        {prompt}
                                    </motion.button>
                                ))}
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
    );
}
