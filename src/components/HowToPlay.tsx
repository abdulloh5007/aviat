import Image from 'next/image';

const steps = [
    {
        id: 1,
        image: '/AviatorWinn_files/rules-step-1.png',
        text: (
            <>
                <span className="font-bold text-[#e0050e]">BET</span> before take-off
            </>
        ),
    },
    {
        id: 2,
        image: '/AviatorWinn_files/rules-step-02.png',
        text: (
            <>
                <span className="font-bold text-[#e0050e]">WATCH</span> as your Lucky Plane
                takes off and your winnings increase
            </>
        ),
    },
    {
        id: 3,
        image: '/AviatorWinn_files/rules-step-03.png',
        text: (
            <>
                <span className="font-bold text-[#e0050e]">CASH OUT</span> before plane
                disappears and win X times more!
            </>
        ),
    },
];

export default function HowToPlay() {
    return (
        <section className="py-10 bg-transparent text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-[32px] font-bold uppercase mb-2 tracking-wide">
                        How to <span className="text-[#e0050e]">Play?</span>
                    </h2>
                    <p className="text-[#999999] text-lg font-light">
                        Aviator is as easy to play as 1-2-3
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {steps.map((step) => (
                        <div key={step.id} className="flex flex-col">
                            {/* Number */}
                            <div className="w-full text-center md:text-left md:pl-8 mb-1">
                                <span className="text-white text-2xl font-bold">{step.id}</span>
                            </div>

                            {/* Image Frame */}
                            <div className="relative w-full aspect-[16/9] mb-4 overflow-hidden rounded-[20px] border border-gray-800 bg-[#0f0f0f]">
                                <img
                                    src={step.image}
                                    alt={`Step ${step.id}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Description - Icon + Text */}
                            <div className="flex items-center gap-3 px-2">
                                <img
                                    src="/AviatorWinn_files/cash-pic-steps.png"
                                    alt="Icon"
                                    className="shrink-0 w-12 h-12 object-contain"
                                />
                                <p className="text-[13px] leading-tight text-white font-medium">
                                    {step.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Disclaimer */}
                <div className="text-center w-full px-4">
                    <p className="text-[#999999] text-[11px] leading-relaxed mx-auto max-w-4xl tracking-wide">
                        But remember, if you did not have time to Cash Out before the Lucky Plane flies away, your bet will be lost. Aviator is pure excitement! Risk and win. It's all in your hands!
                    </p>
                </div>
            </div>
        </section>
    );
}
