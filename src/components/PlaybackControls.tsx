import type { MouseEvent } from 'react';
import { Play, Pause, Maximize, RotateCcw, Rewind, FastForward } from 'lucide-react';

interface PlaybackControlsProps {
    showSettings: boolean;
    isPlaying: boolean;
    onPlayPause: (e: MouseEvent<HTMLButtonElement>) => void;
    onReset: () => void;
    onSkipBackward: (e: MouseEvent<HTMLButtonElement>) => void;
    onSkipForward: (e: MouseEvent<HTMLButtonElement>) => void;
    onFullscreen: () => void;
}

export function PlaybackControls({
    showSettings, isPlaying, onPlayPause, onReset,
    onSkipBackward, onSkipForward, onFullscreen,
}: PlaybackControlsProps) {
    return (
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 p-3 rounded-full backdrop-blur-md border border-zinc-700/50 shadow-2xl transition-all duration-300 z-20 ${showSettings ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
            <button onClick={onReset} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Restart">
                <RotateCcw size={24} />
            </button>
            <button onClick={onSkipBackward} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Rewind">
                <Rewind size={24} />
            </button>
            <button onClick={onPlayPause} className="p-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition shadow-[0_0_15px_rgba(37,99,235,0.5)] transform active:scale-90">
                {isPlaying ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
            </button>
            <button onClick={onSkipForward} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Fast Forward">
                <FastForward size={24} />
            </button>
            <button onClick={onFullscreen} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Fullscreen">
                <Maximize size={24} />
            </button>
        </div>
    );
}
