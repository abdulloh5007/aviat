'use client';

import Image from 'next/image';
import Link from 'next/link';
import HowToPlay from '@/components/HowToPlay';
import WhatIsAviator from '@/components/WhatIsAviator';
import HowToWin from '@/components/HowToWin';

export default function HomePage() {
  return (
    <div className="main-page-container">
      {/* Background elements */}
      <div className="main-page-background">
        <div className="main-page-bg-sun">
          <Image
            src="/AviatorWinn_files/bg-sun.svg"
            alt=""
            width={2000}
            height={1000}
            className="w-full"
          />
        </div>
        <div className="main-page-bg-cloud-1">
          <Image
            src="/AviatorWinn_files/cloud1.svg"
            alt=""
            width={400}
            height={200}
          />
        </div>
        <div className="main-page-bg-cloud-2">
          <Image
            src="/AviatorWinn_files/cloud2.svg"
            alt=""
            width={350}
            height={180}
          />
        </div>
        <div className="main-page-big-plane">
          <Image
            src="/AviatorWinn_files/bigplane.svg"
            alt=""
            width={700}
            height={500}
          />
        </div>
        <div className="main-page-phone-plane">
          <Image
            src="/AviatorWinn_files/phone-plane.svg"
            alt=""
            width={450}
            height={400}
          />
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="main-page-wrapper z-index-2">
        {/* Header */}
        <header className="main-page-header-wrapper">
          <div className="main-page-logo">
            <Image
              src="/AviatorWinn_files/Logo.png"
              alt="AviatorWinn"
              width={200}
              height={60}
            />
          </div>
          <div className="main-page-auth-wrapper">
            <div className="main-page-login-wrapper">
              <Link href="/login" className="login-button">
                <Image
                  src="/AviatorWinn_files/login.svg"
                  alt=""
                  width={22}
                  height={22}
                />
                <span>Log In</span>
              </Link>
            </div>
            <div className="main-page-registration-wrapper">
              <Link href="/registration" className="registration-button">
                <Image
                  src="/AviatorWinn_files/circle-plus.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                <span>Registration</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="main-page-content-wrapper">
          {/* Main title section */}
          <div className="main-page-content-title flex flex-direction-column align-items-center">
            <h1 className="text-color-white font-size-42 font-bold text-align-center">
              Your bet, your flight!
            </h1>
            <h2 className="text-color-white font-size-35 font-bold text-align-center">
              Take control and win big
            </h2>
            <h2 className="text-color-red font-size-35 font-bold text-align-center">
              With AviatorWinn
            </h2>
          </div>

          {/* Section 2 - Description */}
          <div className="main-page-content-h2">
            <section className="text-color-crem font-size-12">
              Ready to take off? Jump into the action, place your bet, and experience the rush of winning big!
            </section>
          </div>

          {/* Play button */}
          <div className="flex jc-center">
            <button className="main-page-play-button font-size-16">
              PLAY AVIATOR
            </button>
          </div>

          {/* What is Aviator section */}
          <WhatIsAviator />

          {/* How to Play section */}
          <HowToPlay />

          {/* How to Win section */}
          <HowToWin />

          {/* Footer buttons */}
          <div className="mp-footer-auth">
            <div className="main-page-login-wrapper">
              <Link href="/login" className="login-button">
                <Image
                  src="/AviatorWinn_files/login.svg"
                  alt=""
                  width={22}
                  height={22}
                />
                <span>Log In</span>
              </Link>
            </div>
            <div className="main-page-registration-wrapper">
              <Link href="/registration" className="registration-button">
                <Image
                  src="/AviatorWinn_files/circle-plus.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                <span>Registration</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile compass decorations */}
      <div className="mp-compass">
        <Image
          src="/AviatorWinn_files/compass.png"
          alt=""
          width={100}
          height={100}
        />
      </div>
      <div className="mp-reverse-compass">
        <Image
          src="/AviatorWinn_files/reverse-compass.png"
          alt=""
          width={100}
          height={100}
        />
      </div>
      <div className="mp-red-compass">
        <Image
          src="/AviatorWinn_files/av-compass.png"
          alt=""
          width={80}
          height={80}
        />
      </div>

      {/* Footer */}
      <div className="main-page-footer-wrapper">
        <div className="main-page-footer">
          {/* Footer content if needed */}
        </div>
      </div>
    </div>
  );
}
