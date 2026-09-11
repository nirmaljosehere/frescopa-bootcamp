// codegen:layout-pattern=detail-split
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [{
  name: 'MyBarista Monthly Coffee Subscription',
  description: 'A monthly subscription that curates hand-selected coffees to your flavor profile. Take a four-question quiz, receive a curated delivery each month, and rate the coffees you try so future shipments get more personalized.',
  price: '',
  category: 'Coffee Subscription',
}];

// Brand colors from DESIGN_TOKENS' color tier. getThemedCardBg() darkens PALETTE[0]
// to luminance <= 0.12 so white text keeps WCAG AA contrast.
const PALETTE = ['#00647d', '#95351d', '#ebb439', '#58181d', '#004e62', '#ffffff'];

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
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}

const theme = getThemedCardBg(PALETTE);
const CARD_COLORS = ['#ebb439', '#95351d', '#00647d', '#58181d'];

const DEFAULT_STEPS = [
  'Take a four-question preference quiz',
  'Receive your curated monthly delivery',
  'Rate each coffee to refine future shipments',
];

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = Array.isArray(SAMPLE_DATA) ? SAMPLE_DATA[0] : SAMPLE_DATA;
    } else {
      // Detail concept — structuredContent IS the item (flat). No wrapper key.
      const _result = await bridge.toolResult;
      item = _result?.structuredContent || {};
    }
  } else {
    item = Array.isArray(SAMPLE_DATA) ? SAMPLE_DATA[0] : SAMPLE_DATA;
  }

  block.textContent = '';

  const name = item?.plan_name || item?.name;
  if (!name) {
    const empty = document.createElement('p');
    empty.className = 'get-mybarista-subscription-details-empty';
    empty.textContent = 'No subscription details were found.';
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

function renderDetail(block, item, bridge) {
  const name = item.plan_name || item.name || '';
  const category = item.category || item.cadence;

  const card = document.createElement('div');
  card.className = 'get-mybarista-subscription-details-card';

  // Image panel (LEFT)
  const imgPanel = document.createElement('div');
  imgPanel.className = 'get-mybarista-subscription-details-image-panel';
  const fallbackColor = CARD_COLORS[0];
  const colorDiv = () => {
    const d = document.createElement('div');
    d.className = 'get-mybarista-subscription-details-image-placeholder';
    d.style.cssText = `background-color:${fallbackColor};`;
    return d;
  };
  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = name;
    img.onerror = () => { imgPanel.replaceChild(colorDiv(), img); };
    imgPanel.appendChild(img);
  } else {
    imgPanel.appendChild(colorDiv());
  }
  card.appendChild(imgPanel);

  // Content panel (RIGHT)
  const content = document.createElement('div');
  content.className = 'get-mybarista-subscription-details-content';
  content.style.background = theme?.bg ?? '#00647d';
  content.style.color = theme?.fg ?? '#fff';

  const title = document.createElement('h2');
  title.className = 'get-mybarista-subscription-details-title';
  title.textContent = name;
  content.appendChild(title);

  if (item.cadence) {
    const badge = document.createElement('span');
    badge.className = 'get-mybarista-subscription-details-badge';
    badge.textContent = item.cadence;
    content.appendChild(badge);
  } else if (category) {
    const badge = document.createElement('span');
    badge.className = 'get-mybarista-subscription-details-badge';
    badge.textContent = category;
    content.appendChild(badge);
  }

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'get-mybarista-subscription-details-description';
    desc.textContent = item.description;
    content.appendChild(desc);
  }

  // Pricing / offer — only when available
  if (item.current_offer) {
    const offer = document.createElement('div');
    offer.className = 'get-mybarista-subscription-details-offer';
    offer.textContent = item.current_offer;
    content.appendChild(offer);
  } else if (item.price !== undefined && item.price !== null && item.price !== '') {
    const price = document.createElement('div');
    price.className = 'get-mybarista-subscription-details-price';
    const cur = item.currency ? `${item.currency} ` : '';
    price.textContent = `${cur}${item.price}`;
    content.appendChild(price);
  }

  // Three-step personalization timeline
  const steps = Array.isArray(item.personalization_process) && item.personalization_process.length
    ? item.personalization_process.slice(0, 3)
    : DEFAULT_STEPS;
  const timeline = document.createElement('div');
  timeline.className = 'get-mybarista-subscription-details-timeline';
  steps.forEach((stepText, i) => {
    const step = document.createElement('div');
    step.className = 'get-mybarista-subscription-details-step';
    const num = document.createElement('span');
    num.className = 'get-mybarista-subscription-details-step-num';
    num.textContent = String(i + 1);
    const txt = document.createElement('span');
    txt.className = 'get-mybarista-subscription-details-step-text';
    txt.textContent = stepText;
    step.appendChild(num);
    step.appendChild(txt);
    timeline.appendChild(step);
  });
  content.appendChild(timeline);

  // First shipment timing
  if (item.first_shipment_timing) {
    const meta = document.createElement('div');
    meta.className = 'get-mybarista-subscription-details-meta';
    const label = document.createElement('strong');
    label.textContent = 'First shipment: ';
    meta.appendChild(label);
    meta.appendChild(document.createTextNode(item.first_shipment_timing));
    content.appendChild(meta);
  }

  // CTAs — max 2. Primary: Start Subscription; Secondary: Take Coffee Quiz.
  const actions = document.createElement('div');
  actions.className = 'get-mybarista-subscription-details-actions';

  const startBtn = document.createElement('button');
  startBtn.className = 'get-mybarista-subscription-details-cta get-mybarista-subscription-details-cta-primary';
  startBtn.type = 'button';
  startBtn.textContent = 'Start Subscription';
  if (bridge) {
    startBtn.addEventListener('click', () => {
      if (item.subscription_url) bridge.openLink(item.subscription_url);
      else bridge.sendMessage(`Tell me more about ${name}`);
    });
  }
  actions.appendChild(startBtn);

  const quizBtn = document.createElement('button');
  quizBtn.className = 'get-mybarista-subscription-details-cta get-mybarista-subscription-details-cta-secondary';
  quizBtn.type = 'button';
  quizBtn.textContent = 'Take Coffee Quiz';
  if (bridge) {
    quizBtn.addEventListener('click', () => {
      bridge.sendMessage(`I'd like to take the coffee preference quiz for ${name}`);
    });
  }
  actions.appendChild(quizBtn);

  content.appendChild(actions);
  card.appendChild(content);
  block.appendChild(card);
}
