import { useRef, useState } from "react";
import Icon from "./Icons.jsx";
import { uploadFiles } from "../lib/api.js";

const MAX_FILES = 3;
const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT =
  ".pdf,.doc,.docx,image/png,image/jpeg,image/webp,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,audio/webm,audio/flac";

const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i;

function isAudio(file) {
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.test(file.name);
}

function iconFor(file) {
  if (isAudio(file)) return "audio";
  if (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp)$/i.test(file.name)
  ) {
    return "image";
  }
  return "file";
}

function isSupported(file) {
  return (
    /\.(pdf|docx?)$/i.test(file.name) ||
    ["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    isAudio(file)
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPanel({ sessionId, onUploaded }) {
  const inputRef = useRef(null);
  const [pending, setPending] = useState([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const canPick = Boolean(sessionId) && !busy;

  function addFiles(fileList) {
    setError("");
    setNotice("");

    const next = [...pending];

    for (const file of Array.from(fileList)) {
      if (next.length >= MAX_FILES) {
        setError(`You can queue up to ${MAX_FILES} files per upload.`);
        break;
      }
      if (!isSupported(file)) {
        setError(
          `${file.name} is not supported. Use PDF, DOCX, PNG/JPG/WEBP, or audio (MP3/WAV/M4A/AAC/OGG/FLAC).`,
        );
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than 20 MB.`);
        continue;
      }
      if (next.some((f) => f.name === file.name && f.size === file.size)) {
        continue;
      }
      next.push(file);
    }

    setPending(next);
  }

  function removeAt(index) {
    setPending((prev) => prev.filter((_, i) => i !== index));
    setError("");
  }

  async function upload() {
    if (!pending.length || busy) return;
    if (!sessionId) {
      setError("Session is still starting. Try again in a moment.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const data = await uploadFiles(sessionId, pending);
      const entries = data.uploaded_res || [];

      if (entries.length === 0) {
        setNotice("Already indexed — duplicate file skipped.");
      } else {
        const chunks = entries.reduce(
          (total, entry) => total + (entry.totalChunks || 0),
          0,
        );
        setNotice(
          `Indexed ${entries.length} file${entries.length === 1 ? "" : "s"} · ${chunks} passages`,
        );
        onUploaded(entries);
      }

      setPending([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Knowledge base
        </h2>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
          {pending.length}/{MAX_FILES}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={canPick ? 0 : -1}
        aria-label="Choose files to upload"
        onClick={() => canPick && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (canPick && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (canPick) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (canPick) addFiles(event.dataTransfer.files);
        }}
        className={`group flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-3 py-5 text-center transition ${
          dragging
            ? "border-violet-400/70 bg-violet-500/10"
            : "border-white/15 bg-slate-950/30 hover:border-violet-400/40 hover:bg-white/[0.04]"
        } ${canPick ? "" : "cursor-not-allowed opacity-50"}`}
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-400/10 ring-1 ring-white/10 transition group-hover:scale-105">
          <Icon name="upload" className="h-4 w-4 text-violet-300" />
        </span>
        <span className="text-xs font-medium text-slate-200">
          Drop files or{" "}
          <span className="text-violet-300 underline decoration-violet-400/40 underline-offset-2">
            browse
          </span>
        </span>
        <span className="text-[10px] text-slate-500">
          PDF · DOCX · PNG · JPG · WEBP · MP3 · WAV · M4A
        </span>
      </div>

      {pending.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {pending.map((file, index) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/5">
                <Icon
                  name={iconFor(file)}
                  className="h-3.5 w-3.5 text-slate-400"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] text-slate-200">{file.name}</p>
                <p className="text-[10px] text-slate-500">
                  {formatSize(file.size)}
                </p>
              </div>
              {busy ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-violet-300" />
              ) : (
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="grid h-6 w-6 place-items-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-rose-300"
                  aria-label={`Remove ${file.name}`}
                >
                  <Icon name="close" className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {(error || notice) && (
        <p
          className={`mt-2 flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[10px] leading-4 ${
            error
              ? "bg-rose-500/10 text-rose-300"
              : "bg-emerald-500/10 text-emerald-300"
          }`}
        >
          <Icon
            name={error ? "alert" : "check"}
            className="mt-0.5 h-3 w-3 shrink-0"
          />
          <span>{error || notice}</span>
        </p>
      )}

      <button
        type="button"
        onClick={upload}
        disabled={!sessionId || busy || pending.length === 0}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {busy ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Processing…
          </>
        ) : (
          <>
            <Icon name="upload" className="h-3.5 w-3.5" />
            Upload {pending.length > 0 ? `${pending.length} ` : ""}file
            {pending.length === 1 ? "" : "s"}
          </>
        )}
      </button>
    </section>
  );
}
