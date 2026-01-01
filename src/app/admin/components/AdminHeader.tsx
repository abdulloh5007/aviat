import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
    loading: boolean;
    onRefresh: () => void;
}

export const AdminHeader = ({ loading, onRefresh }: AdminHeaderProps) => {
    const router = useRouter();

    return (
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
                        <h1 className="text-white font-bold text-xl">Admin Panel</h1>
                        <p className="text-gray-500 text-sm">To'lov so'rovlari</p>
                    </div>
                </div>
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Yangilash
                </button>
            </div>
        </header>
    );
};
