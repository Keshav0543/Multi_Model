import { useState } from "react";
import Icon from "./Icons.jsx";
import UploadPanel from "./UploadPanel.jsx";

function iconForName(name = "") {
  if (/\.(png|jpe?g|webp)$/i.test(name)) return "image";
  if (/\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i.test(name)) return "audio";
  return "file";
}

function DocRow({ doc, active }) {

  return (
    <li
      className={`flex items-center gap-2 rounded-lg px-1 py-1.5 ${
        active ? "bg-violet-500/10" : ""
      }`}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/5 bg-white/[0.04]">
        <Icon
          name={iconForName(doc.name)}
          className="h-3.5 w-3.5 text-slate-400"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] text-slate-200" title={doc.name}>
          {doc.name}
        </p>
        <p className="text-[10px] text-slate-500">
          {doc.chunks} passage{doc.chunks === 1 ? "" : "s"} indexed
        </p>
      </div>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80" />
    </li>
  );
}

function timeAgo(value) {
  if (!value) return "";

  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff)) return "";

  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString();
}

function DocumentRow({ doc, active, onSelect }) {

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(doc)}
        className={`group flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
          active
            ? "border-violet-400/40 bg-violet-500/10"
            : "border-transparent hover:border-white/10 hover:bg-white/[0.05]"
        }`}
        aria-current={active ? "true" : undefined}
      >
        <span
          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${
            active
              ? "bg-violet-500/20 text-violet-200"
              : "bg-white/5 text-slate-400"
          }`}
        >
          <Icon name={iconForName(doc.fileName)} className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[10px] text-slate-300"
            title={doc.fileName}
          >
            {doc.fileName}
          </span>
          <span className="block truncate text-[9px] text-slate-500">
            {doc.chunks} passage{doc.chunks === 1 ? "" : "s"} · session{" "}
            {doc.sessionId.slice(0, 8)}
            {doc.createdAt ? ` · ${timeAgo(doc.createdAt)}` : ""}
          </span>
        </span>
        {active ? (
          <span className="mt-0.5 shrink-0 rounded-full bg-violet-400/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-200">
            Loaded
          </span>
        ) : (
          <span className="mt-0.5 shrink-0 text-[10px] font-medium text-violet-300 opacity-0 transition group-hover:opacity-100">
            Open
          </span>
        )}
      </button>
    </li>
  );
}

export default function Sidebar({
  open,
  onClose,
  sessionId,
  docs,
  onUploaded,
  onNewSession,
  offline,
  resumed,
  documents,
  documentsLoading,
  documentsError,
  activeDocId,
  onRefreshDocuments,
  onSelectDocument,
  user,
  onSignOut,
}) {
  const [copied, setCopied] = useState(false);

  async function copySession() {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can be blocked; ignore */
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[20.5rem] max-w-[86vw] flex-col border-r border-white/10 bg-[#080d18]/95 backdrop-blur-2xl transition-transform duration-300 lg:static lg:z-10 lg:w-80 lg:max-w-none lg:translate-x-0 lg:bg-white/[0.015] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Workspace sidebar"
      >
        <div className="flex items-center gap-2.5 border-b border-white/5 px-4 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40 ring-1 ring-white/20">
            <Icon name="sparkles" className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-tight text-white">
              Lumen
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Multimodal RAG
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
          <UploadPanel sessionId={sessionId} onUploaded={onUploaded} />

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Indexed files
              </h2>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                {docs.length}
              </span>
            </div>

            {docs.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 px-2 py-3 text-center text-[10px] leading-4 text-slate-500">
                {resumed
                  ? "No files in this session yet — upload one to continue."
                  : "No files yet. Upload a document to ground the assistant."}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {docs.map((doc) => (
                  <DocRow
                    key={doc.docId || doc.name}
                    doc={doc}
                    active={Boolean(doc.docId) && doc.docId === activeDocId}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Available documents
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                  {documents.length}
                </span>
                <button
                  type="button"
                  onClick={onRefreshDocuments}
                  disabled={documentsLoading}
                  className="grid h-6 w-6 place-items-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-slate-200 disabled:opacity-40"
                  aria-label="Refresh documents"
                >
                  <Icon
                    name="refresh"
                    className={`h-3.5 w-3.5 ${documentsLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {documentsError ? (
              <div className="rounded-lg bg-rose-500/10 px-2 py-1.5 text-[10px] leading-4 text-rose-300">
                <p>{documentsError}</p>
                <button
                  type="button"
                  onClick={onRefreshDocuments}
                  className="mt-1 rounded-md border border-rose-300/30 px-2 py-0.5 font-medium text-rose-100 transition hover:bg-rose-500/20"
                >
                  Retry
                </button>
              </div>
            ) : documentsLoading && documents.length === 0 ? (
              <div className="space-y-1.5" aria-hidden="true">
                {[0, 1].map((index) => (
                  <div
                    key={index}
                    className="h-8 animate-pulse rounded-lg bg-white/[0.04]"
                  />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 px-2 py-3 text-center text-[10px] leading-4 text-slate-500">
                No documents uploaded yet. Add a file above to begin.
              </p>
            ) : (
              <ul className="max-h-52 space-y-0.5 overflow-y-auto pr-0.5">
                {documents.map((doc) => (
                  <DocumentRow
                    key={doc.docId}
                    doc={doc}
                    active={doc.docId === activeDocId}
                    onSelect={onSelectDocument}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <h2 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Session
            </h2>
            <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950/40 px-2 py-2">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  sessionId
                    ? "bg-emerald-400"
                    : offline
                      ? "bg-rose-400"
                      : "animate-pulse bg-amber-400"
                }`}
              />
              <code className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-400">
                {sessionId || "starting…"}
              </code>
              <button
                type="button"
                onClick={copySession}
                disabled={!sessionId}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-200 disabled:opacity-30"
                aria-label="Copy session id"
              >
                <Icon
                  name={copied ? "check" : "copy"}
                  className={`h-3.5 w-3.5 ${copied ? "text-emerald-300" : ""}`}
                />
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-2 border-t border-white/5 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950/40 px-2 py-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-semibold uppercase text-white ring-1 ring-white/20">
              {(user?.userId || user?.EmailId || "?").slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[11px] font-medium text-slate-200"
                title={user?.userId}
              >
                {user?.userId || "Signed in"}
              </p>
              <p className="truncate text-[9px] text-slate-500" title={user?.EmailId}>
                {user?.EmailId}
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-rose-300"
              aria-label="Sign out"
              title="Sign out"
            >
              <Icon name="logout" className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-violet-400/40 hover:bg-white/[0.07]"
          >
            <Icon name="refresh" className="h-3.5 w-3.5" />
            New session
          </button>
          <p className="text-center text-[10px] text-slate-600">
            Gemini · MongoDB Atlas · Express
          </p>
        </div>
      </aside>
    </>
  );
}
