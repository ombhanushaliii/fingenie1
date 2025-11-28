"use client";

import { motion } from "framer-motion";

export default function TypingIndicator() {
    return (
        <div className="flex items-center space-x-1 p-4 bg-[#171717] rounded-2xl rounded-tl-none w-fit border border-white/5">
            {[0, 1, 2].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{
                        y: ["0%", "-50%", "0%"],
                        opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: dot * 0.2,
                    }}
                />
            ))}
        </div>
    );
}
