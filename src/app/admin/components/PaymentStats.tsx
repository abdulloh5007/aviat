import { Clock, CreditCard, Check, X } from 'lucide-react';

interface PaymentRequest {
    status: 'pending' | 'awaiting_review' | 'awaiting_confirmation' | 'completed' | 'expired' | 'cancelled';
    amount: number;
}

interface PaymentStatsProps {
    payments: PaymentRequest[];
    formatAmount: (value: number) => string;
}

export const PaymentStats = ({ payments, formatAmount }: PaymentStatsProps) => {
    const pendingCount = payments.filter(p => p.status === 'pending' || p.status === 'awaiting_confirmation' || p.status === 'awaiting_review').length;
    const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'awaiting_confirmation' || p.status === 'awaiting_review').reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Kutilmoqda</p>
                        <p className="text-white font-bold text-xl">{pendingCount}</p>
                    </div>
                </div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                        <CreditCard className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Jami summa</p>
                        <p className="text-white font-bold text-lg">{formatAmount(totalPending)}</p>
                    </div>
                </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Check className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Tasdiqlangan</p>
                        <p className="text-white font-bold text-xl">{payments.filter(p => p.status === 'completed').length}</p>
                    </div>
                </div>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-pink-500/10 border border-red-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                        <X className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Rad etilgan</p>
                        <p className="text-white font-bold text-xl">{payments.filter(p => p.status === 'cancelled').length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
