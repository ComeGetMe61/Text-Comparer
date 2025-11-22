
import React, { useEffect, useRef, useState } from 'react';
import { DiffLine, DiffType, SupportedLanguage } from '../types';
import { Copy, Check } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // html
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';

interface DiffViewerProps {
  originalLines: DiffLine[];
  modifiedLines: DiffLine[];
  language: SupportedLanguage;
  originalText: string;
  modifiedText: string;
}

const CodeLine: React.FC<{ line: DiffLine; language: SupportedLanguage }> = ({ line, language }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current && line.content && language !== 'plaintext') {
      if (!line.parts) {
        Prism.highlightElement(codeRef.current);
      }
    }
  }, [line.content, language, line.parts]);

  const getBgClass = () => {
    switch (line.type) {
      case DiffType.INSERT: return 'bg-green-900/20';
      case DiffType.DELETE: return 'bg-red-900/20';
      case DiffType.EMPTY: return 'bg-slate-950/50 opacity-50 diagonal-stripes';
      default: return 'bg-transparent';
    }
  };

  const getBorderClass = () => {
    switch (line.type) {
      case DiffType.INSERT: return 'border-green-500/50';
      case DiffType.DELETE: return 'border-red-500/50';
      default: return 'border-transparent';
    }
  };

  const getTextColor = () => {
    if (line.type === DiffType.EMPTY) return 'text-transparent';
    return 'text-slate-300';
  };

  const renderContent = () => {
    if (line.type === DiffType.EMPTY) return <span>&nbsp;</span>;

    if (line.parts && line.parts.length > 0) {
      return (
        <span>
          {line.parts.map((part, idx) => {
            let className = "";
            // Darker background for character diffs, ensuring text is visible
            if (part.type === DiffType.DELETE) className = "bg-red-500/40 text-white rounded-sm shadow-sm";
            if (part.type === DiffType.INSERT) className = "bg-green-500/40 text-white rounded-sm shadow-sm";
            return <span key={idx} className={className}>{part.content}</span>;
          })}
        </span>
      );
    }

    return (
      <code ref={codeRef} className={`language-${language} !bg-transparent !p-0 !m-0 !text-sm !shadow-none !border-0 !leading-none block font-mono`}>
        {line.content || ' '}
      </code>
    );
  };

  return (
    <div className={`flex items-center w-full h-6 ${getBgClass()} hover:bg-slate-800/50 transition-colors duration-75 group relative border-l-[3px] ${getBorderClass()}`}>
      {/* Line Number */}
      <div className="w-12 flex-shrink-0 sticky left-0 z-20 flex items-center justify-end h-full select-none bg-slate-900 border-r border-slate-800/50 text-[10px] text-slate-500 font-mono pr-2">
        {line.type !== DiffType.EMPTY && (line.originalLineNumber || line.modifiedLineNumber)}
      </div>

      {/* Content */}
      <div className={`flex-1 px-4 whitespace-pre font-mono text-sm flex items-center h-full ${getTextColor()}`}>
        {renderContent()}
      </div>
    </div>
  );
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

const DiffViewer: React.FC<DiffViewerProps> = ({ originalLines, modifiedLines, language, originalText, modifiedText }) => {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  const handleLeftScroll = () => {
    if (!leftScrollRef.current || !rightScrollRef.current) return;
    if (isSyncingLeft.current) {
      isSyncingLeft.current = false;
      return;
    }
    isSyncingRight.current = true;
    rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
  };

  const handleRightScroll = () => {
    if (!leftScrollRef.current || !rightScrollRef.current) return;
    if (isSyncingRight.current) {
      isSyncingRight.current = false;
      return;
    }
    isSyncingLeft.current = true;
    leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
  };

  return (
    // Use CSS Grid for robust 50/50 split regardless of content width
    <div className="grid grid-cols-2 w-full h-full bg-slate-950 overflow-hidden">
      {/* Version 1 (Left) */}
      <div className="flex flex-col h-full min-w-0 border-r border-slate-800 bg-slate-900 relative overflow-hidden">
        <div className="bg-slate-950 px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center flex-shrink-0 h-10 z-30">
          <span>Version 1</span>
          <CopyButton text={originalText} />
        </div>
        <div
          ref={leftScrollRef}
          onScroll={handleLeftScroll}
          className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        >
          {/* w-max ensures the container grows to fit long lines, triggering horizontal scroll on parent */}
          <div className="min-w-full w-max pb-8">
            {originalLines.map((line, idx) => (
              <CodeLine key={`orig-${idx}`} line={line} language={language} />
            ))}
          </div>
        </div>
      </div>

      {/* Version 2 (Right) */}
      <div className="flex flex-col h-full min-w-0 bg-slate-900 relative overflow-hidden">
        <div className="bg-slate-950 px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center flex-shrink-0 h-10 z-30">
          <span>Version 2</span>
          <CopyButton text={modifiedText} />
        </div>
        <div
          ref={rightScrollRef}
          onScroll={handleRightScroll}
          className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        >
          <div className="min-w-full w-max pb-8">
            {modifiedLines.map((line, idx) => (
              <CodeLine key={`mod-${idx}`} line={line} language={language} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
