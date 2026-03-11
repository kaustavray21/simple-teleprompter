import { useRef, useEffect, useCallback } from 'react';
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

    // Store latest values in refs so the rAF callback never goes stale
    const isPlayingRef = useRef(isPlaying);
    const speedRef = useRef(speed);
    const isMirroredRef = useRef(isMirrored);

    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { isMirroredRef.current = isMirrored; }, [isMirrored]);

    const applyTransform = useCallback(() => {
        if (!textRef.current) return;
        const startY = (window.innerHeight / 2) - scrollYRef.current;
        textRef.current.style.transform = `translateY(${startY}px) ${isMirroredRef.current ? 'scaleX(-1)' : 'scaleX(1)'}`;
    }, []);

    // Single rAF loop — never torn down and recreated
    useEffect(() => {
        const tick = () => {
            if (isPlayingRef.current) {
                scrollYRef.current += speedRef.current;
            }
            applyTransform();
            requestRef.current = requestAnimationFrame(tick);
        };

        requestRef.current = requestAnimationFrame(tick);
        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
        };
    }, [applyTransform]);

    // Recalculate immediate offset on static property changes
    useEffect(() => {
        if (!isPlayingRef.current) {
            applyTransform();
        }
    }, [isMirrored, text, fontSize, fontFamily, textAlign, applyTransform]);

    const resetScroll = useCallback(() => {
        scrollYRef.current = 0;
        if (!isPlayingRef.current) applyTransform();
    }, [applyTransform]);

    const skipBackward = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        scrollYRef.current = Math.max(0, scrollYRef.current - (fontSize * 5));
        if (!isPlayingRef.current) applyTransform();
    }, [fontSize, applyTransform]);

    const skipForward = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        scrollYRef.current += (fontSize * 5);
        if (!isPlayingRef.current) applyTransform();
    }, [fontSize, applyTransform]);

    return {
        textRef,
        containerRef,
        scrollYRef,
        resetScroll,
        skipBackward,
        skipForward,
    };
}
