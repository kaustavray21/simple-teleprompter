import type { ChangeEvent } from 'react';
import { Upload, Link as LinkIcon, FileText, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, FlipHorizontal, Mic, MicOff, Trash2, CircleHelp } from 'lucide-react';

interface SettingsBarProps {
    showSettings: boolean;
    speed: number;
    setSpeed: (speed: number) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
    fontFamily: string;
    setFontFamily: (family: string) => void;
    isMirrored: boolean;
    setIsMirrored: (mirrored: boolean) => void;
    voiceEnabled: boolean;
    onToggleVoice: () => void;
    onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    onOpenGDoc: () => void;
    onOpenPaste: () => void;
    onClearMemory: () => void;
    onOpenVoiceHelp: () => void;
}

export function SettingsBar({
    showSettings, speed, setSpeed, fontSize, setFontSize,
    textAlign, setTextAlign, fontFamily, setFontFamily,
    isMirrored, setIsMirrored, voiceEnabled, onToggleVoice,
    onFileUpload, onOpenGDoc, onOpenPaste, onClearMemory, onOpenVoiceHelp
}: SettingsBarProps) {
    return (
        <div
            className={`absolute top-0 left-0 w-full bg-zinc-900/95 p-3 z-20 flex flex-wrap gap-3 items-center justify-center border-b border-zinc-800 shadow-xl backdrop-blur-md transition-transform duration-300 ${showSettings ? 'translate-y-0' : '-translate-y-full'} overflow-y-auto max-h-[50vh]`}
        >
            {/* Group 1: Files & Input */}
            <div className="flex items-center gap-1 bg-zinc-800/50 p-1.5 rounded-xl border border-zinc-700/50">
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-zinc-700 transition active:scale-95 text-zinc-200">
                    <Upload size={16} className="text-blue-400" />
                    <span className="text-sm font-semibold tracking-wide hidden sm:block">Load</span>
                    <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={onFileUpload} />
                </label>

                <button onClick={onOpenGDoc} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition active:scale-95 text-zinc-200">
                    <LinkIcon size={16} className="text-green-400" />
                    <span className="text-sm font-semibold tracking-wide hidden sm:block">G-Doc</span>
                </button>

                <button onClick={onOpenPaste} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition active:scale-95 text-zinc-200">
                    <FileText size={16} className="text-yellow-400" />
                    <span className="text-sm font-semibold tracking-wide hidden sm:block">Paste</span>
                </button>
            </div>

            {/* Group 2: Typography */}
            <div className="flex items-center gap-2 bg-zinc-800/50 p-1.5 rounded-xl border border-zinc-700/50 flex-wrap justify-center">
                <div className="flex items-center gap-2 px-2">
                    <span className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Size</span>
                    <input type="range" min="24" max="200" step="4" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-16 sm:w-20 accent-blue-500 cursor-pointer" />
                    <span className="text-xs font-mono text-blue-400 w-6 text-right">{fontSize}</span>
                </div>

                <div className="w-px h-6 bg-zinc-700 hidden sm:block"></div>

                <div className="flex items-center text-zinc-200 px-1">
                    <Type size={14} className="text-zinc-500 mr-2 hidden sm:block" />
                    <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="bg-transparent text-zinc-200 text-sm font-semibold outline-none cursor-pointer hover:text-blue-400 transition-colors appearance-none pr-4"
                    >
                        <option value="sans-serif" className="bg-zinc-900 text-white">Sans</option>
                        <option value="serif" className="bg-zinc-900 text-white">Serif</option>
                        <option value="monospace" className="bg-zinc-900 text-white">Mono</option>
                        <option value="Arial, sans-serif" className="bg-zinc-900 text-white">Arial</option>
                        <option value="Georgia, serif" className="bg-zinc-900 text-white">Georgia</option>
                    </select>
                </div>

                <div className="w-px h-6 bg-zinc-700 hidden sm:block"></div>

                <div className="flex items-center gap-0.5 px-1">
                    <button onClick={() => setTextAlign('left')} className={`p-1.5 rounded-md transition ${textAlign === 'left' ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`} title="Align Left"><AlignLeft size={16} /></button>
                    <button onClick={() => setTextAlign('center')} className={`p-1.5 rounded-md transition ${textAlign === 'center' ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`} title="Align Center"><AlignCenter size={16} /></button>
                    <button onClick={() => setTextAlign('right')} className={`p-1.5 rounded-md transition ${textAlign === 'right' ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`} title="Align Right"><AlignRight size={16} /></button>
                    <button onClick={() => setTextAlign('justify')} className={`p-1.5 rounded-md transition ${textAlign === 'justify' ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`} title="Justify"><AlignJustify size={16} /></button>
                </div>
            </div>

            {/* Group 3: Playback */}
            <div className="flex items-center gap-2 bg-zinc-800/50 p-1.5 rounded-xl border border-zinc-700/50 flex-wrap justify-center">
                <div className="flex items-center gap-2 px-2">
                    <span className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Spd</span>
                    <input type="range" min="0.5" max="12" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-16 sm:w-20 accent-blue-500 cursor-pointer" />
                    <span className="text-xs font-mono text-blue-400 w-8 text-right">{speed.toFixed(1)}x</span>
                </div>

                <div className="w-px h-6 bg-zinc-700 hidden sm:block"></div>

                <button onClick={() => setIsMirrored(!isMirrored)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition active:scale-95 ${isMirrored ? 'text-blue-400 bg-blue-500/10' : 'hover:bg-zinc-700 text-zinc-300'}`}>
                    <FlipHorizontal size={16} />
                    <span className="text-sm font-semibold tracking-wide hidden sm:block">Mirror</span>
                </button>
            </div>

            {/* Group 4: Tools */}
            <div className="flex items-center gap-1 bg-zinc-800/50 p-1.5 rounded-xl border border-zinc-700/50">
                <button onClick={onToggleVoice} className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition active:scale-95 ${voiceEnabled ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'hover:bg-zinc-700 text-zinc-300'}`}>
                    {voiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                    <span className="text-sm font-semibold tracking-wide hidden sm:block">Voice</span>
                </button>
                <button onClick={onOpenVoiceHelp} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full transition" title="Offline Voice Setup Instructions">
                    <CircleHelp size={16} />
                </button>

                <div className="w-px h-6 bg-zinc-700 mx-1 hidden sm:block"></div>

                <button onClick={onClearMemory} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-red-900/50 hover:text-red-400 text-zinc-300 transition active:scale-95" title="Clear saved text">
                    <Trash2 size={16} />
                    <span className="text-sm font-semibold tracking-wide hidden sm:block">Clear</span>
                </button>
            </div>
        </div>
    );
}
