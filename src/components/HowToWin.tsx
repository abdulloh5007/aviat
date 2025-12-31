export default function HowToWin() {
    const tips = [
        {
            emoji: '🔥',
            title: '1. Start with Smart Bets',
            description: "Don't go all in on a single round—manage your bankroll wisely and play strategically.",
        },
        {
            emoji: '⚡',
            title: '2. Use Auto Cash-Out',
            description: 'Set an automatic cash-out at a reasonable multiplier to secure consistent profits.',
        },
        {
            emoji: '📊',
            title: '3. Analyze Previous Rounds',
            description: 'Check past multipliers to identify patterns and adjust your strategy accordingly.',
        },
        {
            emoji: '🎯',
            title: '4. Play with Dual Bets',
            description: 'Increase your winning potential by placing two bets at once with different strategies.',
        },
        {
            emoji: '💡',
            title: '5. Stay Calm & Play Smart',
            description: "Don't let emotions take over—stick to your strategy and cash out at the right moment.",
        },
    ];

    return (
        <section
            className="relative w-full max-w-7xl mx-auto px-6 text-white bg-transparent overflow-hidden"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
            {/* Background Image - Big on the right, hidden on mobile */}
            <div className="absolute right-0 top-0 w-[55%] h-full pointer-events-none z-0 hidden lg:flex items-center justify-end">
                <img
                    src="/AviatorWinn_files/how-to-win.png"
                    alt="How to Win"
                    className="w-full h-full object-contain object-right"
                />
            </div>

            {/* Content - Left side over the background */}
            <div className="relative z-10 w-full lg:max-w-[55%]">
                <h2 className="text-xl font-bold mb-2">
                    How to <span className="text-[#e0050e]">Win</span>?
                </h2>

                <p className="text-[#999999] text-sm mb-4 font-light">
                    Want to maximize your winnings in Aviator? Follow these expert tips to increase your chances of success!
                </p>

                <div className="space-y-3">
                    {tips.map((tip, index) => (
                        <div key={index}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-sm">{tip.emoji}</span>
                                <h3 className="text-sm font-semibold text-white">{tip.title}</h3>
                            </div>
                            <p className="text-[#999999] text-sm font-light leading-relaxed">
                                {tip.description}
                            </p>
                        </div>
                    ))}
                </div>

                <p className="pt-4 text-white text-sm font-medium flex items-center gap-2">
                    <span>🚀</span> Win Big in Aviator Today! Play smart, take calculated risks, and claim your rewards! <span>🎉</span>
                </p>
            </div>
        </section>
    );
}
