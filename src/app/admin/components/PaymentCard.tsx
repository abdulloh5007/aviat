import { User, Calendar, Image as ImageIcon, Loader2, Check, X } from 'lucide-react';

interface PaymentRequest {
    id: string;
    profile_user_id: string;
    method: string;
    amount: number;
    status: string;
    created_at: string;
    screenshot_url?: string;
}

interface PaymentCardProps {
    payment: PaymentRequest;
    processingId: string | null;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onViewScreenshot: (url: string) => void;
    formatAmount: (val: number) => string;
    formatDate: (date: string) => string;
    getMethodColor: (method: string) => string;
    getStatusColor: (status: string) => string;
    getStatusLabel: (status: string) => string;
}

export const PaymentCard = ({
    payment,
    processingId,
    onApprove,
    onReject,
    onViewScreenshot,
    formatAmount,
    formatDate,
    getMethodColor,
    getStatusColor,
    getStatusLabel
}: PaymentCardProps) => {
    return (
        <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
            <div className={`${getMethodColor(payment.method)} p-4`}>
                <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg uppercase">{payment.method}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                    </span>
                </div>
            </div>
            <div className="p-4 space-y-4">
                <div className="text-center py-2">
                    <p className="text-gray-500 text-xs mb-1">Summa</p>
                    <p className="text-white font-bold text-2xl">{formatAmount(payment.amount)} <span className="text-gray-400 text-base">UZS</span></p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm">ID:</span>
                        <span className="text-white text-sm font-mono">{payment.profile_user_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm">{formatDate(payment.created_at)}</span>
                    </div>
                </div>
                {payment.screenshot_url && (
                    <button
                        type="button"
                        onClick={() => onViewScreenshot(payment.screenshot_url!)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">Chekni ko'rish</span>
                    </button>
                )}
                {(payment.status === 'pending' || payment.status === 'awaiting_confirmation' || payment.status === 'awaiting_review') && (
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => onApprove(payment.id)}
                            disabled={processingId === payment.id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
                        >
                            {processingId === payment.id ? (
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
                            onClick={() => onReject(payment.id)}
                            disabled={processingId === payment.id}
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
