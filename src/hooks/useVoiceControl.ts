import { useState, useRef, useEffect } from 'react';

interface VoiceCallbacks {
    onPlay: () => void;
    onPause: () => void;
    onSetSpeed: (speed: number) => void;
    onJumpTo: (progress: number) => void;
    onJumpToLine: (lineNum: number) => void;
    onJumpToEnd: () => void;
    onRestart: () => void;
    onSetFontSize: (updater: (prev: number) => number) => void;
    onSetTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
    onSetFontFamily: (family: string) => void;
    onToggleMirror: () => void;
    speed: number;
}

function wordToNumber(str: string): string {
    const words: Record<string, string> = {
        zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
        six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
        eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15',
        sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20',
        thirty: '30', forty: '40', fifty: '50', sixty: '60', seventy: '70',
        eighty: '80', ninety: '90', hundred: '100',
    };
    let result = str;
    for (const [word, digit] of Object.entries(words)) {
        result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
    }
    return result;
}

function parseCommand(rawTranscript: string, callbacks: VoiceCallbacks): void {
    const transcript = wordToNumber(rawTranscript);

    // Mute
    if (transcript.includes('mute') || transcript.includes('voice off')) {
        // Handled externally — caller will disable voice
        return;
    }

    // Restart
    if (transcript.includes('restart') || transcript.includes('start over') || transcript.includes('beginning') || transcript.includes('reset')) {
        callbacks.onRestart();
        return;
    }

    // Pause / Stop
    if (transcript.includes('pause') || transcript.includes('stop')) {
        callbacks.onPause();
        return;
    }

    // Play / Resume / Start
    if (transcript.includes('play') || transcript.includes('resume') || transcript.includes('start') || transcript.includes('go')) {
        if (!transcript.includes('percent') && !transcript.includes('%') && !transcript.includes('line') && !transcript.includes('end')) {
            callbacks.onPlay();
            return;
        }
    }

    // Speed
    if (transcript.includes('faster')) {
        callbacks.onSetSpeed(callbacks.speed + 1);
        return;
    }
    if (transcript.includes('slower')) {
        callbacks.onSetSpeed(callbacks.speed - 1);
        return;
    }
    const speedMatch = transcript.match(/(?:set|change)?\s*speed\s*(?:to)?\s*(\d+(?:\.\d+)?)/i);
    if (speedMatch) {
        const parsed = parseFloat(speedMatch[1]);
        if (!isNaN(parsed)) callbacks.onSetSpeed(parsed);
        return;
    }

    // Jump to end
    if (transcript.includes('end') || transcript.includes('last line') || transcript.includes('bottom')) {
        callbacks.onJumpToEnd();
        return;
    }

    // Jump to line
    const lineMatch = transcript.match(/(?:jump|go)?\s*(?:to)?\s*line\s*(?:number)?\s*(\d+)/i);
    if (lineMatch) {
        const lineNum = parseInt(lineMatch[1], 10);
        if (!isNaN(lineNum)) callbacks.onJumpToLine(lineNum);
        return;
    }

    // Jump to percent
    const jumpMatch = transcript.match(/(\d+)\s*(?:percent|%)/i);
    if (jumpMatch) {
        const pct = parseInt(jumpMatch[1], 10);
        if (!isNaN(pct)) callbacks.onJumpTo(Math.min(100, Math.max(0, pct)) / 100);
        return;
    }

    // Font size
    if (transcript.includes('bigger') || transcript.includes('increase size') || transcript.includes('larger')) {
        callbacks.onSetFontSize(prev => Math.min(200, prev + 8));
        return;
    }
    if (transcript.includes('smaller') || transcript.includes('decrease size') || transcript.includes('tiny')) {
        callbacks.onSetFontSize(prev => Math.max(24, prev - 8));
        return;
    }
    const sizeMatch = transcript.match(/(?:set)?\s*size\s*(?:to)?\s*(\d+)/i);
    if (sizeMatch) {
        const parsed = parseInt(sizeMatch[1], 10);
        if (!isNaN(parsed)) callbacks.onSetFontSize(() => Math.min(200, Math.max(24, parsed)));
        return;
    }

    // Alignment
    if (transcript.includes('align left') || transcript.includes('left align')) { callbacks.onSetTextAlign('left'); return; }
    if (transcript.includes('align center') || transcript.includes('center align') || transcript.includes('centre')) { callbacks.onSetTextAlign('center'); return; }
    if (transcript.includes('align right') || transcript.includes('right align')) { callbacks.onSetTextAlign('right'); return; }
    if (transcript.includes('align justify') || transcript.includes('justify')) { callbacks.onSetTextAlign('justify'); return; }

    // Font family
    if (transcript.includes('font sans') || transcript.includes('sans serif')) { callbacks.onSetFontFamily('sans-serif'); return; }
    if (transcript.includes('font serif') && !transcript.includes('sans')) { callbacks.onSetFontFamily('serif'); return; }
    if (transcript.includes('font mono') || transcript.includes('monospace')) { callbacks.onSetFontFamily('monospace'); return; }
    if (transcript.includes('font arial') || transcript.includes('aerial')) { callbacks.onSetFontFamily('Arial, sans-serif'); return; }
    if (transcript.includes('font georgia')) { callbacks.onSetFontFamily('Georgia, serif'); return; }

    // Mirror
    if (transcript.includes('mirror') || transcript.includes('flip')) { callbacks.onToggleMirror(); return; }
}

export function useVoiceControl(callbacks: VoiceCallbacks) {
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [lastCommand, setLastCommand] = useState<string>('');
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const voiceEnabledRef = useRef(false);
    const callbacksRef = useRef(callbacks);
    callbacksRef.current = callbacks;

    useEffect(() => {
        voiceEnabledRef.current = voiceEnabled;

        if (!voiceEnabled) {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
            return;
        }

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setVoiceError('Speech recognition is not supported in this browser.');
            setVoiceEnabled(false);
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const results = event.results;
            const lastResult = results[results.length - 1];
            if (lastResult && lastResult.isFinal) {
                const transcript = lastResult[0].transcript.toLowerCase().trim();
                setLastCommand(transcript);

                // Handle mute directly here
                const normalized = wordToNumber(transcript);
                if (normalized.includes('mute') || normalized.includes('voice off')) {
                    setVoiceEnabled(false);
                    return;
                }

                parseCommand(transcript, callbacksRef.current);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                setVoiceError(`Voice error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            if (voiceEnabledRef.current) {
                try {
                    recognition.start();
                } catch (_e) {
                    // Ignore "already started" errors
                }
            }
        };

        try {
            recognition.start();
            setVoiceError(null);
        } catch (_e) {
            setVoiceError('Failed to start speech recognition.');
        }

        recognitionRef.current = recognition;

        return () => {
            recognition.onend = null;
            recognition.stop();
            recognitionRef.current = null;
        };
    }, [voiceEnabled]);

    return { voiceEnabled, setVoiceEnabled, lastCommand, voiceError };
}
