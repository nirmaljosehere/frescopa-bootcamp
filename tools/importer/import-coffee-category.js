/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroPromoLightParser from './parsers/hero-promo-light.js';
import cardsProductParser from './parsers/cards-product.js';
import columnsOfferParser from './parsers/columns-offer.js';
import columnsArticleParser from './parsers/columns-article.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/frescopa-cleanup.js';
import sectionsTransformer from './transformers/frescopa-sections.js';
import dmImagesTransformer from './transformers/frescopa-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'hero-promo-light': heroPromoLightParser,
  'cards-product': cardsProductParser,
  'columns-offer': columnsOfferParser,
  'columns-article': columnsArticleParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'coffee-category',
  description: 'Coffee category page with hero header and product/feature card grid',
  urls: [
    'https://frescopa.coffee/coffee',
  ],
  blocks: [
    { name: 'hero-promo-light', instances: ['.teaser.block'] },
    { name: 'cards-product', instances: ['.product-list-page-custom.block'] },
    { name: 'columns-offer', instances: ['.dm-scene7-template.block'] },
    { name: 'columns-article', instances: ['.article.block'] },
  ],
  sections: [
    { id: 'section-1', name: 'Coffee hero banner', selector: '.teaser-wrapper', style: 'dark', blocks: ['hero-promo-light'], defaultContent: [] },
    { id: 'section-2', name: 'Bagged Coffee product grid', selector: '.section.product-list-page-custom-container', style: 'light', blocks: ['cards-product'], defaultContent: ['.product-list-page-custom-container h3'] },
    { id: 'section-3', name: 'Limited-time offer banner', selector: '.dm-scene7-template-wrapper', style: null, blocks: ['columns-offer'], defaultContent: [] },
    { id: 'section-4', name: 'Coffee Pods product grid', selector: '.section.product-list-page-custom-container', style: 'light', blocks: ['cards-product'], defaultContent: ['.product-list-page-custom-container h3'] },
    { id: 'section-5', name: 'Espresso article panel', selector: '.article-wrapper', style: 'accent', blocks: ['columns-article'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then sections, then DM images.
// DM images run last in afterTransform: parsers extract <img> into block cells
// first, then this transformer rewrites any DM/Scene7 imgs to carrier anchors
// so they survive the markdown round-trip (rebuilt as <picture> client-side).
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  dmImagesTransformer,
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform cleanup + section breaks/metadata + DM image anchors
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
