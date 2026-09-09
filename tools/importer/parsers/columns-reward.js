/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: columns-reward
 * Base block: columns
 * Source: https://frescopa.coffee/ (.reward.block)
 * Generated: 2026-06-12
 *
 * Rewards/gift-card promo banner (accent background). Side-by-side columns layout:
 *   - Left column: illustration image + heading + descriptive paragraph(s)
 *   - Right column: single "Claim Rewards" CTA
 * Mapped to the canonical EDS columns table: a single content row with two cells.
 */
export default function parse(element, { document }) {
  // Scope to the inner content wrapper when present, otherwise the block itself.
  const content = element.querySelector('.reward-content') || element;

  // Illustration image. In source it is a child of .reward-content (sibling of
  // .reward-left); search the whole block as a fallback to be resilient to nesting.
  const image = content.querySelector('img') || element.querySelector('img');

  // Left side: heading + body copy. Validated source classes: .reward-left, h6, p.
  const leftContainer = content.querySelector('.reward-left') || content;

  // Heading: source uses h6, but allow common heading levels as fallback.
  // Skip empty .headline placeholder; pick first non-empty heading.
  const headings = Array.from(
    leftContainer.querySelectorAll('h1, h2, h3, h4, h5, h6'),
  ).filter((h) => h.textContent.trim());
  const heading = headings[0] || null;

  // Body paragraphs: skip empty placeholders (e.g. p.detail with no text).
  const paragraphs = Array.from(leftContainer.querySelectorAll('p')).filter(
    (p) => p.textContent.trim(),
  );

  // Right side: CTA link(s). Validated source: .reward-right a.button.secondary.
  const rightContainer = content.querySelector('.reward-right') || content;
  const ctaLinks = Array.from(
    rightContainer.querySelectorAll('a'),
  ).filter((a) => a.textContent.trim() || a.href);

  // Build the left (content) cell: illustration, heading, then body copy.
  const leftCell = [];
  if (image) leftCell.push(image);
  if (heading) leftCell.push(heading);
  paragraphs.forEach((p) => leftCell.push(p));

  // Build the right (CTA) cell.
  const rightCell = [];
  ctaLinks.forEach((a) => rightCell.push(a));

  // Single content row with two columns, matching the canonical columns format.
  const cells = [[leftCell, rightCell]];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-reward',
    cells,
  });
  element.replaceWith(block);
}
