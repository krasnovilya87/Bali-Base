import React from 'react';

interface ThreeDIconProps {
  emoji: string;
  className?: string;
  size?: number;
}

const LEGACY_EMOJI_MAP: Record<string, string> = {
  'рџЏЎ': '🏡',
  'рџ›µ': '🛵',
  'рџ§‘вЂЌрџ’ј': '💼',
  'рџ“ў': '📣',
  'рџЋ‰': '🎉',
  'рџ’¬': '💬',
  'рџ§­': '🧭',
  'рџЏў': '🏢',
  'рџ›Њ': '🛌',
  'рџЏЍ': '🏍',
  'рџЏЌ': '🏍',
  'рџљ—': '🚗',
  'рџЏќ': '🏝',
  'рџЏ„вЂЌв™‚пёЏ': '🏄',
  'рџЏ„': '🏄',
  'рџ’ј': '💼',
  'рџ”Њ': '🔌',
  'рџ‘•': '👕',
  'рџЋЁ': '🎨'
};

export const ThreeDIcon: React.FC<ThreeDIconProps> = ({ emoji, className = '', size = 38 }) => {
  const displayEmoji = LEGACY_EMOJI_MAP[emoji] || emoji;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none pointer-events-none leading-none drop-shadow-sm ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.72)}px` }}
      aria-hidden="true"
    >
      {displayEmoji}
    </span>
  );
};
