/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-teaser-teal.
 * Base block: hero
 * Source URL: https://frescopa.coffee/sustainability (.teaser.block —
 *   "teaser left frescopa-background-blue", the sustainability hero banner)
 * Generated: 2026-06-13
 *
 * Target table format (single column, two rows) — matches the block's
 * decorate(), which classifies the first cell containing a picture/img as the
 * image cell and treats the remaining cell(s) as text content:
 *   Row 1: block name
 *   Row 2: image (picture/img, preserved as-is)
 *   Row 3: text content (heading + intro paragraphs)
 *
 * Source structure (.teaser.block):
 *   .background picture > img        -> teaser image (Row 2)
 *   .foreground .text .title h*      -> heading (Row 3)
 *   .foreground .text .long-description (p, p, ...) -> intro paragraphs (Row 3)
 *   .foreground .text .cta a         -> optional CTA(s) (Row 3, usually empty here)
 */
export default function parse(element, { document }) {
  // Row 2: the teaser image. Prefer the full <picture> so all sources are
  // preserved; the underlying <img> src (incl. any DM/Scene7 or media query
  // params) is left untouched.
  const image = element.querySelector('.background picture, .background img, picture, img');

  // Row 3 content: heading, intro paragraphs, and any CTA links.
  const heading = element.querySelector(
    '.text .title h1, .text .title h2, .text .title h3, .text .title h4, .text .title h5, .text .title h6, .title h1, .title h2, .title h3, h1, h2, h3, h4, h5, h6',
  );
  const description = element.querySelector('.text .long-description, .long-description');
  const ctaLinks = Array.from(element.querySelectorAll('.text .cta a, .cta a, a.button')).filter(
    (a) => a.textContent.trim() || a.querySelector('img, picture'),
  );

  const cells = [];

  // Row 2: image cell (only when an image is present).
  if (image) {
    cells.push([image]);
  }

  // Row 3: text content cell. Wrap heading + paragraphs (+ optional CTAs) in a
  // single container so they remain in one cell and the block reads them as the
  // text column.
  const textWrapper = document.createElement('div');
  if (heading) textWrapper.append(heading);
  if (description && description.textContent.trim()) {
    // Preserve the individual <p> elements rather than flattening to text.
    const paragraphs = description.querySelectorAll('p');
    if (paragraphs.length) {
      paragraphs.forEach((p) => textWrapper.append(p));
    } else {
      textWrapper.append(description);
    }
  }
  ctaLinks.forEach((cta) => textWrapper.append(cta));

  cells.push([textWrapper]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-teaser-teal', cells });
  element.replaceWith(block);
}
