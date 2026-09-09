/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: columns-offer
 * Base block: columns
 * Source: https://frescopa.coffee/coffee (.dm-scene7-template.block — limited-time offer banner)
 * Generated: 2026-06-13
 *
 * Source structure (section 3):
 *   .dm-scene7-template.block > img[src="https://s7d1.scene7.com/is/image/.../TimeSensitiveOffer?..."]
 *
 * The source is a single Scene7 dynamic-media banner (a /is/image/ URL) whose
 * baked-in copy reads:
 *   "Fall in love with coffee — every single day.
 *    Limited-time offer: Get your first coffee 20% off."
 * including its own baked-in "Book Now" CTA. All copy and the CTA live inside
 * the rendered image, so we model the block as a single full-width banner image
 * — no separate text column and no synthesized CTA.
 *
 * IMPORTANT: the Scene7 image is a /is/image/ URL. It is preserved verbatim
 * (including all query params: wid/hei/qlt/fit) so the dynamic-media transformer /
 * auto-block can render it. We never strip params or rewrite the src.
 *
 * Mapped to the canonical EDS columns table: a single content row with one cell
 * holding the banner image. columns-offer's decorate() flags the image-only
 * column as columns-offer-img-col so it renders full size.
 */
export default function parse(element, { document }) {
  // Scope to the block; fall back gracefully if wrapped.
  const content = element.querySelector('.dm-scene7-template') || element;

  // The Scene7 banner image. Preserve it as-is so the DM transformer/auto-block
  // can render the /is/image/ URL with its query params intact.
  const bannerImage = content.querySelector('img[src*="/is/image/"]')
    || content.querySelector('img');

  // Single content row, single column: the full-width banner image only.
  const cells = [[[bannerImage].filter(Boolean)]];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-offer',
    cells,
  });
  element.replaceWith(block);
}
