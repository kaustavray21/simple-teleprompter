import { useState, useCallback } from 'react';

interface UseLocalStorageOptions<T> {
    /** Time-to-live in milliseconds. If set, entries older than this are treated as expired. */
    ttl?: number;
    /** Custom serializer (default: JSON.stringify) */
    serialize?: (value: T) => string;
    /** Custom deserializer (default: JSON.parse) */
    deserialize?: (raw: string) => T;
}

interface StoredEntry<T> {
    value: T;
    timestamp: number;
}

export function useLocalStorage<T>(
    key: string,
    defaultValue: T,
    options: UseLocalStorageOptions<T> = {}
) {
    const { ttl, serialize, deserialize } = options;

    const [value, setValue] = useState<T>(() => {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return defaultValue;

            if (ttl) {
                // TTL mode: stored as { value, timestamp }
                const entry: StoredEntry<T> = JSON.parse(raw);
                if (Date.now() - entry.timestamp > ttl) {
                    localStorage.removeItem(key);
                    return defaultValue;
                }
                return entry.value;
            }

            return deserialize ? deserialize(raw) : JSON.parse(raw);
        } catch {
            return defaultValue;
        }
    });

    const setAndPersist = useCallback((updater: T | ((prev: T) => T)) => {
        setValue(prev => {
            const next = typeof updater === 'function'
                ? (updater as (prev: T) => T)(prev)
                : updater;

            try {
                if (ttl) {
                    const entry: StoredEntry<T> = { value: next, timestamp: Date.now() };
                    localStorage.setItem(key, JSON.stringify(entry));
                } else {
                    const serialized = serialize ? serialize(next) : JSON.stringify(next);
                    localStorage.setItem(key, serialized);
                }
            } catch (error) {
                console.error(`Failed to persist "${key}" to localStorage`, error);
            }

            return next;
        });
    }, [key, ttl, serialize]);

    const remove = useCallback(() => {
        localStorage.removeItem(key);
        setValue(defaultValue);
    }, [key, defaultValue]);

    return [value, setAndPersist, remove] as const;
}
