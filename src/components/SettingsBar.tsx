import type { ChangeEvent } from 'react';
import { Upload, Link as LinkIcon, FileText, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, FlipHorizontal, Mic, MicOff } from 'lucide-react';

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
}

export function SettingsBar({
    showSettings, speed, setSpeed, fontSize, setFontSize,
    textAlign, setTextAlign, fontFamily, setFontFamily,
    isMirrored, setIsMirrored, voiceEnabled, onToggleVoice,
    onFileUpload, onOpenGDoc, onOpenPaste,
}: SettingsBarProps) {
    return (
        <div
            className={`absolute top-0 left-0 w-full bg-zinc-900/95 p-4 z-20 flex flex-wrap gap-4 items-center justify-center border-b border-zinc-800 shadow-xl backdrop-blur-md transition-transform duration-300 ${showSettings ? 'translate-y-0' : '-translate-y-full'}`}
        >
            <label className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-700 transition active:scale-95">
                <Upload size={18} className="text-blue-400" />
                <span className="text-sm font-semibold tracking-wide hidden md:block">Load</span>
                <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={onFileUpload} />
            </label>

            <button onClick={onOpenGDoc} className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg hover:bg-zinc-700 transition active:scale-95 text-zinc-300">
                <LinkIcon size={18} className="text-green-400" />
                <span className="text-sm font-semibold tracking-wide hidden md:block">G-Doc</span>
            </button>

            <button onClick={onOpenPaste} className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg hover:bg-zinc-700 transition active:scale-95 text-zinc-300">
                <FileText size={18} className="text-yellow-400" />
                <span className="text-sm font-semibold tracking-wide hidden md:block">Paste</span>
            </button>

            <div className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg">
                <span className="text-sm font-semibold tracking-wide text-zinc-300">Spd</span>
                <input type="range" min="0.5" max="12" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-20 accent-blue-500 cursor-pointer" />
                <span className="text-xs font-mono text-blue-400 w-8 text-right">{speed.toFixed(1)}x</span>
            </div>

            <div className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg">
                <span className="text-sm font-semibold tracking-wide text-zinc-300">Size</span>
                <input type="range" min="24" max="200" step="4" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-20 accent-blue-500 cursor-pointer" />
                <span className="text-xs font-mono text-blue-400 w-6 text-right">{fontSize}</span>
            </div>

            <div className="flex items-center bg-zinc-800 p-1 rounded-lg">
                <button onClick={() => setTextAlign('left')} className={`p-1.5 rounded-md transition ${textAlign === 'left' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`} title="Align Left"><AlignLeft size={18} /></button>
                <button onClick={() => setTextAlign('center')} className={`p-1.5 rounded-md transition ${textAlign === 'center' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`} title="Align Center"><AlignCenter size={18} /></button>
                <button onClick={() => setTextAlign('right')} className={`p-1.5 rounded-md transition ${textAlign === 'right' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`} title="Align Right"><AlignRight size={18} /></button>
                <button onClick={() => setTextAlign('justify')} className={`p-1.5 rounded-md transition ${textAlign === 'justify' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`} title="Justify"><AlignJustify size={18} /></button>
            </div>

            <div className="flex items-center bg-zinc-800 px-3 py-1.5 rounded-lg text-sm font-semibold tracking-wide text-zinc-300 gap-2">
                <Type size={18} className="text-zinc-400" />
                <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="bg-zinc-900 text-white text-sm font-semibold outline-none cursor-pointer rounded-md px-2 py-1 border border-zinc-700 hover:border-blue-500 transition-colors appearance-none pr-6"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                >
                    <option value="sans-serif" className="bg-zinc-900 text-white py-1">Sans-Serif</option>
                    <option value="serif" className="bg-zinc-900 text-white py-1">Serif</option>
                    <option value="monospace" className="bg-zinc-900 text-white py-1">Monospace</option>
                    <option value="Arial, sans-serif" className="bg-zinc-900 text-white py-1">Arial</option>
                    <option value="Georgia, serif" className="bg-zinc-900 text-white py-1">Georgia</option>
                </select>
            </div>

            <button onClick={() => setIsMirrored(!isMirrored)} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition active:scale-95 ${isMirrored ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>
                <FlipHorizontal size={18} />
                <span className="text-sm font-semibold tracking-wide hidden md:block">Mirror</span>
            </button>

            <button onClick={onToggleVoice} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition active:scale-95 ${voiceEnabled ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>
                {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                <span className="text-sm font-semibold tracking-wide hidden md:block">Voice</span>
            </button>
        </div>
    );
}
