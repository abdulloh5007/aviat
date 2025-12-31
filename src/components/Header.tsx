'use client';

import Image from 'next/image';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-aviator-dark/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <div className="flex-1" />

                <div className="flex-1 flex justify-center">
                    <Image
                        src="/AviatorWinn_files/Logo.png"
                        alt="Aviator"
                        width={120}
                        height={40}
                        className="h-10 w-auto"
                        priority
                    />
                </div>

                {/* Auth Buttons */}
                <div className="flex-1 flex justify-end gap-3">
                    <button className="btn-login hidden sm:flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                        Log In
                    </button>
                    <button className="btn-primary text-sm py-2 px-4 sm:py-3 sm:px-6">
                        Registration
                    </button>
                </div>
            </div>
        </header>
    );
}
