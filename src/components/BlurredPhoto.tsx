import React from 'react';

type BlurredPhotoProps = {
  key?: string | number;
  src: string;
  alt: string;
  loading?: 'eager' | 'lazy';
  onDragStart?: (event: React.DragEvent<HTMLImageElement>) => void;
};

// Photo shown whole (object-contain) over a blurred copy of itself, so portrait photos fill the frame
// without cropping, like video players do.
export default function BlurredPhoto({ src, alt, loading = 'lazy', onDragStart }: BlurredPhotoProps) {
  return (
    <div className="relative w-full h-full shrink-0 overflow-hidden bg-black select-none pointer-events-none">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        loading={loading}
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
      />
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        decoding="async"
        loading={loading}
        onDragStart={onDragStart}
        className="relative w-full h-full object-contain"
      />
    </div>
  );
}
