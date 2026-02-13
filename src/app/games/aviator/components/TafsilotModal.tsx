'use client';

import { X, Clock, XCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface TafsilotModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

interface Transaction {
    id: string;
    method: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    created_at: string;
}

const formatAmount = (amount: number) => {
    return amount.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ');
};

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} | ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function TafsilotModal({
    isOpen,
    onClose,
    userId
}: TafsilotModalProps) {
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [deposits, setDeposits] = useState<Transaction[]>([]);
    const [withdraws, setWithdraws] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            // Load deposits
            const { data: depositData } = await supabase
                .from('payment_requests')
                .select('id, method, amount, status, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            // Load withdrawals
            const { data: withdrawData } = await supabase
                .from('withdraw_requests')
                .select('id, method, amount, status, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            setDeposits(depositData || []);
            setWithdraws(withdrawData || []);
        } catch (err) {
            console.error('Error loading transactions:', err);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isOpen && userId) {
            loadTransactions();
        }
    }, [isOpen, userId, loadTransactions]);

    if (!isOpen) return null;

    const currentTransactions = activeTab === 'deposit' ? deposits : withdraws;

    const pendingTransactions = currentTransactions.filter(t => t.status === 'pending');
    const rejectedTransactions = currentTransactions.filter(t => t.status === 'rejected' || t.status === 'expired');
    const approvedTransactions = currentTransactions.filter(t => t.status === 'approved');

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock size={16} className="text-yellow-500" />;
            case 'rejected':
            case 'expired':
                return <XCircle size={16} className="text-red-500" />;
            case 'approved':
                return <CheckCircle size={16} className="text-green-500" />;
            default:
                return null;
        }
    };

    const TransactionCard = ({ transaction }: { transaction: Transaction }) => (
        <div className="bg-white border border-gray-200 rounded-xl p-3 mb-2">
            <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 text-xs">ID #{transaction.id.slice(0, 6).toUpperCase()}</span>
                <span className="text-gray-400 text-xs">{formatDate(transaction.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-gray-800 font-bold uppercase">{transaction.method}</span>
                <div className="flex items-center gap-1">
                    <span className="text-gray-800 font-medium">UZS {formatAmount(transaction.amount)}</span>
                    {getStatusIcon(transaction.status)}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl z-50 max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-[#1a1a4e] font-bold text-lg">Tafsilot</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} className="text-gray-600" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-4 bg-gray-50 shrink-0">
                    <button
                        onClick={() => setActiveTab('deposit')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'deposit'
                                ? 'bg-[#27b82c] text-white'
                                : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                    >
                        Pul kirgizish
                    </button>
                    <button
                        onClick={() => setActiveTab('withdraw')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'withdraw'
                                ? 'bg-[#27b82c] text-white'
                                : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                    >
                        Pul chiqarish
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#27b82c] rounded-full animate-spin" />
                        </div>
                    ) : currentTransactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Hozircha tranzaksiyalar yo&apos;q
                        </div>
                    ) : (
                        <>
                            {/* Pending Section */}
                            {pendingTransactions.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-gray-800 font-semibold mb-2">Kutilmoqda</h3>
                                    {pendingTransactions.map(t => (
                                        <TransactionCard key={t.id} transaction={t} />
                                    ))}
                                </div>
                            )}

                            {/* Rejected Section */}
                            {rejectedTransactions.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-gray-800 font-semibold mb-2">Bekor qilingan</h3>
                                    {rejectedTransactions.map(t => (
                                        <TransactionCard key={t.id} transaction={t} />
                                    ))}
                                </div>
                            )}

                            {/* Approved Section */}
                            {approvedTransactions.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-gray-800 font-semibold mb-2">Tasdiqlangan</h3>
                                    {approvedTransactions.map(t => (
                                        <TransactionCard key={t.id} transaction={t} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
