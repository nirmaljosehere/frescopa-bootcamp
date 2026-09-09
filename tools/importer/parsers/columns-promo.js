/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-promo.
 * Base block: columns
 * Source: https://frescopa.coffee/ (.offer.block — subscription promo)
 * Generated: 2026-06-12
 *
 * Source structure:
 *   .offer.block > .offer-content
 *     img                       -> promo icon (left column)
 *     .offer-left  > h4.headline + p.detail   -> heading + paragraph (left column)
 *     .offer-right > a.button.secondary       -> "Shop Now" CTA (right column)
 *
 * Maps to the canonical EDS columns table: first row is the block name,
 * second row has two cells representing the two visual columns
 * (left: icon + heading + paragraph, right: CTA).
 */
export default function parse(element, { document }) {
  // Scope to the inner content wrapper when present; fall back to the block element.
  const content = element.querySelector('.offer-content') || element;

  // LEFT COLUMN: icon image + heading + descriptive paragraph.
  const icon = content.querySelector(':scope > img, .offer-left img, img');
  const heading = content.querySelector('.offer-left .headline, .offer-left h1, .offer-left h2, .offer-left h3, .offer-left h4, h4.headline, h1, h2, h3, h4');
  const description = content.querySelector('.offer-left .detail, .offer-left p, p.detail, p');

  const leftCell = [];
  if (icon) leftCell.push(icon);
  if (heading) leftCell.push(heading);
  if (description) leftCell.push(description);

  // RIGHT COLUMN: the CTA link(s).
  const ctaLinks = Array.from(
    content.querySelectorAll('.offer-right a, a.button, a.secondary, a[href]'),
  ).filter((a, i, arr) => arr.indexOf(a) === i);
  const rightCell = [...ctaLinks];

  const cells = [
    [leftCell, rightCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo', cells });
  element.replaceWith(block);
}
