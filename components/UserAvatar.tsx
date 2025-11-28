"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function UserAvatar() {
    const { data: session } = useSession();

    if (session?.user) {
        return (
            <div className="relative group cursor-pointer">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#2d8cff] hover:border-[#6ec0ff] transition-colors duration-300">
                    {session.user.image ? (
                        <Image
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            width={40}
                            height={40}
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-[#171717] flex items-center justify-center text-white font-bold">
                            {session.user.name?.[0] || "U"}
                        </div>
                    )}
                </div>

                {/* Dropdown for Sign Out */}
                <div className="absolute right-0 mt-2 w-32 bg-[#171717] border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <button
                        onClick={() => signOut()}
                        className="w-full px-4 py-2 text-sm text-red-400 hover:bg-white/5 text-left rounded-lg"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => signIn("google")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#171717] border border-gray-800 hover:border-[#2d8cff] text-gray-400 hover:text-[#2d8cff] transition-all duration-300"
            aria-label="Sign In"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
            </svg>
        </button>
    );
}
