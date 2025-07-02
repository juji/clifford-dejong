import { useEffect, useRef, useLayoutEffect } from "react";

interface AttractorWorkerOptions {
  onStop?: (e: MessageEvent) => void;
  onPreview: (progress: number, e: MessageEvent) => void;
  onDone: (progress: number, e: MessageEvent) => void;
  onError: (err: string) => void;
  onLoadError: (err: string) => void;
  onReady: (e: MessageEvent) => void;
}

export function useAttractorWorker({
  onStop,
  onPreview,
  onDone,
  onError,
  onLoadError,
  onReady
}: AttractorWorkerOptions) {
  // Gunakan ref untuk menyimpan callback terbaru. Ini menyelesaikan masalah stale closure
  // di mana onmessage handler milik worker hanya akan melihat versi awal
  // dari properti callback.
  const optionsRef = useRef({ onStop, onPreview, onDone, onError, onLoadError, onReady });
  useLayoutEffect(() => {
    optionsRef.current = { onStop, onPreview, onDone, onError, onLoadError, onReady };
  });

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Atur timeout untuk menangani kasus di mana skrip worker gagal dimuat atau diinisialisasi.
    const loadTimeout = setTimeout(() => {
      optionsRef.current.onLoadError("Worker failed to initialize in a timely manner.");
    }, 2000);

    // Inisialisasi worker.
    const worker = new Worker(
      new URL("../workers/attractor-worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    // Message handler terpusat untuk semua event dari worker.
    worker.onmessage = (e: MessageEvent) => {
      // Selalu gunakan callback terbaru dari ref.
      const { onReady, onStop, onPreview, onDone, onError } = optionsRef.current;
      switch (e.data.type) {
        case "ready":
          // Worker siap, hapus timeout pemuatan.
          clearTimeout(loadTimeout);
          onReady(e);
          break;
        case "stopped":
          onStop?.(e);
          break;
        case "preview":
          onPreview(e.data.progress, e);
          break;
        case "done":
          onDone(e.data.progress, e);
          break;
        case "error":
          onError(e.data.error);
          break;
      }
    };

    // Penanganan error yang kuat untuk error saat memuat skrip.
    worker.onerror = (event) => {
      clearTimeout(loadTimeout);
      optionsRef.current.onLoadError(`Worker script error: ${event.message}`);
      event.preventDefault();
    };

    // Fungsi cleanup untuk menghentikan worker dan menghapus timeout saat unmount.
    return () => {
      clearTimeout(loadTimeout);
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return workerRef;
}
