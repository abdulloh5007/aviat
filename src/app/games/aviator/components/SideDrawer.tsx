'use client';

import { X, User, Wallet, ArrowDownCircle, FileText, Bell, HeadphonesIcon, Shield, Users } from 'lucide-react';
import { formatAmount } from '../constants';

interface SideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userBalance: number;
    isAdmin?: boolean;
    onProfileClick: () => void;
    onDepositClick: () => void;
    onWithdrawClick: () => void;
    onHistoryClick: () => void;
    onAdminClick?: () => void;
    onUsersClick?: () => void;
    onSignOut: () => void;
}

export default function SideDrawer({
    isOpen,
    onClose,
    userId,
    userBalance,
    isAdmin,
    onProfileClick,
    onDepositClick,
    onWithdrawClick,
    onHistoryClick,
    onAdminClick,
    onUsersClick,
    onSignOut,
}: SideDrawerProps) {
    return (
        <div
            id="side-drawer"
            className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-[#1a1a4e] font-bold text-lg">ID #{userId}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} className="text-gray-600" />
                    </button>
                </div>

                {/* Balance */}
                <div className="mx-4 mt-4 p-4 border border-gray-200 rounded-lg">
                    <p className="text-gray-500 text-sm">Balans hisobi</p>
                    <p className="text-[#1a1a4e] font-semibold">
                        <span className="font-bold">UZS</span> | {formatAmount(userBalance)}
                    </p>
                </div>

                {/* Menu Items */}
                <div className="flex-1 py-4">
                    <button
                        onClick={onProfileClick}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <User size={22} className="text-gray-500" />
                        <span className="text-gray-800 font-medium">Profil</span>
                    </button>

                    <button
                        onClick={onDepositClick}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <Wallet size={22} className="text-gray-500" />
                        <span className="text-gray-800 font-medium">Pul kirgizish</span>
                    </button>

                    <button
                        onClick={onWithdrawClick}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <ArrowDownCircle size={22} className="text-gray-500" />
                        <span className="text-gray-800 font-medium">Pul chiqarish</span>
                    </button>

                    <button
                        onClick={onHistoryClick}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <FileText size={22} className="text-gray-500" />
                        <span className="text-gray-800 font-medium">Tafsilot</span>
                    </button>

                    <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <Bell size={22} className="text-gray-500" />
                        <span className="text-gray-800 font-medium">Bildirishnomalar</span>
                    </button>

                    <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <HeadphonesIcon size={22} className="text-gray-500" />
                        <span className="text-gray-800 font-medium">Texnik yordam</span>
                    </button>

                    {/* Admin Section */}
                    {isAdmin && (
                        <div className="border-t border-gray-100 mt-2 pt-2">
                            {onAdminClick && (
                                <button
                                    onClick={onAdminClick}
                                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-colors"
                                >
                                    <Shield size={22} className="text-red-500" />
                                    <span className="text-red-600 font-medium">Admin Panel</span>
                                </button>
                            )}
                            {onUsersClick && (
                                <button
                                    onClick={onUsersClick}
                                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-purple-50 transition-colors"
                                >
                                    <Users size={22} className="text-purple-500" />
                                    <span className="text-purple-600 font-medium">Foydalanuvchilar</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={onSignOut}
                        className="w-full py-3 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Chiqish
                    </button>
                </div>
            </div>
        </div>
    );
}

