import type { RefObject } from 'react';

interface TeleprompterViewportProps {
    containerRef: RefObject<HTMLDivElement | null>;
    textRef: RefObject<HTMLDivElement | null>;
    text: string;
    fontSize: number;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    fontFamily: string;
}

export function TeleprompterViewport({ containerRef, textRef, text, fontSize, textAlign, fontFamily }: TeleprompterViewportProps) {
    return (
        <div ref={containerRef} className="flex-1 relative w-full h-full cursor-pointer overflow-hidden z-10">
            <div
                ref={textRef}
                className="absolute left-0 right-0 mx-auto w-[90%] md:w-[85%] whitespace-pre-wrap leading-relaxed pb-[50vh] text-white"
                style={{
                    fontSize: `${fontSize}px`,
                    textAlign: textAlign,
                    fontFamily: fontFamily,
                    fontWeight: 'bold',
                    willChange: 'transform'
                }}
            >
                {text}
            </div>
        </div>
    );
}
