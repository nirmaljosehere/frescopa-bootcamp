/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards-numbered
 * Base block: cards
 * Source URL: https://frescopa.coffee/sustainability (.cards.block)
 * Generated: 2026-06-13
 *
 * Source structure (validated against
 * migration-work/block-context/cards-numbered/source.html):
 *   .cards.block > ul > li                       (one numbered card; 5 cards)
 *     li > .cards-card-image > picture > img      (card photo; src kept verbatim,
 *                                                  including any DM /adobe/assets/urn: URLs)
 *     li > .cards-card-body                        (rich body:
 *        h3                                          card heading, e.g. "Coffee and Tea Sourcing")
 *        p (multiple)                                paragraphs, several wrapping a
 *                                                    <strong> bold sub-heading)
 *
 * Target: canonical EDS cards table format — one row per card with two cells:
 *   [ image cell | body cell ].
 * The body cell preserves the FULL rich content (the h3 heading AND every
 * paragraph, including the <strong> bold sub-headings). The block's decorate()
 * supplies the number badge via a CSS counter, so no numbering is emitted here.
 *
 * NOTE: image URLs (including Adobe DM Open API /adobe/assets/urn: URLs) are
 * preserved exactly — the full <picture>/<img> is referenced as-is, never
 * rewritten or stripped of query params.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each card is a <li> within the block's list.
  let cards = Array.from(element.querySelectorAll(':scope > ul > li'));
  // Fallback for nesting variations: any <li> that holds an image + body.
  if (!cards.length) {
    cards = Array.from(element.querySelectorAll(':scope li'))
      .filter((li) => li.querySelector('.cards-card-image, picture, img'));
  }

  cards.forEach((card) => {
    // --- Image cell ---
    // Prefer the full <picture> so any sources/srcset are preserved; fall back
    // to the bare <img>. Image URLs (incl. DM URLs) are kept exactly as authored.
    const imageContainer = card.querySelector('.cards-card-image');
    const picture = (imageContainer && imageContainer.querySelector('picture'))
      || card.querySelector('picture');
    const img = card.querySelector('.cards-card-image img, img');
    const imageCell = picture || img || '';

    // --- Body cell ---
    // Pass the whole card body so the full rich content is preserved verbatim:
    // the h3 heading and every paragraph, including the <strong> sub-headings.
    // Nothing is flattened or dropped.
    const body = card.querySelector('.cards-card-body');
    let bodyCell;
    if (body) {
      bodyCell = body;
    } else {
      // Fallback: gather the heading + all paragraphs directly from the card.
      const bodyContent = [];
      const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) bodyContent.push(heading);
      card.querySelectorAll(':scope > p, :scope > div > p').forEach((p) => bodyContent.push(p));
      bodyCell = bodyContent.length ? bodyContent : '';
    }

    cells.push([imageCell, bodyCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-numbered', cells });
  element.replaceWith(block);
}
