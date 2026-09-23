import React from 'react';
import { Ellipsis } from 'lucide-react';
import boardImage from '../../assets/images/surf-products/surf-board.png';
import finsImage from '../../assets/images/surf-products/surf-fins.png';
import leashImage from '../../assets/images/surf-products/surf-leash.png';
import bagImage from '../../assets/images/surf-products/surf-board-bag.png';
import wetsuitImage from '../../assets/images/surf-products/surf-wetsuit.png';
import rashguardImage from '../../assets/images/surf-products/surf-rashguard.png';
import ponchoImage from '../../assets/images/surf-products/surf-poncho.png';
import waxImage from '../../assets/images/surf-products/surf-wax.png';
import repairKitImage from '../../assets/images/surf-products/surf-repair-kit.png';
import mountImage from '../../assets/images/surf-products/surf-mount.png';

const surfProductImages: Record<string, string> = {
  board: boardImage,
  fins: finsImage,
  leash: leashImage,
  bag: bagImage,
  wetsuit: wetsuitImage,
  rashguard: rashguardImage,
  poncho: ponchoImage,
  wax: waxImage,
  repair_kit: repairKitImage,
  rack: mountImage
};

const SurfProductIcon: React.FC<{ productType: string; className?: string }> = ({
  productType,
  className = 'h-12 w-12'
}) => {
  if (productType === 'other') {
    return <Ellipsis className={className} strokeWidth={1.8} aria-hidden="true" />;
  }

  const image = surfProductImages[productType];
  if (!image) return null;

  return (
    <img
      src={image}
      alt=""
      className={`${className} object-contain`}
      draggable={false}
      aria-hidden="true"
    />
  );
};

export default SurfProductIcon;
