import { useMemo, useState } from 'react';
import { Listing } from '../../../types';
import { defaultCategoriesList, defaultSubcategoriesMap } from '../defaultMenu';

type CategorySourceItem = {
  id: string;
  label: string;
  icon: string;
  desc: string;
  image?: any;
  l2?: string;
};

type SubcategorySourceItem = {
  id: string;
  label: string;
  icon: string;
};

type UseCategoryStepsParams = {
  initialListing?: Listing | null;
  propCategoriesList?: CategorySourceItem[];
  propSubcategoriesMap?: Record<string, SubcategorySourceItem[]>;
  menuOverrides?: any;
};

export const useCategorySteps = ({
  initialListing,
  propCategoriesList,
  propSubcategoriesMap,
  menuOverrides
}: UseCategoryStepsParams) => {
  const categoriesToUse = (propCategoriesList || defaultCategoriesList) as CategorySourceItem[];
  const subcategoriesMapToUse = propSubcategoriesMap || defaultSubcategoriesMap;

  const [category, setCategory] = useState<any>(initialListing?.category || 'housing');
  const [subCategory, setSubCategory] = useState<string>(initialListing?.subCategory || 'entire_place');

  const categoriesList = useMemo(() => {
    return categoriesToUse.map(cat => {
      const displayLabel = menuOverrides?.l1?.[cat.id]?.label || cat.label;
      const displayIcon = menuOverrides?.l1?.[cat.id]?.icon || cat.icon || '📦';
      const displayImage = menuOverrides?.l1?.[cat.id]?.image || cat.image;
      const displayDesc = cat.desc;
      return {
        id: cat.id,
        label: displayLabel,
        icon: displayIcon,
        image: displayImage,
        desc: displayDesc
      };
    });
  }, [categoriesToUse, menuOverrides]);

  const subcategories = useMemo(() => {
    const rawSubs = subcategoriesMapToUse[category] || [];
    return rawSubs.map(sub => {
      const displayLabel = menuOverrides?.l2?.[sub.id]?.label || sub.label;
      const displayIcon = menuOverrides?.l2?.[sub.id]?.icon || sub.icon || '⭐';
      const displayCustomImage = menuOverrides?.l2?.[sub.id]?.customImage;
      return {
        id: sub.id,
        label: displayLabel,
        icon: displayIcon,
        customImage: displayCustomImage
      };
    });
  }, [category, menuOverrides, subcategoriesMapToUse]);

  const handleSelectCategory = (catId: any) => {
    setCategory(catId);
    const subList = subcategoriesMapToUse[catId] || [];
    setSubCategory(subList.length > 0 ? subList[0].id : '');
  };

  return {
    category,
    setCategory,
    subCategory,
    setSubCategory,
    categoriesList,
    subcategories,
    handleSelectCategory
  };
};
