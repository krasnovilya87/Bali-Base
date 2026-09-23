import React from 'react';
import matImage from '../../assets/images/yoga-products/yoga-mat.png';
import blocksImage from '../../assets/images/yoga-products/yoga-blocks.png';
import cushionImage from '../../assets/images/yoga-products/yoga-cushion.png';
import strapImage from '../../assets/images/yoga-products/yoga-strap.png';
import bolsterImage from '../../assets/images/yoga-products/yoga-bolster.png';
import wheelImage from '../../assets/images/yoga-products/yoga-wheel.png';
import hammockImage from '../../assets/images/yoga-products/yoga-hammock.png';
import blanketImage from '../../assets/images/yoga-products/yoga-blanket.png';
import accessorySetImage from '../../assets/images/yoga-products/yoga-accessory-set.png';

const yogaProductImages: Record<string, string> = {
  mat: matImage,
  blocks: blocksImage,
  meditation_cushion: cushionImage,
  strap: strapImage,
  bolster: bolsterImage,
  wheel: wheelImage,
  hammock: hammockImage,
  blanket: blanketImage,
  accessories: accessorySetImage,
  set: accessorySetImage
};

const YogaProductIcon: React.FC<{ productType: string; className?: string }> = ({
  productType,
  className = 'h-6 w-6'
}) => {
  const image = yogaProductImages[productType];
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

export default YogaProductIcon;
