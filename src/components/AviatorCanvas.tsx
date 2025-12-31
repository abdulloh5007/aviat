'use client';

import React, { useRef, useEffect } from 'react';

interface AviatorCanvasProps {
    gameState: 'waiting' | 'flying' | 'crashed';
    currentMultiplier: number;
}

const AviatorCanvas: React.FC<AviatorCanvasProps> = ({ gameState, currentMultiplier }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const planeImageRef = useRef<HTMLImageElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const crashTimeRef = useRef(0);

    // Load plane image
    useEffect(() => {
        const img = new Image();
        img.src = '/AviatorWinn_files/plane.png';
        img.onload = () => {
            planeImageRef.current = img;
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            if (!canvas || !ctx) return;

            // Resize canvas to parent
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }

            const width = canvas.width;
            const height = canvas.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // 1. Draw Curve and Plane based on state
            if (gameState === 'flying' || gameState === 'crashed') {
                drawGameScene(ctx, width, height, currentMultiplier, gameState);
            } else {
                drawWaitingScene(ctx, width, height);
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [gameState, currentMultiplier]);

    // Helper: Draw Waiting Scene (Empty, plane invisible)
    const drawWaitingScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Plane is invisible during waiting as requested
        return;
    };

    // Helper: Draw Flying/Crashed Scene
    const drawGameScene = (ctx: CanvasRenderingContext2D, width: number, height: number, multiplier: number, state: string) => {
        // Calculate plane position based on multiplier "curve"
        const progress = Math.min((multiplier - 1.0) / 1.0, 1);

        // Start position
        const startX = 0;
        const startY = height - 20;

        // End position (Cruise)
        const cruiseX = width * 0.7; // 70% width
        const cruiseY = height * 0.2; // 20% height (top)

        // Calculate current plane X,Y (Base position on curve)
        let currentX = startX + (cruiseX - startX) * progress;
        let currentY = startY + (cruiseY - startY) * progress;

        // Base values for trail endpoint
        let trailX = currentX;
        let trailY = currentY;

        // Add curve influence
        if (progress < 1) {
            const t = progress;
            const ease = 1 - Math.pow(1 - t, 3); // Cubic ease out
            currentX = startX + (cruiseX - startX) * ease;
            currentY = startY + (cruiseY - startY) * ease;
            trailX = currentX;
            trailY = currentY;
        }

        // Apply visual hover effect (swimming) - affects both Plane and Trail
        if (state === 'flying') {
            const amplitude = height * 0.25; // 25% height amplitude for deep dives
            let rawSin = Math.sin(Date.now() / 1500);

            // Bias: Deep dive, shallow rise
            // If sin is negative (going UP), scale it down significantly
            if (rawSin < 0) rawSin *= 0.2;

            const hoverOffset = rawSin * amplitude;
            const scale = Math.min(progress, 1);
            currentY += hoverOffset * scale;
            trailY += hoverOffset * scale;
        }

        // Handle Crash Animation (Fly Away)
        if (state === 'crashed') {
            if (crashTimeRef.current === 0) crashTimeRef.current = Date.now();
            const dt = (Date.now() - crashTimeRef.current) / 1000;
            // Accelerate up and right
            currentX += dt * 1000 + Math.pow(dt, 2) * 500;
            currentY -= dt * 500 + Math.pow(dt, 2) * 200;
        } else {
            crashTimeRef.current = 0;
        }

        // Draw Trail (Area under curve) - Only if NOT crashed
        if (state !== 'crashed') {
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(startX, startY);

            // Draw curve to current position
            const currentCpX = startX + (currentX - startX) * 0.5;
            const currentCpY = height;

            ctx.quadraticCurveTo(currentCpX, currentCpY, trailX + 30, trailY + 40);

            ctx.lineTo(trailX, height);
            ctx.lineTo(0, height);
            ctx.closePath();

            // Gradient fill
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(233, 28, 70, 0.5)');
            gradient.addColorStop(1, 'rgba(233, 28, 70, 0.1)');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Stroke line
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(currentCpX, currentCpY, trailX + 10, trailY + 30);
            ctx.strokeStyle = '#e91c46';
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // Draw Plane
        if (planeImageRef.current) {
            ctx.save();

            // Plane position already includes hover offset
            ctx.translate(currentX, currentY);

            // Rotate plane based on ascent
            let rotation = -10 * (1 - progress); // Starts at 0, tilts up to -20

            if (state === 'crashed') {
                // Rotate sharply up when flying away
                rotation -= 25;
            } else if (state === 'flying') {
                // Add subtle hover wobble (rotation)
                rotation += Math.sin(Date.now() / 500) * 2;
            }

            ctx.rotate((rotation - 15) * Math.PI / 180); // Base rotation -15deg

            // Draw plane centered
            const w = 120;
            const h = 60;
            ctx.drawImage(planeImageRef.current, -w / 2, -h / 2, w, h);

            ctx.restore();
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
