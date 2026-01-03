'use client';

import { X, Plus, Minus, Bell } from 'lucide-react';
import { useState } from 'react';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userPhone: string;
    userEmail: string;
    balances: { UZS: number; USD: number; RUB: number };
    onDepositClick: () => void;
    onWithdrawClick: () => void;
}

const formatAmount = (amount: number) => {
    return amount.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ');
};

export default function ProfileModal({
    isOpen,
    onClose,
    userId,
    userPhone,
    userEmail,
    balances,
    onDepositClick,
    onWithdrawClick
}: ProfileModalProps) {
    const [selectedCurrency, setSelectedCurrency] = useState('UZS');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl z-50 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-[#1a1a4e] font-bold text-lg">Profil</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} className="text-gray-600" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Currency Section */}
                    <div>
                        <p className="text-gray-500 text-sm mb-3">Mening hamyonlarim</p>

                        {/* UZS - Active */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className="text-[#27b82c] font-bold text-sm">UZS</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-800 font-medium">{formatAmount(balances.UZS)}</span>
                            </div>
                            <button
                                onClick={() => setSelectedCurrency('UZS')}
                                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${selectedCurrency === 'UZS' ? 'bg-[#27b82c]' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${selectedCurrency === 'UZS' ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* USD - Disabled */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 opacity-50">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 font-bold text-sm">USD</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-400 font-medium">{formatAmount(balances.USD)}</span>
                                <span className="text-xs text-gray-400 ml-2">Yaqinda</span>
                            </div>
                            <div className="w-11 h-6 rounded-full bg-gray-200 p-0.5 cursor-not-allowed">
                                <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>

                        {/* RUB - Disabled */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 opacity-50">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 font-bold text-sm">RUB</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-400 font-medium">{formatAmount(balances.RUB)}</span>
                                <span className="text-xs text-gray-400 ml-2">Yaqinda</span>
                            </div>
                            <div className="w-11 h-6 rounded-full bg-gray-200 p-0.5 cursor-not-allowed">
                                <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => { onClose(); onDepositClick(); }}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                        >
                            <Plus size={16} className="text-[#27b82c]" />
                            <span className="text-gray-700 text-sm font-medium">Pul kirgizish</span>
                        </button>
                        <button
                            onClick={() => { onClose(); onWithdrawClick(); }}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                        >
                            <Minus size={16} className="text-gray-500" />
                            <span className="text-gray-700 text-sm font-medium">Pul chiqarish</span>
                        </button>
                    </div>

                    {/* Personal Info Section */}
                    <div>
                        <p className="text-gray-500 text-sm mb-3">Shaxsiy ma'lumotlar</p>

                        {/* Phone */}
                        <div className="flex items-center gap-2 py-3 border-b border-gray-100">
                            <span className="text-[#27b82c] font-bold text-sm w-8">UZ</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-800">{userPhone || "Ko'rsatilmagan"}</span>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2 py-3 border-b border-gray-100">
                            <span className="text-gray-400 text-lg">✉</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-800">{userEmail || "Ko'rsatilmagan"}</span>
                        </div>

                        {/* Notifications Toggle */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Bell size={18} className="text-gray-400" />
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-800">Bildirishnomalar</span>
                            </div>
                            <button
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${notificationsEnabled ? 'bg-[#27b82c]' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Verification Section */}
                    <div>
                        <p className="text-gray-500 text-sm mb-3">Shaxs tasdiqlash xolati</p>
                        <button
                            className="w-full py-3 bg-[#ff4757] hover:bg-[#ff3344] text-white font-medium rounded-lg transition-colors"
                            onClick={() => {/* TODO: Implement verification */ }}
                        >
                            Shaxsni tasdiqlash
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
