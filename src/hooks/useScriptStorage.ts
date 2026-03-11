import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface SavedScript {
    id: string;
    name: string;
    text: string;
    timestamp: number;
    isTemporary: boolean;
}

const STORAGE_KEY = 'teleprompter_scripts';
const TEMP_LIFESPAN_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanExpiredScripts(scripts: SavedScript[]): SavedScript[] {
    const now = Date.now();
    return scripts.filter(script => {
        if (!script.isTemporary) return true;
        return (now - script.timestamp) < TEMP_LIFESPAN_MS;
    });
}

export function useScriptStorage() {
    const [scripts, setScripts, removeScripts] = useLocalStorage<SavedScript[]>(
        STORAGE_KEY,
        [],
        {
            deserialize: (raw) => cleanExpiredScripts(JSON.parse(raw)),
        }
    );

    const saveScript = useCallback((name: string, text: string, isTemporary: boolean) => {
        const newScript: SavedScript = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            name,
            text,
            timestamp: Date.now(),
            isTemporary
        };

        setScripts(prev => [newScript, ...prev]);
        return newScript;
    }, [setScripts]);

    const deleteScript = useCallback((id: string) => {
        setScripts(prev => prev.filter(s => s.id !== id));
    }, [setScripts]);

    const clearAllScripts = useCallback(() => {
        removeScripts();
    }, [removeScripts]);

    return {
        scripts,
        saveScript,
        deleteScript,
        clearAllScripts
    };
}
