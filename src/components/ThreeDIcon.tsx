import React, { useState, useEffect } from 'react';

// Explicit manual mappings for perfect high-fidelity 3D emojis
const EMOJI_TO_3D_MAP: Record<string, string> = {
  // L1 Categories
  '🏡': '1f3e1', // entire_place / housing (House with Garden)
  '🛵': '1f6f5', // scooters / transport (Motor Scooter)
  '🧑‍💼': '1f4bc', // services (mapped to Briefcase 💼 for ultra-clean 3D render)
  '📢': '1f4e3', // ads (Megaphone)
  '🎉': '1f389', // afisha (Party Popper)
  '💬': '1f4ac', // life (Speech Balloon)
  '🧭': '1f9ed', // useful (Compass)

  // L2 Subcategories
  '🏢': '1f3e2', // private_suite (Office Building)
  '🛌': '1f6cf', // private_room (Bed)
  '🏍': '1f3cd', // motorcycles / trans_sale (Motorcycle)
  '🚗': '1f697', // cars (Automobile)
  '🏄‍♂️': '1f3c4', // person surfing (mapped to 🏄 Surfer)
  '🏄': '1f3c4',  // surfing
  '💼': '1f4bc',  // briefcase
  '🔌': '1f50c',  // electronics / plug
  '👕': '1f455',  // clothes / t-shirt
  '🎨': '1f3a8'   // exhibitions / palette
};

interface ThreeDIconProps {
  emoji: string;
  className?: string;
  size?: number;
}

export const ThreeDIcon: React.FC<ThreeDIconProps> = ({ emoji, className = '', size = 38 }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset states on emoji change
    setHasError(false);

    // Get the hex code
    let hex = EMOJI_TO_3D_MAP[emoji];
    if (!hex) {
      // Calculate code points dynamically if not in map
      const points = (Array.from(emoji) as string[])
        .map(char => char.codePointAt(0)?.toString(16))
        .filter(Boolean) as string[];
      // Filter out variation selectors (fe0f)
      const cleanPoints = points.filter(p => p !== 'fe0f');
      hex = cleanPoints.join('-');
    }

    if (hex) {
      // Use the beautiful master assets from LobeHub fluent emoji
      setImgSrc(`https://cdn.jsdelivr.net/gh/lobehub/fluent-emoji@master/assets/3d/${hex}.webp`);
    } else {
      setHasError(true);
    }
  }, [emoji]);

  // If there's an error or we couldn't resolve the source, render the native emoji gracefully
  if (hasError || !imgSrc) {
    return (
      <span 
        className={`${className} select-none`}
        style={{ fontSize: `${size * 0.9}px`, lineHeight: 1 }}
      >
        {emoji}
      </span>
    );
  }

  return (
    <div 
      className="relative flex items-center justify-center shrink-0 select-none pointer-events-none" 
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src={imgSrc}
        alt={emoji}
        className={`w-full h-full object-contain transition-all duration-300 drop-shadow-sm ${className}`}
        onError={() => {
          // Fall back to native if image fails to load
          setHasError(true);
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
