"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Send, Sparkles, User, Bot, Mic, Image as ImageIcon } from "lucide-react";
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
        <div className="flex flex-col h-screen w-full relative bg-[#0a0a0a] text-gray-100 font-sans overflow-hidden">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 py-4 px-6 flex justify-between items-center z-20">
                <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-sm tracking-wide text-gray-300">Fingenie</span>
                </div>
                <UserAvatar />
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide w-full">
                <div className="max-w-3xl mx-auto px-4 pt-24 pb-40 min-h-full flex flex-col justify-end">
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
                                            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center">
                                                <User className="w-4 h-4 text-gray-400" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <Bot className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div
                                        className={`px-6 py-4 rounded-3xl shadow-sm leading-relaxed text-[15px] ${msg.role === "user"
                                                ? "bg-[#1a1a1a] text-gray-100 border border-white/5"
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
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-linear-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent z-10">
                <div className="max-w-3xl mx-auto">
                    {/* Pre-prompts */}
                    {messages.length < 3 && (
                        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide justify-center mb-2 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {PRE_PROMPTS.map((prompt, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.02, backgroundColor: "#222" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setInput(prompt)}
                                    className="whitespace-nowrap px-4 py-2 bg-[#1a1a1a] border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-colors duration-200"
                                >
                                    {prompt}
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {/* Input Pill */}
                    <div className="relative w-full max-w-3xl mx-auto">
                        <div className="relative flex items-center bg-[#1a1a1a] rounded-[32px] ring-1 ring-white/10 focus-within:ring-white/20 p-2 shadow-lg shadow-black/20 transition-all duration-200">
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
