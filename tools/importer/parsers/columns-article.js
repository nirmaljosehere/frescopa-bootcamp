/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: columns-article
 * Base block: columns
 * Source: https://frescopa.coffee/coffee (.article.block — Espresso article panel)
 * Generated: 2026-06-13
 *
 * Text-only editorial panel on an accent (dark-red) background. No image, no CTA.
 * Source structure:
 *   .article.block > .article-content > div
 *     h4.headline   -> panel heading ("The Magic of Espresso")
 *     p.detail      -> descriptive paragraph
 *
 * Maps to a single-cell / single-column columns table: first row is the block
 * name, and one content row with a single cell holding the heading + paragraph.
 */
export default function parse(element, { document }) {
  // Scope to the inner content wrapper when present; fall back to the block element.
  const content = element.querySelector('.article-content') || element;

  // Heading: source uses h4.headline. Allow common heading levels as fallback;
  // skip empty placeholders by picking the first non-empty heading.
  const headings = Array.from(
    content.querySelectorAll('.headline, h1, h2, h3, h4, h5, h6'),
  ).filter((h) => h.textContent.trim());
  const heading = headings[0] || null;

  // Body paragraph(s): source uses p.detail. Skip empty placeholders.
  const paragraphs = Array.from(
    content.querySelectorAll('p.detail, p'),
  ).filter((p, i, arr) => arr.indexOf(p) === i && p.textContent.trim());

  // Single content cell: heading followed by the descriptive paragraph(s).
  const contentCell = [];
  if (heading) contentCell.push(heading);
  paragraphs.forEach((p) => contentCell.push(p));

  // Single row, single column, matching the text-only panel layout.
  const cells = [[contentCell]];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-article',
    cells,
  });
  element.replaceWith(block);
}
