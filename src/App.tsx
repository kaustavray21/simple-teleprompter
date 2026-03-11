import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';

import { useTeleprompterScroll } from './hooks/useTeleprompterScroll';
import { useVoiceControl } from './hooks/useVoiceControl';
import { SettingsBar } from './components/SettingsBar';
import { PlaybackControls } from './components/PlaybackControls';
import { VoiceStatusPill } from './components/VoiceStatusPill';
import { InputModal } from './components/InputModal';
import type { ModalConfig } from './components/InputModal';
import { TeleprompterViewport } from './components/TeleprompterViewport';
import { ScriptLibraryModal } from './components/ScriptLibraryModal';
import { useScriptStorage } from './hooks/useScriptStorage';
import type { SavedScript } from './hooks/useScriptStorage';
import { useLocalStorage } from './hooks/useLocalStorage';

import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const DEFAULT_TEXT = 'Upload a PDF, Word, or TXT document to begin.\n\nTap the screen to hide or show the top settings bar.\n\nYou can control the scrolling speed, adjust text size, align paragraphs, format text, and enter full screen mode using the controls.';
const TEXT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLOSED_MODAL: ModalConfig = { isOpen: false };

// CORS proxy list — if the primary fails, try the fallback
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

export default function App() {
  // --- STATE ---
  const [text, setText, removeText] = useLocalStorage<string>(
    'teleprompter_saved_text',
    DEFAULT_TEXT,
    { ttl: TEXT_TTL_MS }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [isMirrored, setIsMirrored] = useState(false);
  const [fontSize, setFontSize] = useState(64);
  const [showSettings, setShowSettings] = useState(true);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [modalConfig, setModalConfig] = useState<ModalConfig>(CLOSED_MODAL);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- HOOKS ---
  const { scripts, saveScript, deleteScript } = useScriptStorage();
  const { textRef, containerRef, scrollYRef, resetScroll, skipBackward, skipForward } = useTeleprompterScroll({
    isPlaying, speed, isMirrored, fontSize, text, fontFamily, textAlign,
  });

  // --- VOICE CONTROL JUMP HANDLERS (useCallback for stable refs) ---
  const handleJumpTo = useCallback((progress: number) => {
    if (!textRef.current) return;
    const totalHeight = textRef.current.scrollHeight - (window.innerHeight / 2);
    const clamped = Math.min(1, Math.max(0, progress));
    scrollYRef.current = Math.max(0, totalHeight * clamped);
    const startY = (window.innerHeight / 2) - scrollYRef.current;
    textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
  }, [textRef, scrollYRef, isMirrored]);

  const handleJumpToLine = useCallback((lineNum: number) => {
    if (!textRef.current) return;
    const lineHeight = fontSize * 1.625;
    const contentHeight = textRef.current.scrollHeight - (window.innerHeight / 2);
    const totalVisualLines = Math.max(1, Math.round(contentHeight / lineHeight));
    const clamped = Math.min(totalVisualLines, Math.max(1, lineNum));
    scrollYRef.current = Math.max(0, (clamped - 1) * lineHeight);
    const startY = (window.innerHeight / 2) - scrollYRef.current;
    textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
  }, [textRef, scrollYRef, fontSize, isMirrored]);

  const handleJumpToEnd = useCallback(() => {
    if (!textRef.current) return;
    const totalHeight = textRef.current.scrollHeight - (window.innerHeight / 2);
    scrollYRef.current = Math.max(0, totalHeight);
    const startY = (window.innerHeight / 2) - scrollYRef.current;
    textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
  }, [textRef, scrollYRef, isMirrored]);

  const handleRestart = useCallback(() => {
    scrollYRef.current = 0;
    if (textRef.current) {
      const startY = (window.innerHeight / 2);
      textRef.current.style.transform = `translateY(${startY}px) ${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`;
    }
  }, [textRef, scrollYRef, isMirrored]);

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

  // --- CLEAR MEMORY ---
  const handleClearMemory = useCallback(() => {
    removeText();
    setIsPlaying(false);
    scrollYRef.current = 0;
  }, [removeText, scrollYRef]);

  // --- LOAD SCRIPT FROM LIBRARY ---
  const handleLoadScript = useCallback((script: SavedScript) => {
    setText(script.text);
    setIsLibraryOpen(false);
    setIsPlaying(false);
    scrollYRef.current = 0;
  }, [setText, scrollYRef]);

  // --- SETTINGS VISIBILITY ---
  useEffect(() => {
    if (isPlaying) {
      setShowSettings(false);
    } else {
      setShowSettings(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  }, [isPlaying]);

  const handleUserInteraction = useCallback(() => {
    setShowSettings(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setShowSettings(false), 2500);
    }
  }, [isPlaying]);

  // --- FILE / DOC HANDLERS (with error handling) ---
  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsPlaying(false);
    scrollYRef.current = 0;

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setText(result.value);
      } else if (file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items
            .filter((item): item is { str: string } & typeof item => 'str' in item)
            .map(item => item.str)
            .join(' ') + '\n\n';
        }
        setText(fullText);
      } else if (file.name.endsWith('.txt')) {
        const textContent = await file.text();
        setText(textContent);
      }
    } catch (error) {
      console.error('Failed to parse file:', error);
      setModalConfig({
        isOpen: true, type: 'error',
        message: `Failed to load "${file.name}". The file may be corrupted or in an unsupported format.`,
        inputValue: ''
      });
    }
  }, [setText, scrollYRef]);

  const openGDocModal = useCallback(() => {
    setModalConfig({ isOpen: true, type: 'input', message: "Paste a PUBLIC Google Docs link:\n(Must be set to 'Anyone with the link can view')", inputValue: '' });
  }, []);

  const openPasteModal = useCallback(() => {
    setModalConfig({ isOpen: true, type: 'paste', message: "Paste your script text below:", inputValue: '' });
  }, []);

  const openVoiceHelpModal = useCallback(() => {
    setModalConfig({ isOpen: true, type: 'offline-voice-help', message: "🎙️ Offline Voice Setup", inputValue: '' });
  }, []);

  const handlePasteSubmit = useCallback(() => {
    if (modalConfig.isOpen && modalConfig.inputValue.trim()) {
      setText(modalConfig.inputValue);
      setIsPlaying(false);
      scrollYRef.current = 0;
    }
    setModalConfig(CLOSED_MODAL);
  }, [modalConfig, setText, scrollYRef]);

  const handleGDocSubmit = useCallback(async (url: string) => {
    if (!url) { setModalConfig(CLOSED_MODAL); return; }
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      setModalConfig({ isOpen: true, type: 'error', message: "Invalid Google Docs link.", inputValue: '' });
      return;
    }

    const docId = match[1];
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    setModalConfig({ isOpen: true, type: 'error', message: "Loading document...", inputValue: '' });

    // Try each CORS proxy in order
    for (const makeProxyUrl of CORS_PROXIES) {
      try {
        const response = await fetch(makeProxyUrl(exportUrl));
        if (!response.ok) continue;
        const fetchedText = await response.text();
        if (fetchedText.trim().startsWith('<')) continue; // HTML error page, try next
        setText(fetchedText);
        setIsPlaying(false);
        scrollYRef.current = 0;
        setModalConfig(CLOSED_MODAL);
        return;
      } catch {
        // Try next proxy
      }
    }

    // All proxies failed
    setModalConfig({
      isOpen: true, type: 'error',
      message: "Failed to fetch the document. It might not be public, or CORS proxies are unavailable. Try pasting the text directly instead.",
      inputValue: ''
    });
  }, [setText, scrollYRef]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      try {
        const orientation = screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> };
        if (orientation.lock) {
          await orientation.lock('landscape');
        }
      } catch { /* orientation lock not supported on this device */ }
    } else {
      await document.exitFullscreen();
      try {
        const orientation = screen.orientation as ScreenOrientation & { unlock?: () => void };
        if (orientation.unlock) {
          orientation.unlock();
        }
      } catch { /* ignore */ }
    }
  }, []);

  const handleSavePromptSubmit = useCallback((name: string, isTemporary: boolean) => {
    if (name.trim()) {
      saveScript(name.trim(), text, isTemporary);
      setModalConfig(CLOSED_MODAL);
    }
  }, [saveScript, text]);

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
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenVoiceHelp={openVoiceHelpModal}
        onClearMemory={handleClearMemory}
        onOpenSavePrompt={() => setModalConfig({ isOpen: true, type: 'save-prompt', message: "Save Script to Library", inputValue: '' })}
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
        onSavePromptSubmit={handleSavePromptSubmit}
      />

      <ScriptLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        scripts={scripts}
        onLoadScript={handleLoadScript}
        onDeleteScript={deleteScript}
      />
    </div>
  );
}