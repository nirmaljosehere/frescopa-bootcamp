// codegen:layout-pattern=carousel
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'House Blend - Dark Roast', short_description: 'A bold blend of Arabica and Robusta beans with notes of dark chocolate, toasted nuts, and a hint of smokiness.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:3c43c4b2-5e63-42ca-a80b-e63d134a1cbe/as/FRES-COF-001.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Bagged Coffee' },
  { name: 'House Blend - Expresso', short_description: 'A rich, full-bodied coffee with notes of dark chocolate, caramel, and nuttiness.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:3df2b232-b4f1-4d4e-ac8e-2b76c28fb00e/as/FRES-COF-002.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Coffee Pods' },
  { name: 'House Blend - Medium Roast', short_description: 'A smooth blend with bold notes of caramel, toasted nuts, and fruitiness for a flavorful, aromatic cup.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:19414faa-96e6-489d-9c62-5f3c3bc708d7/as/FRES-COF-003.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Bagged Coffee' },
  { name: 'Morning Muse - Light Roast', short_description: 'A Colombian roast with caramel, chocolate, and cherry flavor.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:e4be36fc-dc7c-4374-9505-a89b3c59271b/as/FRES-COF-004.webp?quality=80&width=960&height=1191', price: '$3.99', category: 'Bagged Coffee' },
  { name: 'Fresco Deluxe', short_description: 'Triple-nozzle machine with timed brewing, adjustable grind coarseness, and custom drink settings.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:37d0c924-9f9e-4622-a4ba-121a2b7d5fff/as/FRES-MAC-002.webp?quality=80&width=960&height=1191', price: '$499.00', category: 'Coffee Machines' },
  { name: 'Frescopa Maestro 300', short_description: 'Fully automatic bean-to-cup machine with a built-in grinder and automatic milk system.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:1fd8810d-d13a-49fd-af60-a8df5ee209e3/as/FRES-MAC-005.webp?quality=80&width=960&height=1191', price: '$1,099.00', category: 'Coffee Machines' },
];

// Brand colors from DESIGN_TOKENS' color tier (Warm Roast Editorial).
// getThemedCardBg() darkens PALETTE[0] to luminance <= 0.12 for WCAG AA white text.
const PALETTE = ['#00647d', '#95351d', '#ebb439'];
const CTA_ACCENT_REST = '#00647d';
const CTA_ACCENT_HOVER = '#004e62';
const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

function renderCarousel(block, items, bridge) {
  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'search-products-wrapper';

  const btnLeft = document.createElement('button');
  btnLeft.className = 'search-products-arrow search-products-arrow-left';
  btnLeft.setAttribute('aria-label', 'Scroll left');
  btnLeft.textContent = '◄';

  const trackWrap = document.createElement('div');
  trackWrap.className = 'search-products-track-wrap';

  const track = document.createElement('div');
  track.className = 'search-products-track';

  const btnRight = document.createElement('button');
  btnRight.className = 'search-products-arrow search-products-arrow-right';
  btnRight.setAttribute('aria-label', 'Scroll right');
  btnRight.textContent = '►';

  const fade = document.createElement('div');
  fade.className = 'search-products-fade';
  fade.style.background = `linear-gradient(to right, transparent, ${theme?.bg ?? '#1a1a1a'}cc)`;

  items.slice(0, 6).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'search-products-card';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'search-products-img';
    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imgWrap.appendChild(img);
    } else {
      imgWrap.appendChild(colorDiv());
    }
    card.appendChild(imgWrap);

    const info = document.createElement('div');
    info.className = 'search-products-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    const name = document.createElement('div');
    name.className = 'search-products-name';
    name.textContent = item.name || '';
    info.appendChild(name);

    if (item.short_description) {
      const desc = document.createElement('div');
      desc.className = 'search-products-desc';
      desc.textContent = item.short_description;
      info.appendChild(desc);
    }

    const priceRow = document.createElement('div');
    priceRow.className = 'search-products-price-row';
    if (item.price !== undefined && item.price !== null && item.price !== '') {
      const price = document.createElement('span');
      price.className = 'search-products-price';
      const cur = item.currency && !String(item.price).trim().startsWith('$') ? `${item.currency} ` : '';
      price.textContent = `${cur}${item.price}`;
      priceRow.appendChild(price);
    }
    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'search-products-badge';
      badge.textContent = item.category;
      priceRow.appendChild(badge);
    }
    if (priceRow.childNodes.length) info.appendChild(priceRow);

    if (item.availability) {
      const avail = document.createElement('div');
      avail.className = 'search-products-avail';
      avail.textContent = item.availability;
      info.appendChild(avail);
    }

    const cta = document.createElement('button');
    cta.className = 'search-products-cta';
    cta.textContent = 'View Details';
    if (bridge) {
      cta.addEventListener('click', () => {
        if (item.product_url) bridge.openLink(item.product_url);
        else bridge.sendMessage(`Tell me more about ${item.name || 'this product'}`);
      });
    }
    info.appendChild(cta);

    card.appendChild(info);
    track.appendChild(card);
  });

  trackWrap.appendChild(track);
  trackWrap.appendChild(fade);
  wrapper.appendChild(btnLeft);
  wrapper.appendChild(trackWrap);
  wrapper.appendChild(btnRight);
  block.appendChild(wrapper);

  const cardWidth = 220 + 16;
  const scrollLeft = () => track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  const scrollRight = () => track.scrollBy({ left: cardWidth, behavior: 'smooth' });
  btnLeft.addEventListener('click', scrollLeft);
  btnRight.addEventListener('click', scrollRight);
  [btnLeft, btnRight].forEach((btn) => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (btn === btnLeft) scrollLeft(); else scrollRight();
      }
    });
  });
  const updateArrows = () => {
    btnLeft.style.display = track.scrollLeft <= 0 ? 'none' : 'flex';
    btnRight.style.display = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4 ? 'none' : 'flex';
    fade.style.display = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4 ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);
  updateArrows();
}

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || {};
      // structuredContent.products — derived from action name "search_products" (bare array outputSchema rule)
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  if (!items || !items.length) items = SAMPLE_DATA;
  // AMCP-360 is_deal partition: this product-list concept excludes deal items.
  items = items.filter((it) => it.is_deal !== true);

  renderCarousel(block, items, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}
