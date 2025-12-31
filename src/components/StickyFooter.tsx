'use client';

export default function StickyFooter() {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-aviator-dark/95 backdrop-blur-md border-t border-white/10 p-3 sm:p-4">
            <div className="max-w-md mx-auto flex gap-3">
                <button className="btn-login flex-1 flex items-center justify-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Log In
                </button>
                <button className="btn-primary flex-1">
                    Registration
                </button>
            </div>
        </div>
    );
}
