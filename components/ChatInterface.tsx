"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Send, Sparkles, User, Bot } from "lucide-react";
import UserAvatar from "./UserAvatar";
import TypingIndicator from "./TypingIndicator";

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
        <div className="flex flex-col h-screen max-w-5xl mx-auto px-4 relative bg-[#040404] text-white font-sans">
            {/* Header */}
            <header className="flex justify-between items-center py-6 border-b border-white/5 backdrop-blur-md sticky top-0 z-10 bg-[#040404]/80">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-[#2d8cff] to-[#6ec0ff] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Fingenie</h1>
                        <p className="text-xs text-gray-400">AI Financial Assistant</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-[#171717] px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#2d8cff] rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-400 font-medium">Online</span>
                    </div>
                    <UserAvatar />
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto py-8 space-y-6 scrollbar-hide px-2">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`flex max-w-3xl gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                {/* Avatar */}
                                <div className="shrink-0 mt-1">
                                    {msg.role === "user" ? (
                                        <div className="w-8 h-8 rounded-full bg-[#171717] border border-white/10 flex items-center justify-center">
                                            <User className="w-4 h-4 text-gray-400" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#2d8cff] to-[#6ec0ff] flex items-center justify-center shadow-md">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div
                                    className={`p-5 rounded-2xl shadow-sm ${msg.role === "user"
                                        ? "bg-[#171717] text-white border border-white/5 rounded-tr-none"
                                        : "bg-transparent text-gray-200 rounded-tl-none"
                                        }`}
                                >
                                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
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
                                                        <code className="bg-white/10 rounded px-1 py-0.5 text-blue-300" {...props}>
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
                        className="flex justify-start pl-12"
                    >
                        <TypingIndicator />
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="pb-8 pt-4 bg-[#040404]">
                {/* Pre-prompts */}
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-2 px-1">
                    {PRE_PROMPTS.map((prompt, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ scale: 1.02, backgroundColor: "#222" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setInput(prompt)}
                            className="whitespace-nowrap px-4 py-2 bg-[#171717] border border-white/5 rounded-full text-sm text-gray-400 hover:text-white transition-colors duration-200 shadow-sm"
                        >
                            {prompt}
                        </motion.button>
                    ))}
                </div>

                {/* Input Field */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-linear-to-r from-[#2d8cff] to-[#6ec0ff] rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur-md"></div>
                    <div className="relative flex items-end bg-[#0a0a0a] rounded-2xl border border-white/10 p-2 shadow-xl">
                        <button className="p-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
                            <Sparkles className="w-5 h-5" />
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
                            placeholder="Ask me something..."
                            rows={1}
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 px-4 py-3 resize-none max-h-[200px] scrollbar-hide"
                        />

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className={`p-3 rounded-xl transition-all duration-200 ${input.trim()
                                ? "bg-[#2d8cff] text-white shadow-lg shadow-blue-500/20"
                                : "bg-[#171717] text-gray-500 cursor-not-allowed"
                                }`}
                        >
                            <Send className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>

                <div className="text-center mt-4">
                    <p className="text-xs text-gray-600">
                        Fingenie can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    );
}
