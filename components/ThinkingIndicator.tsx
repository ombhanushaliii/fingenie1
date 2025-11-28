import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';

export const THINKING_PHRASES = [
    "Analyzing your request...",
    "Thinking...",
    "Processing...",
    "Understanding context...",
    "Generating response..."
];

interface ThinkingIndicatorProps {
    thinkingPhraseIndex: number;
}

export default function ThinkingIndicator({ thinkingPhraseIndex }: ThinkingIndicatorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start mb-8"
        >
            <div className="flex max-w-[85%] gap-4">
                {/* Avatar */}
                <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-sm">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                </div>

                {/* Skeleton Loading */}
                <div className="space-y-3 flex-1 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap h-6">
                        <div className="flex gap-1">
                            <motion.div
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-1 h-1 bg-blue-400 rounded-full"
                            />
                            <motion.div
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                className="w-1 h-1 bg-blue-400 rounded-full"
                            />
                            <motion.div
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                                className="w-1 h-1 bg-blue-400 rounded-full"
                            />
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={thinkingPhraseIndex}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.3 }}
                                className="italic"
                            >
                                {THINKING_PHRASES[thinkingPhraseIndex]}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
