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

  // tools/importer/import-content-guide-page-alt.js
  var import_content_guide_page_alt_exports = {};
  __export(import_content_guide_page_alt_exports, {
    default: () => import_content_guide_page_alt_default
  });

  // tools/importer/parsers/hero-teaser-teal.js
  function parse(element, { document }) {
    const image = element.querySelector(".background picture, .background img, picture, img");
    const heading = element.querySelector(
      ".text .title h1, .text .title h2, .text .title h3, .text .title h4, .text .title h5, .text .title h6, .title h1, .title h2, .title h3, h1, h2, h3, h4, h5, h6"
    );
    const description = element.querySelector(".text .long-description, .long-description");
    const ctaLinks = Array.from(element.querySelectorAll(".text .cta a, .cta a, a.button")).filter(
      (a) => a.textContent.trim() || a.querySelector("img, picture")
    );
    const cells = [];
    if (image) {
      cells.push([image]);
    }
    const textWrapper = document.createElement("div");
    if (heading) textWrapper.append(heading);
    if (description && description.textContent.trim()) {
      const paragraphs = description.querySelectorAll("p");
      if (paragraphs.length) {
        paragraphs.forEach((p) => textWrapper.append(p));
      } else {
        textWrapper.append(description);
      }
    }
    ctaLinks.forEach((cta) => textWrapper.append(cta));
    cells.push([textWrapper]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-teaser-teal", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-numbered.js
  function parse2(element, { document }) {
    const cells = [];
    let cards = Array.from(element.querySelectorAll(":scope > ul > li"));
    if (!cards.length) {
      cards = Array.from(element.querySelectorAll(":scope li")).filter((li) => li.querySelector(".cards-card-image, picture, img"));
    }
    cards.forEach((card) => {
      const imageContainer = card.querySelector(".cards-card-image");
      const picture = imageContainer && imageContainer.querySelector("picture") || card.querySelector("picture");
      const img = card.querySelector(".cards-card-image img, img");
      const imageCell = picture || img || "";
      const body = card.querySelector(".cards-card-body");
      let bodyCell;
      if (body) {
        bodyCell = body;
      } else {
        const bodyContent = [];
        const heading = card.querySelector("h1, h2, h3, h4, h5, h6");
        if (heading) bodyContent.push(heading);
        card.querySelectorAll(":scope > p, :scope > div > p").forEach((p) => bodyContent.push(p));
        bodyCell = bodyContent.length ? bodyContent : "";
      }
      cells.push([imageCell, bodyCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-numbered", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed-video.js
  function parse3(element, { document }) {
    let videoUrl = null;
    const iframe = element.querySelector(
      "iframe.dm-video-iframe, .dm-video-iframe-wrap iframe, iframe[src]"
    );
    if (iframe && iframe.getAttribute("src")) {
      videoUrl = iframe.getAttribute("src");
    }
    if (!videoUrl) {
      const anchor = element.querySelector("a[href]");
      if (anchor && anchor.getAttribute("href")) {
        videoUrl = anchor.getAttribute("href");
      }
    }
    if (!videoUrl) {
      element.remove();
      return;
    }
    const link = document.createElement("a");
    link.href = videoUrl;
    link.textContent = videoUrl;
    const cells = [[link]];
    const block = WebImporter.Blocks.createBlock(document, { name: "embed-video", cells });
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
      element.querySelectorAll(".store-locator.block").forEach((slBlock) => {
        const hasContent = slBlock.textContent.trim() !== "" || slBlock.querySelector('img, picture, a, iframe, svg, [id*="map"]');
        if (!hasContent) {
          const wrapper = slBlock.closest(".store-locator-wrapper");
          (wrapper || slBlock).remove();
        }
      });
    }
  }

  // tools/importer/transformers/frescopa-sections.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function sectionCandidateSelectors(section, blockIndex) {
    const selectors = [];
    (section.defaultContent || []).forEach((sel) => {
      if (sel) selectors.push(sel);
    });
    (section.blocks || []).forEach((blockName) => {
      const instances = blockIndex[blockName] || [];
      instances.forEach((sel) => {
        if (sel) selectors.push(sel);
      });
    });
    if (section.selector) selectors.push(section.selector);
    return selectors;
  }
  function isAfter(ref, el) {
    if (!ref) return true;
    if (ref === el) return false;
    return (ref.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  }
  function topLevelSectionElement(element, anchor) {
    let node = anchor;
    while (node.parentElement && node.parentElement !== element) {
      const parent = node.parentElement;
      if (parent.classList && parent.classList.contains("section")) {
        break;
      }
      node = parent;
    }
    return node;
  }
  function resolveSectionBoundary(element, section, blockIndex, claimed, prevBoundary) {
    const selectors = sectionCandidateSelectors(section, blockIndex);
    let best = null;
    selectors.forEach((sel) => {
      let matches;
      try {
        matches = element.querySelectorAll(sel);
      } catch (e) {
        return;
      }
      matches.forEach((match) => {
        const wrapper = topLevelSectionElement(element, match);
        if (!wrapper || claimed.has(wrapper)) return;
        if (wrapper.classList && wrapper.classList.contains("section")) {
          const containerClassCount = Array.from(wrapper.classList).filter((c) => c.endsWith("-container")).length;
          if (containerClassCount > 1) return;
        }
        if (prevBoundary && !isAfter(prevBoundary, wrapper)) return;
        if (!best || isAfter(wrapper, best)) {
          best = wrapper;
        }
      });
    });
    return best;
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const template = payload && payload.template;
      const sections = template && template.sections || [];
      if (sections.length < 2) {
        return;
      }
      const doc = element.ownerDocument;
      const blockIndex = {};
      (template.blocks || []).forEach((block) => {
        if (block && block.name) blockIndex[block.name] = block.instances || [];
      });
      const claimed = /* @__PURE__ */ new Set();
      let prevBoundary = null;
      const anchors = sections.map((section) => {
        if (!section) return null;
        const boundary = resolveSectionBoundary(
          element,
          section,
          blockIndex,
          claimed,
          prevBoundary
        );
        if (!boundary) return null;
        claimed.add(boundary);
        prevBoundary = boundary;
        return boundary;
      });
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = anchors[i];
        if (!section || !sectionEl) {
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

  // tools/importer/transformers/frescopa-dm-images.js
  function detectDynamicMediaUrl(urlStr) {
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) {
      return "scene7";
    }
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  var LINKED_DM_INLINE_WRAPPER_TAGS = /* @__PURE__ */ new Set(["PICTURE"]);
  var LINKED_DM_WRAPPER_SIBLING_TAGS = /* @__PURE__ */ new Set(["SOURCE"]);
  function findLinkedDmCarrier(img) {
    if (!img || !img.parentElement) return null;
    let node = img;
    let parent = img.parentElement;
    while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
      let foundNode = false;
      for (const child of parent.children) {
        if (child === node) {
          foundNode = true;
        } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
          return null;
        }
      }
      if (!foundNode) return null;
      node = parent;
      parent = parent.parentElement;
    }
    if (!parent || parent.tagName !== "A") return null;
    if (parent.children.length !== 1 || parent.children[0] !== node) return null;
    if (parent.textContent.trim() !== "") return null;
    return parent;
  }
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function altToLinkText(alt) {
    return alt || EMPTY_ALT_SENTINEL;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(src)) return;
      const alt = img.getAttribute("alt") || "";
      const linkedAnchor = findLinkedDmCarrier(img);
      if (linkedAnchor) {
        linkedAnchor.setAttribute("title", src);
        linkedAnchor.textContent = altToLinkText(alt);
        return;
      }
      const parent = img.parentElement;
      if (parent && parent.tagName === "A") {
        console.warn("DM image inside mixed-content anchor, skipped:", src);
        return;
      }
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = altToLinkText(alt);
      img.replaceWith(a);
    });
  }

  // tools/importer/import-content-guide-page-alt.js
  var parsers = {
    "hero-teaser-teal": parse,
    "cards-numbered": parse2,
    "embed-video": parse3
  };
  var PAGE_TEMPLATE = {
    name: "content-guide-page-alt",
    description: "Editorial content layout: hero intro, numbered cards, and a media/video section",
    urls: [
      "https://frescopa.coffee/sustainability"
    ],
    blocks: [
      { name: "hero-teaser-teal", instances: [".teaser.block"] },
      { name: "cards-numbered", instances: [".cards.block"] },
      { name: "embed-video", instances: [".dm-video.block"] }
    ],
    sections: [
      { id: "section-1", name: "Sustainability hero", selector: ".teaser-wrapper", style: null, blocks: ["hero-teaser-teal"], defaultContent: [] },
      { id: "section-2", name: "Focus areas numbered cards", selector: ".section.cards-container", style: null, blocks: ["cards-numbered"], defaultContent: [".cards-container h2"] },
      { id: "section-3", name: "Sustainability video", selector: ".dm-video-wrapper", style: null, blocks: ["embed-video"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : [],
    transform3
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
  var import_content_guide_page_alt_default = {
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
  return __toCommonJS(import_content_guide_page_alt_exports);
})();
