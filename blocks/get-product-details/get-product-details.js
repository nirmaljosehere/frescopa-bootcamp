// codegen:layout-pattern=detail-split
// Sample data for standalone/preview mode. In production, data comes from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'House Blend - Dark Roast', description: 'A bold blend of Arabica and Robusta beans with notes of dark chocolate, toasted nuts, and a hint of smokiness.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:3c43c4b2-5e63-42ca-a80b-e63d134a1cbe/as/FRES-COF-001.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Bagged Coffee' },
  { name: 'House Blend - Expresso', description: 'A rich, full-bodied coffee with notes of dark chocolate, caramel, and nuttiness.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:3df2b232-b4f1-4d4e-ac8e-2b76c28fb00e/as/FRES-COF-002.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Coffee Pods' },
  { name: 'House Blend - Medium Roast', description: 'A smooth blend with bold notes of caramel, toasted nuts, and fruitiness for a flavorful, aromatic cup.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:19414faa-96e6-489d-9c62-5f3c3bc708d7/as/FRES-COF-003.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Bagged Coffee' },
  { name: 'Morning Muse - Light Roast', description: 'A Colombian roast with caramel, chocolate, and cherry flavor.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:e4be36fc-dc7c-4374-9505-a89b3c59271b/as/FRES-COF-004.webp?quality=80&width=960&height=1191', price: '$3.99', category: 'Bagged Coffee' },
  { name: 'Fresco Deluxe', description: 'Triple-nozzle machine with timed brewing, adjustable grind coarseness, and custom drink settings.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:37d0c924-9f9e-4622-a4ba-121a2b7d5fff/as/FRES-MAC-002.webp?quality=80&width=960&height=1191', price: '$499.00', category: 'Coffee Machines' },
  { name: 'Frescopa Maestro 300', description: 'Fully automatic bean-to-cup machine with a built-in grinder and automatic milk system.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:1fd8810d-d13a-49fd-af60-a8df5ee209e3/as/FRES-MAC-005.webp?quality=80&width=960&height=1191', price: '$1,099.00', category: 'Coffee Machines' },
];

// Preview default — the product the user asked about.
const PREVIEW_ITEM = SAMPLE_DATA.find((p) => p.name === 'Frescopa Maestro 300') || SAMPLE_DATA[0];

// Brand colors from DESIGN_TOKENS (Warm Roast Editorial).
const PALETTE = ['#00647d', '#95351d', '#ebb439', '#58181d', '#004e62'];
const CTA_PRIMARY_REST = '#00647d';
const CTA_PRIMARY_HOVER = '#004e62';
const CTA_SECONDARY = '#95351d';

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
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

const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = PREVIEW_ITEM;
    } else {
      // Detail concept — structuredContent IS the item (flat). No wrapper key.
      const _result = await bridge.toolResult;
      item = _result?.structuredContent || {};
    }
  } else {
    item = PREVIEW_ITEM;
  }

  block.textContent = '';

  if (!item?.name) {
    const empty = document.createElement('p');
    empty.className = 'gpd-empty';
    empty.textContent = 'No matching product was found.';
    block.appendChild(empty);
  } else {
    renderDetail(block, item, bridge);
  }

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

function formatPrice(item) {
  if (item.price == null) return '';
  const raw = String(item.price);
  if (/[^\d.,\s-]/.test(raw)) return raw; // already carries a currency symbol/code
  const cur = item.currency || '';
  return cur ? `${cur} ${raw}`.trim() : raw;
}

function renderDetail(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'gpd-card';

  // Image (LEFT)
  const imageWrap = document.createElement('div');
  imageWrap.className = 'gpd-image';
  const fallbackColor = CARD_COLORS[0];
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
    img.onerror = () => img.parentNode && img.parentNode.replaceChild(colorDiv(), img);
    imageWrap.appendChild(img);
  } else {
    imageWrap.appendChild(colorDiv());
  }
  card.appendChild(imageWrap);

  // Content (RIGHT)
  const content = document.createElement('div');
  content.className = 'gpd-content';
  content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  if (item.category) {
    const chip = document.createElement('span');
    chip.className = 'gpd-chip';
    chip.textContent = item.category;
    content.appendChild(chip);
  }

  const title = document.createElement('h3');
  title.className = 'gpd-title';
  title.textContent = item.name;
  content.appendChild(title);

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'gpd-desc';
    desc.textContent = item.description;
    content.appendChild(desc);
  }

  // Optional attribute rows — only when populated.
  const attrs = document.createElement('div');
  attrs.className = 'gpd-attrs';
  if (item.roast_level) attrs.appendChild(buildAttr('Roast', item.roast_level));
  if (Array.isArray(item.tasting_notes) && item.tasting_notes.length) attrs.appendChild(buildAttr('Notes', item.tasting_notes.join(', ')));
  if (Array.isArray(item.features) && item.features.length) attrs.appendChild(buildAttr('Features', item.features.join(', ')));
  if (item.availability) attrs.appendChild(buildAttr('Availability', item.availability));
  if (attrs.children.length) content.appendChild(attrs);

  const priceText = formatPrice(item);
  if (priceText) {
    const price = document.createElement('div');
    price.className = 'gpd-price';
    price.textContent = priceText;
    content.appendChild(price);
  }

  const actions = document.createElement('div');
  actions.className = 'gpd-actions';

  const compareBtn = document.createElement('button');
  compareBtn.type = 'button';
  compareBtn.className = 'gpd-btn gpd-btn-secondary';
  compareBtn.textContent = 'Compare Product';
  compareBtn.style.background = CTA_SECONDARY;
  if (bridge) {
    compareBtn.addEventListener('click', () => {
      bridge.sendMessage(`Compare ${item.name} with similar products`);
    });
  }
  actions.appendChild(compareBtn);

  const shopBtn = document.createElement('button');
  shopBtn.type = 'button';
  shopBtn.className = 'gpd-btn gpd-btn-primary';
  shopBtn.textContent = 'Shop Product';
  shopBtn.style.background = CTA_PRIMARY_REST;
  if (bridge) {
    shopBtn.addEventListener('click', () => {
      const url = item.product_url || item.url;
      if (url) bridge.openLink(url);
      else bridge.sendMessage(`Where can I buy the ${item.name}?`);
    });
  }
  actions.appendChild(shopBtn);

  content.appendChild(actions);
  card.appendChild(content);
  block.appendChild(card);
}

function buildAttr(label, value) {
  const row = document.createElement('div');
  row.className = 'gpd-attr';
  const l = document.createElement('span');
  l.className = 'gpd-attr-label';
  l.textContent = label;
  const v = document.createElement('span');
  v.className = 'gpd-attr-value';
  v.textContent = value;
  row.appendChild(l);
  row.appendChild(v);
  return row;
}
