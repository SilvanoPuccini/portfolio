'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Dictado por voz, con el reconocimiento que ya trae el navegador.
 *
 * Sirve para no tipear mientras mirás al cliente: apretás el micrófono y lo
 * que decís se escribe en la casilla. Lo que NO hace, y conviene saberlo: capta
 * tu micrófono, no la voz del cliente. Para transcribir la conversación entera
 * hace falta la grabación de Cal.com, que es de plan pago.
 *
 * Solo existe en navegadores basados en Chrome. Donde no está, el botón no se
 * muestra: un botón que no hace nada es peor que ningún botón.
 */

type RecognitionResult = { 0: { transcript: string }; isFinal: boolean };
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { resultIndex: number; results: RecognitionResult[] }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function createRecognition(): Recognition | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = 'es-AR';
  recognition.continuous = true;
  recognition.interimResults = false;
  return recognition;
}

export function useDictation(onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const handler = useRef(onText);

  handler.current = onText;

  useEffect(() => {
    setSupported(createRecognition() !== null);
    return () => { recognition.current?.stop(); };
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      recognition.current?.stop();
      setListening(false);
      return;
    }

    const instance = createRecognition();
    if (!instance) return;

    instance.onresult = (event) => {
      // Solo lo definitivo: los resultados provisorios reescriben la frase
      // entera a cada palabra y dejan la casilla temblando.
      const text = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript.trim())
        .join(' ')
        .trim();
      if (text) handler.current(text);
    };
    instance.onend = () => setListening(false);
    instance.onerror = () => setListening(false);

    recognition.current = instance;
    instance.start();
    setListening(true);
  }, [listening]);

  return { supported, listening, toggle };
}
