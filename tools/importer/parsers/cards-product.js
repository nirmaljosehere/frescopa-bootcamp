/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards-product
 * Base block: cards
 * Source URL: https://frescopa.coffee/coffee (.product-list-page-custom.block)
 * Generated: 2026-06-13
 *
 * Source structure (validated against
 * migration-work/block-context/cards-product/source.html):
 *   .product-list-page-custom.block .products .list > ol > li   (one product card)
 *     li > .picture > a > picture > img   (product photo; Adobe DM Open API URL)
 *     li > .name > a                      (product name / title)
 *     li > .description > a               (short description paragraph)
 *     li > .price > .price-final          (price, e.g. "$14.99")
 *
 * Target: canonical EDS cards table format — one row per product card:
 *   [ image cell | text cell (name + description + price) ].
 * There is NO per-card CTA/button in this variant.
 *
 * NOTE: product images are Adobe DM Open API URLs (/adobe/assets/urn:...).
 * The full <picture>/<img> is preserved as-is (src/srcset/anchors untouched)
 * so the DM transformer / auto-block can render them. We do not rewrite or
 * strip query params from these URLs.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each product is an <li> inside the results list (.list > ol > li).
  // Scope strictly to the product grid so we never pick up the sort-overlay
  // <li> items (which contain `<a href="#">` sort links, not products).
  let cards = Array.from(element.querySelectorAll(':scope .list ol > li'));
  // Fallback: any <li> that actually contains a product picture/name.
  if (!cards.length) {
    cards = Array.from(element.querySelectorAll(':scope li'))
      .filter((li) => li.querySelector('.picture, .name'));
  }

  cards.forEach((card) => {
    // --- Image cell ---
    // Prefer the full <picture> so any sources/srcset are preserved; fall back
    // to the bare <img>. Adobe DM Open API URLs are kept exactly as authored.
    const pictureContainer = card.querySelector('.picture');
    const picture = (pictureContainer && pictureContainer.querySelector('picture'))
      || card.querySelector('picture');
    const img = card.querySelector('.picture img, img');
    const imageCell = picture || img || '';

    // --- Text cell ---
    const textCell = [];

    // Product name → heading (block CSS styles h3/h4 inside the card body).
    const nameEl = card.querySelector('.name a, .name');
    if (nameEl) {
      const heading = document.createElement('h3');
      heading.textContent = nameEl.textContent.trim();
      textCell.push(heading);
    }

    // Short description → paragraph.
    const descEl = card.querySelector('.description a, .description');
    if (descEl) {
      const desc = document.createElement('p');
      desc.textContent = descEl.textContent.trim();
      textCell.push(desc);
    }

    // Price (e.g. "$14.99") → bold paragraph. Block CSS bolds the last <strong>.
    const priceEl = card.querySelector('.price .price-final, .price-final, .price');
    if (priceEl) {
      const price = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = priceEl.textContent.trim();
      price.append(strong);
      textCell.push(price);
    }

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
