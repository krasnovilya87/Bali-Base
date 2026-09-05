let encodingQueue: Promise<unknown> = Promise.resolve();

export const encodeCanvasWebp = async (canvas: HTMLCanvasElement): Promise<Blob> => {
  const nativeBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (nativeBlob?.type === 'image/webp') return nativeBlob;

  // Limit fallback encoding to one worker at a time on memory-constrained phones.
  const pending = encodingQueue.then(() => new Promise<Blob>((resolve, reject) => {
    const worker = new Worker(new URL('./webpEncoder.worker.ts', import.meta.url), { type: 'module' });
    const finish = (result?: ArrayBuffer) => {
      clearTimeout(timeout);
      worker.terminate();
      if (result) resolve(new Blob([result], { type: 'image/webp' }));
      else reject(new Error('WebP encoding failed'));
    };
    const timeout = setTimeout(() => finish(), 120000);
    worker.onmessage = event => finish(event.data.result);
    worker.onerror = () => finish();
    worker.onmessageerror = () => finish();
    try {
      const context = canvas.getContext('2d');
      if (!context) { finish(); return; }
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      worker.postMessage(pixels, [pixels.data.buffer]);
    } catch {
      finish();
    }
  }));
  encodingQueue = pending.catch(() => undefined);
  return pending;
};
