interface VoiceStatusPillProps {
    voiceEnabled: boolean;
    lastCommand: string;
    voiceError: string | null;
}

export function VoiceStatusPill({ voiceEnabled, lastCommand, voiceError }: VoiceStatusPillProps) {
    if (!voiceEnabled) return null;

    return (
        <div className="absolute bottom-28 left-4 z-20 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-xl px-4 py-3 max-w-xs shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs font-semibold text-green-400 tracking-wide">Listening…</span>
            </div>
            {lastCommand && (
                <p className="text-xs text-zinc-400 truncate">Last: <span className="text-zinc-200">"{lastCommand}"</span></p>
            )}
            {voiceError && (
                <p className="text-xs text-red-400 mt-1">{voiceError}</p>
            )}
        </div>
    );
}
