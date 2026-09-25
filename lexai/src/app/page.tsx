"use client";

import { useState, useRef, useCallback } from "react";

type Action = {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
};

const ACTIONS: Action[] = [
  {
    id: "simplify",
    label: "Simplify",
    icon: "📖",
    description: "Rewrite in plain English",
    color: "from-violet-500/20 to-violet-600/10 border-violet-500/40 hover:border-violet-400/70",
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: "📋",
    description: "Get a concise overview",
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/40 hover:border-blue-400/70",
  },
  {
    id: "risks",
    label: "Find Risks",
    icon: "⚠️",
    description: "Identify red flags & risks",
    color: "from-red-500/20 to-red-600/10 border-red-500/40 hover:border-red-400/70",
  },
  {
    id: "checklist",
    label: "Checklist",
    icon: "✅",
    description: "Generate action checklist",
    color: "from-green-500/20 to-green-600/10 border-green-500/40 hover:border-green-400/70",
  },
  {
    id: "questions",
    label: "Lawyer Prep",
    icon: "💬",
    description: "Questions for your lawyer",
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/40 hover:border-amber-400/70",
  },
  {
    id: "compare",
    label: "Compare",
    icon: "⚖️",
    description: "Compare two documents",
    color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/40 hover:border-cyan-400/70",
  },
  {
    id: "ask",
    label: "Ask a Question",
    icon: "🔍",
    description: "Ask anything about the doc",
    color: "from-pink-500/20 to-pink-600/10 border-pink-500/40 hover:border-pink-400/70",
  },
];

// Simple markdown renderer (no external deps)
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/^\[ \] (.+)$/gm, "<li>☐ $1</li>")
    .replace(/^\[x\] (.+)$/gm, "<li>☑ $1</li>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul]|<block|<hr|<code)(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}

export default function Home() {
  const [document1, setDocument1] = useState("");
  const [document2, setDocument2] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("simplify");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isDragging2, setIsDragging2] = useState(false);
  const [charCount1, setCharCount1] = useState(0);
  const [charCount2, setCharCount2] = useState(0);
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent, docNum: 1 | 2) => {
      e.preventDefault();
      docNum === 1 ? setIsDragging(false) : setIsDragging2(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        const text = await readFile(file);
        if (docNum === 1) {
          setDocument1(text);
          setCharCount1(text.length);
        } else {
          setDocument2(text);
          setCharCount2(text.length);
        }
      }
    },
    []
  );

  const handleFileInput = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docNum: 1 | 2
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await readFile(file);
      if (docNum === 1) {
        setDocument1(text);
        setCharCount1(text.length);
      } else {
        setDocument2(text);
        setCharCount2(text.length);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!document1.trim()) {
      setError("Please paste or upload a legal document first.");
      return;
    }
    if (selectedAction === "ask" && !question.trim()) {
      setError("Please enter a question about the document.");
      return;
    }
    if (selectedAction === "compare" && !document2.trim()) {
      setError("Please provide a second document to compare.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: document1,
          document2: document2 || undefined,
          action: selectedAction,
          question: question || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.result);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
  };

  const handleClear = () => {
    setDocument1("");
    setDocument2("");
    setQuestion("");
    setResult("");
    setError("");
    setCharCount1(0);
    setCharCount2(0);
  };

  const selectedActionData = ACTIONS.find((a) => a.id === selectedAction);

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-violet-500/20">
              ⚖
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Lex<span className="text-violet-400">AI</span>
              </h1>
              <p className="text-xs text-gray-500 leading-none">
                Legal Document Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Powered by Gemini
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center py-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Understand Any Legal Document{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Instantly
            </span>
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            Paste or upload a contract, agreement, or policy. Choose what you
            need — LexAI does the rest.
          </p>
        </div>

        {/* Action Selector */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            What would you like to do?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => setSelectedAction(action.id)}
                className={`relative p-3 rounded-xl border bg-gradient-to-b transition-all duration-200 text-left group ${
                  action.color
                } ${
                  selectedAction === action.id
                    ? "ring-2 ring-white/20 scale-[1.02] shadow-lg"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <div className="text-xl mb-1">{action.icon}</div>
                <div className="text-xs font-semibold text-white">
                  {action.label}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight mt-0.5 hidden sm:block">
                  {action.description}
                </div>
                {selectedAction === action.id && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/60" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Document Input Area */}
        <div className={`grid gap-4 ${selectedAction === "compare" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Document 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                {selectedAction === "compare" ? "Document 1" : "Your Legal Document"}
              </label>
              {charCount1 > 0 && (
                <span className="text-xs text-gray-500">
                  {charCount1.toLocaleString()} characters
                </span>
              )}
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => handleDrop(e, 1)}
              className={`relative rounded-xl border transition-all duration-200 ${
                isDragging
                  ? "border-violet-400 bg-violet-500/5"
                  : "border-white/10 bg-[#1a1d27]"
              }`}
            >
              <textarea
                value={document1}
                onChange={(e) => {
                  setDocument1(e.target.value);
                  setCharCount1(e.target.value.length);
                }}
                placeholder="Paste your legal document here, or drag & drop a .txt file...

Example: Employment contracts, rental agreements, NDAs, terms of service, privacy policies, purchase agreements..."
                className="w-full h-56 bg-transparent text-gray-300 text-sm p-4 resize-none outline-none placeholder-gray-600 rounded-xl"
              />
              {isDragging && (
                <div className="absolute inset-0 rounded-xl bg-violet-500/10 border-2 border-violet-400 border-dashed flex items-center justify-center">
                  <p className="text-violet-300 font-medium">Drop file here</p>
                </div>
              )}
              <div className="border-t border-white/5 px-4 py-2 flex items-center justify-between">
                <button
                  onClick={() => fileRef1.current?.click()}
                  className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload .txt file
                </button>
                {document1 && (
                  <button
                    onClick={() => { setDocument1(""); setCharCount1(0); }}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                ref={fileRef1}
                type="file"
                accept=".txt,.md,.text"
                className="hidden"
                onChange={(e) => handleFileInput(e, 1)}
              />
            </div>
          </div>

          {/* Document 2 (compare mode) */}
          {selectedAction === "compare" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Document 2
                </label>
                {charCount2 > 0 && (
                  <span className="text-xs text-gray-500">
                    {charCount2.toLocaleString()} characters
                  </span>
                )}
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging2(true); }}
                onDragLeave={() => setIsDragging2(false)}
                onDrop={(e) => handleDrop(e, 2)}
                className={`relative rounded-xl border transition-all duration-200 ${
                  isDragging2
                    ? "border-cyan-400 bg-cyan-500/5"
                    : "border-white/10 bg-[#1a1d27]"
                }`}
              >
                <textarea
                  value={document2}
                  onChange={(e) => {
                    setDocument2(e.target.value);
                    setCharCount2(e.target.value.length);
                  }}
                  placeholder="Paste the second document to compare..."
                  className="w-full h-56 bg-transparent text-gray-300 text-sm p-4 resize-none outline-none placeholder-gray-600 rounded-xl"
                />
                {isDragging2 && (
                  <div className="absolute inset-0 rounded-xl bg-cyan-500/10 border-2 border-cyan-400 border-dashed flex items-center justify-center">
                    <p className="text-cyan-300 font-medium">Drop file here</p>
                  </div>
                )}
                <div className="border-t border-white/5 px-4 py-2 flex items-center justify-between">
                  <button
                    onClick={() => fileRef2.current?.click()}
                    className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload .txt file
                  </button>
                  {document2 && (
                    <button
                      onClick={() => { setDocument2(""); setCharCount2(0); }}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef2}
                  type="file"
                  accept=".txt,.md,.text"
                  className="hidden"
                  onChange={(e) => handleFileInput(e, 2)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ask Question Input */}
        {selectedAction === "ask" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Your Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder='e.g. "What are the termination conditions?" or "Am I liable if the product is defective?"'
              className="w-full bg-[#1a1d27] border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm outline-none focus:border-pink-500/40 placeholder-gray-600 transition-colors"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            <span className="text-lg leading-none">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Analyze Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex-1 sm:flex-none sm:min-w-[200px] py-3 px-8 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                {selectedActionData?.icon} {selectedActionData?.label}
              </>
            )}
          </button>
          {(document1 || result) && (
            <button
              onClick={handleClear}
              className="py-3 px-5 rounded-xl font-medium text-gray-400 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-200"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="rounded-2xl border border-white/5 bg-[#1a1d27] p-6 space-y-3 animate-pulse">
            <div className="h-4 bg-white/5 rounded-full w-3/4" />
            <div className="h-4 bg-white/5 rounded-full w-full" />
            <div className="h-4 bg-white/5 rounded-full w-5/6" />
            <div className="h-4 bg-white/5 rounded-full w-2/3" />
            <div className="h-4 bg-white/5 rounded-full w-full" />
            <div className="h-4 bg-white/5 rounded-full w-4/5" />
          </div>
        )}

        {/* Result Panel */}
        {result && !loading && (
          <div ref={resultRef} className="rounded-2xl border border-white/10 bg-[#1a1d27] overflow-hidden shadow-xl">
            {/* Result Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/2">
              <div className="flex items-center gap-2">
                <span className="text-base">{selectedActionData?.icon}</span>
                <span className="text-sm font-semibold text-gray-200">
                  {selectedActionData?.label} Results
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                  <span className="w-1 h-1 rounded-full bg-green-400" />
                  Complete
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150 border border-transparent hover:border-white/10"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
            </div>

            {/* Result Content */}
            <div
              className="result-content p-6 text-sm leading-relaxed max-h-[600px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
            />
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-200/70 text-xs">
          <span className="text-base leading-none mt-0.5">⚖️</span>
          <div>
            <strong className="text-amber-200/90">Not Legal Advice.</strong>{" "}
            LexAI provides general legal information and analysis to help you
            understand documents better. It does not constitute legal advice,
            does not create an attorney-client relationship, and should not be
            used as a substitute for professional legal counsel. For important
            legal matters, always consult a qualified attorney.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-600 text-xs">
          <p>
            LexAI — Built for Prompt Wars · Powered by Google Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
