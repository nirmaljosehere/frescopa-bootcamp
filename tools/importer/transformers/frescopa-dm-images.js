/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Frescopa Dynamic Media / Scene7 image carrier.
 *
 * The coffee-category page sources imagery from two DM families (detected in
 * migration-work/metadata.json `.images.mapping` during STEP 4 of the
 * import-transformer sub-agent):
 *   - Scene7 IS/Image:   https://s7d1.scene7.com/is/image/SummitProd/TimeSensitiveOffer?...
 *                        (the section-3 limited-time offer banner)
 *   - DM Open API:       https://delivery-p149891-e1546481.adobeaemcloud.com/adobe/assets/urn:aaid:aem:...
 *                        (the cards-product grid product images)
 * (The <img src> values in cleaned.html are localized ./images/<hash> paths;
 * the importer presents the original DM/Scene7 URLs at afterTransform.)
 *
 * Runs ONLY in afterTransform. Block parsers run between the two hooks and
 * extract <img> references into block cells (cards/columns image cells); a
 * beforeTransform rewrite would leave those cells empty. After parsing, this
 * transformer walks the parser-modified DOM and rewrites every DM <img> into an
 * anchor so the URL round-trips through markdown intact. The companion
 * client-side auto-block (buildDynamicMediaImages in scripts/scripts.js,
 * installed by the site-migration orchestrator) rebuilds responsive <picture>
 * markup from those anchors at render time.
 *
 * Canonical helpers below are copied byte-identical from
 * sub-agents/.../references/dm-scene7-helpers.js (the transformer-side subset:
 * detectDynamicMediaUrl, findLinkedDmCarrier, EMPTY_ALT_SENTINEL, altToLinkText).
 */

// ---- Begin canonical helpers (copy from dm-scene7-helpers.js) ----
function detectDynamicMediaUrl(urlStr) {
  let u;
  try { u = new URL(urlStr, 'https://x/'); } catch { return false; }
  // Scene7 detected by path alone — hostname is irrelevant because customer
  // sites routinely CNAME a vanity domain to Scene7. Keep byte-identical with
  // dm-scene7-helpers.js.
  if (u.pathname.startsWith('/is/image/')) {
    return 'scene7';
  }
  if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname)
      && u.pathname.startsWith('/adobe/assets/urn:')) {
    return 'dm-openapi';
  }
  return false;
}

// Walk up from a DM <img> through allow-listed inline wrappers (currently just
// <picture>) to find the carrier anchor for the linked-image round-trip.
// Returns the outer <a> when the img is the sole meaningful descendant; null
// otherwise. Keep byte-identical with dm-scene7-helpers.js.
const LINKED_DM_INLINE_WRAPPER_TAGS = new Set(['PICTURE']);
const LINKED_DM_WRAPPER_SIBLING_TAGS = new Set(['SOURCE']); // standard <picture> siblings
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
  if (!parent || parent.tagName !== 'A') return null;
  if (parent.children.length !== 1 || parent.children[0] !== node) return null;
  if (parent.textContent.trim() !== '') return null;
  return parent;
}

const EMPTY_ALT_SENTINEL = 'Image without alt text';

function altToLinkText(alt) {
  return alt || EMPTY_ALT_SENTINEL;
}
// ---- End canonical helpers ----

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const doc = element.ownerDocument;

  element.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!detectDynamicMediaUrl(src)) return;

    // Preserve alt verbatim, including empty string for decorative images (the
    // Scene7 offer banner has alt=""). The auto-block uses the URL pattern (not
    // the text) to find these anchors, so the link text is purely a
    // Document-view UX cue. When alt is empty we substitute EMPTY_ALT_SENTINEL
    // so authors see a visible cell at the image's position; the auto-block
    // translates the sentinel back to alt="" via linkTextToAlt() so screen
    // readers correctly skip decorative images.
    const alt = img.getAttribute('alt') || '';

    // Linked image (incl. parser-wrapped <a><picture><img></picture></a>, which
    // is exactly the shape cards-product emits for each product tile). Stash the
    // DM URL in title, keep the outer navigation href; setting textContent
    // replaces any wrapper descendants with the link text.
    const linkedAnchor = findLinkedDmCarrier(img);
    if (linkedAnchor) {
      linkedAnchor.setAttribute('title', src);
      linkedAnchor.textContent = altToLinkText(alt);
      return;
    }

    // Inside an anchor but not a sole-meaningful-child shape — mixed content.
    // No clean single-anchor markdown representation; skip and warn.
    const parent = img.parentElement;
    if (parent && parent.tagName === 'A') {
      // eslint-disable-next-line no-console
      console.warn('DM image inside mixed-content anchor, skipped:', src);
      return;
    }

    // Unlinked image (the standalone Scene7 offer banner): create an anchor
    // whose href is the DM URL.
    const a = doc.createElement('a');
    a.href = src;
    a.textContent = altToLinkText(alt);
    img.replaceWith(a);
  });
}
