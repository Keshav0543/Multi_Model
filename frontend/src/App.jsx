import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Composer from "./components/Composer.jsx";
import MessageBubble, { TypingBubble } from "./components/MessageBubble.jsx";
import Icon from "./components/Icons.jsx";
import {
  askQuestion,
  createSession,
  getDocumentData,
  listDocuments,
} from "./lib/api.js";

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const suggestions = [
  "Summarize the uploaded document",
  "What are the candidate's key skills?",
  "List the most important dates and numbers",
  "What does the uploaded image show?",
];

const features = [
  { icon: "file", title: "PDF & Word", copy: "Parsed, chunked, embedded" },
  { icon: "image", title: "Images & Audio", copy: "Vision & transcription" },
  { icon: "database", title: "Grounded", copy: "Sources shown per answer" },
];

function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute -top-40 left-[8%] h-[34rem] w-[34rem] rounded-full bg-violet-600/20 blur-[130px]" />
      <div className="absolute right-[-10rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-[130px]" />
      <div className="absolute bottom-[-12rem] left-1/4 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/10 blur-[130px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.04)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
    </div>
  );
}

function StatusPill({ state }) {
  const styles = {
    ready: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    connecting: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    offline: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  };
  const labels = {
    ready: "Connected",
    connecting: "Connecting",
    offline: "Offline",
  };
  const dots = {
    ready: "bg-emerald-400",
    connecting: "animate-pulse bg-amber-400",
    offline: "bg-rose-400",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[state]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[state]}`} />
      {labels[state]}
    </span>
  );
}

function EmptyState({ docs, resumed, sessionId, onPick, onOpenSidebar }) {
  const ready = docs.length > 0;

  return (
    <div className="animate-rise pt-4 text-center sm:pt-10">
      <div className="animate-float-slow mx-auto mb-6 grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-violet-500/25 to-cyan-400/10 ring-1 ring-white/10 shadow-[0_0_90px_-20px_rgba(139,92,246,0.9)]">
        <Icon name="sparkles" className="h-9 w-9 text-violet-200" />
      </div>

      <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {resumed ? (
          "Continue your previous session"
        ) : (
          <>
            Ask anything about{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              your files
            </span>
          </>
        )}
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        {resumed
          ? ready
            ? "This session's files are still indexed. Ask a follow-up question — every answer will cite the passages it used."
            : "This session was saved but has no indexed files yet. Upload a document to continue."
          : "Upload a PDF, Word document, image, or audio file. Answers are retrieved from your own files — and every response shows the exact passages it used."}
      </p>

      {resumed && (
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-200">
          <Icon name="message" className="h-3 w-3" />
          Resumed session
          <code className="font-mono text-cyan-100/80">
            {sessionId.slice(0, 8)}
          </code>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            disabled={!ready}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {!ready && (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] px-4 py-4">
          <p className="text-xs leading-5 text-violet-100/80">
            Your knowledge base is empty. Add a file to begin.
          </p>
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/15 lg:hidden"
          >
            <Icon name="upload" className="h-3.5 w-3.5" />
            Open uploads
          </button>
          <span className="hidden text-[11px] text-slate-500 lg:block">
            Use the upload panel in the sidebar.
          </span>
        </div>
      )}

      <div className="mx-auto mt-8 hidden max-w-lg grid-cols-3 gap-2 sm:grid">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left"
          >
            <span className="mb-2 grid h-7 w-7 place-items-center rounded-lg bg-white/5">
              <Icon name={feature.icon} className="h-3.5 w-3.5 text-violet-300" />
            </span>
            <p className="text-xs font-medium text-slate-200">{feature.title}</p>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
              {feature.copy}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [sessionId, setSessionId] = useState("");
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");
  const [docs, setDocs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [activeDocId, setActiveDocId] = useState("");
  const [activeDoc, setActiveDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resumed, setResumed] = useState(false);
  const scrollRef = useRef(null);
  const startedRef = useRef(false);
  const documentsLoadedRef = useRef(false);
  const documentsRetryRef = useRef(0);
  const selectionRef = useRef(0);

  const startSession = useCallback(async () => {
    setBooting(true);
    setBootError("");

    try {
      const data = await createSession();
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch (err) {
      setSessionId("");
      setBootError(err.message);
      return "";
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startSession();
  }, [startSession]);

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    setDocumentsError("");

    try {
      const data = await listDocuments();
      setDocuments(data);
      documentsRetryRef.current = 0;
    } catch (err) {
      setDocumentsError(err.message);

      if (documentsRetryRef.current < 3) {
        documentsRetryRef.current += 1;
        setTimeout(() => loadDocuments(), 1500 * documentsRetryRef.current);
      }
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (documentsLoadedRef.current) return;
    documentsLoadedRef.current = true;
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const refresh = () => {
      if (window.document.visibilityState === "visible") loadDocuments();
    };

    window.document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadDocuments]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const handleUploaded = useCallback((entries) => {
    setDocs((previous) => {
      const next = [...previous];

      for (const entry of entries) {
        if (!next.some((doc) => doc.docId === entry.docId)) {
          next.push({
            docId: entry.docId,
            name: entry.originalname,
            chunks: entry.totalChunks || 0,
          });
        }
      }

      return next;
    });
    setSidebarOpen(false);
    loadDocuments();
  }, [loadDocuments]);

  const selectDocument = useCallback(
    async (doc) => {
      setSidebarOpen(false);
      selectionRef.current += 1;
      const requestId = selectionRef.current;

      setSessionId(doc.sessionId);
      setResumed(true);
      setActiveDocId(doc.docId);
      setActiveDoc(null);
      setDocs(
        documents
          .filter((item) => item.sessionId === doc.sessionId)
          .map((item) => ({
            docId: item.docId,
            name: item.fileName,
            chunks: item.chunks || 0,
          })),
      );
      setMessages([]);
      setInput("");
      setBootError("");

      try {
        const data = await getDocumentData(doc.docId);
        if (selectionRef.current !== requestId) return;

        const chunks = Array.isArray(data.chunksData) ? data.chunksData : [];
        const info = data.document || doc;

        setActiveDoc({ ...doc, ...info, chunks });
        setMessages([
          {
            id: uid(),
            role: "assistant",
            content: `Loaded **${info.fileName}** — ${chunks.length} passage${
              chunks.length === 1 ? "" : "s"
            } indexed. Questions will now be answered from this document only.`,
          },
        ]);
      } catch (err) {
        if (selectionRef.current !== requestId) return;
        setMessages([{ id: uid(), role: "assistant", error: err.message }]);
      }
    },
    [documents],
  );

  const newSession = useCallback(async () => {
    selectionRef.current += 1;
    setDocs([]);
    setActiveDocId("");
    setActiveDoc(null);
    setMessages([]);
    setInput("");
    setResumed(false);
    setBootError("");
    setSidebarOpen(false);
    await startSession();
  }, [startSession]);

  const send = useCallback(
    async (question) => {
      const trimmed = (question ?? input).trim();
      if (!trimmed || sending || !sessionId) return;

      setInput("");
      setMessages((previous) => [
        ...previous,
        { id: uid(), role: "user", content: trimmed },
      ]);
      setSending(true);

      try {
        const data = await askQuestion(sessionId, trimmed, activeDocId);
        setMessages((previous) => [
          ...previous,
          {
            id: uid(),
            role: "assistant",
            content: data.answer,
            sources: data.results,
          },
        ]);
      } catch (err) {
        setMessages((previous) => [
          ...previous,
          { id: uid(), role: "assistant", error: err.message },
        ]);
      } finally {
        setSending(false);
      }
    },
    [activeDocId, input, sending, sessionId],
  );

  const offline = Boolean(bootError);
  const status = offline ? "offline" : sessionId ? "ready" : "connecting";
  const canChat = Boolean(sessionId) && !offline && docs.length > 0;

  const hint = offline
    ? "Backend offline — start it with `node index.js`, then retry."
    : booting
      ? "Starting a session…"
      : sending
        ? "Retrieving context and asking Gemini…"
        : resumed && docs.length === 0
          ? "This session has no files yet — upload one to continue."
          : docs.length === 0
            ? "Upload at least one file in the sidebar to start asking questions."
            : "Enter to send · Shift + Enter for a new line · every answer cites its sources";

  return (
    <div className="relative flex h-dvh overflow-hidden bg-[#05070f] text-slate-100">
      <Backdrop />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessionId={sessionId}
        docs={docs}
        onUploaded={handleUploaded}
        onNewSession={newSession}
        offline={offline}
        resumed={resumed}
        documents={documents}
        documentsLoading={documentsLoading}
        documentsError={documentsError}
        activeDocId={activeDocId}
        onRefreshDocuments={loadDocuments}
        onSelectDocument={selectDocument}
      />

      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/5 bg-[#05070f]/60 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] lg:hidden"
            aria-label="Open sidebar"
          >
            <Icon name="menu" className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-white sm:text-base">
                Chat with your files
              </h1>
              <StatusPill state={status} />
            </div>
            <p className="truncate text-[11px] text-slate-500">
              {activeDoc
                ? `${activeDoc.fileName} · ${activeDoc.chunks.length} passages loaded`
                : docs.length > 0
                  ? `${docs.length} source file${docs.length === 1 ? "" : "s"} indexed`
                  : resumed
                    ? "Previous session loaded"
                    : "No files indexed yet"}
              {sessionId ? ` · session ${sessionId.slice(0, 8)}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={newSession}
            disabled={booting}
            className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-400/40 hover:text-white disabled:opacity-40 sm:flex"
          >
            <Icon name="refresh" className="h-3.5 w-3.5" />
            New session
          </button>
        </header>

        {offline && (
          <div className="flex flex-wrap items-center gap-2 border-b border-rose-500/20 bg-rose-500/10 px-4 py-2 text-[11px] text-rose-200 sm:px-6">
            <Icon name="alert" className="h-3.5 w-3.5" />
            <span className="min-w-0 flex-1">
              Could not create a session: {bootError}
            </span>
            <button
              type="button"
              onClick={() => {
                startSession();
                loadDocuments();
              }}
              className="rounded-lg border border-rose-300/30 px-2 py-0.5 font-medium text-rose-100 transition hover:bg-rose-500/20"
            >
              Retry
            </button>
          </div>
        )}

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        >
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {messages.length === 0 && !sending ? (
              <EmptyState
                docs={docs}
                resumed={resumed}
                sessionId={sessionId}
                onPick={(suggestion) => send(suggestion)}
                onOpenSidebar={() => setSidebarOpen(true)}
              />
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}

            {sending && <TypingBubble />}
          </div>
        </div>

        <Composer
          value={input}
          onChange={setInput}
          onSend={() => send()}
          disabled={!canChat}
          sending={sending}
          hint={hint}
        />
      </main>
    </div>
  );
}
