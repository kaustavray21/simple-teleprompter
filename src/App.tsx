import { useState, useRef, useEffect } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import { Play, Pause, Maximize, RotateCcw, FlipHorizontal, Upload, Link as LinkIcon, Rewind, FastForward, FileText, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Mic, MicOff } from 'lucide-react';

declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function App() {
  const [text, setText] = useState('Upload a PDF, Word, or TXT document to begin.\n\nTap the screen to hide or show the top settings bar.\n\nYou can control the scrolling speed, adjust text size, align paragraphs, format text, and enter full screen mode using the controls.');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [isMirrored, setIsMirrored] = useState(false);
  const [fontSize, setFontSize] = useState(64);
  const [showSettings, setShowSettings] = useState(true);

  // Formatting State
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center');
  const [fontFamily, setFontFamily] = useState('sans-serif');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  const requestRef = useRef<number | null>(null);
  const scrollYRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', message: '', inputValue: '' });

  // VOICE CONTROL STATE
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceEnabledRef = useRef(false);
  // VOICE CONTROL STATE END

  // Initial script loading
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    document.head.appendChild(script);

    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    };

    const mammothScript = document.createElement('script');
    mammothScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
    document.head.appendChild(mammothScript);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
      if (document.head.contains(mammothScript)) document.head.removeChild(mammothScript);
    };
  }, []);

  // VOICE CONTROL — REUSABLE HANDLERS
  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSetSpeed = (s: number) => {
    const clamped = Math.min(12, Math.max(0.5, s));
    setSpeed(clamped);
  };

  const handleJumpTo = (progress: number) => {
    // progress is 0–1 representing fraction of total script height
    if (!textRef.current) return;
    const totalHeight = textRef.current.scrollHeight;
    const clamped = Math.min(1, Math.max(0, progress));
    scrollYRef.current = totalHeight * clamped;
    // Force an immediate visual update
    if (!isPlaying && textRef.current) {
      const startY = (window.innerHeight / 2) - scrollYRef.current;
      textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
    }
  };
  // VOICE CONTROL — REUSABLE HANDLERS END

  // VOICE CONTROL — COMMAND PARSER
  const parseVoiceCommand = (transcript: string) => {
    setLastCommand(transcript);

    // Play
    if (transcript.includes('play') && !transcript.includes('pause')) {
      handlePlay();
      return;
    }

    // Pause / Stop
    if (transcript.includes('pause') || transcript.includes('stop')) {
      handlePause();
      return;
    }

    // Set speed: "set speed to 3", "speed 5", "change speed to 2.5"
    const speedMatch = transcript.match(/(?:set|change)?\s*speed\s*(?:to)?\s*(\d+(?:\.\d+)?)/i);
    if (speedMatch) {
      const parsed = parseFloat(speedMatch[1]);
      if (!isNaN(parsed)) handleSetSpeed(parsed);
      return;
    }

    // Jump to percent: "jump to 50 percent", "go to 80 percent", "50 percent"
    const jumpMatch = transcript.match(/(?:jump|go)?\s*(?:to)?\s*(\d+)\s*percent/i);
    if (jumpMatch) {
      const pct = parseInt(jumpMatch[1], 10);
      if (!isNaN(pct)) handleJumpTo(Math.min(100, Math.max(0, pct)) / 100);
      return;
    }
  };
  // VOICE CONTROL — COMMAND PARSER END

  // VOICE CONTROL — SPEECH RECOGNITION LIFECYCLE
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
        parseVoiceCommand(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setVoiceError(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled
      if (voiceEnabledRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore "already started" errors
        }
      }
    };

    try {
      recognition.start();
      setVoiceError(null);
    } catch (e) {
      setVoiceError('Failed to start speech recognition.');
    }

    recognitionRef.current = recognition;

    return () => {
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [voiceEnabled]);
  // VOICE CONTROL — SPEECH RECOGNITION LIFECYCLE END

  // Frame Loop logic
  const updateScroll = () => {
    if (!textRef.current) return;

    if (isPlaying) {
      scrollYRef.current += speed;
    }

    const startY = (window.innerHeight / 2) - scrollYRef.current;
    textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;

    requestRef.current = requestAnimationFrame(updateScroll);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateScroll);
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, speed, isMirrored]);

  // Recalculate immediate offset on static changes
  useEffect(() => {
    if (!isPlaying && textRef.current) {
      const startY = (window.innerHeight / 2) - scrollYRef.current;
      textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
    }
  }, [isMirrored, text, fontSize, fontFamily, textAlign]);

  useEffect(() => {
    if (isPlaying) {
      setShowSettings(false);
    } else {
      setShowSettings(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  }, [isPlaying]);

  const handleUserInteraction = () => {
    setShowSettings(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setShowSettings(false);
      }, 2500);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPlaying(false);
    scrollYRef.current = 0;

    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      setText(result.value);
    } else if (file.name.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: any) => item.str).join(' ') + '\n\n';
      }
      setText(fullText);
    } else if (file.name.endsWith('.txt')) {
      const textNode = await file.text();
      setText(textNode);
    }
  };

  const openGDocModal = () => {
    setModalConfig({
      isOpen: true,
      type: 'input',
      message: "Paste a PUBLIC Google Docs link:\n(Must be set to 'Anyone with the link can view')",
      inputValue: ''
    });
  };

  const openPasteModal = () => {
    setModalConfig({
      isOpen: true,
      type: 'paste',
      message: "Paste your script text below:",
      inputValue: ''
    });
  };

  const handlePasteSubmit = () => {
    if (modalConfig.inputValue.trim()) {
      setText(modalConfig.inputValue);
      setIsPlaying(false);
      scrollYRef.current = 0;
    }
    setModalConfig({ ...modalConfig, isOpen: false, inputValue: '' });
  };

  const handleGDocSubmit = async (url: string) => {
    if (!url) {
      setModalConfig({ ...modalConfig, isOpen: false });
      return;
    }

    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      setModalConfig({ isOpen: true, type: 'error', message: "Invalid Google Docs link.", inputValue: '' });
      return;
    }

    const docId = match[1];
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`;

    setModalConfig({ isOpen: true, type: 'error', message: "Loading document...", inputValue: '' });

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const fetchedText = await response.text();

      if (fetchedText.trim().startsWith('<')) {
        setModalConfig({ isOpen: true, type: 'error', message: "Could not load document. Please ensure the Google Doc sharing settings are set to 'Anyone with the link can view'.", inputValue: '' });
        return;
      }

      setText(fetchedText);
      setIsPlaying(false);
      scrollYRef.current = 0;
      setModalConfig({ isOpen: false, type: '', message: '', inputValue: '' });
    } catch (error) {
      setModalConfig({ isOpen: true, type: 'error', message: "Failed to fetch the document. It might not be public or the proxy failed.", inputValue: '' });
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      try {
        await (screen.orientation as any).lock('landscape');
      } catch (err) { }
    } else {
      await document.exitFullscreen();
      try {
        (screen.orientation as any).unlock();
      } catch (err) { }
    }
  };

  const resetScroll = () => {
    scrollYRef.current = 0;
    if (!isPlaying && textRef.current) {
      const startY = (window.innerHeight / 2) - scrollYRef.current;
      textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
    }
  };

  const skipBackward = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    scrollYRef.current = Math.max(0, scrollYRef.current - (fontSize * 5));
    if (!isPlaying && textRef.current) {
      const startY = (window.innerHeight / 2) - scrollYRef.current;
      textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
    }
  };

  const skipForward = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    scrollYRef.current += (fontSize * 5);
    if (!isPlaying && textRef.current) {
      const startY = (window.innerHeight / 2) - scrollYRef.current;
      textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
    }
  };

  return (
    <div
      className="w-full h-screen bg-black text-white overflow-hidden flex flex-col relative select-none"
      style={{ fontFamily }}
      onMouseMove={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onClick={handleUserInteraction}
    >
      {/* --- TOP SETTINGS BAR --- */}
      <div
        className={`absolute top-0 left-0 w-full bg-zinc-900/95 p-4 z-20 flex flex-wrap gap-4 items-center justify-center border-b border-zinc-800 shadow-xl backdrop-blur-md transition-transform duration-300 ${showSettings ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <label className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-700 transition active:scale-95">
          <Upload size={18} className="text-blue-400" />
          <span className="text-sm font-semibold tracking-wide hidden md:block">Load</span>
          <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} />
        </label>

        <button onClick={openGDocModal} className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg hover:bg-zinc-700 transition active:scale-95 text-zinc-300">
          <LinkIcon size={18} className="text-green-400" />
          <span className="text-sm font-semibold tracking-wide hidden md:block">G-Doc</span>
        </button>

        <button onClick={openPasteModal} className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg hover:bg-zinc-700 transition active:scale-95 text-zinc-300">
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

        {/* VOICE CONTROL TOGGLE */}
        <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition active:scale-95 ${voiceEnabled ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>
          {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          <span className="text-sm font-semibold tracking-wide hidden md:block">Voice</span>
        </button>
      </div>

      {/* --- TELEPROMPTER VIEWPORT --- */}
      <div ref={containerRef} className="flex-1 relative w-full h-full cursor-pointer overflow-hidden z-10">
        <div
          ref={textRef}
          className="absolute left-0 right-0 mx-auto w-[90%] md:w-[85%] whitespace-pre-wrap leading-relaxed pb-[50vh] text-white"
          style={{
            fontSize: `${fontSize}px`,
            textAlign: textAlign,
            fontWeight: 'bold',
            // Uses CSS positioning and translate3d hardware acceleration for 60fps scrolling
            willChange: 'transform'
          }}
        >
          {text}
        </div>
      </div>

      {/* --- BOTTOM CONTROLS --- */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 p-3 rounded-full backdrop-blur-md border border-zinc-700/50 shadow-2xl transition-all duration-300 z-20 ${showSettings ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
        <button onClick={resetScroll} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Restart">
          <RotateCcw size={24} />
        </button>
        <button onClick={skipBackward} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Rewind">
          <Rewind size={24} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); isPlaying ? handlePause() : handlePlay(); }} className="p-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition shadow-[0_0_15px_rgba(37,99,235,0.5)] transform active:scale-90">
          {isPlaying ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
        </button>
        <button onClick={skipForward} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Fast Forward">
          <FastForward size={24} />
        </button>
        <button onClick={toggleFullscreen} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Fullscreen">
          <Maximize size={24} />
        </button>
      </div>

      {/* VOICE CONTROL — FLOATING STATUS PILL */}
      {voiceEnabled && (
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
      )}

      {/* --- MODALS --- */}
      {modalConfig.isOpen && (
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
                  onKeyDown={e => e.key === 'Enter' && handleGDocSubmit(modalConfig.inputValue)}
                />
                <div className="flex justify-end gap-3 mt-2">
                  <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="px-4 py-2 rounded hover:bg-zinc-800 text-zinc-300 transition">Cancel</button>
                  <button onClick={() => handleGDocSubmit(modalConfig.inputValue)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition">Load</button>
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
                  <button onClick={handlePasteSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition">Load Text</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end mt-4">
                <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}