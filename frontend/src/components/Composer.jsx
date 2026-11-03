import { useEffect, useRef } from "react";
import Icon from "./Icons.jsx";

export default function Composer({
  value,
  onChange,
  onSend,
  disabled,
  sending,
  hint,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [value]);

  function submit() {
    if (disabled || sending || !value.trim()) return;
    onSend();
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="relative z-10 border-t border-white/5 bg-gradient-to-t from-[#05070f] via-[#05070f]/95 to-transparent px-3 pb-4 pt-3 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div
          className={`flex items-end gap-2 rounded-2xl border p-2 transition-all duration-200 ${
            disabled
              ? "border-white/5 bg-white/[0.02]"
              : "border-white/10 bg-white/[0.04] focus-within:border-violet-400/50 focus-within:bg-white/[0.06] focus-within:ring-4 focus-within:ring-violet-500/10"
          }`}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? "Upload a document to start chatting…"
                : "Ask a question about your files…"
            }
            className="max-h-40 w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed"
            aria-label="Your question"
          />

          <button
            type="button"
            onClick={submit}
            disabled={disabled || sending || !value.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-950/50 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            aria-label="Send question"
          >
            {sending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Icon name="send" className="h-4 w-4" />
            )}
          </button>
        </div>

        <p className="mt-2 px-1 text-center text-[11px] leading-5 text-slate-500">
          {hint}
        </p>
      </div>
    </div>
  );
}
