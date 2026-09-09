// Generic Adobe Brand Concierge block for EDS.
// All values are authored in the block table — nothing brand-specific is
// hardcoded, so the same block powers any concierge on any site.
//
// Authoring (DA block table):
//   | brand-concierge |                                             |
//   | datastream-id   | a4294afa-ee0f-4dbe-9ee0-231a379821c7        |
//   | org-id          | 708E423B67F3C2050A495C27@AdobeOrg           |
//   | region          | va7                                         |
//   | style-config    | /concierge/frescopa-style.js                |
//   | ...             | ...                                         |
//
// Only datastream-id and org-id are required; everything else has a default.

const DEFAULTS = {
  'sdk-url': 'https://cdn1.adoberesources.net/alloy/2.34.0/alloy.min.js',
  'agent-url': 'https://experience.adobe.net/solutions/experience-platform-brand-concierge-web-agent/static-assets/main.js',
  'instance-name': 'alloy',
  'edge-domain': 'edge.adobedc.net',
  'edge-base-path': 'ee',
  'default-consent': 'in',
  region: 'va7',
  debug: 'false',
  'sticky-session': 'false',
  'id-migration': 'false',
  'third-party-cookies': 'false',
  'style-config': '',
  'style-global': 'styleConfiguration',
};

/**
 * Read a block's rows into a key/value map.
 * Each two-cell row becomes { slug(firstCell): trimmed(secondCell) }.
 * A row whose second cell holds a link uses that link's href as the value.
 */
function readBlockConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key) return;
    const valueCell = cells[1];
    const link = valueCell.querySelector('a');
    config[key] = (link ? link.href : valueCell.textContent).trim();
  });
  return config;
}

function bool(v) {
  return String(v).toLowerCase() === 'true';
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Don't double-load the SDK/agent if another concierge is on the page.
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = false; // preserve execution order
    // Under a 'strict-dynamic' CSP, an injected script only runs if it carries
    // the page nonce. EDS exposes it on window.nonce / the current script tag.
    const nonce = window.nonce
      || document.currentScript?.nonce
      || document.querySelector('script[nonce]')?.nonce;
    if (nonce) {
      s.setAttribute('nonce', nonce);
      s.nonce = nonce;
    }
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function initAlloyNS(instanceName) {
  (function initNS(n, o) {
    o.forEach((name) => {
      if (!n[name]) {
        (n.__alloyNS = n.__alloyNS || []).push(name);
        n[name] = function alloyStub(...args) {
          return new Promise((i, l) => { n[name].q.push([i, l, args]); });
        };
        n[name].q = [];
      }
    });
  }(window, [instanceName]));
}

/** Resolve the styling object from a URL (.js sets a global, .json is fetched). */
async function loadStyleConfig(url, globalName) {
  if (!url) return {};
  if (url.endsWith('.json')) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch (e) {
      // fall through to empty config
    }
    return {};
  }
  // Assume a JS file that assigns window[globalName].
  await loadScript(url);
  return window[globalName] || {};
}

export default async function decorate(block) {
  const cfg = { ...DEFAULTS, ...readBlockConfig(block) };

  if (!cfg['datastream-id'] || !cfg['org-id']) {
    // eslint-disable-next-line no-console
    console.warn('brand-concierge: datastream-id and org-id are required.');
  }

  // Build the mount point, replacing the authored config table.
  block.textContent = '';
  const mount = document.createElement('div');
  mount.className = 'brand-concierge-mount';
  // Unique id so multiple concierge blocks can coexist on one page.
  mount.id = `brand-concierge-mount-${Math.random().toString(36).slice(2, 8)}`;
  block.appendChild(mount);

  const instanceName = cfg['instance-name'];
  initAlloyNS(instanceName);

  await loadScript(cfg['sdk-url']);
  await loadScript(cfg['agent-url']);

  const styleConfiguration = await loadStyleConfig(cfg['style-config'], cfg['style-global']);

  window[instanceName]('configure', {
    defaultConsent: cfg['default-consent'],
    edgeDomain: cfg['edge-domain'],
    edgeBasePath: cfg['edge-base-path'],
    datastreamId: cfg['datastream-id'],
    orgId: cfg['org-id'],
    debugEnabled: bool(cfg.debug),
    idMigrationEnabled: bool(cfg['id-migration']),
    thirdPartyCookiesEnabled: bool(cfg['third-party-cookies']),
    prehidingStyle: '.personalization-container { opacity: 0 !important }',
    conversation: { region: cfg.region },
  });
  window[instanceName]('sendEvent', {});

  window.adobe.concierge.bootstrap({
    instanceName,
    stylingConfigurations: styleConfiguration,
    selector: `#${mount.id}`,
    stickySession: bool(cfg['sticky-session']),
  });
}