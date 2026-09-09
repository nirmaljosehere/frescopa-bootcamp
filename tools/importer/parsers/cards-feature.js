/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature.
 * Base block: cards
 * Source: https://frescopa.coffee/ (.home .cards.block)
 * Generated: 2026-06-12
 *
 * Feature cards section: large feature cards side by side. Each card has a
 * photo, a heading, paragraph(s), and a CTA button. Maps to the canonical EDS
 * cards table format: one row per card with two cells (image | text content
 * containing heading, description, and CTA).
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each card is a <li> within the block's list.
  // Validated against source.html: .cards.block > ul > li, each li has
  // .cards-card-image (picture/img) and .cards-card-body (heading + paragraphs).
  const cards = Array.from(element.querySelectorAll(':scope ul > li'));

  cards.forEach((card) => {
    // Image cell: prefer the picture, fall back to the raw img.
    const imageContainer = card.querySelector('.cards-card-image, picture, img');
    const picture = imageContainer
      ? imageContainer.querySelector('picture') || imageContainer.closest('picture') || imageContainer
      : null;
    const img = card.querySelector('img');
    const imageCell = picture || img || '';

    // Text cell: heading, description paragraph(s), and CTA button(s).
    const body = card.querySelector('.cards-card-body') || card;
    const textCell = [];

    const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) textCell.push(heading);

    // Description paragraphs that are not CTA/button containers.
    const paragraphs = Array.from(body.querySelectorAll(':scope > p'))
      .filter((p) => !p.classList.contains('button-container'));
    paragraphs.forEach((p) => textCell.push(p));

    // CTA links (e.g. "Learn More", "Start Now").
    const ctaLinks = Array.from(body.querySelectorAll('.button-container a, a.button'));
    ctaLinks.forEach((a) => textCell.push(a));

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
  element.replaceWith(block);
}
