import { useState } from 'react';
import { User, Phone, Calendar, Wallet, Plus, Minus, Save, Loader2 } from 'lucide-react';

interface UserProfile {
    id: string;
    user_id: string;
    phone: string;
    balance: number;
    created_at: string;
}

interface UserCardProps {
    user: UserProfile;
    onUpdateBalance: (userId: string, action: 'add' | 'subtract' | 'set', amount: number) => Promise<void>;
    formatAmount: (val: number) => string;
    formatDate: (date: string) => string;
}

export const UserCard = ({
    user,
    onUpdateBalance,
    formatAmount,
    formatDate
}: UserCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (action: 'add' | 'subtract' | 'set') => {
        const numAmount = parseInt(amount.replace(/\s/g, ''));
        if (!numAmount || numAmount < 0) return;

        setIsLoading(true);
        try {
            await onUpdateBalance(user.id, action, numAmount);
            setAmount('');
            setIsEditing(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAmountChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned) {
            setAmount(parseInt(cleaned).toLocaleString('uz-UZ').replace(/,/g, ' '));
        } else {
            setAmount('');
        }
    };

    return (
        <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg">ID: {user.user_id}</p>
                            <p className="text-white/70 text-sm flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone || 'Telefon yo\'q'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
                {/* Balance */}
                <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            Balans
                        </span>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                            {isEditing ? 'Bekor qilish' : 'Tahrirlash'}
                        </button>
                    </div>
                    <p className="text-white font-bold text-2xl">
                        {formatAmount(user.balance)} <span className="text-gray-400 text-base">UZS</span>
                    </p>
                </div>

                {/* Edit Balance */}
                {isEditing && (
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            placeholder="Summa kiriting..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction('add')}
                                disabled={isLoading || !amount}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Qo'shish
                            </button>
                            <button
                                onClick={() => handleAction('subtract')}
                                disabled={isLoading || !amount}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                                Ayirish
                            </button>
                            <button
                                onClick={() => handleAction('set')}
                                disabled={isLoading || !amount}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                O'rnatish
                            </button>
                        </div>
                    </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Ro'yxatdan o'tgan: {formatDate(user.created_at)}</span>
                </div>
            </div>
        </div>
    );
};
