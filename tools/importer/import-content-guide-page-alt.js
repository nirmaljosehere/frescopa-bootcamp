/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroTeaserTealParser from './parsers/hero-teaser-teal.js';
import cardsNumberedParser from './parsers/cards-numbered.js';
import embedVideoParser from './parsers/embed-video.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/frescopa-cleanup.js';
import sectionsTransformer from './transformers/frescopa-sections.js';
import dmImagesTransformer from './transformers/frescopa-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'hero-teaser-teal': heroTeaserTealParser,
  'cards-numbered': cardsNumberedParser,
  'embed-video': embedVideoParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'content-guide-page-alt',
  description: 'Editorial content layout: hero intro, numbered cards, and a media/video section',
  urls: [
    'https://frescopa.coffee/sustainability',
  ],
  blocks: [
    { name: 'hero-teaser-teal', instances: ['.teaser.block'] },
    { name: 'cards-numbered', instances: ['.cards.block'] },
    { name: 'embed-video', instances: ['.dm-video.block'] },
  ],
  sections: [
    { id: 'section-1', name: 'Sustainability hero', selector: '.teaser-wrapper', style: null, blocks: ['hero-teaser-teal'], defaultContent: [] },
    { id: 'section-2', name: 'Focus areas numbered cards', selector: '.section.cards-container', style: null, blocks: ['cards-numbered'], defaultContent: ['.cards-container h2'] },
    { id: 'section-3', name: 'Sustainability video', selector: '.dm-video-wrapper', style: null, blocks: ['embed-video'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then sections, then DM images.
// DM images run last in afterTransform: parsers extract <img>/iframe into block
// cells first, then this transformer rewrites any DM/Scene7 imgs to carrier
// anchors so they survive the markdown round-trip (rebuilt as <picture> client-side).
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
