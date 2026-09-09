/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards-tiles
 * Base block: cards
 * Source URL: https://frescopa.coffee/
 * Generated: 2026-06-12
 *
 * Source structure (validated against migration-work/block-context/cards-tiles/source.html
 * and migration-work/cleaned.html):
 *   .cards.block > ul > li
 *     li > .cards-card-image > picture > img   (line-art product icon)
 *     li > .cards-card-body  > h5              (short product-category label)
 *
 * Target: canonical EDS cards table format — one row per card: [ image | text ].
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each <li> is one product-category tile (Coffee Machines, Bagged Coffee,
  // Coffee Pods, Bundles, Accessories).
  const cards = element.querySelectorAll(':scope > ul > li');

  cards.forEach((card) => {
    // Image cell: prefer the full <picture> so srcset/sources are preserved,
    // fall back to the bare <img>.
    const imageContainer = card.querySelector('.cards-card-image');
    const picture = (imageContainer && imageContainer.querySelector('picture'))
      || card.querySelector('picture');
    const img = card.querySelector('.cards-card-image img, img');
    const imageCell = picture || img || '';

    // Text cell: the label heading inside the card body.
    const body = card.querySelector('.cards-card-body');
    const textCell = body || card.querySelector('h2, h3, h4, h5, h6') || '';

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-tiles', cells });
  element.replaceWith(block);
}
