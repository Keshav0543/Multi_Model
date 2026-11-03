import { useState } from "react";
import ReactMarkdown from "react-markdown";
import Icon from "./Icons.jsx";

const markdownComponents = {
  h1: ({ node, ...props }) => (
    <h1 className="mb-3 mt-4 text-lg font-semibold text-white first:mt-0" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="mb-2 mt-4 text-base font-semibold text-white first:mt-0" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="mb-1.5 mt-3 text-sm font-semibold text-violet-200 first:mt-0" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mb-3 text-sm leading-7 text-slate-200 last:mb-0" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 marker:text-violet-400/80 last:mb-0" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 marker:text-violet-400/80 last:mb-0" {...props} />
  ),
  li: ({ node, ...props }) => <li className="pl-0.5 text-sm leading-6 text-slate-200" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
  em: ({ node, ...props }) => <em className="text-slate-300" {...props} />,
  a: ({ node, ...props }) => (
    <a
      className="text-cyan-300 underline decoration-cyan-400/40 underline-offset-2 transition hover:text-cyan-200"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote className="mb-3 border-l-2 border-violet-400/40 pl-3 text-sm italic text-slate-400" {...props} />
  ),
  pre: ({ node, ...props }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs leading-6 [&_code]:bg-transparent [&_code]:p-0" {...props} />
  ),
  code: ({ node, ...props }) => (
    <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-200" {...props} />
  ),
  hr: () => <hr className="my-4 border-white/10" />,
};

function Avatar({ kind }) {
  if (kind === "user") {
    return (
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-[10px] font-semibold text-slate-200 ring-1 ring-white/10">
        You
      </div>
    );
  }

  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-950/50 ring-1 ring-white/20">
      <Icon name="sparkles" className="h-4 w-4 text-white" />
    </div>
  );
}

function Sources({ results }) {
  const [open, setOpen] = useState(false);

  if (!results?.length) return null;

  const lowRelevance = results.some((r) => (r.similarity ?? 0) < 0.6);

  return (
    <div className="mt-4 border-t border-white/5 pt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 transition hover:text-slate-200"
        aria-expanded={open}
      >
        <Icon name="database" className="h-3.5 w-3.5 text-violet-300" />
        {results.length} retrieved passage{results.length === 1 ? "" : "s"}
        {lowRelevance && (
          <span className="ml-1 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] normal-case tracking-normal text-amber-300">
            low relevance
          </span>
        )}
        <Icon
          name="chevronDown"
          className={`ml-auto h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ol className="animate-rise mt-3 space-y-2">
          {results.map((result, index) => {
            const percent = Math.round((result.similarity ?? 0) * 100);

            return (
              <li
                key={index}
                className="rounded-xl border border-white/10 bg-slate-950/40 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    #{index + 1}
                  </span>
                  {result.fileName && (
                    <span
                      className="min-w-0 truncate text-[10px] text-slate-400"
                      title={result.fileName}
                    >
                      {result.fileName}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"
                        style={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[10px] text-cyan-200">
                      {percent}%
                    </span>
                  </div>
                </div>
                <p className="max-h-28 overflow-y-auto whitespace-pre-wrap pr-1 text-xs leading-5 text-slate-400">
                  {result.text}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="animate-rise flex gap-3">
      <Avatar />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-4 py-3.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="dot h-1.5 w-1.5 rounded-full bg-violet-300"
            style={{ animationDelay: `${index * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);

  const isNotFound =
    typeof message.content === "string" &&
    /couldn'?t find (this )?information/i.test(message.content);
  const hasSources = Boolean(message.sources?.length);
  const showContextHint = isNotFound && hasSources;

  if (message.error) {
    return (
      <div className="animate-rise flex gap-3">
        <Avatar />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl rounded-tl-md border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-300">
              <Icon name="alert" className="h-3.5 w-3.5" />
              Request failed
            </p>
            <p className="mt-1.5 text-sm leading-6 text-rose-100/80">
              {message.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="animate-rise flex justify-end gap-3">
        <div className="max-w-[88%] rounded-2xl rounded-tr-md bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-violet-950/40 sm:max-w-[80%]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <Avatar kind="user" />
      </div>
    );
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard can be blocked; ignore */
    }
  }

  return (
    <div className="animate-rise flex gap-3">
      <Avatar />
      <div className="min-w-0 flex-1">
        <div className="group relative rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-4 py-3 shadow-xl shadow-black/20 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
              Lumen
            </span>
            <button
              type="button"
              onClick={copyAnswer}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-200 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              aria-label="Copy answer"
            >
              <Icon
                name={copied ? "check" : "copy"}
                className={`h-3.5 w-3.5 ${copied ? "text-emerald-300" : ""}`}
              />
            </button>
          </div>

          <div className="text-sm">
            <ReactMarkdown components={markdownComponents}>
              {message.content || ""}
            </ReactMarkdown>
          </div>

          {showContextHint && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2">
              <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
              <p className="text-[11px] leading-4 text-amber-200/90">
                The model found {message.sources.length} relevant passage
                {message.sources.length === 1 ? "" : "s"} but couldn't extract a
                confident answer. Try rephrasing your question or uploading a
                more detailed document.
              </p>
            </div>
          )}

          <Sources results={message.sources} />
        </div>
      </div>
    </div>
  );
}
