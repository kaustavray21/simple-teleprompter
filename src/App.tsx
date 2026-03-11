import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';

import { useTeleprompterScroll } from './hooks/useTeleprompterScroll';
import { useVoiceControl } from './hooks/useVoiceControl';
import { SettingsBar } from './components/SettingsBar';
import { PlaybackControls } from './components/PlaybackControls';
import { VoiceStatusPill } from './components/VoiceStatusPill';
import { InputModal } from './components/InputModal';
import { TeleprompterViewport } from './components/TeleprompterViewport';

declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const DEFAULT_TEXT = 'Upload a PDF, Word, or TXT document to begin.\n\nTap the screen to hide or show the top settings bar.\n\nYou can control the scrolling speed, adjust text size, align paragraphs, format text, and enter full screen mode using the controls.';

export default function App() {
  // --- STATE ---
  const [text, setText] = useState(DEFAULT_TEXT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [isMirrored, setIsMirrored] = useState(false);
  const [fontSize, setFontSize] = useState(64);
  const [showSettings, setShowSettings] = useState(true);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', message: '', inputValue: '' });
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- HOOKS ---
  const { textRef, containerRef, scrollYRef, resetScroll, skipBackward, skipForward } = useTeleprompterScroll({
    isPlaying, speed, isMirrored, fontSize, text, fontFamily, textAlign,
  });

  // Voice control jump handlers need textRef and scrollYRef
  const handleJumpTo = (progress: number) => {
    if (!textRef.current) return;
    const totalHeight = textRef.current.scrollHeight - (window.innerHeight / 2);
    const clamped = Math.min(1, Math.max(0, progress));
    scrollYRef.current = Math.max(0, totalHeight * clamped);
    const startY = (window.innerHeight / 2) - scrollYRef.current;
    textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
  };

  const handleJumpToLine = (lineNum: number) => {
    if (!textRef.current) return;
    const lineHeight = fontSize * 1.625;
    const contentHeight = textRef.current.scrollHeight - (window.innerHeight / 2);
    const totalVisualLines = Math.max(1, Math.round(contentHeight / lineHeight));
    const clamped = Math.min(totalVisualLines, Math.max(1, lineNum));
    scrollYRef.current = Math.max(0, (clamped - 1) * lineHeight);
    const startY = (window.innerHeight / 2) - scrollYRef.current;
    textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
  };

  const handleJumpToEnd = () => {
    if (!textRef.current) return;
    const totalHeight = textRef.current.scrollHeight - (window.innerHeight / 2);
    scrollYRef.current = Math.max(0, totalHeight);
    const startY = (window.innerHeight / 2) - scrollYRef.current;
    textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
  };

  const handleRestart = () => {
    scrollYRef.current = 0;
    if (textRef.current) {
      const startY = (window.innerHeight / 2);
      textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
    }
  };

  const { voiceEnabled, setVoiceEnabled, lastCommand, voiceError } = useVoiceControl({
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onSetSpeed: (s) => setSpeed(Math.min(12, Math.max(0.5, s))),
    onJumpTo: handleJumpTo,
    onJumpToLine: handleJumpToLine,
    onJumpToEnd: handleJumpToEnd,
    onRestart: handleRestart,
    onSetFontSize: (updater) => setFontSize(updater),
    onSetTextAlign: setTextAlign,
    onSetFontFamily: setFontFamily,
    onToggleMirror: () => setIsMirrored(prev => !prev),
    speed,
  });

  // --- SCRIPT LOADING ---
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

  // --- LOCAL STORAGE PERSISTENCE ---
  useEffect(() => {
    const savedText = localStorage.getItem('teleprompter_saved_text');
    const savedTimestamp = localStorage.getItem('teleprompter_saved_timestamp');

    if (savedText && savedTimestamp) {
      const parsedTime = parseInt(savedTimestamp, 10);
      const isExpired = Date.now() - parsedTime > 24 * 60 * 60 * 1000; // 24 hours

      if (isExpired) {
        localStorage.removeItem('teleprompter_saved_text');
        localStorage.removeItem('teleprompter_saved_timestamp');
      } else {
        setText(savedText);
      }
    }
  }, []);

  useEffect(() => {
    if (text === DEFAULT_TEXT) {
      localStorage.removeItem('teleprompter_saved_text');
      localStorage.removeItem('teleprompter_saved_timestamp');
    } else {
      localStorage.setItem('teleprompter_saved_text', text);
      localStorage.setItem('teleprompter_saved_timestamp', Date.now().toString());
    }
  }, [text]);

  const handleClearMemory = () => {
    localStorage.removeItem('teleprompter_saved_text');
    localStorage.removeItem('teleprompter_saved_timestamp');
    setText(DEFAULT_TEXT);
    setIsPlaying(false);
    scrollYRef.current = 0;
  };

  // --- SETTINGS VISIBILITY ---
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
      hideTimerRef.current = setTimeout(() => setShowSettings(false), 2500);
    }
  };

  // --- FILE / DOC HANDLERS ---
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
    setModalConfig({ isOpen: true, type: 'input', message: "Paste a PUBLIC Google Docs link:\n(Must be set to 'Anyone with the link can view')", inputValue: '' });
  };

  const openPasteModal = () => {
    setModalConfig({ isOpen: true, type: 'paste', message: "Paste your script text below:", inputValue: '' });
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
    if (!url) { setModalConfig({ ...modalConfig, isOpen: false }); return; }
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) { setModalConfig({ isOpen: true, type: 'error', message: "Invalid Google Docs link.", inputValue: '' }); return; }

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
    } catch {
      setModalConfig({ isOpen: true, type: 'error', message: "Failed to fetch the document. It might not be public or the proxy failed.", inputValue: '' });
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      try { await (screen.orientation as any).lock('landscape'); } catch { }
    } else {
      await document.exitFullscreen();
      try { (screen.orientation as any).unlock(); } catch { }
    }
  };

  // --- RENDER ---
  return (
    <div
      className="w-full h-screen bg-black text-white overflow-hidden flex flex-col relative select-none"
      style={{ fontFamily }}
      onMouseMove={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onClick={handleUserInteraction}
    >
      <SettingsBar
        showSettings={showSettings}
        speed={speed} setSpeed={setSpeed}
        fontSize={fontSize} setFontSize={setFontSize}
        textAlign={textAlign} setTextAlign={setTextAlign}
        fontFamily={fontFamily} setFontFamily={setFontFamily}
        isMirrored={isMirrored} setIsMirrored={setIsMirrored}
        voiceEnabled={voiceEnabled} onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onFileUpload={handleFileUpload}
        onOpenGDoc={openGDocModal}
        onOpenPaste={openPasteModal}
        onClearMemory={handleClearMemory}
      />

      <TeleprompterViewport
        containerRef={containerRef}
        textRef={textRef}
        text={text}
        fontSize={fontSize}
        textAlign={textAlign}
        fontFamily={fontFamily}
      />

      <PlaybackControls
        showSettings={showSettings}
        isPlaying={isPlaying}
        onPlayPause={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
        onReset={resetScroll}
        onSkipBackward={skipBackward}
        onSkipForward={skipForward}
        onFullscreen={toggleFullscreen}
      />

      <VoiceStatusPill
        voiceEnabled={voiceEnabled}
        lastCommand={lastCommand}
        voiceError={voiceError}
      />

      <InputModal
        modalConfig={modalConfig}
        setModalConfig={setModalConfig}
        onGDocSubmit={handleGDocSubmit}
        onPasteSubmit={handlePasteSubmit}
      />
    </div>
  );
}