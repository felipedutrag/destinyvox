"use client";

import { useState } from "react";
import {
  ConversationProvider,
  useConversationClientTool,
  useConversationControls,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { AudioLines, Loader2, Mic, PhoneOff, Sparkles } from "lucide-react";

function AgentControls() {
  const [error, setError] = useState<string | null>(null);
  const { startSession, endSession } = useConversationControls();
  const { status, message } = useConversationStatus();
  const { isSpeaking } = useConversationMode();

  useConversationClientTool("navigateToPricing", () => {
    document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return "A oferta do mapa foi mostrada na página.";
  });

  useConversationClientTool("highlightNumerologyPillar", (parameters) => {
    const number = parameters.number;
    if (typeof number !== "string" || !/^0[1-6]$/.test(number)) return "Pilar não encontrado.";
    const pillar = document.querySelector<HTMLElement>(`[data-agent-pillar="${number}"]`);
    if (!pillar) return "O pilar não está visível nesta página.";

    pillar.scrollIntoView({ behavior: "smooth", block: "center" });
    pillar.classList.add("agent-pillar-highlight");
    window.setTimeout(() => pillar.classList.remove("agent-pillar-highlight"), 3_500);
    return `Pilar ${number} destacado na página.`;
  });

  const beginConversation = async () => {
    setError(null);
    try {
      await startSession();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar a conversa.");
    }
  };

  const isConnected = status === "connected";
  const isStarting = status === "connecting";

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      {isConnected ? (
        <button
          type="button"
          onClick={() => void endSession()}
          className="inline-flex h-12 items-center justify-center gap-2 border border-red-400/30 bg-red-950/30 px-6 font-mono text-xs font-bold uppercase tracking-wider text-red-200 transition-colors hover:bg-red-900/40"
        >
          <PhoneOff className="h-4 w-4" />
          Encerrar conversa
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void beginConversation()}
          disabled={isStarting}
          className="inline-flex h-12 items-center justify-center gap-2 bg-amber-400 px-6 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
        >
          {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          {isStarting ? "Conectando..." : "Conversar por voz"}
        </button>
      )}
      <p className="font-mono text-[10px] text-neutral-500" aria-live="polite">
        {isConnected ? isSpeaking ? "A assistente está falando..." : "Conversa ativa · pode falar" : status === "disconnected" ? "Clique para iniciar e permita o acesso ao microfone." : ""}
      </p>
      {(error || message) && <p role="alert" className="max-w-lg text-center font-mono text-xs text-amber-300">{error || message}</p>}
    </div>
  );
}

export function ElevenLabsAgent() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  return (
    <section className="px-4 sm:px-12 pb-12 sm:pb-16 max-w-4xl mx-auto" aria-labelledby="voice-agent-title">
      <div className="border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-[#080808] p-5 sm:p-8 text-center">
        <div className="flex items-center justify-center gap-2 font-mono text-[10px] sm:text-xs tracking-[0.2em] text-amber-300 uppercase">
          <Sparkles className="w-4 h-4" />
          ElevenLabs Agents · Voz em português
        </div>
        <h2 id="voice-agent-title" className="font-editorial text-2xl sm:text-3xl text-white mt-3">
          Converse com a DestinyVox.
        </h2>
        <p className="font-mono text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
          Tire dúvidas sobre o mapa por voz. A assistente também pode mostrar os pilares e levar você até a oferta.
        </p>
        {agentId ? (
          <ConversationProvider agentId={agentId}>
            <AgentControls />
          </ConversationProvider>
        ) : (
          <div className="mt-5 inline-flex items-center gap-2 border border-neutral-800 px-4 py-3 font-mono text-[10px] text-neutral-400">
            <AudioLines className="h-4 w-4 text-amber-400" />
            Configure ELEVENLABS_API_KEY e execute npm run setup:elevenlabs-agent.
          </div>
        )}
      </div>
    </section>
  );
}
