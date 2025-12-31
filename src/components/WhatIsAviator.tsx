
import Image from 'next/image';

export default function WhatIsAviator() {
    return (
        <section className="relative w-full max-w-7xl mx-auto px-4 py-16 text-white bg-transparent overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {/* Background Image - Positioned absolutely on the right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60%] lg:w-[50%] h-full opacity-50 lg:opacity-100 pointer-events-none z-0 flex items-center justify-end">
                <img
                    src="/AviatorWinn_files/aviator-clouds.svg"
                    alt="Clouds"
                    className="w-full h-auto object-contain max-w-[800px]"
                />
            </div>

            {/* Content - Positioned over the background */}
            <div className="relative z-10 w-full lg:max-w-[70%]">
                <h2 className="text-4xl font-bold mb-6">
                    What is <span className="text-[#e0050e]">Aviator</span>?
                </h2>

                <div className="space-y-6 text-[#999999] text-[15px] leading-relaxed font-light">
                    <p>
                        Aviator is an exciting crash game that combines strategy, risk, and real-time decision-making. The
                        game features a plane that takes off and increases its multiplier as it ascends. The goal is to cash
                        out your bet before the plane crashes! The longer you wait, the higher the potential winnings—but
                        if you wait too long, you risk losing everything.
                    </p>

                    <p>
                        With its simple yet thrilling mechanics, Aviator has gained popularity among casino enthusiasts
                        and betting fans worldwide. The game offers an engaging experience with live multiplayer action,
                        chat features, and real-time betting statistics.
                    </p>

                    <div className="pt-4">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            <span>💰</span> Key Features
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ul className="space-y-2">
                                {[
                                    "Fast-paced, high-adrenaline gameplay",
                                    "Real-time multiplier increases",
                                    "Cash out at the right moment for maximum profit",
                                ].map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <span className="text-[#516d8a] font-bold text-xl leading-none">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <ul className="space-y-2">
                                {[
                                    "Play with other users and track their bets",
                                    "Exclusive bonuses for new players"
                                ].map((item, index) => (
                                    <li key={index + 3} className="flex items-start gap-3">
                                        <span className="text-[#516d8a] font-bold text-xl leading-none">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>

                    <p className="pt-4 text-[#999999]">
                        Ready to take off? Place your bet and see how high you can fly before the crash! 🚀🔥
                    </p>
                </div>
            </div>
        </section>
    );
}
