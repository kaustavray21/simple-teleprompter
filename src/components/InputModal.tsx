interface ModalConfig {
    isOpen: boolean;
    type: string;
    message: string;
    inputValue: string;
}

interface InputModalProps {
    modalConfig: ModalConfig;
    setModalConfig: (config: ModalConfig) => void;
    onGDocSubmit: (url: string) => void;
    onPasteSubmit: () => void;
}

export function InputModal({ modalConfig, setModalConfig, onGDocSubmit, onPasteSubmit }: InputModalProps) {
    if (!modalConfig.isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-lg font-bold mb-4 whitespace-pre-line text-zinc-100">{modalConfig.message}</h3>

                {modalConfig.type === 'input' ? (
                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            autoFocus
                            className="w-full bg-zinc-800 border border-zinc-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="https://docs.google.com/document/d/..."
                            value={modalConfig.inputValue}
                            onChange={e => setModalConfig({ ...modalConfig, inputValue: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && onGDocSubmit(modalConfig.inputValue)}
                        />
                        <div className="flex justify-end gap-3 mt-2">
                            <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="px-4 py-2 rounded hover:bg-zinc-800 text-zinc-300 transition">Cancel</button>
                            <button onClick={() => onGDocSubmit(modalConfig.inputValue)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition">Load</button>
                        </div>
                    </div>
                ) : modalConfig.type === 'paste' ? (
                    <div className="flex flex-col gap-4">
                        <textarea
                            autoFocus
                            className="w-full h-48 bg-zinc-800 border border-zinc-600 rounded p-2 text-white focus:outline-none focus:border-blue-500 resize-y"
                            placeholder="Paste your text here..."
                            value={modalConfig.inputValue}
                            onChange={e => setModalConfig({ ...modalConfig, inputValue: e.target.value })}
                        />
                        <div className="flex justify-end gap-3 mt-2">
                            <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="px-4 py-2 rounded hover:bg-zinc-800 text-zinc-300 transition">Cancel</button>
                            <button onClick={onPasteSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition">Load Text</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end mt-4">
                        <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition">Close</button>
                    </div>
                )}
            </div>
        </div>
    );
}
