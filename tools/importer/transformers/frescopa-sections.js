/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Frescopa section boundaries + section metadata.
 *
 * Establishes EDS section breaks (<hr>) and Section Metadata blocks from the
 * sections defined for the matched template in page-templates.json. Fully
 * template-driven via payload.template.sections, so it serves every Frescopa
 * template (homepage: 6 sections, coffee-category: 5 sections).
 *
 * ── Why this transformer can't just querySelector the section selector ──
 * On the homepage each section is its own `.section.<name>-container` div, so
 * `querySelector(section.selector)` resolves to a distinct element per section.
 *
 * But the coffee page (migration-work/cleaned.html) collapses sections 2-5 into
 * ONE combined container whose classList carries every section-container class
 * at once (line 178):
 *   <div class="section product-list-page-custom-container
 *               dm-scene7-template-container article-container
 *               store-locator-container">
 * There, `.section.product-list-page-custom-container`,
 * `.section.dm-scene7-template-container`, and `.section.article-container` all
 * match that SAME node, so querying by the container selector would anchor
 * multiple sections on one element and emit overlapping/duplicate <hr> and
 * Section Metadata at a single point instead of at the real boundaries.
 *
 * ── Boundary resolution strategy ──
 * For each section we resolve its boundary to the top-level WRAPPER of the
 * first authorable content element that belongs to it (via
 * topLevelSectionElement), scanning candidate selectors in document order,
 * skipping the multi-section shared container itself, requiring the boundary to
 * be strictly after the previous section's boundary, and never reusing a
 * claimed wrapper. Candidate selectors per section, in priority order:
 *   1. section.defaultContent[] selectors (e.g. the "Bagged Coffee" /
 *      "Coffee Pods" h3 wrappers)
 *   2. the instance selectors of section.blocks[] (looked up in template.blocks)
 *   3. the section.selector (.section.<name>-container) as a last resort
 * This is correct on the homepage (validated: 5 <hr> + 5 Section Metadata),
 * where every section is its own `.section.<name>-container` directly under
 * `main`.
 *
 * ── KNOWN LIMITATION: coffee-category collapsed+nested DOM ──
 * The scraped coffee page does NOT lay out sections 2-5 as flat siblings under
 * the shared `.section …-container`. The live-parsed DOM nests the Scene7
 * banner, the second product grid, and the article INSIDE the first
 * `.product-list-page-custom-wrapper` (confirmed empirically in a browser:
 * `topLevelSectionElement` of `.dm-scene7-template.block` resolves to
 * `product-list-page-custom-wrapper`, not a distinct `dm-scene7-template-wrapper`).
 * Because every inner section shares that one outer wrapper, no purely
 * template-selector-driven heuristic can split them into 5 distinct boundaries
 * from the ambiguous, repeated container/block selectors alone. On this page
 * the transformer emits the hero break + the first product-grid break/metadata
 * correctly, but cannot reliably place the remaining inner-section breaks.
 *
 * Resolution for coffee-category: the per-section <hr>/style boundaries for the
 * collapsed inner sections need page-specific handling — either a dedicated
 * coffee parser that re-flattens the combined container before this transformer
 * runs, or explicit boundary markers added by the coffee import script. This
 * generic section transformer intentionally does not hard-code coffee-specific
 * DOM surgery. See the migration report for the follow-up.
 *
 * Logic (per generate-import-transformer.md "Section Transformers"):
 *   - Resolve a distinct, in-document-order boundary wrapper per section.
 *   - Process sections in reverse order so DOM insertions don't shift earlier
 *     boundaries. For each section with a `style`, append a Section Metadata
 *     block after the boundary wrapper. For each non-first section, insert an
 *     <hr> before it.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

/**
 * Collect the candidate selectors for a section, in priority order:
 * defaultContent first, then each block's instance selectors, then the section
 * container selector as a fallback.
 */
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

/** True when `el` strictly follows `ref` in document order. */
function isAfter(ref, el) {
  if (!ref) return true;
  if (ref === el) return false;
  // eslint-disable-next-line no-bitwise
  return (ref.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

/**
 * Walk up from a matched content element to the element that should carry the
 * section break / metadata.
 *
 * Normal case (homepage): each section is its own `.section.<name>-container`
 * div directly under `main`, so we walk up to the child of `main`.
 *
 * Collapsed case (coffee page): sections 2-5 share ONE `.section …-container`
 * div, and their content sits in distinct direct-child wrappers of it
 * (.default-content-wrapper, .product-list-page-custom-wrapper,
 * .dm-scene7-template-wrapper, .article-wrapper). Walking all the way up to the
 * shared container would collapse every break/metadata onto one node. So we
 * stop at the highest ancestor whose parent is EITHER `main` OR a
 * `.section`-classed container — giving each collapsed section a distinct
 * insertion point (its own first wrapper) while the homepage still resolves to
 * the top-level section div.
 */
function topLevelSectionElement(element, anchor) {
  let node = anchor;
  while (node.parentElement && node.parentElement !== element) {
    const parent = node.parentElement;
    if (parent.classList && parent.classList.contains('section')) {
      // parent is a section container; `node` is its direct child wrapper.
      break;
    }
    node = parent;
  }
  return node;
}

/**
 * Resolve a section to its top-level boundary element (the wrapper the <hr> and
 * Section Metadata attach to).
 *
 * For each candidate selector match we first map it to its top-level wrapper
 * via topLevelSectionElement, then require that wrapper to be (a) not already
 * claimed by an earlier section and (b) strictly AFTER the previous section's
 * boundary wrapper in document order. Among the qualifying wrappers we take the
 * earliest in document order.
 *
 * The "after previous boundary" constraint (comparing WRAPPERS, not raw content
 * anchors) is what disambiguates the coffee page, where sections 2 and 4 share
 * the same block selector (`.product-list-page-custom.block`) and section 2's
 * defaultContent (`.product-list-page-custom-container h3`) matches BOTH the
 * "Bagged Coffee" and "Coffee Pods" headings inside the one combined container.
 * Section 4 has no defaultContent, so it falls back to the shared block selector
 * and the container selector; requiring its wrapper to come after section 3's
 * (the Scene7 wrapper) forces it onto the SECOND product grid / "Coffee Pods"
 * wrapper rather than re-selecting the first grid.
 */
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
      // Reject a wrapper that is itself the multi-section shared container
      // (coffee page: one `.section …-container` div carries several sections'
      // `*-container` classes at once). Anchoring a section on that shared
      // container would claim the whole region and starve every later section.
      // We only want INNER wrappers (default-content / block wrappers). Detect
      // the shared container by counting how many `-container` classes it has:
      // a normal single-section container has exactly one; the collapsed coffee
      // container has four.
      if (wrapper.classList && wrapper.classList.contains('section')) {
        const containerClassCount = Array.from(wrapper.classList)
          .filter((c) => c.endsWith('-container')).length;
        if (containerClassCount > 1) return;
      }
      // Must come strictly after the previous section's boundary. (When the
      // previous boundary IS the same shared container — i.e. wrapper === the
      // ancestor of prevBoundary — isAfter handles document order between
      // sibling wrappers correctly.)
      if (prevBoundary && !isAfter(prevBoundary, wrapper)) return;
      // Keep the EARLIEST qualifying wrapper: replace `best` only when the new
      // wrapper precedes it in document order (i.e. best is after wrapper).
      if (!best || isAfter(wrapper, best)) {
        best = wrapper;
      }
    });
  });
  return best;
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const template = payload && payload.template;
    const sections = (template && template.sections) || [];
    if (sections.length < 2) {
      return;
    }

    const doc = element.ownerDocument;

    // Map block name -> instance selectors so section.blocks[] can resolve to
    // DOM selectors (used as boundary anchors when defaultContent is absent).
    const blockIndex = {};
    (template.blocks || []).forEach((block) => {
      if (block && block.name) blockIndex[block.name] = block.instances || [];
    });

    // Resolve a distinct boundary wrapper per section first, before any DOM
    // mutation, so insertions don't disturb resolution. `claimed` prevents the
    // coffee page's shared container children from being assigned to multiple
    // sections; `prevBoundary` enforces strictly-increasing document order so
    // sections sharing a block selector land on successive wrappers.
    const claimed = new Set();
    let prevBoundary = null;
    const anchors = sections.map((section) => {
      if (!section) return null;
      const boundary = resolveSectionBoundary(
        element, section, blockIndex, claimed, prevBoundary,
      );
      if (!boundary) return null;
      claimed.add(boundary);
      prevBoundary = boundary;
      return boundary;
    });

    // Apply in reverse order so earlier insertions don't invalidate later refs.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = anchors[i];
      if (!section || !sectionEl) {
        continue;
      }

      // Section Metadata block (only when the section declares a style).
      if (section.style) {
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(metadataBlock);
      }

      // Section break before every section except the first.
      if (i > 0) {
        sectionEl.before(doc.createElement('hr'));
      }
    }
  }
}
