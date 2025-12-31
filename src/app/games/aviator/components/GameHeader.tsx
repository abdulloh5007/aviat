'use client';

import Image from 'next/image';
import { Menu, Bell } from 'lucide-react';
import { formatAmount } from '../constants';

interface GameHeaderProps {
    userBalance: number;
    onDepositClick: () => void;
    onMenuClick: () => void;
}

export default function GameHeader({ userBalance, onDepositClick, onMenuClick }: GameHeaderProps) {
    return (
        <>
            {/* Main Header */}
            <header className="w-full px-4 py-3 flex justify-between items-center border-b border-gray-700/50 bg-[#1a1a1a]">
                {/* Logo */}
                <div className="flex items-center">
                    <Image
                        src="/AviatorWinn_files/Logo.png"
                        alt="AviatorWinn"
                        width={140}
                        height={40}
                        className="h-8 w-auto"
                    />
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* Deposit Button */}
                    <button
                        onClick={onDepositClick}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#27b82c] hover:bg-[#2ed134] text-white rounded-full font-semibold text-sm transition-colors"
                    >
                        Pul kirgizish
                    </button>

                    {/* Menu Button */}
                    <button
                        id="menu-btn"
                        onClick={onMenuClick}
                        className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            {/* Aviator Secondary Header */}
            <div className="w-full px-4 py-2 flex justify-between items-center bg-[#0e0e0e] border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <span className="text-[#e91c46] italic font-bold text-xl">Aviator</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[#5ce85c] font-bold">{formatAmount(userBalance)}</span>
                    <span className="text-gray-400 text-sm">UZS</span>
                    <button className="text-gray-400 hover:text-white">
                        <Menu size={18} />
                    </button>
                    <button className="text-gray-400 hover:text-white">
                        <Bell size={18} />
                    </button>
                </div>
            </div>
        </>
    );
}
