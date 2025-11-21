
import React, { useState, useMemo } from 'react';
import { FileDiff, Trash2, Wand2, Code2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { computeDiff } from './utils/diffEngine';
import DiffViewer from './components/DiffViewer';
import Button from './components/Button';
import { LanguageOption, SupportedLanguage } from './types';
import { explainDifferences } from './services/geminiService';

const LANGUAGES: LanguageOption[] = [
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JSON', value: 'json' },
  { label: 'Python', value: 'python' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'SQL', value: 'sql' },
];

const CopyButton: React.FC<{ text: string, className?: string }> = ({ text, className = "" }) => {
    const [copied, setCopied] = useState(false);
  
    const handleCopy = async () => {
      if (!text) return;
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
        className={`p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-all ${className}`}
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    );
};

const App: React.FC = () => {
  const [leftText, setLeftText] = useState<string>('');
  const [rightText, setRightText] = useState<string>('');
  const [language, setLanguage] = useState<SupportedLanguage>('plaintext');
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Computed diff result
  const diffResult = useMemo(() => computeDiff(leftText, rightText), [leftText, rightText]);
  
  const handleClear = () => {
    if (confirm('Are you sure you want to clear both text fields?')) {
      setLeftText('');
      setRightText('');
      setIsEditing(true);
      setAiExplanation(null);
    }
  };

  const handleExplain = async () => {
    if (!leftText || !rightText) return;
    setIsAiLoading(true);
    setAiExplanation(null);
    try {
        const result = await explainDifferences(leftText, rightText);
        setAiExplanation(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Header / Toolbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <FileDiff className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-white">Text Comparer</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-800 rounded-md p-1 border border-slate-700">
             <button 
               onClick={() => setIsEditing(true)}
               className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${isEditing ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
             >
               Input
             </button>
             <button 
               onClick={() => setIsEditing(false)}
               className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${!isEditing ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
             >
               Compare
             </button>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-1"></div>

          <div className="relative group">
            <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-750"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>

          <Button variant="danger" onClick={handleClear} title="Clear All" icon={<Trash2 className="w-4 h-4" />}>
             Clear
          </Button>
          
          <Button 
            variant="ai" 
            onClick={handleExplain} 
            isLoading={isAiLoading}
            icon={<Wand2 className="w-4 h-4" />}
          >
            Explain Difference
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {isEditing ? (
          <div className="flex flex-1 h-full border-t border-slate-800">
            {/* Left Input */}
            <div className="flex-1 flex flex-col border-r border-slate-800">
               <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
                 <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                   Version 1
                 </span>
                 <CopyButton text={leftText} />
               </div>
               <div className="flex-1 relative bg-slate-950">
                 {leftText === '' && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                       <div className="text-center">
                         <p className="text-slate-600">Paste Version 1 text here</p>
                       </div>
                     </div>
                 )}
                 <textarea
                   className="absolute inset-0 w-full h-full bg-transparent p-4 resize-none focus:outline-none focus:bg-slate-900/30 transition-colors font-mono text-sm leading-6 text-slate-300 z-10"
                   value={leftText}
                   onChange={(e) => setLeftText(e.target.value)}
                   spellCheck={false}
                   placeholder=""
                 />
               </div>
            </div>
            
            {/* Right Input */}
            <div className="flex-1 flex flex-col">
               <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
                 <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                   Version 2
                 </span>
                 <CopyButton text={rightText} />
               </div>
               <div className="flex-1 relative bg-slate-950">
                 {rightText === '' && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                       <p className="text-slate-600">Paste Version 2 text here</p>
                     </div>
                 )}
                 <textarea
                   className="absolute inset-0 w-full h-full bg-transparent p-4 resize-none focus:outline-none focus:bg-slate-900/30 transition-colors font-mono text-sm leading-6 text-slate-300 z-10"
                   value={rightText}
                   onChange={(e) => setRightText(e.target.value)}
                   spellCheck={false}
                   placeholder=""
                 />
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 h-full relative">
             <DiffViewer 
               originalLines={diffResult.originalLines}
               modifiedLines={diffResult.modifiedLines}
               language={language}
               originalText={leftText}
               modifiedText={rightText}
             />
             
             {/* Floating Stats Card */}
             <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg shadow-2xl p-4 flex gap-6 text-sm z-20">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-green-400 font-mono font-bold">+{diffResult.additions}</span>
                  <span className="text-slate-400">Additions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-red-400 font-mono font-bold">-{diffResult.deletions}</span>
                  <span className="text-slate-400">Deletions</span>
                </div>
             </div>
          </div>
        )}

        {/* AI Explanation Sidebar (Overlay) */}
        {aiExplanation && (
          <div className="absolute inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Wand2 className="w-5 h-5" />
                  <h3 className="font-semibold">AI Analysis</h3>
                </div>
                <button onClick={() => setAiExplanation(null)} className="text-slate-500 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>
             <div className="p-6 overflow-y-auto flex-1">
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  <ReactMarkdown 
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-semibold text-white mt-3 mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-white mt-2 mb-1" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      code: ({node, ...props}) => <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono text-xs" {...props} />,
                    }}
                  >
                    {aiExplanation}
                  </ReactMarkdown>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
