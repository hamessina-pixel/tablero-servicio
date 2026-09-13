"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";

interface SpeechRecognitionResultLike {
  results: { [i: number]: { [j: number]: { transcript: string } } };
}
interface SpeechRecognitionErrorLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionResultLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
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

const MENSAJE_ERROR: Record<string, string> = {
  "not-allowed": "Permiso de micrófono denegado. Habilitalo en la configuración del sitio (candado junto a la URL) y probá de nuevo.",
  "service-not-allowed": "El navegador bloqueó el acceso al micrófono para este sitio.",
  "no-speech": "No se detectó voz. Probá de nuevo, más cerca del micrófono.",
  "audio-capture": "No se encontró ningún micrófono conectado.",
  network: "Sin conexión para el reconocimiento de voz. Revisá tu internet.",
  aborted: "",
};

export function VoiceInputButton({ onResultado }: { onResultado: (texto: string) => void }) {
  const toast = useToast();
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
    rec.lang = "es-ES";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setEscuchando(true);
    rec.onresult = (e) => {
      const texto = e.results[0]?.[0]?.transcript ?? "";
      if (texto) onResultado(limpiarCodigoDictado(texto));
    };
    rec.onerror = (e) => {
      setEscuchando(false);
      const msg = MENSAJE_ERROR[e.error] ?? `No se pudo usar el micrófono (${e.error}).`;
      if (msg) toast(msg, "error");
    };
    rec.onend = () => setEscuchando(false);
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setEscuchando(false);
      toast("No se pudo iniciar el micrófono.", "error");
    }
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
