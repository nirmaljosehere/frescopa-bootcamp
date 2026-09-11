// codegen:layout-pattern=comparison
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
// SAMPLE_DATA below is the flat catalogue array; for the comparison preview we select
// the two Coffee Machines and derive comparison rows (price, category) from their fields.
const SAMPLE_CATALOGUE = [
  { name: 'House Blend - Dark Roast', description: 'A bold blend of Arabica and Robusta beans with notes of dark chocolate, toasted nuts, and a hint of smokiness.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:3c43c4b2-5e63-42ca-a80b-e63d134a1cbe/as/FRES-COF-001.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Bagged Coffee' },
  { name: 'House Blend - Expresso', description: 'A rich, full-bodied coffee with notes of dark chocolate, caramel, and nuttiness.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:3df2b232-b4f1-4d4e-ac8e-2b76c28fb00e/as/FRES-COF-002.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Coffee Pods' },
  { name: 'House Blend - Medium Roast', description: 'A smooth blend with bold notes of caramel, toasted nuts, and fruitiness for a flavorful, aromatic cup.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:19414faa-96e6-489d-9c62-5f3c3bc708d7/as/FRES-COF-003.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Bagged Coffee' },
  { name: 'Morning Muse - Light Roast', description: 'A Colombian roast with caramel, chocolate, and cherry flavor.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:e4be36fc-dc7c-4374-9505-a89b3c59271b/as/FRES-COF-004.webp?quality=80&width=960&height=1191', price: '$3.99', category: 'Bagged Coffee' },
  { name: 'Fresco Deluxe', description: 'Triple-nozzle machine with timed brewing, adjustable grind coarseness, and custom drink settings.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:37d0c924-9f9e-4622-a4ba-121a2b7d5fff/as/FRES-MAC-002.webp?quality=80&width=960&height=1191', price: '$499.00', category: 'Coffee Machines' },
  { name: 'Frescopa Maestro 300', description: 'Fully automatic bean-to-cup machine with a built-in grinder and automatic milk system.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:1fd8810d-d13a-49fd-af60-a8df5ee209e3/as/FRES-MAC-005.webp?quality=80&width=960&height=1191', price: '$1,099.00', category: 'Coffee Machines' },
];

// Preview fixture: the two Coffee Machines, first the Maestro 300 (the customer's lead pick).
const SAMPLE_DATA = {
  products: [
    SAMPLE_CATALOGUE.find((p) => p.name === 'Frescopa Maestro 300'),
    SAMPLE_CATALOGUE.find((p) => p.name === 'Fresco Deluxe'),
  ],
  comparison_attributes: [],
};

// Brand colors from DESIGN_TOKENS' color tier — used to derive the panel/table background.
const PALETTE = ['#00647d', '#95351d', '#ebb439', '#58181d', '#004e62'];
const SECONDARY_COLOR = '#95351d';
const SHARED_CTA_REST = '#00647d';
const SHARED_CTA_HOVER = '#004e62';

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const CARD_COLORS = ['#00647d', '#95351d', '#ebb439', '#58181d', '#0fb5ae', '#e68619'];

// Build comparison rows from the two products when the tool didn't supply comparison_attributes.
function deriveAttrs(products) {
  const [a, b] = products;
  const rows = [];
  const push = (attribute, first, second) => {
    if (first == null && second == null) return;
    rows.push({ attribute, first_product_value: String(first ?? '—'), second_product_value: String(second ?? '—') });
  };
  push('Price', a?.price, b?.price);
  push('Category', a?.category, b?.category);
  push('Availability', a?.availability, b?.availability);
  return rows;
}

function normalizeAttrs(attrs, products) {
  const src = Array.isArray(attrs) && attrs.length ? attrs : deriveAttrs(products);
  // Skip prose (> ~60 chars) — that belongs in the header description, not the table.
  return src
    .filter((row) => {
      const fv = String(row.first_product_value ?? '');
      const sv = String(row.second_product_value ?? '');
      return fv.length <= 60 && sv.length <= 60;
    })
    .slice(0, 6);
}

export default async function decorate(block, bridge) {
  let products = [];
  let attrs = [];

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      products = SAMPLE_DATA.products;
      attrs = SAMPLE_DATA.comparison_attributes;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || {};
      products = structuredContent?.products || [];
      attrs = structuredContent?.comparison_attributes || [];
    }
  } else {
    products = SAMPLE_DATA.products;
    attrs = SAMPLE_DATA.comparison_attributes;
  }

  block.textContent = '';
  renderComparison(block, products, attrs, bridge);

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

function renderComparison(block, products, attrsInput, bridge) {
  const pair = (products || []).slice(0, 2);
  if (pair.length < 2) {
    const empty = document.createElement('p');
    empty.className = 'compare-products-empty';
    empty.textContent = 'Two products are needed for a side-by-side comparison.';
    block.appendChild(empty);
    return;
  }

  const attrs = normalizeAttrs(attrsInput, pair);

  const container = document.createElement('div');
  container.className = 'compare-products-container';
  if (theme) container.style.background = theme.bg;

  // --- Two header panels ---
  const panels = document.createElement('div');
  panels.className = 'compare-products-panels';

  pair.forEach((product, i) => {
    const panel = document.createElement('div');
    panel.className = 'compare-products-panel';
    if (theme) { panel.style.background = theme.bg; panel.style.color = theme.fg; }

    const imgWrap = document.createElement('div');
    imgWrap.className = 'compare-products-panel-image';
    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (product.image_url) {
      const img = document.createElement('img');
      img.src = product.image_url;
      img.alt = product.name || '';
      img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
      imgWrap.appendChild(img);
    } else {
      imgWrap.appendChild(colorDiv());
    }
    panel.appendChild(imgWrap);

    const body = document.createElement('div');
    body.className = 'compare-products-panel-body';

    const name = document.createElement('h3');
    name.className = 'compare-products-name';
    name.textContent = product.name || '';
    body.appendChild(name);

    if (product.description) {
      const desc = document.createElement('p');
      desc.className = 'compare-products-desc';
      desc.textContent = product.description;
      body.appendChild(desc);
    }

    panel.appendChild(body);
    panels.appendChild(panel);
  });

  container.appendChild(panels);

  // --- Attribute table ---
  if (attrs.length) {
    const table = document.createElement('div');
    table.className = 'compare-products-table';
    const leadAttrs = new Set(['price', 'rating']);

    attrs.forEach((row, idx) => {
      const tr = document.createElement('div');
      tr.className = 'compare-products-row';
      if (idx % 2 === 1) tr.classList.add('compare-products-row--alt');
      const label = String(row.attribute || '').toLowerCase();
      if (leadAttrs.has(label)) tr.classList.add('compare-products-row--lead');

      const labelCell = document.createElement('div');
      labelCell.className = 'compare-products-label';
      labelCell.textContent = row.attribute || '';
      tr.appendChild(labelCell);

      const fv = String(row.first_product_value ?? '—');
      const sv = String(row.second_product_value ?? '—');
      const differs = fv.trim() !== sv.trim();

      [fv, sv].forEach((val) => {
        const cell = document.createElement('div');
        cell.className = 'compare-products-value';
        if (differs) cell.classList.add('compare-products-value--diff');
        cell.textContent = val;
        tr.appendChild(cell);
      });

      table.appendChild(tr);
    });

    container.appendChild(table);
  }

  // --- Per-item CTA row ---
  const ctaRow = document.createElement('div');
  ctaRow.className = 'compare-products-cta-row';

  const ctaSpacer = document.createElement('div');
  ctaSpacer.className = 'compare-products-cta-spacer';
  ctaRow.appendChild(ctaSpacer);

  const ctaLabels = ['View First Product', 'View Second Product'];
  pair.forEach((product, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'compare-products-cta';
    btn.textContent = ctaLabels[i];
    if (bridge) {
      btn.addEventListener('click', () => bridge.sendMessage(`Tell me more about ${product.name}`));
    }
    ctaRow.appendChild(btn);
  });
  container.appendChild(ctaRow);

  // --- Shared "Find Similar Products" CTA row ---
  const sharedRow = document.createElement('div');
  sharedRow.className = 'compare-products-shared-row';

  const sharedSpacer = document.createElement('div');
  sharedSpacer.className = 'compare-products-cta-spacer';
  sharedRow.appendChild(sharedSpacer);

  const sharedBtn = document.createElement('button');
  sharedBtn.type = 'button';
  sharedBtn.className = 'compare-products-cta compare-products-cta--shared';
  sharedBtn.textContent = 'Find Similar Products';
  if (bridge) {
    sharedBtn.addEventListener('click', () => bridge.sendMessage(`Find products similar to ${pair[0].name} and ${pair[1].name}`));
  }
  sharedRow.appendChild(sharedBtn);
  container.appendChild(sharedRow);

  block.appendChild(container);
}
