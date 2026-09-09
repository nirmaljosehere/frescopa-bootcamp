/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Frescopa site-wide cleanup.
 *
 * The source page (https://frescopa.coffee/) is itself an AEM EDS page, so the
 * captured DOM (migration-work/cleaned.html) contains EDS scaffolding that is
 * NOT page-level authorable content: the global header/nav block, the footer
 * block, and the Adobe Commerce dropin chrome (minicart panel, search
 * autocomplete, auth sign-in dropin, nav tool panels, and the modal overlay).
 *
 * All selectors below were verified against migration-work/cleaned.html:
 *   - header.header-wrapper                  (line 2)   global header/nav wrapper
 *   - footer.footer-wrapper                  (line 643) global footer wrapper
 *   - .overlay                               (line 3)   modal/dropin overlay (inside header)
 *   - .minicart-panel                        (line 61)  commerce minicart dropin panel
 *   - .nav-search-panel / #search_autocomplete (lines 68, 71) search dropin + autocomplete
 *   - #auth-dropin-container                 (line 81)  auth sign-in dropin
 *   - .nav-tools-panel                        (lines 61, 68, 80) commerce tool flyout panels
 *
 * The commerce dropin chrome and overlay all live inside header.header-wrapper,
 * so removing the header removes them. They are also targeted explicitly as a
 * defensive measure in case the importer scope retains them as siblings.
 *
 * coffee-category template addition (verified against migration-work/cleaned.html):
 *   - .store-locator-wrapper / .store-locator.block (lines 441-452) is an EMPTY
 *     store-locator instance that renders nothing on the coffee page. It carries
 *     no authorable content (only empty nested divs), so it is stripped here.
 *     It is NOT a section in the coffee-category template, so removing it keeps
 *     the import limited to the 5 real sections.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove interactive commerce dropin chrome and the modal overlay before
    // block parsing so these panels never interfere with block matching.
    // Selectors verified in cleaned.html (see header notes above).
    WebImporter.DOMUtils.remove(element, [
      '.overlay',
      '.minicart-panel',
      '.nav-search-panel',
      '#search_autocomplete',
      '#auth-dropin-container',
      '.nav-tools-panel',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove non-authorable global chrome (header/nav, footer) and any leftover
    // safe-to-strip elements. Selectors verified in cleaned.html.
    WebImporter.DOMUtils.remove(element, [
      'header.header-wrapper',
      'footer.footer-wrapper',
      'header',
      'footer',
      'nav',
      'noscript',
      'link',
    ]);

    // coffee-category: remove the trailing EMPTY store-locator instance only.
    // On the coffee page (cleaned.html lines 441-452) this block contains only
    // empty nested divs and renders nothing; it is not one of the 5 authorable
    // sections. We must NOT remove a populated store-locator (the homepage maps
    // .store-locator.block -> embed-map as authorable content with a real map
    // widget), so guard on emptiness: strip the block (and its wrapper) only
    // when it has no text and no media/anchors. Selectors verified in cleaned.html.
    element.querySelectorAll('.store-locator.block').forEach((slBlock) => {
      const hasContent = slBlock.textContent.trim() !== ''
        || slBlock.querySelector('img, picture, a, iframe, svg, [id*="map"]');
      if (!hasContent) {
        const wrapper = slBlock.closest('.store-locator-wrapper');
        (wrapper || slBlock).remove();
      }
    });
  }
}
