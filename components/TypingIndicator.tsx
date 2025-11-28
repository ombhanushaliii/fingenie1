"use client";

import { motion } from "framer-motion";

export default function TypingIndicator() {
    return (
        <div className="flex items-center space-x-1.5 py-2">
            {[0, 1, 2].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-gray-500 rounded-full"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: dot * 0.2,
                    }}
                />
            ))}
        </div>
    );
}
