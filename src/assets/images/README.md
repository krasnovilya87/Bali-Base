# Image asset structure

Keep new image files in a named subfolder. Do not add images directly to this directory.

## Menu images

- `menu/l1/` — top-level menu categories.
- `menu/l2/<category>/` — second-level menu items grouped by their L1 category.
- `menu/l3/<category>/` — third-level menu items grouped by their parent category.

## Other application images

- `other/backgrounds/` — hero and background artwork.
- `other/condition-sprites/` — vehicle condition comparison sprites.
- `other/vehicle-parameters/` — vehicle option icons.
- `other/wizard/` — creation-wizard examples and overlays.
- `other/products/` — product-category illustrations.
- `other/misc/` — images whose purpose does not fit another group.

Files that must be addressed by a direct public URL live under `public/assets/images/` in similarly named folders.
