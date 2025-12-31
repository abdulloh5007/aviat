'use client';

import Image from 'next/image';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-32 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Clouds */}
                <Image
                    src="/AviatorWinn_files/cloud1.svg"
                    alt=""
                    width={400}
                    height={200}
                    className="absolute top-20 -left-20 opacity-20 animate-float"
                />
                <Image
                    src="/AviatorWinn_files/cloud2.svg"
                    alt=""
                    width={350}
                    height={180}
                    className="absolute top-40 -right-10 opacity-15 animate-float"
                    style={{ animationDelay: '2s' }}
                />

                {/* Compass decorations */}
                <Image
                    src="/AviatorWinn_files/compass.png"
                    alt=""
                    width={150}
                    height={150}
                    className="absolute top-32 left-10 opacity-10 hidden lg:block"
                />
                <Image
                    src="/AviatorWinn_files/reverse-compass.png"
                    alt=""
                    width={120}
                    height={120}
                    className="absolute bottom-40 right-10 opacity-10 hidden lg:block"
                />

                {/* Sun glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-aviator-red/10 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
                    Your bet, your flight!
                    <br />
                    <span className="text-white/90">Take control and win big</span>
                    <br />
                    <span className="text-gradient">With AviatorWinn</span>
                </h1>

                {/* Phone with plane illustration */}
                <div className="relative my-8 sm:my-12">
                    <Image
                        src="/AviatorWinn_files/phone-plane.svg"
                        alt="Aviator Game"
                        width={500}
                        height={400}
                        className="mx-auto w-full max-w-md sm:max-w-lg animate-float"
                        priority
                    />
                </div>

                {/* Play button */}
                <button className="btn-primary text-lg sm:text-xl py-4 px-12 sm:px-16 play-btn">
                    PLAY AVIATOR
                </button>
            </div>
        </section>
    );
}
