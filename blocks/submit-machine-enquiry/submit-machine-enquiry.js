// codegen:layout-pattern=generic-form
// Sample data for standalone/preview mode.
// In production, form values are collected from user input and the confirmation
// comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'House Blend - Dark Roast', description: 'A bold blend of Arabica and Robusta beans with notes of dark chocolate, toasted nuts, and a hint of smokiness.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:3c43c4b2-5e63-42ca-a80b-e63d134a1cbe/as/FRES-COF-001.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Bagged Coffee' },
  { name: 'House Blend - Expresso', description: 'A rich, full-bodied coffee with notes of dark chocolate, caramel, and nuttiness.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:3df2b232-b4f1-4d4e-ac8e-2b76c28fb00e/as/FRES-COF-002.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Coffee Pods' },
  { name: 'House Blend - Medium Roast', description: 'A smooth blend with bold notes of caramel, toasted nuts, and fruitiness for a flavorful, aromatic cup.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:19414faa-96e6-489d-9c62-5f3c3bc708d7/as/FRES-COF-003.webp?quality=80&width=960&height=1191', price: '$14.99', category: 'Bagged Coffee' },
  { name: 'Morning Muse - Light Roast', description: 'A Colombian roast with caramel, chocolate, and cherry flavor.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:e4be36fc-dc7c-4374-9505-a89b3c59271b/as/FRES-COF-004.webp?quality=80&width=960&height=1191', price: '$3.99', category: 'Bagged Coffee' },
  { name: 'Fresco Deluxe', description: 'Triple-nozzle machine with timed brewing, adjustable grind coarseness, and custom drink settings.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:37d0c924-9f9e-4622-a4ba-121a2b7d5fff/as/FRES-MAC-002.webp?quality=80&width=960&height=1191', price: '$499.00', category: 'Coffee Machines' },
  { name: 'Frescopa Maestro 300', description: 'Fully automatic bean-to-cup machine with a built-in grinder and automatic milk system.', image_url: 'https://delivery-p158081-e1683323.adobeaemcloud.com/adobe/assets/urn:aaid:aem:1fd8810d-d13a-49fd-af60-a8df5ee209e3/as/FRES-MAC-005.webp?quality=80&width=960&height=1191', price: '$1,099.00', category: 'Coffee Machines' },
];

// The machine this enquiry is about (chosen by the host/user upstream).
const SELECTED_MACHINE = 'Frescopa Maestro 300';

// Brand colors from DESIGN_TOKENS' color tier (Warm Roast Editorial).
const PALETTE = ['#00647d', '#95351d', '#ebb439', '#58181d', '#ffffff', '#004e62'];

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

function findMachine(items, name) {
  if (!Array.isArray(items)) return null;
  return items.find((it) => it && it.name === name) || items.find((it) => it && it.category === 'Coffee Machines') || null;
}

export default async function decorate(block, bridge) {
  let machine = findMachine(SAMPLE_DATA, SELECTED_MACHINE);
  let confirmation = null;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (!isPreview) {
      // Detail/flat result — structuredContent IS the confirmation object.
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || {};
      if (structuredContent && structuredContent.confirmation_id) {
        confirmation = structuredContent;
      }
    }
  }

  block.textContent = '';
  if (confirmation) {
    renderConfirmation(block, confirmation, machine, bridge);
  } else {
    renderForm(block, machine, bridge);
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

function buildHeader(machine) {
  const header = document.createElement('div');
  header.className = 'sme-header';
  header.style.cssText = `background:${theme?.bg ?? '#00303c'};color:${theme?.fg ?? '#fff'}`;

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'sme-thumb';
  const fallbackColor = CARD_COLORS[0];
  if (machine && machine.image_url) {
    const img = document.createElement('img');
    img.src = machine.image_url;
    img.alt = machine.name || 'Selected machine';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      if (img.parentNode) img.parentNode.replaceChild(d, img);
    };
    thumbWrap.appendChild(img);
  } else {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    thumbWrap.appendChild(d);
  }
  header.appendChild(thumbWrap);

  const meta = document.createElement('div');
  meta.className = 'sme-header-meta';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'sme-eyebrow';
  eyebrow.textContent = 'Machine Enquiry';
  meta.appendChild(eyebrow);
  const title = document.createElement('h3');
  title.className = 'sme-title';
  title.textContent = (machine && machine.name) || SELECTED_MACHINE;
  meta.appendChild(title);
  if (machine && machine.price) {
    const price = document.createElement('span');
    price.className = 'sme-price';
    price.textContent = machine.price;
    meta.appendChild(price);
  }
  header.appendChild(meta);
  return header;
}

function renderForm(block, machine, bridge) {
  const card = document.createElement('div');
  card.className = 'sme-card';
  card.appendChild(buildHeader(machine));

  const form = document.createElement('form');
  form.className = 'sme-form';
  form.setAttribute('novalidate', '');

  const fields = [
    { key: 'customer_name', label: 'Your name', type: 'text', required: true, autocomplete: 'name' },
    { key: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' },
    { key: 'phone', label: 'Phone (optional)', type: 'tel', required: false, autocomplete: 'tel' },
    { key: 'intended_use', label: 'Home or business use', type: 'text', required: true, placeholder: 'e.g. office kitchen' },
    { key: 'message', label: 'Message (optional)', type: 'textarea', required: false, placeholder: 'Questions or requirements' },
  ];

  const inputs = {};
  fields.forEach((f) => {
    const row = document.createElement('label');
    row.className = 'sme-field';
    const span = document.createElement('span');
    span.className = 'sme-label';
    span.textContent = f.label;
    row.appendChild(span);
    let input;
    if (f.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 2;
    } else {
      input = document.createElement('input');
      input.type = f.type;
    }
    input.className = 'sme-input';
    input.name = f.key;
    if (f.required) input.required = true;
    if (f.placeholder) input.placeholder = f.placeholder;
    if (f.autocomplete) input.setAttribute('autocomplete', f.autocomplete);
    row.appendChild(input);
    const err = document.createElement('span');
    err.className = 'sme-error';
    err.setAttribute('aria-live', 'polite');
    row.appendChild(err);
    inputs[f.key] = { input, err };
    form.appendChild(row);
  });

  const actions = document.createElement('div');
  actions.className = 'sme-actions';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'sme-btn sme-btn-primary';
  submitBtn.textContent = 'Submit Enquiry';
  actions.appendChild(submitBtn);

  const compareBtn = document.createElement('button');
  compareBtn.type = 'button';
  compareBtn.className = 'sme-btn sme-btn-secondary';
  compareBtn.textContent = 'Compare Machines';
  if (bridge) {
    compareBtn.addEventListener('click', () => {
      bridge.sendMessage('Compare the Frescopa coffee machines so I can decide which one fits our needs.');
    });
  }
  actions.appendChild(compareBtn);
  form.appendChild(actions);

  const validate = () => {
    let ok = true;
    Object.keys(inputs).forEach((k) => { inputs[k].err.textContent = ''; inputs[k].input.classList.remove('is-invalid'); });
    const name = inputs.customer_name.input.value.trim();
    const email = inputs.email.input.value.trim();
    const use = inputs.intended_use.input.value.trim();
    if (!name) { inputs.customer_name.err.textContent = 'Please enter your name.'; inputs.customer_name.input.classList.add('is-invalid'); ok = false; }
    if (!email) { inputs.email.err.textContent = 'Please enter your email.'; inputs.email.input.classList.add('is-invalid'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { inputs.email.err.textContent = 'Enter a valid email address.'; inputs.email.input.classList.add('is-invalid'); ok = false; }
    if (!use) { inputs.intended_use.err.textContent = 'Let us know how it will be used.'; inputs.intended_use.input.classList.add('is-invalid'); ok = false; }
    return ok;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const values = {
      product_name: (machine && machine.name) || SELECTED_MACHINE,
      customer_name: inputs.customer_name.input.value.trim(),
      email: inputs.email.input.value.trim(),
      phone: inputs.phone.input.value.trim(),
      intended_use: inputs.intended_use.input.value.trim(),
      message: inputs.message.input.value.trim(),
    };
    if (bridge) {
      const parts = [
        `I'd like to submit a machine enquiry for the ${values.product_name}.`,
        `Name: ${values.customer_name}.`,
        `Email: ${values.email}.`,
      ];
      if (values.phone) parts.push(`Phone: ${values.phone}.`);
      parts.push(`Intended use: ${values.intended_use}.`);
      if (values.message) parts.push(`Message: ${values.message}`);
      bridge.sendMessage(parts.join(' '));
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';
    }
  });

  card.appendChild(form);
  block.appendChild(card);
}

function renderConfirmation(block, confirmation, machine, bridge) {
  const card = document.createElement('div');
  card.className = 'sme-card';
  card.appendChild(buildHeader(machine));

  const body = document.createElement('div');
  body.className = 'sme-confirm';

  const statusRow = document.createElement('div');
  statusRow.className = 'sme-status-row';
  const chip = document.createElement('span');
  chip.className = 'sme-chip';
  chip.textContent = confirmation.status || 'Received';
  statusRow.appendChild(chip);
  if (confirmation.confirmation_id) {
    const id = document.createElement('span');
    id.className = 'sme-confid';
    id.textContent = `#${confirmation.confirmation_id}`;
    statusRow.appendChild(id);
  }
  body.appendChild(statusRow);

  const msg = document.createElement('p');
  msg.className = 'sme-message';
  msg.textContent = confirmation.message || 'Thanks — your enquiry has been recorded and our team will follow up.';
  body.appendChild(msg);

  if (confirmation.submitted_at) {
    const ts = document.createElement('span');
    ts.className = 'sme-ts';
    ts.textContent = `Submitted ${confirmation.submitted_at}`;
    body.appendChild(ts);
  }

  const actions = document.createElement('div');
  actions.className = 'sme-actions';
  const machineName = confirmation.product_name || (machine && machine.name) || SELECTED_MACHINE;

  const detailsBtn = document.createElement('button');
  detailsBtn.type = 'button';
  detailsBtn.className = 'sme-btn sme-btn-primary';
  detailsBtn.textContent = 'View Machine Details';
  if (bridge) {
    detailsBtn.addEventListener('click', () => { bridge.sendMessage(`Tell me more about the ${machineName}.`); });
  }
  actions.appendChild(detailsBtn);

  const exploreBtn = document.createElement('button');
  exploreBtn.type = 'button';
  exploreBtn.className = 'sme-btn sme-btn-secondary';
  exploreBtn.textContent = 'Explore Other Machines';
  if (bridge) {
    exploreBtn.addEventListener('click', () => { bridge.sendMessage('Show me other Frescopa coffee machines.'); });
  }
  actions.appendChild(exploreBtn);
  body.appendChild(actions);

  card.appendChild(body);
  block.appendChild(card);
}
