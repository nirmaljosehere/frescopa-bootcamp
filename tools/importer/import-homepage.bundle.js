/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-promo-light.js
  function parse(element, { document }) {
    const bgImage = element.querySelector(".background picture, .background img, picture, img");
    const eyebrow = element.querySelector(".eyebrow");
    const heading = element.querySelector(".title h1, .title h2, .title h3, .title h4, .title h5, .title h6, h1, h2, h3, h4, h5, h6");
    const description = element.querySelector(".long-description");
    const ctaLinks = Array.from(element.querySelectorAll(".cta a, a.button"));
    const cells = [];
    if (bgImage) {
      cells.push([bgImage]);
    }
    const contentWrapper = document.createElement("div");
    if (eyebrow && eyebrow.textContent.trim()) {
      const eyebrowEl = document.createElement("p");
      eyebrowEl.textContent = eyebrow.textContent.trim();
      contentWrapper.append(eyebrowEl);
    }
    if (heading) contentWrapper.append(heading);
    if (description && description.textContent.trim()) contentWrapper.append(description);
    ctaLinks.forEach((cta) => contentWrapper.append(cta));
    cells.push([contentWrapper]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-promo-light", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo.js
  function parse2(element, { document }) {
    const content = element.querySelector(".offer-content") || element;
    const icon = content.querySelector(":scope > img, .offer-left img, img");
    const heading = content.querySelector(".offer-left .headline, .offer-left h1, .offer-left h2, .offer-left h3, .offer-left h4, h4.headline, h1, h2, h3, h4");
    const description = content.querySelector(".offer-left .detail, .offer-left p, p.detail, p");
    const leftCell = [];
    if (icon) leftCell.push(icon);
    if (heading) leftCell.push(heading);
    if (description) leftCell.push(description);
    const ctaLinks = Array.from(
      content.querySelectorAll(".offer-right a, a.button, a.secondary, a[href]")
    ).filter((a, i, arr) => arr.indexOf(a) === i);
    const rightCell = [...ctaLinks];
    const cells = [
      [leftCell, rightCell]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed-map.js
  function parse3(element, { document }) {
    const heading = element.querySelector(".sidepanel__title, h1, h2, h3");
    const introText = element.querySelector(".search__title");
    const defaultContentNodes = [];
    if (heading) {
      const h = document.createElement("h2");
      h.textContent = heading.textContent.trim();
      defaultContentNodes.push(h);
    }
    if (introText && introText.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = introText.textContent.trim();
      defaultContentNodes.push(p);
    }
    let mapUrl = null;
    const mapsAnchor = element.querySelector(
      'a[href*="maps.google."], a[href*="google.com/maps"], a[href*="maps.app.goo"]'
    );
    if (mapsAnchor && mapsAnchor.getAttribute("href")) {
      mapUrl = mapsAnchor.getAttribute("href");
    }
    if (!mapUrl) {
      const iframe = element.querySelector('iframe[src*="map"], iframe[src*="google"]');
      if (iframe && iframe.getAttribute("src")) {
        mapUrl = iframe.getAttribute("src");
      }
    }
    if (!mapUrl) {
      const mapContainer = element.querySelector("#locator-map, .map");
      let coords = null;
      let zoom = "17";
      if (mapContainer) {
        const dataLat = mapContainer.getAttribute("data-lat");
        const dataLng = mapContainer.getAttribute("data-lng") || mapContainer.getAttribute("data-lon");
        const dataZoom = mapContainer.getAttribute("data-zoom");
        if (dataLat && dataLng) {
          coords = `${dataLat},${dataLng}`;
          if (dataZoom) zoom = dataZoom;
        }
      }
      if (!coords) {
        const candidate = Array.from(
          element.querySelectorAll('a[href*="maps"], img[src*="maps"]')
        ).map((el) => el.getAttribute("href") || el.getAttribute("src") || "").find((url) => /[?&]ll=-?\d|\/@-?\d/.test(url));
        if (candidate) {
          const m = candidate.match(/[?&]ll=(-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)/) || candidate.match(/\/@(-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)/);
          if (m) coords = m[1];
          const z = candidate.match(/[,&]z=?(\d+)/) || candidate.match(/,(\d+)z/);
          if (z) [, zoom] = z;
        }
      }
      if (!coords) coords = "36.121,-115.17";
      mapUrl = `https://maps.google.com/maps?ll=${coords}&z=${zoom}&t=m&hl=en-US&gl=US&mapclient=apiv3`;
    }
    const cells = [];
    if (mapUrl) {
      const link = document.createElement("a");
      link.href = mapUrl;
      link.textContent = mapUrl;
      cells.push([link]);
    }
    const replacement = document.createElement("div");
    defaultContentNodes.forEach((node) => replacement.append(node));
    if (cells.length) {
      const block = WebImporter.Blocks.createBlock(document, { name: "embed-map", cells });
      replacement.append(block);
    }
    element.replaceWith(replacement);
  }

  // tools/importer/parsers/cards-tiles.js
  function parse4(element, { document }) {
    const cells = [];
    const cards = element.querySelectorAll(":scope > ul > li");
    cards.forEach((card) => {
      const imageContainer = card.querySelector(".cards-card-image");
      const picture = imageContainer && imageContainer.querySelector("picture") || card.querySelector("picture");
      const img = card.querySelector(".cards-card-image img, img");
      const imageCell = picture || img || "";
      const body = card.querySelector(".cards-card-body");
      const textCell = body || card.querySelector("h2, h3, h4, h5, h6") || "";
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-tiles", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-feature.js
  function parse5(element, { document }) {
    const cells = [];
    const cards = Array.from(element.querySelectorAll(":scope ul > li"));
    cards.forEach((card) => {
      const imageContainer = card.querySelector(".cards-card-image, picture, img");
      const picture = imageContainer ? imageContainer.querySelector("picture") || imageContainer.closest("picture") || imageContainer : null;
      const img = card.querySelector("img");
      const imageCell = picture || img || "";
      const body = card.querySelector(".cards-card-body") || card;
      const textCell = [];
      const heading = body.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) textCell.push(heading);
      const paragraphs = Array.from(body.querySelectorAll(":scope > p")).filter((p) => !p.classList.contains("button-container"));
      paragraphs.forEach((p) => textCell.push(p));
      const ctaLinks = Array.from(body.querySelectorAll(".button-container a, a.button"));
      ctaLinks.forEach((a) => textCell.push(a));
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-reward.js
  function parse6(element, { document }) {
    const content = element.querySelector(".reward-content") || element;
    const image = content.querySelector("img") || element.querySelector("img");
    const leftContainer = content.querySelector(".reward-left") || content;
    const headings = Array.from(
      leftContainer.querySelectorAll("h1, h2, h3, h4, h5, h6")
    ).filter((h) => h.textContent.trim());
    const heading = headings[0] || null;
    const paragraphs = Array.from(leftContainer.querySelectorAll("p")).filter(
      (p) => p.textContent.trim()
    );
    const rightContainer = content.querySelector(".reward-right") || content;
    const ctaLinks = Array.from(
      rightContainer.querySelectorAll("a")
    ).filter((a) => a.textContent.trim() || a.href);
    const leftCell = [];
    if (image) leftCell.push(image);
    if (heading) leftCell.push(heading);
    paragraphs.forEach((p) => leftCell.push(p));
    const rightCell = [];
    ctaLinks.forEach((a) => rightCell.push(a));
    const cells = [[leftCell, rightCell]];
    const block = WebImporter.Blocks.createBlock(document, {
      name: "columns-reward",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/frescopa-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".overlay",
        ".minicart-panel",
        ".nav-search-panel",
        "#search_autocomplete",
        "#auth-dropin-container",
        ".nav-tools-panel"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.header-wrapper",
        "footer.footer-wrapper",
        "header",
        "footer",
        "nav",
        "noscript",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/frescopa-sections.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const template = payload && payload.template;
      const sections = template && template.sections || [];
      if (sections.length < 2) {
        return;
      }
      const doc = element.ownerDocument;
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section || !section.selector) {
          continue;
        }
        const sectionEl = element.querySelector(section.selector);
        if (!sectionEl) {
          continue;
        }
        if (section.style) {
          const metadataBlock = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(metadataBlock);
        }
        if (i > 0) {
          sectionEl.before(doc.createElement("hr"));
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-promo-light": parse,
    "columns-promo": parse2,
    "embed-map": parse3,
    "cards-tiles": parse4,
    "cards-feature": parse5,
    "columns-reward": parse6
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Primary landing layout with hero banner, feature sections, product category grid, and promotional content blocks",
    urls: [
      "https://frescopa.coffee/"
    ],
    blocks: [
      { name: "hero-promo-light", instances: [".teaser.block"] },
      { name: "columns-promo", instances: [".offer.block"] },
      { name: "embed-map", instances: [".store-locator.block"] },
      { name: "cards-tiles", instances: [".card-tiles .cards.block"] },
      { name: "cards-feature", instances: [".home .cards.block"] },
      { name: "columns-reward", instances: [".reward.block"] }
    ],
    sections: [
      { id: "section-1", name: "Hero quiz banner", selector: ".section.teaser-container", style: null, blocks: ["hero-promo-light"], defaultContent: [] },
      { id: "section-2", name: "Subscription promo", selector: ".section.offer-container", style: "light", blocks: ["columns-promo"], defaultContent: [] },
      { id: "section-3", name: "Store locator", selector: ".section.store-locator-container", style: "light", blocks: ["embed-map"], defaultContent: [] },
      { id: "section-4", name: "Product category tiles", selector: ".section.card-tiles.cards-container", style: "light", blocks: ["cards-tiles"], defaultContent: [".section.card-tiles h2"] },
      { id: "section-5", name: "Feature cards", selector: ".section.home.cards-container", style: "light", blocks: ["cards-feature"], defaultContent: [] },
      { id: "section-6", name: "Rewards promo", selector: ".section.reward-container", style: "accent", blocks: ["columns-reward"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/index"
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
