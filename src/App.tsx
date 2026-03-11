import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { Play, Pause, Maximize, RotateCcw, FlipHorizontal, Upload, Link as LinkIcon, Rewind, FastForward, FileText, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
  }
}

export default function App() {
  const [text, setText] = useState('Upload a PDF or Word document to begin.\n\nTap the screen to hide or show the top settings bar.\n\nYou can control the scrolling speed, adjust text size, mirror the text for teleprompter glass, and enter full screen mode using the controls.');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [isMirrored, setIsMirrored] = useState(false);
  const [fontSize, setFontSize] = useState(48);
  const [showSettings, setShowSettings] = useState(true);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center');
  const [lines, setLines] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const scrollYRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', message: '', inputValue: '' });

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

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.font = `bold ${fontSize}px sans-serif`;
    const maxWidth = dimensions.width * 0.85;
    const paragraphs = text.split('\n');
    const newLines: string[] = [];

    paragraphs.forEach(p => {
      if (!p.trim()) {
        newLines.push('');
        return;
      }
      const words = p.split(' ');
      let currentLine = words[0] || '';
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          newLines.push(currentLine);
          currentLine = word;
        }
      }
      newLines.push(currentLine);
    });
    setLines(newLines);
  }, [text, fontSize, dimensions]);

  const draw = useCallback(() => {
    if (!canvasRef.current || !dimensions.width) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    if (isMirrored) {
      ctx.translate(dimensions.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = 'middle';

    const lineHeight = fontSize * 1.5;
    let startY = (dimensions.height / 2) - scrollYRef.current;
    const maxWidth = dimensions.width * 0.85;

    lines.forEach((line) => {
      if (startY > -lineHeight && startY < dimensions.height + lineHeight) {
        if (textAlign === 'center') {
          ctx.textAlign = 'center';
          ctx.fillText(line, dimensions.width / 2, startY);
        } else if (textAlign === 'left') {
          ctx.textAlign = 'left';
          ctx.fillText(line, (dimensions.width - maxWidth) / 2, startY);
        } else if (textAlign === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(line, dimensions.width - ((dimensions.width - maxWidth) / 2), startY);
        } else if (textAlign === 'justify') {
          ctx.textAlign = 'left';
          const words = line.split(' ');
          if (words.length <= 1 || line === '') {
            ctx.fillText(line, (dimensions.width - maxWidth) / 2, startY);
          } else {
            const totalTextWidth = ctx.measureText(line.replace(/\s/g, '')).width;
            const spaceWidth = (maxWidth - totalTextWidth) / (words.length - 1);
            let currentX = (dimensions.width - maxWidth) / 2;
            words.forEach((word) => {
              ctx.fillText(word, currentX, startY);
              currentX += ctx.measureText(word).width + spaceWidth;
            });
          }
        }
      }
      startY += lineHeight;
    });

    ctx.restore();

    if (isPlaying) {
      scrollYRef.current += speed;
    }
    requestRef.current = requestAnimationFrame(draw);
  }, [dimensions, lines, isPlaying, speed, isMirrored, fontSize, textAlign]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [draw]);

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
    if (!isPlaying) {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(draw);
    }
  };

  const skipBackward = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    scrollYRef.current = Math.max(0, scrollYRef.current - (fontSize * 5));
    if (!isPlaying) {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(draw);
    }
  };

  const skipForward = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    scrollYRef.current += (fontSize * 5);
    if (!isPlaying) {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(draw);
    }
  };

  return (
    <div
      className="w-full h-screen bg-black text-white overflow-hidden flex flex-col relative font-sans select-none"
      onMouseMove={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onClick={handleUserInteraction}
    >
      <div
        className={`absolute top-0 left-0 w-full bg-zinc-900/90 p-4 z-20 flex flex-wrap gap-4 items-center justify-center border-b border-zinc-800 shadow-xl backdrop-blur-md transition-transform duration-300 ${showSettings ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <label className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg cursor-pointer hover:bg-zinc-700 transition active:scale-95">
          <Upload size={20} className="text-blue-400" />
          <span className="text-sm font-semibold tracking-wide">Load File</span>
          <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileUpload} />
        </label>

        <button onClick={openGDocModal} className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg hover:bg-zinc-700 transition active:scale-95 text-zinc-300">
          <LinkIcon size={20} className="text-green-400" />
          <span className="text-sm font-semibold tracking-wide">G-Doc</span>
        </button>

        <button onClick={openPasteModal} className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg hover:bg-zinc-700 transition active:scale-95 text-zinc-300">
          <FileText size={20} className="text-yellow-400" />
          <span className="text-sm font-semibold tracking-wide">Paste</span>
        </button>

        <div className="flex items-center gap-3 bg-zinc-800 px-4 py-2 rounded-lg">
          <span className="text-sm font-semibold tracking-wide text-zinc-300 w-12">Speed</span>
          <input type="range" min="0.5" max="12" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-24 accent-blue-500 cursor-pointer" />
          <span className="text-xs font-mono text-blue-400 w-8 text-right">{speed.toFixed(1)}x</span>
        </div>

        <div className="flex items-center gap-3 bg-zinc-800 px-4 py-2 rounded-lg">
          <span className="text-sm font-semibold tracking-wide text-zinc-300 w-10">Size</span>
          <input type="range" min="24" max="140" step="4" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-24 accent-blue-500 cursor-pointer" />
          <span className="text-xs font-mono text-blue-400 w-6 text-right">{fontSize}</span>
        </div>

        <div className="flex items-center bg-zinc-800 p-1 rounded-lg">
          <button onClick={() => setTextAlign('left')} className={`p-1.5 rounded-md transition ${textAlign === 'left' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`} title="Align Left">
            <AlignLeft size={18} />
          </button>
          <button onClick={() => setTextAlign('center')} className={`p-1.5 rounded-md transition ${textAlign === 'center' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`} title="Align Center">
            <AlignCenter size={18} />
          </button>
          <button onClick={() => setTextAlign('right')} className={`p-1.5 rounded-md transition ${textAlign === 'right' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`} title="Align Right">
            <AlignRight size={18} />
          </button>
          <button onClick={() => setTextAlign('justify')} className={`p-1.5 rounded-md transition ${textAlign === 'justify' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`} title="Justify">
            <AlignJustify size={18} />
          </button>
        </div>

        <button onClick={() => setIsMirrored(!isMirrored)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition active:scale-95 ${isMirrored ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>
          <FlipHorizontal size={20} />
          <span className="text-sm font-semibold tracking-wide">Mirror</span>
        </button>
      </div>

      <div ref={containerRef} className="flex-1 relative w-full h-full cursor-pointer">
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full block" style={{ touchAction: 'none' }} />
      </div>

      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 p-3 rounded-full backdrop-blur-md border border-zinc-700/50 shadow-2xl transition-all duration-300 z-20 ${showSettings ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
        <button onClick={resetScroll} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Restart">
          <RotateCcw size={24} />
        </button>
        <button onClick={skipBackward} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Rewind">
          <Rewind size={24} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className="p-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition shadow-[0_0_15px_rgba(37,99,235,0.5)] transform active:scale-90">
          {isPlaying ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
        </button>
        <button onClick={skipForward} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Fast Forward">
          <FastForward size={24} />
        </button>
        <button onClick={toggleFullscreen} className="p-3 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-90" title="Fullscreen">
          <Maximize size={24} />
        </button>
      </div>

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