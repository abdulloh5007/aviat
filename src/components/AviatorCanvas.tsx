'use client';

import React, { useRef, useEffect } from 'react';

interface AviatorCanvasProps {
    gameState: 'waiting' | 'flying' | 'crashed';
    currentMultiplier: number;
}

const AviatorCanvas: React.FC<AviatorCanvasProps> = ({ gameState, currentMultiplier }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const planeImageRef = useRef<HTMLImageElement | null>(null);
    const crashTimeRef = useRef(0);
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Store latest props in ref for the animation loop to access
    const latestProps = useRef({ gameState, currentMultiplier });

    // Smooth multiplier interpolation
    const visualMultiplierRef = useRef(1.0);

    // Update refs when props change
    useEffect(() => {
        latestProps.current = { gameState, currentMultiplier };
        // Reset visual multiplier on new game
        if (gameState === 'waiting') {
            visualMultiplierRef.current = 1.0;
            crashTimeRef.current = 0;
        }
        // Force sync if visual falls too far behind (e.g. tab switch)
        if (Math.abs(visualMultiplierRef.current - currentMultiplier) > 0.5) {
            visualMultiplierRef.current = currentMultiplier;
        }
    }, [gameState, currentMultiplier]);

    // Load plane image
    useEffect(() => {
        const img = new Image();
        img.src = '/AviatorWinn_files/plane.png';
        img.onload = () => {
            planeImageRef.current = img;
        };
    }, []);

    // Main Animation Loop
    useEffect(() => {
        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Handle sizing
            const parent = canvas.parentElement;
            if (parent && (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight)) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }

            const width = canvas.width;
            const height = canvas.height;

            // Clear
            ctx.clearRect(0, 0, width, height);

            const { gameState, currentMultiplier } = latestProps.current;

            if (gameState === 'waiting') {
                // Clear state, maybe draw static plane on runway
                visualMultiplierRef.current = 1.0;
                // Optional: Draw waiting state visuals here if needed
            } else if (gameState === 'flying') {
                // Smoothly interpolate visual multiplier towards actual currentMultiplier
                // LERP factor 0.1 gives smooth follow, but we need to ensure it doesn't lag too much
                // Since we update currentMultiplier every 30ms, we can just move towards it.
                const diff = currentMultiplier - visualMultiplierRef.current;
                visualMultiplierRef.current += diff * 0.2; // 20% catchup per frame (60fps)
            } else if (gameState === 'crashed') {
                // In crashed state, we don't update multiplier, but we animate the plane flying away
            }

            if (gameState === 'flying' || gameState === 'crashed') {
                drawGameScene(ctx, width, height, visualMultiplierRef.current, gameState);
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        // Start loop
        render();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    const drawGameScene = (ctx: CanvasRenderingContext2D, width: number, height: number, multiplier: number, state: string) => {
        // Non-linear progress: faster at start, plane reaches cruise by 2x
        let progress: number;
        if (multiplier <= 2.0) {
            // From 1.0x to 2.0x: progress goes 0 to 1.0 (plane reaches destination by 2x)
            progress = (multiplier - 1.0) / 1.0;
        } else {
            // After 2.0x: plane stays at cruise position (progress = 1), just floating
            progress = 1.0;
        }
        progress = Math.min(progress, 1);

        // Start from far left edge
        const startX = 0;
        const startY = height - 20;
        const cruiseX = width * 0.80;
        const cruiseY = height * 0.25;

        // Smooth easing
        const ease = 1 - Math.pow(1 - progress, 2);

        let currentX = startX + (cruiseX - startX) * ease;
        let currentY = startY + (cruiseY - startY) * ease;
        let rotation = 15 - 15 * ease; // Base 15 degrees right tilt, minus flight angle

        if (state === 'crashed') {
            if (crashTimeRef.current === 0) crashTimeRef.current = Date.now();
            const dt = (Date.now() - crashTimeRef.current) / 1000;

            currentX += dt * 800;
            currentY -= dt * 400;
            rotation -= dt * 90;
        } else {
            crashTimeRef.current = 0;

            // "Dive" Effect during cruise (when progress is essentially 1)
            // Even during takeoff (progress < 1), we can add little turbulence
            // But main "Dive" is requested "at the end" (cruise)

            // Continuous sinusoidal wave that gets deeper as we reach cruise
            const time = Date.now() / 2000; // Slow wave (2 seconds)
            const baseWave = Math.sin(time);

            // Amplitude grows with progress. At cruise (1.0), amplitude is large.
            // "Dive to center": Center is ~height/2. CruiseY is height*0.2.
            // We want it to dip DOWN (positive Y).
            const diveAmplitude = (height * 0.15) * progress; // Max dive 15% of height

            // Only apply significant looping movement when near cruise
            if (progress > 0.8) {
                // Secondary "Dive" loop
                // "Dive to center and up to its place"
                // Using a combination of Sin for Y and Cos for X to make a slight oval
                const divePhase = (Date.now() / 3000) * Math.PI * 2;

                // When Sin is 1 (down), we add Y.
                // We want it to mostly stay at cruiseY but occasionally dip.
                // Squared sin gives a "bounce" or we just use normal sin.

                const hoverY = Math.sin(divePhase) * (height * 0.15);
                const hoverX = Math.cos(divePhase) * (width * 0.05);

                // Blend it in based on progress (smooth transition from takeoff to cruise loop)
                const blend = Math.max(0, (progress - 0.8) / 0.2);

                currentY += hoverY * blend;
                currentX += hoverX * blend;

                // Tilt plane with the dive
                rotation += (Math.cos(divePhase) * 10) * blend;
            }
        }

        // Draw Trail
        if (state !== 'crashed') {
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(startX, startY);

            // Control point for curve
            const controlX = startX + (currentX - startX) * 0.3;
            // Dynamic control Y to make the trail follow the "dive"
            const controlY = startY + (currentY - startY) * 0.2;

            ctx.quadraticCurveTo(controlX, controlY, currentX, currentY);

            ctx.lineTo(currentX, height);
            ctx.lineTo(0, height);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(233, 28, 70, 0.4)');
            gradient.addColorStop(1, 'rgba(233, 28, 70, 0.05)');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Draw Line
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(controlX, controlY, currentX, currentY);
            ctx.strokeStyle = '#e91c46';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // Draw Plane
        if (planeImageRef.current) {
            // Check if plane is onscreen
            if (currentX > -100 && currentX < width + 100 && currentY > -100 && currentY < height + 100) {
                ctx.save();
                ctx.translate(currentX, currentY);
                ctx.rotate(rotation * Math.PI / 180);

                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 10;

                // Draw plane bigger
                ctx.drawImage(planeImageRef.current, -60, -30, 120, 60);
                ctx.restore();
            }
        }
    };

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ touchAction: 'none' }}
        />
    );
};

export default AviatorCanvas;
