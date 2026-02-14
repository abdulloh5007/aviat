import { User, CreditCard, Calendar, Loader2, Check, X, Clock } from 'lucide-react';

interface WithdrawRequest {
    id: string;
    user_id: string;
    profile_user_id: string;
    method: string;
    amount: number;
    card_number: string;
    card_expiry?: string;
    status: string;
    created_at: string;
}

interface WithdrawalCardProps {
    withdrawal: WithdrawRequest;
    processingId: string | null;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    formatAmount: (val: number) => string;
    formatDate: (date: string) => string;
    getMethodColor: (method: string) => string;
    getStatusColor: (status: string) => string;
    getStatusLabel: (status: string) => string;
}

// Format card number as "1234 5678 1234 5678"
const formatCardNumber = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

export const WithdrawalCard = ({
    withdrawal,
    processingId,
    onApprove,
    onReject,
    formatAmount,
    formatDate,
    getMethodColor,
    getStatusColor,
    getStatusLabel
}: WithdrawalCardProps) => {
    return (
        <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
            {/* Card Header with Method */}
            <div className={`${getMethodColor(withdrawal.method)} p-4`}>
                <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg uppercase">{withdrawal.method}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                        {getStatusLabel(withdrawal.status)}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-4">
                {/* Amount */}
                <div className="text-center py-2">
                    <p className="text-gray-500 text-xs mb-1">Summa</p>
                    <p className="text-white font-bold text-2xl">{formatAmount(withdrawal.amount)} <span className="text-gray-400 text-base">UZS</span></p>
                </div>

                {/* User & Card Info */}
                <div className="bg-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm">ID:</span>
                        <span className="text-white text-sm font-mono">{withdrawal.profile_user_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm">Karta:</span>
                        <span className="text-white text-sm font-mono">{formatCardNumber(withdrawal.card_number)}</span>
                    </div>
                    {withdrawal.card_expiry && (
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-400 text-sm">Valid Thru:</span>
                            <span className="text-white text-sm font-mono">{withdrawal.card_expiry}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm">{formatDate(withdrawal.created_at)}</span>
                    </div>
                </div>

                {/* Actions */}
                {withdrawal.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => onApprove(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
                        >
                            {processingId === withdrawal.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Tasdiqlash
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => onReject(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Rad etish
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
