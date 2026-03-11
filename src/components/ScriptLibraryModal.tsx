import { Trash2, Play, Clock, Save, X } from 'lucide-react';
import type { SavedScript } from '../hooks/useScriptStorage';

interface ScriptLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    scripts: SavedScript[];
    onLoadScript: (script: SavedScript) => void;
    onDeleteScript: (id: string) => void;
}

export function ScriptLibraryModal({ isOpen, onClose, scripts, onLoadScript, onDeleteScript }: ScriptLibraryModalProps) {
    if (!isOpen) return null;

    const permanentScripts = scripts.filter(s => !s.isTemporary);
    const tempScripts = scripts.filter(s => s.isTemporary);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>

                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Save size={20} className="text-blue-400" /> Script Library
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition" title="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-6">
                    {scripts.length === 0 ? (
                        <div className="py-12 text-center text-zinc-500">
                            <p>No scripts saved yet.</p>
                            <p className="text-sm mt-2">Load a PDF, Document, or paste text to get started.</p>
                        </div>
                    ) : (
                        <>
                            {permanentScripts.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-1">Permanent Scripts</h3>
                                    <div className="grid gap-2">
                                        {permanentScripts.map(script => (
                                            <ScriptBlock key={script.id} script={script} onLoad={onLoadScript} onDelete={onDeleteScript} format={formatDate} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tempScripts.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Temporary Sessions</h3>
                                        <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Clock size={12} /> Auto-deletes in 24h
                                        </span>
                                    </div>
                                    <div className="grid gap-2">
                                        {tempScripts.map(script => (
                                            <ScriptBlock key={script.id} script={script} onLoad={onLoadScript} onDelete={onDeleteScript} format={formatDate} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function ScriptBlock({ script, onLoad, onDelete, format }: { script: SavedScript, onLoad: (s: SavedScript) => void, onDelete: (id: string) => void, format: (t: number) => string }) {
    return (
        <div className="group flex items-center justify-between bg-zinc-800 border border-zinc-700 hover:border-blue-500/50 p-3 rounded-lg transition-colors cursor-pointer" onClick={() => onLoad(script)}>
            <div className="flex flex-col min-w-0 pr-4">
                <span className="text-zinc-200 font-semibold truncate">{script.name}</span>
                <span className="text-xs text-zinc-500 truncate mt-0.5">{format(script.timestamp)} • {script.text.substring(0, 60)}...</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(script.id); }}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 rounded-md transition"
                    title="Delete Script"
                >
                    <Trash2 size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onLoad(script); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md transition transform active:scale-95"
                >
                    <Play size={14} /> Load
                </button>
            </div>
        </div>
    );
}
