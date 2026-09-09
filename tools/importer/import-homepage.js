/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroPromoLightParser from './parsers/hero-promo-light.js';
import columnsPromoParser from './parsers/columns-promo.js';
import embedMapParser from './parsers/embed-map.js';
import cardsTilesParser from './parsers/cards-tiles.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import columnsRewardParser from './parsers/columns-reward.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/frescopa-cleanup.js';
import sectionsTransformer from './transformers/frescopa-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-promo-light': heroPromoLightParser,
  'columns-promo': columnsPromoParser,
  'embed-map': embedMapParser,
  'cards-tiles': cardsTilesParser,
  'cards-feature': cardsFeatureParser,
  'columns-reward': columnsRewardParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Primary landing layout with hero banner, feature sections, product category grid, and promotional content blocks',
  urls: [
    'https://frescopa.coffee/',
  ],
  blocks: [
    { name: 'hero-promo-light', instances: ['.teaser.block'] },
    { name: 'columns-promo', instances: ['.offer.block'] },
    { name: 'embed-map', instances: ['.store-locator.block'] },
    { name: 'cards-tiles', instances: ['.card-tiles .cards.block'] },
    { name: 'cards-feature', instances: ['.home .cards.block'] },
    { name: 'columns-reward', instances: ['.reward.block'] },
  ],
  sections: [
    { id: 'section-1', name: 'Hero quiz banner', selector: '.section.teaser-container', style: null, blocks: ['hero-promo-light'], defaultContent: [] },
    { id: 'section-2', name: 'Subscription promo', selector: '.section.offer-container', style: 'light', blocks: ['columns-promo'], defaultContent: [] },
    { id: 'section-3', name: 'Store locator', selector: '.section.store-locator-container', style: 'light', blocks: ['embed-map'], defaultContent: [] },
    { id: 'section-4', name: 'Product category tiles', selector: '.section.card-tiles.cards-container', style: 'light', blocks: ['cards-tiles'], defaultContent: ['.section.card-tiles h2'] },
    { id: 'section-5', name: 'Feature cards', selector: '.section.home.cards-container', style: 'light', blocks: ['cards-feature'], defaultContent: [] },
    { id: 'section-6', name: 'Rewards promo', selector: '.section.reward-container', style: 'accent', blocks: ['columns-reward'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then sections (afterTransform adds breaks/metadata)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
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

    // 4. afterTransform cleanup + section breaks/metadata
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
