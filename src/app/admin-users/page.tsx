'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import { Loader2, ArrowLeft, RefreshCw, Users, Search } from 'lucide-react';
import { UserCard } from '../admin/components/UserCard';

interface UserProfile {
    id: string;
    user_id: string;
    phone: string;
    balance: number;
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

export default function AdminUsersPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    const fetchUsers = useCallback(async () => {
        if (!user?.id) return;
        setLoadingUsers(true);
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUserId: user.id })
            });
            const data = await response.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoadingUsers(false);
        }
    }, [user?.id]);

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
                    fetchUsers();
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
    }, [user, loading, router, fetchUsers]);

    const handleUpdateBalance = async (targetUserId: string, action: 'add' | 'subtract' | 'set', amount: number) => {
        if (!user?.id) return;
        try {
            const response = await fetch('/api/admin/users/balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminUserId: user.id,
                    targetUserId,
                    action,
                    amount: action === 'set' ? undefined : amount,
                    newBalance: action === 'set' ? amount : undefined
                })
            });
            const data = await response.json();
            if (data.success) {
                fetchUsers();
            }
        } catch (err) {
            console.error('Error updating balance:', err);
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

    const filteredUsers = users.filter(u => {
        if (!userSearch) return true;
        return u.user_id.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.phone?.toLowerCase().includes(userSearch.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e]">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#0f0f0f]/90 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/games/aviator')}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-white font-bold text-xl">Foydalanuvchilar</h1>
                            <p className="text-gray-500 text-sm">Barcha foydalanuvchilarni boshqarish</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchUsers}
                        disabled={loadingUsers}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                        Yangilash
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="ID yoki telefon raqami bo'yicha qidirish..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Stats - Only total users */}
                <div className="mb-6">
                    <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4 inline-block">
                        <p className="text-gray-400 text-xs">Jami foydalanuvchilar</p>
                        <p className="text-white font-bold text-2xl">{users.length}</p>
                    </div>
                </div>

                {/* User Cards */}
                {loadingUsers ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-500">Foydalanuvchilar topilmadi</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredUsers.map((userProfile) => (
                            <UserCard
                                key={userProfile.id}
                                user={userProfile}
                                onUpdateBalance={handleUpdateBalance}
                                formatAmount={formatAmount}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
