/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-promo-light.
 * Base block: hero
 * Source URL: https://frescopa.coffee/
 * Generated: 2026-06-12
 *
 * Canonical EDS hero table format (1 column):
 *   Row 1: block name
 *   Row 2: Background Image (optional)
 *   Row 3: Title (heading) + Subheading text + Call-to-Action
 *
 * Source structure (.teaser.block):
 *   .background picture > img     -> background image (Row 2)
 *   .foreground .text .eyebrow    -> eyebrow / subheading text
 *   .foreground .text .title h*   -> heading (Title)
 *   .foreground .text .long-description -> optional description
 *   .foreground .text .cta a      -> call-to-action link
 */
export default function parse(element, { document }) {
  // Row 2: background image (optional)
  const bgImage = element.querySelector('.background picture, .background img, picture, img');

  // Row 3 content: eyebrow, heading, description, CTA(s)
  const eyebrow = element.querySelector('.eyebrow');
  const heading = element.querySelector('.title h1, .title h2, .title h3, .title h4, .title h5, .title h6, h1, h2, h3, h4, h5, h6');
  const description = element.querySelector('.long-description');
  const ctaLinks = Array.from(element.querySelectorAll('.cta a, a.button'));

  const cells = [];

  // Row 2: background image cell (only if present)
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 3: content cell (heading + eyebrow/description text + CTAs).
  // Wrap all content in a single container so it stays in ONE cell (single
  // column) and stacks vertically, matching the canonical hero table format.
  const contentWrapper = document.createElement('div');

  if (eyebrow && eyebrow.textContent.trim()) {
    const eyebrowEl = document.createElement('p');
    eyebrowEl.textContent = eyebrow.textContent.trim();
    contentWrapper.append(eyebrowEl);
  }
  if (heading) contentWrapper.append(heading);
  if (description && description.textContent.trim()) contentWrapper.append(description);
  ctaLinks.forEach((cta) => contentWrapper.append(cta));

  cells.push([contentWrapper]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo-light', cells });
  element.replaceWith(block);
}
