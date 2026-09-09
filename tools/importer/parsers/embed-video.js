/* eslint-disable */
/* global WebImporter */
/**
 * Parser for embed-video (sustainability video).
 * Base block: embed
 * Source: https://frescopa.coffee/sustainability (.dm-video.block)
 * Generated: 2026-06-13
 *
 * The source is an Adobe Dynamic Media video: an <iframe> inside
 * .dm-video-iframe-wrap whose src is a DM Open API delivery URL
 * (host delivery-p*-e*.adobeaemcloud.com, path /adobe/assets/urn:.../play).
 *
 * Migration strategy (canonical EDS embed block, per embed-video.js
 * `block.querySelector('a').href`):
 *  - Represent the video as a single-cell row containing the video URL as an
 *    anchor (text equals href). The embed-video block's decorate() reads the
 *    anchor href and builds the contained 16:9 iframe via its generic-iframe
 *    branch (DM /play URL).
 *  - The DM video URL is preserved VERBATIM, including all query params
 *    (languageselected, mode, autoplay, muted, lang, customcss). Stripping
 *    params would break playback/styling.
 */
export default function parse(element, { document }) {
  // --- Extract the video URL verbatim -------------------------------------
  // Preferred: the DM video iframe src. Fallbacks cover an already-anchored
  // URL or any iframe within the block.
  let videoUrl = null;

  const iframe = element.querySelector(
    'iframe.dm-video-iframe, .dm-video-iframe-wrap iframe, iframe[src]',
  );
  if (iframe && iframe.getAttribute('src')) {
    videoUrl = iframe.getAttribute('src');
  }

  // Fallback: the URL may already be authored as an anchor href.
  if (!videoUrl) {
    const anchor = element.querySelector('a[href]');
    if (anchor && anchor.getAttribute('href')) {
      videoUrl = anchor.getAttribute('href');
    }
  }

  // Only emit an embed-video block when a video URL was found.
  if (!videoUrl) {
    element.remove();
    return;
  }

  // Build the embed cell: a single anchor whose text equals its href, per the
  // canonical embed block example. Preserve the URL exactly (no param stripping).
  const link = document.createElement('a');
  link.href = videoUrl;
  link.textContent = videoUrl;

  const cells = [[link]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-video', cells });
  element.replaceWith(block);
}
