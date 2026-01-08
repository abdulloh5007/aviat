'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import { Loader2, ArrowUpCircle, ArrowDownCircle, CreditCard, X } from 'lucide-react';

import { AdminHeader } from './components/AdminHeader';
import { PaymentStats } from './components/PaymentStats';
import { PaymentCard } from './components/PaymentCard';
import { WithdrawalCard } from './components/WithdrawalCard';

interface PaymentRequest {
    id: string;
    user_id: string;
    profile_user_id: string;
    user_name: string;
    user_phone: string;
    method: string;
    amount: number;
    card_number: string;
    status: 'pending' | 'awaiting_confirmation' | 'completed' | 'expired' | 'cancelled';
    created_at: string;
    expires_at: string;
    screenshot_url?: string;
}

interface WithdrawRequest {
    id: string;
    user_id: string;
    profile_user_id: string;
    method: string;
    amount: number;
    card_number: string;
    card_expiry: string;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
}

const formatAmount = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'awaiting_confirmation': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'expired': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'pending': return 'Kutilmoqda';
        case 'awaiting_confirmation': return 'Tasdiqlash kutilmoqda';
        case 'completed': return 'Tasdiqlangan';
        case 'cancelled': return 'Rad etilgan';
        case 'expired': return 'Muddati o\'tgan';
        default: return status;
    }
};

const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
        case 'uzcard': return 'bg-gradient-to-r from-blue-600 to-blue-700';
        case 'humo': return 'bg-gradient-to-r from-green-600 to-green-700';
        case 'payme': return 'bg-gradient-to-r from-cyan-500 to-cyan-600';
        case 'click': return 'bg-gradient-to-r from-blue-500 to-indigo-600';
        default: return 'bg-gradient-to-r from-gray-600 to-gray-700';
    }
};

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [mainTab, setMainTab] = useState<'deposits' | 'withdrawals'>('deposits');

    const fetchPayments = useCallback(async () => {
        if (!user?.id) return;
        setLoadingPayments(true);
        try {
            const response = await fetch('/api/admin/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUserId: user.id })
            });
            const data = await response.json();
            if (data.payments) {
                setPayments(data.payments);
            }
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoadingPayments(false);
        }
    }, [user?.id]);

    const fetchWithdrawals = useCallback(async () => {
        if (!user?.id) return;
        try {
            const response = await fetch('/api/admin/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUserId: user.id })
            });
            const data = await response.json();
            if (data.withdrawals) {
                setWithdrawals(data.withdrawals);
            }
        } catch (err) {
            console.error('Error fetching withdrawals:', err);
        }
    }, [user?.id]);

    const fetchAll = useCallback(async () => {
        await Promise.all([fetchPayments(), fetchWithdrawals()]);
    }, [fetchPayments, fetchWithdrawals]);

    useEffect(() => {
        const checkAdmin = async () => {
            if (loading) return;

            if (!user) {
                router.push('/');
                return;
            }

            try {
                const response = await fetch('/api/admin/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ authId: user.id })
                });
                const data = await response.json();

                if (data.isAdmin) {
                    setIsAdmin(true);
                    fetchAll();
                } else {
                    setIsAdmin(false);
                }
            } catch (err) {
                setIsAdmin(false);
            } finally {
                setChecking(false);
            }
        };

        checkAdmin();
    }, [user, loading, router, fetchAll]);

    const handleApprove = async (paymentId: string) => {
        if (!user?.id) return;
        setProcessingId(paymentId);
        try {
            const response = await fetch('/api/admin/payments/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUserId: user.id, paymentId })
            });
            const data = await response.json();
            if (data.success) {
                fetchPayments();
            }
        } catch (err) {
            console.error('Error approving:', err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (paymentId: string) => {
        if (!user?.id) return;
        setProcessingId(paymentId);
        try {
            const response = await fetch('/api/admin/payments/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUserId: user.id, paymentId })
            });
            const data = await response.json();
            if (data.success) {
                fetchPayments();
            }
        } catch (err) {
            console.error('Error rejecting:', err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveWithdrawal = async (withdrawalId: string) => {
        if (!user?.id) return;
        setProcessingId(withdrawalId);
        try {
            const response = await fetch('/api/admin/withdrawals/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUserId: user.id, withdrawalId })
            });
            const data = await response.json();
            if (data.success) {
                fetchWithdrawals();
            }
        } catch (err) {
            console.error('Error approving withdrawal:', err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectWithdrawal = async (withdrawalId: string) => {
        if (!user?.id) return;
        setProcessingId(withdrawalId);
        try {
            const response = await fetch('/api/admin/withdrawals/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUserId: user.id, withdrawalId })
            });
            const data = await response.json();
            if (data.success) {
                fetchWithdrawals();
            }
        } catch (err) {
            console.error('Error rejecting withdrawal:', err);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading || checking) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex flex-col items-center justify-center p-8">
                <h1 className="text-white text-6xl font-bold mb-4">404</h1>
                <p className="text-gray-400 text-xl">Sahifa topilmadi</p>
            </div>
        );
    }

    const filteredPayments = payments.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'pending') return p.status === 'pending' || p.status === 'awaiting_confirmation';
        return p.status === filter;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e]">
            <AdminHeader loading={loadingPayments} onRefresh={fetchAll} />

            {/* Main Tabs */}
            <div className="max-w-7xl mx-auto px-4 pt-6">
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 mb-6">
                    <button
                        onClick={() => setMainTab('deposits')}
                        className={`relative flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-all ${mainTab === 'deposits'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <ArrowDownCircle className="w-5 h-5" />
                        <span>Pul kiritish</span>
                        {payments.filter(p => p.status === 'pending' || p.status === 'awaiting_confirmation').length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setMainTab('withdrawals')}
                        className={`relative flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-all ${mainTab === 'withdrawals'
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <ArrowUpCircle className="w-5 h-5" />
                        <span>Pul chiqarish</span>
                        {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Deposits Content */}
            {mainTab === 'deposits' && (
                <>
                    <div className="max-w-7xl mx-auto px-4 pb-6">
                        <PaymentStats payments={payments} formatAmount={formatAmount} />

                        {/* Filter Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            {[
                                { key: 'all', label: 'Hammasi' },
                                { key: 'pending', label: 'Kutilmoqda' },
                                { key: 'completed', label: 'Tasdiqlangan' },
                                { key: 'cancelled', label: 'Rad etilgan' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key as typeof filter)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === tab.key
                                        ? 'bg-white text-black'
                                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Payment Cards */}
                        {loadingPayments ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                                    <CreditCard className="w-8 h-8 text-gray-600" />
                                </div>
                                <p className="text-gray-500">So'rovlar topilmadi</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPayments.map(payment => (
                                    <PaymentCard
                                        key={payment.id}
                                        payment={payment}
                                        processingId={processingId}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        onViewScreenshot={setPreviewImage}
                                        formatAmount={formatAmount}
                                        formatDate={formatDate}
                                        getMethodColor={getMethodColor}
                                        getStatusColor={getStatusColor}
                                        getStatusLabel={getStatusLabel}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Image Preview Modal */}
                    {previewImage && (
                        <div
                            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                            onClick={() => setPreviewImage(null)}
                        >
                            <div className="relative max-w-2xl max-h-[80vh]">
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="absolute -top-10 right-0 p-2 text-white hover:bg-white/20 rounded-lg"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <img
                                    src={previewImage}
                                    alt="Payment screenshot"
                                    className="rounded-xl max-h-[80vh] object-contain"
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Withdrawals Content */}
            {mainTab === 'withdrawals' && (
                <div className="max-w-7xl mx-auto px-4 pb-6">
                    {withdrawals.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                                <ArrowUpCircle className="w-8 h-8 text-gray-600" />
                            </div>
                            <p className="text-gray-500">Chiqarish so&apos;rovlari topilmadi</p>
                            <p className="text-gray-600 text-sm mt-2">Hozircha foydalanuvchilar pul chiqarish so&apos;rovi yubormagan</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {withdrawals.map((withdrawal) => (
                                <WithdrawalCard
                                    key={withdrawal.id}
                                    withdrawal={withdrawal}
                                    processingId={processingId}
                                    onApprove={handleApproveWithdrawal}
                                    onReject={handleRejectWithdrawal}
                                    formatAmount={formatAmount}
                                    formatDate={formatDate}
                                    getMethodColor={getMethodColor}
                                    getStatusColor={getStatusColor}
                                    getStatusLabel={getStatusLabel}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
