"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypingTitleProps {
    title: string;
    isTyping: boolean;
    startText?: string;
    onComplete?: () => void;
}

export default function TypingTitle({ title, isTyping, startText = "New Chat", onComplete }: TypingTitleProps) {
    const [displayText, setDisplayText] = useState(startText);
    const [phase, setPhase] = useState<'idle' | 'erasing' | 'typing'>('idle');

    useEffect(() => {
        if (isTyping && title) {
            setPhase('erasing');
        }
    }, [isTyping, title]);

    useEffect(() => {
        if (phase === 'erasing') {
            if (displayText.length > 0) {
                const timeout = setTimeout(() => {
                    setDisplayText(prev => prev.slice(0, -1));
                }, 50);
                return () => clearTimeout(timeout);
            } else {
                setPhase('typing');
            }
        } else if (phase === 'typing') {
            if (displayText.length < title.length) {
                const timeout = setTimeout(() => {
                    setDisplayText(title.slice(0, displayText.length + 1));
                }, 50);
                return () => clearTimeout(timeout);
            } else {
                if (onComplete) onComplete();
                setPhase('idle');
            }
        }
    }, [phase, displayText, title, onComplete]);

    return (
        <span className="truncate text-left">
            {displayText}
            {phase !== 'idle' && (
                <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 align-middle"
                />
            )}
        </span>
    );
}
