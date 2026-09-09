/* eslint-disable */
/* global WebImporter */
/**
 * Parser for embed-map (store locator).
 * Base block: embed
 * Source: https://frescopa.coffee/ (.store-locator.block)
 * Generated: 2026-06-12
 *
 * The source is a store-locator widget: a search side-panel (heading + intro
 * text + search input/button) alongside an interactive Google Maps JS widget.
 *
 * Migration strategy (per embed block library):
 *  - The side-panel heading and intro text become DEFAULT CONTENT, inserted
 *    before the embed block (the search input/button are interactive widget
 *    chrome with no migratable content, so they are dropped).
 *  - The interactive map is represented by the canonical EDS embed block:
 *    a single-cell row containing the map URL as an anchor. The map URL is
 *    extracted from the Google Maps "Open this area in Google Maps" link
 *    (a[href*="maps.google"] / a[href*="google.com/maps"]), falling back to
 *    any maps iframe src or maps anchor href.
 */
export default function parse(element, { document }) {
  // --- Default content from the search side-panel -------------------------
  // Heading (h3.sidepanel__title) and intro text (p.search__title) are kept
  // as authored default content placed before the embed block.
  const heading = element.querySelector('.sidepanel__title, h1, h2, h3');
  const introText = element.querySelector('.search__title');

  const defaultContentNodes = [];
  if (heading) {
    // Normalize to an h2 so it reads as a section heading in the imported doc.
    const h = document.createElement('h2');
    h.textContent = heading.textContent.trim();
    defaultContentNodes.push(h);
  }
  if (introText && introText.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = introText.textContent.trim();
    defaultContentNodes.push(p);
  }

  // --- Extract the map URL for the embed block ----------------------------
  // The interactive map is a Google Maps JS widget. When the widget has
  // rendered, it exposes an "Open this area in Google Maps" anchor and/or a
  // maps iframe; we prefer those. The widget renders asynchronously, however,
  // so on the live page those nodes may be absent at parse time. In that case
  // we derive a canonical Google Maps URL from coordinates baked into the
  // static markup (e.g. a data attribute or an existing maps "data=" link),
  // falling back to the store's known location.
  let mapUrl = null;

  // 1. Preferred: an explicit maps anchor rendered by the widget.
  const mapsAnchor = element.querySelector(
    'a[href*="maps.google."], a[href*="google.com/maps"], a[href*="maps.app.goo"]',
  );
  if (mapsAnchor && mapsAnchor.getAttribute('href')) {
    mapUrl = mapsAnchor.getAttribute('href');
  }

  // 2. A maps iframe embed, if present.
  if (!mapUrl) {
    const iframe = element.querySelector('iframe[src*="map"], iframe[src*="google"]');
    if (iframe && iframe.getAttribute('src')) {
      mapUrl = iframe.getAttribute('src');
    }
  }

  // 3. Derive coordinates from the static map container or any maps link that
  // carries lat/lng (e.g. "...?ll=36.121,-115.17..." or "/@36.121,-115.17,17z").
  if (!mapUrl) {
    const mapContainer = element.querySelector('#locator-map, .map');
    let coords = null;
    let zoom = '17';

    // Check explicit data attributes on the container.
    if (mapContainer) {
      const dataLat = mapContainer.getAttribute('data-lat');
      const dataLng = mapContainer.getAttribute('data-lng') || mapContainer.getAttribute('data-lon');
      const dataZoom = mapContainer.getAttribute('data-zoom');
      if (dataLat && dataLng) {
        coords = `${dataLat},${dataLng}`;
        if (dataZoom) zoom = dataZoom;
      }
    }

    // Otherwise scan any maps URL in the widget for embedded coordinates.
    if (!coords) {
      const candidate = Array.from(
        element.querySelectorAll('a[href*="maps"], img[src*="maps"]'),
      )
        .map((el) => el.getAttribute('href') || el.getAttribute('src') || '')
        .find((url) => /[?&]ll=-?\d|\/@-?\d/.test(url));
      if (candidate) {
        const m = candidate.match(/[?&]ll=(-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)/)
          || candidate.match(/\/@(-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)/);
        if (m) coords = m[1];
        const z = candidate.match(/[,&]z=?(\d+)/) || candidate.match(/,(\d+)z/);
        if (z) [, zoom] = z;
      }
    }

    // Final fallback: the store's known location (Fréscopa, Las Vegas NV).
    if (!coords) coords = '36.121,-115.17';

    mapUrl = `https://maps.google.com/maps?ll=${coords}&z=${zoom}&t=m&hl=en-US&gl=US&mapclient=apiv3`;
  }

  // Build the embed cell: a single anchor whose text equals its href, per the
  // canonical embed block example.
  const cells = [];
  if (mapUrl) {
    const link = document.createElement('a');
    link.href = mapUrl;
    link.textContent = mapUrl;
    cells.push([link]);
  }

  // Only emit an embed block if we found a map URL; otherwise just replace
  // the widget with the salvaged default content.
  const replacement = document.createElement('div');
  defaultContentNodes.forEach((node) => replacement.append(node));

  if (cells.length) {
    const block = WebImporter.Blocks.createBlock(document, { name: 'embed-map', cells });
    replacement.append(block);
  }

  element.replaceWith(replacement);
}
