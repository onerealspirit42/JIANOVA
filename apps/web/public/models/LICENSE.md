# shoe.glb

The 3D shoe in this folder is a modified version of **Materials Variants Shoe**,
© 2021 Shopify, licensed under the
[Creative Commons Attribution 4.0 International licence](https://creativecommons.org/licenses/by/4.0/)
(CC BY 4.0). Source:
https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe

Changes made for JIANOVA by `scripts/model/build-shoe.py`:

- removed the two stripes on each side, the logo on the heel patch (the licence
  excludes logos and trademarks), the lettering on the midsole and the stitched
  marks on the tongue;
- made the knit and the pull tabs non-metallic;
- tagged every vertex with its part (`_PART`) and replaced the colour textures
  with one light-and-shade ("detail") texture, so each part can be recoloured;
- scaled and centred the shoe.

The shoe is a stand-in for trying the designer, not the JIANOVA product design.
