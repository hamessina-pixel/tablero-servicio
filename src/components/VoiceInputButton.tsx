"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultLike {
  results: { [i: number]: { [j: number]: { transcript: string } } };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionResultLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function crearReconocedor(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const Ctor = (window as unknown as Record<string, unknown>).SpeechRecognition
    || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  if (!Ctor) return null;
  return new (Ctor as { new (): SpeechRecognitionLike })();
}

/** Convierte "cinco cinco dos seis" en "5526" si el resultado es solo dígitos
 *  dictados uno por uno (típico al leer un código de repuesto en voz alta). */
function limpiarCodigoDictado(texto: string): string {
  const solo = texto.trim();
  if (/^[\d\s]+$/.test(solo)) return solo.replace(/\s+/g, "");
  return solo;
}

export function VoiceInputButton({ onResultado }: { onResultado: (texto: string) => void }) {
  const [escuchando, setEscuchando] = useState(false);
  const [soportado, setSoportado] = useState(true);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSoportado(Boolean(crearReconocedor()));
  }, []);

  function alternar() {
    if (escuchando) {
      recRef.current?.stop();
      return;
    }
    const rec = crearReconocedor();
    if (!rec) { setSoportado(false); return; }
    rec.lang = "es-AR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const texto = e.results[0]?.[0]?.transcript ?? "";
      if (texto) onResultado(limpiarCodigoDictado(texto));
    };
    rec.onerror = () => setEscuchando(false);
    rec.onend = () => setEscuchando(false);
    recRef.current = rec;
    setEscuchando(true);
    rec.start();
  }

  if (!soportado) return null;

  return (
    <button
      type="button"
      onClick={alternar}
      title={escuchando ? "Escuchando… (click para detener)" : "Buscar por voz"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border text-base transition-colors
                  ${escuchando
                    ? "border-[var(--status-critical)] bg-[var(--status-critical)]/10 text-[var(--status-critical)]"
                    : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"}`}
    >
      {escuchando ? "●" : "🎤"}
    </button>
  );
}
