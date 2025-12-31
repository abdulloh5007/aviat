'use client';

import { X, Check } from 'lucide-react';

interface ErrorModalProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
}

export function ErrorModal({ isOpen, message, onClose }: ErrorModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="p-6 text-center">
                    {/* Red circle with X icon */}
                    <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X size={28} className="text-white" strokeWidth={3} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Xatolik</h3>
                    <p className="text-gray-500 mb-6">{message}</p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={28} className="text-white" strokeWidth={3} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Muvaffaqiyatli!</h3>
                    <p className="text-gray-500 mb-6">
                        Sizning so&apos;rovingiz qabul qilindi. Tez orada hisobingizga pul tushadi.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-[#27b82c] hover:bg-[#2ed134] text-white rounded-full font-semibold transition-colors"
                    >
                        Davom etish
                    </button>
                </div>
            </div>
        </div>
    );
}
