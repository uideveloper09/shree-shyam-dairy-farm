"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function VoicePage() {
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");

  const voice = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, locale: "HI_IN" }),
      });
      return res.json();
    },
    onSuccess: (data) => setReply(data.reply || JSON.stringify(data)),
  });

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setReply("Browser speech recognition not supported. Type your command below.");
      return;
    }
    const rec = new SR();
    rec.lang = "hi-IN";
    rec.onresult = (e) => setTranscript(e.results[0][0].transcript);
    rec.start();
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold">Voice AI</h2>
      <p className="mt-2 text-sm text-white/60">
        Hindi / English · try &quot;aaj kitne order&quot; or &quot;doodh kitna&quot;
      </p>
      <button
        type="button"
        onClick={startListening}
        className="mt-4 rounded-full bg-[#C89B3C] px-6 py-3 text-sm font-semibold text-[#082F63]"
      >
        🎤 Mic (browser STT)
      </button>
      <input
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Ya yahan likho…"
        className="mt-4 w-full rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none"
      />
      <button
        type="button"
        onClick={() => voice.mutate()}
        disabled={!transcript.trim()}
        className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-xs text-white"
      >
        Send
      </button>
      {reply && <p className="mt-4 rounded-lg bg-white/5 p-3 text-sm">{reply}</p>}
    </div>
  );
}
