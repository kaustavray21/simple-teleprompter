import { useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';

interface UseTeleprompterScrollOptions {
    isPlaying: boolean;
    speed: number;
    isMirrored: boolean;
    fontSize: number;
    text: string;
    fontFamily: string;
    textAlign: string;
}

export function useTeleprompterScroll({
    isPlaying,
    speed,
    isMirrored,
    fontSize,
    text,
    fontFamily,
    textAlign,
}: UseTeleprompterScrollOptions) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const textRef = useRef<HTMLDivElement | null>(null);
    const requestRef = useRef<number | null>(null);
    const scrollYRef = useRef(0);

    // Frame loop
    const updateScroll = () => {
        if (!textRef.current) return;

        if (isPlaying) {
            scrollYRef.current += speed;
        }

        const startY = (window.innerHeight / 2) - scrollYRef.current;
        textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;

        requestRef.current = requestAnimationFrame(updateScroll);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateScroll);
        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, speed, isMirrored]);

    // Recalculate immediate offset on static changes
    useEffect(() => {
        if (!isPlaying && textRef.current) {
            const startY = (window.innerHeight / 2) - scrollYRef.current;
            textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
        }
    }, [isMirrored, text, fontSize, fontFamily, textAlign]);

    const resetScroll = () => {
        scrollYRef.current = 0;
        if (!isPlaying && textRef.current) {
            const startY = (window.innerHeight / 2) - scrollYRef.current;
            textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
        }
    };

    const skipBackward = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        scrollYRef.current = Math.max(0, scrollYRef.current - (fontSize * 5));
        if (!isPlaying && textRef.current) {
            const startY = (window.innerHeight / 2) - scrollYRef.current;
            textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
        }
    };

    const skipForward = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        scrollYRef.current += (fontSize * 5);
        if (!isPlaying && textRef.current) {
            const startY = (window.innerHeight / 2) - scrollYRef.current;
            textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
        }
    };

    return {
        textRef,
        containerRef,
        scrollYRef,
        resetScroll,
        skipBackward,
        skipForward,
    };
}
