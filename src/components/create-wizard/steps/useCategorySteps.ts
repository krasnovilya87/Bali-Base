import { useMemo, useState } from 'react';
import { Listing } from '../../../types';
import { defaultCategoriesList, defaultSubcategoriesMap } from '../defaultMenu';
import { useI18n } from '../../../i18nContext';
import { getMenuCategoryImage, getMenuSubcategoryImage } from '../../../app/menu';

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
  customImage?: string;
};

type UseCategoryStepsParams = {
  initialListing?: Listing | null;
  initialCategory?: string;
  initialSubCategory?: string;
  propCategoriesList?: CategorySourceItem[];
  propSubcategoriesMap?: Record<string, SubcategorySourceItem[]>;
  menuOverrides?: any;
};

export const useCategorySteps = ({
  initialListing,
  initialCategory,
  initialSubCategory,
  propCategoriesList,
  propSubcategoriesMap,
  menuOverrides
}: UseCategoryStepsParams) => {
  const { tr } = useI18n();
  const categoriesToUse = (propCategoriesList || defaultCategoriesList) as CategorySourceItem[];
  const subcategoriesMapToUse = propSubcategoriesMap || defaultSubcategoriesMap;

  const [category, setCategory] = useState<any>(initialListing?.category || initialCategory || 'housing');
  const [subCategory, setSubCategory] = useState<string>(initialListing?.subCategory || initialSubCategory || '');

  const categoriesList = useMemo(() => {
    return categoriesToUse.map(cat => {
      const displayLabel = tr(`category.${cat.id}.label`);
      const displayIcon = menuOverrides?.l1?.[cat.id]?.icon || cat.icon || '📦';
      const displayImage = getMenuCategoryImage(cat, menuOverrides);
      const displayDesc = tr(`category.${cat.id}.desc`);
      return {
        id: cat.id,
        label: displayLabel,
        icon: displayIcon,
        image: displayImage,
        desc: displayDesc
      };
    });
  }, [categoriesToUse, menuOverrides, tr]);

  const subcategories = useMemo(() => {
    const rawSubs = subcategoriesMapToUse[category] || [];
    return rawSubs.map(sub => {
      const displayLabel = tr(`subcategory.${sub.id}`);
      const displayIcon = menuOverrides?.l2?.[sub.id]?.icon || sub.icon || '⭐';
      const displayCustomImage = getMenuSubcategoryImage(sub, menuOverrides);
      return {
        id: sub.id,
        label: displayLabel,
        icon: displayIcon,
        customImage: displayCustomImage
      };
    });
  }, [category, menuOverrides, subcategoriesMapToUse, tr]);

  const handleSelectCategory = (catId: any) => {
    setCategory(catId);
    setSubCategory('');
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
