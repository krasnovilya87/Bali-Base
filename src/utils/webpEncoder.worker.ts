/// <reference types="vite/client" />
import encode, { init } from '@jsquash/webp/encode';
import wasmUrl from '@jsquash/webp/codec/enc/webp_enc.wasm?url';
import simdWasmUrl from '@jsquash/webp/codec/enc/webp_enc_simd.wasm?url';

self.onmessage = async (event: MessageEvent<ImageData>) => {
  try {
    await init({ locateFile: (path: string) => path.includes('simd') ? simdWasmUrl : wasmUrl });
    const result = await encode(event.data, { quality: 85 });
    self.postMessage({ result }, { transfer: [result] });
  } catch {
    self.postMessage({ error: true });
  }
};
