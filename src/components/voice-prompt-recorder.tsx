"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Voice prompt recorder.
//
// The database CHECKs voice_prompt_duration_ms <= 30000, so recording stops
// itself at 30s rather than letting someone record two minutes and then be
// told it was rejected.

const MAX_MS = 30000;

export const VOICE_QUESTIONS = [
  "What does a perfect Saturday in Austin look like?",
  "What song always gets you on the dance floor?",
  "Tell me about the best meal you have had in this city.",
  "What is something you are hopeless at?",
  "What are you looking for here, in your own words?",
];

// Chrome and Android record webm; iOS Safari records mp4. Ask the browser what
// it can actually do rather than assuming, and keep the file extension matched
// to the mime type so Supabase storage accepts the upload.
function pickMimeType(): { mimeType?: string; ext: string } {
  if (typeof MediaRecorder === "undefined") return { ext: "webm" };
  const candidates: [string, string][] = [
    ["audio/webm;codecs=opus", "webm"],
    ["audio/webm", "webm"],
    ["audio/mp4", "m4a"],
    ["audio/mpeg", "mp3"],
  ];
  for (const [mimeType, ext] of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) return { mimeType, ext };
  }
  return { ext: "webm" };
}

function formatMs(ms: number) {
  const s = Math.round(ms / 1000);
  return `0:${String(s).padStart(2, "0")}`;
}

export default function VoicePromptRecorder({
  profileId,
  initialUrl,
  initialQuestion,
  initialDurationMs,
  onSaved,
}: {
  profileId: string;
  initialUrl?: string | null;
  initialQuestion?: string | null;
  initialDurationMs?: number | null;
  onSaved?: (v: { url: string | null; question: string | null; durationMs: number | null }) => void;
}) {
  const supabase = createClient();

  const [question, setQuestion] = useState(initialQuestion ?? VOICE_QUESTIONS[0]);
  const [savedUrl, setSavedUrl] = useState<string | null>(initialUrl ?? null);
  const [savedMs, setSavedMs] = useState<number | null>(initialDurationMs ?? null);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [draft, setDraft] = useState<{ blob: Blob; url: string; ms: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        typeof MediaRecorder !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia,
    );
  }, []);

  // A recording left running when the user navigates away would hold the
  // microphone open, so tear everything down on unmount.
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") rec.stop();
      rec?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function stopRecording() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }

  async function startRecording() {
    setError(null);
    if (draft) URL.revokeObjectURL(draft.url);
    setDraft(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { mimeType } = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const ms = Math.min(Date.now() - startedAtRef.current, MAX_MS);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setDraft({ blob, url: URL.createObjectURL(blob), ms });
        rec.stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        if (tickRef.current) clearInterval(tickRef.current);
      };
      recorderRef.current = rec;
      startedAtRef.current = Date.now();
      rec.start();
      setRecording(true);
      setElapsed(0);
      tickRef.current = setInterval(() => {
        const ms = Date.now() - startedAtRef.current;
        setElapsed(ms);
        if (ms >= MAX_MS) stopRecording();
      }, 100);
    } catch {
      setError("We could not reach your microphone. Check that your browser is allowed to use it.");
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    const { ext } = pickMimeType();
    const path = `${profileId}/voice-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-media")
      .upload(path, draft.blob, { contentType: draft.blob.type, upsert: false });
    if (uploadError) {
      setError("We could not upload that recording. Please try again.");
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        voice_prompt_url: data.publicUrl,
        voice_prompt_question: question,
        voice_prompt_duration_ms: draft.ms,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);
    if (updateError) {
      setError("Your recording uploaded, but we could not save it to your profile.");
      setBusy(false);
      return;
    }
    URL.revokeObjectURL(draft.url);
    setDraft(null);
    setSavedUrl(data.publicUrl);
    setSavedMs(draft.ms);
    onSaved?.({ url: data.publicUrl, question, durationMs: draft.ms });
    setBusy(false);
  }

  async function removeSaved() {
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        voice_prompt_url: null,
        voice_prompt_question: null,
        voice_prompt_duration_ms: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);
    if (updateError) {
      setError("We could not remove your recording. Please try again.");
      setBusy(false);
      return;
    }
    setSavedUrl(null);
    setSavedMs(null);
    onSaved?.({ url: null, question: null, durationMs: null });
    setBusy(false);
  }

  if (!supported) {
    return (
      <p className="text-xs text-ink-soft">
        This browser cannot record audio. Try Safari on iPhone or Chrome on Android.
      </p>
    );
  }

  return (
    <div>
      <label className="mt-3 block text-xs font-semibold text-ink-soft" htmlFor="voice-question">
        Choose what to answer
      </label>
      <select
        id="voice-question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={recording || busy}
        className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3 text-sm"
      >
        {VOICE_QUESTIONS.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>

      {savedUrl && !draft && (
        <div className="mt-3 rounded-xl border border-line bg-cream p-3">
          <p className="text-xs font-semibold text-ink">
            {initialQuestion ?? question}
            {savedMs ? ` \u00b7 ${formatMs(savedMs)}` : ""}
          </p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio src={savedUrl} controls className="mt-2 w-full" />
          <button
            type="button"
            onClick={removeSaved}
            disabled={busy}
            className="mt-2 min-h-11 text-sm font-semibold text-red-600 disabled:opacity-50"
          >
            Remove recording
          </button>
        </div>
      )}

      {draft && (
        <div className="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
          <p className="text-xs font-semibold text-ink">Preview \u00b7 {formatMs(draft.ms)}</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio src={draft.url} controls className="mt-2 w-full" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(draft.url);
                setDraft(null);
              }}
              disabled={busy}
              className="min-h-11 rounded-xl border border-line px-3 text-sm font-bold text-ink-soft disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={busy}
              className="min-h-11 rounded-xl bg-brand px-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Saving\u2026" : "Save to profile"}
            </button>
          </div>
        </div>
      )}

      {!draft && (
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={busy}
          className={`mt-3 min-h-12 w-full rounded-xl px-4 text-sm font-bold disabled:opacity-50 ${
            recording ? "bg-red-600 text-white" : "bg-ink text-cream"
          }`}
        >
          {recording
            ? `Stop \u00b7 ${formatMs(elapsed)} / 0:30`
            : savedUrl
              ? "Record a new one"
              : "Start recording"}
        </button>
      )}

      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
