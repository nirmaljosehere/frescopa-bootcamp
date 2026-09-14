# DA + EDS Brand-Visibility HOL — Setup Guide

A reusable, copy-paste playbook to stand up a **Document Authoring (DA) + Edge Delivery (EDS)**
commerce site with product pages, AEM Assets, template/block libraries, lab permissions, and a
**Brand Concierge (MCP / LLM App)** — as built for `frescopa-bootcamp`.

Generic steps use `{{PLACEHOLDERS}}`. This instance's concrete values are in `DA-URLS.md`.
Common pitfalls are in **Appendix — Gotchas**.

## Fill-in values

| Placeholder | Meaning | This instance |
|---|---|---|
| `{{ORG}}` | GitHub org / DA org | `nirmaljosehere` |
| `{{SITE}}` | site / repo name | `frescopa-bootcamp` |
| `{{IMS_ORG_ID}}` | Admin Console org id | `8AB51935659C10E40A495FA2` (`@AdobeOrg`) |
| `{{GROUP_NAME}}` | Admin Console user group | `Brand visibility Bootcamp 2026 - Internal` |
| `{{LAB_DOMAIN}}` | lab user email domain | `emea.aephandsonlabs.com` (`bv-lab-u01…u50@`) |
| `{{AEM_AUTHOR_HOST}}` | AEM Assets author host | `author-p135360-e1341441.adobeaemcloud.com` |
| `{{PROXY}}` | crawlable proxy domain | `frescopa-demo.vercel.app` |
| `{{OWNER}}` | site owner/admin email | `nirmalj@adobe.com` |

Delivery hosts: `https://main--{{SITE}}--{{ORG}}.aem.page` (preview) · `…​.aem.live` (live).

## Auth — how to run the calls

Two different services, two different auth models:

- **Config Service** (`admin.hlx.page/config/…`) → **cookie auth**. Run the JS snippets in a browser tab **logged into `admin.hlx.page`** (open any `…/config/{{ORG}}/sites/{{SITE}}.json` URL once and sign in). `POST` **replaces** the target resource.
- **DA source API** (`admin.da.live/source/…`) → **Bearer token**. Get it from da.live → DevTools → Network → any `admin.da.live` request → copy the `authorization: Bearer …` value into `TOKEN` below.
- **DA sheets** (`data`, `library`, `permissions`) → edit in the **`da.live/config`** UI. **Row 1 = header** (`key|value`, `title|path`, `path|groups|actions`, `name|path`); data starts row 2.

```bash
# DA source API token (paste from da.live Network tab); used by the curl blocks below
TOKEN='PASTE_BEARER_TOKEN'
```

---

## 1. Create the site

Use the DA Commerce **Site Creator** (`da.live/app/adobe-commerce/storefront-tools/tools/site-creator/`) or copy a boilerplate repo, then connect GitHub `{{ORG}}/{{SITE}}` with content source **DA**. Set commerce endpoint/headers in repo `config.json`.

## 2. PDP routing (folder mapping)

1. Author + **publish** `/products/default` (a `product-details` block with a fallback `defaultSku`).
2. Add the folder mapping (Config Service — run in an `admin.hlx.page` tab):

```js
await fetch('https://admin.hlx.page/config/{{ORG}}/sites/{{SITE}}/folders.json', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ '/products': '/products/default' }),
}).then(async (r) => console.log('folders', r.status, await r.text()));
```

Verify:
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://main--{{SITE}}--{{ORG}}.aem.live/products/default"
curl -s -o /dev/null -w "%{http_code}\n" "https://main--{{SITE}}--{{ORG}}.aem.live/products/<urlkey>/<sku>"
```

## 3. AEM Assets in DA

1. **Cloud Manager** → environment → Configuration → add variable `ADOBE_PROVIDED_CLIENT_ID = darkalley` (type *Variable*; ~10–20 min restart).
2. DA site config → **`data`** sheet (header `key | value`):

   | key | value |
   |---|---|
   | `aem.repositoryId` | `{{AEM_AUTHOR_HOST}}` |

3. Reload the DA editor → image icon appears. Assets must be **published/approved**.

## 4. Templates library

1. Author the template doc `/templates/{name}` (use **absolute** image URLs). Upload from a file:
   ```bash
   curl -X POST "https://admin.da.live/source/{{ORG}}/{{SITE}}/templates/{name}.html" \
     -H "Authorization: Bearer $TOKEN" --form "data=@{name}.html"
   ```
2. Create the library sheet:
   ```bash
   printf '%s' '{"total":1,"limit":1,"offset":0,"data":[{"key":"Product Landing Page","value":"https://content.da.live/{{ORG}}/{{SITE}}/templates/{name}"}],":type":"sheet"}' > templates.json
   curl -X POST "https://admin.da.live/source/{{ORG}}/{{SITE}}/library/templates.json" \
     -H "Authorization: Bearer $TOKEN" --form "data=@templates.json"
   ```
3. Site config → **`library`** tab: `Templates | https://content.da.live/{{ORG}}/{{SITE}}/library/templates.json`.

Authors: new doc → Sidekick → **Library → Templates**.

## 5. Blocks library

1. Block example docs at `/library/blocks/{block}` (block instance + optional `Library Metadata` → `Description`). Upload each:
   ```bash
   for b in hero-teaser-teal cards cards-feature accordion columns-promo; do
     curl -X POST "https://admin.da.live/source/{{ORG}}/{{SITE}}/library/blocks/$b.html" \
       -H "Authorization: Bearer $TOKEN" --form "data=@$b.html"
   done
   ```
2. Blocks sheet (`name | path`):
   ```bash
   printf '%s' '{"total":1,"limit":1,"offset":0,"data":[{"name":"Cards","path":"https://content.da.live/{{ORG}}/{{SITE}}/library/blocks/cards"}],":type":"sheet"}' > blocks.json
   curl -X POST "https://admin.da.live/source/{{ORG}}/{{SITE}}/library/blocks.json" \
     -H "Authorization: Bearer $TOKEN" --form "data=@blocks.json"
   ```
3. Site config → **`library`** tab: `Blocks | https://content.da.live/{{ORG}}/{{SITE}}/library/blocks.json`.

*(Console alternative to curl: `fd=new FormData(); fd.append('data', new Blob([html],{type:'text/html'}), 'x.html'); await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+TOKEN},body:fd})` — run on a da.live tab.)*

## 6. Permissions — TWO separate systems

**6a. DA content edit** — DA **org** config `da.live/config#/{{ORG}}/` → **`permissions`** sheet (`path | groups | actions`):

| path | groups | actions |
|---|---|---|
| `/{{SITE}}/**` | `{{IMS_ORG_ID}}/{{GROUP_NAME}}` | `write` |
| `CONFIG` | `{{IMS_ORG_ID}}/{{GROUP_NAME}}` | `read` |

**6b. Preview / publish** — aem.live access (Config Service; run in an `admin.hlx.page` tab):

```js
await fetch('https://admin.hlx.page/config/{{ORG}}/sites/{{SITE}}/access/admin.json', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role: {
      admin:   ['{{OWNER}}'],
      author:  ['{{OWNER}}', '*@{{LAB_DOMAIN}}'],   // author = preview
      publish: ['{{OWNER}}', '*@{{LAB_DOMAIN}}'],   // publish = go-live
    },
    requireAuth: 'auto',
  }),
}).then(async (r) => console.log('access', r.status, await r.text()));
```

Roles: `author`=preview, `publish`=live, `admin`=config. Uses emails / `*@domain` (IMS group tuples **not** supported here). Users **log out/in** after.

## 7. Brand Concierge / LLM App (MCP)

- App Builder LLM app exposes MCP at `{{MCP}}`; register as a custom connector in the host.
- Action metadata/CSP/widget config → **llm-apps UI** → download `actions.json` (don't hand-edit). Handlers → repo `actions/{name}/index.js`.
- **EDS widget** fields per action:
  - `eds_widget.script_url` = `https://main--{{SITE}}--{{ORG}}.aem.page/scripts/aem-embed.js`
  - `eds_widget.widget_embed_url` = authored widget page
  - `resource_meta.csp.resourceDomains` + `connectDomains` = EDS origin (+ AEM Assets delivery host, fonts, `{{PROXY}}`)
  - `resource_meta.domain` = **unique** origin per widget (required for submission)
- **Import-map fix** (widget renders only `placeholder`): the embed iframe has no `@dropins` import map. `scripts/aem-embed.js` injects it before importing any block:

```js
// scripts/aem-embed.js — at module top level, before any block import()
(() => {
  try {
    if (document.querySelector('script[type="importmap"]')) return;
    const url = new URL(import.meta.url);
    const [codeBasePath] = url.pathname.split('/scripts/');
    const root = `${url.origin}${codeBasePath}`;
    const pkgs = ['storefront-account','storefront-auth','storefront-cart','storefront-checkout',
      'storefront-order','storefront-payment-services','storefront-pdp','storefront-recommendations',
      'storefront-wishlist','storefront-personalization','storefront-product-discovery','tools'];
    const imports = {};
    pkgs.forEach((p) => { imports[`@dropins/${p}/`] = `${root}/scripts/__dropins__/${p}/`; });
    const s = document.createElement('script');
    s.type = 'importmap';
    s.textContent = JSON.stringify({ imports });
    document.head.appendChild(s);
  } catch (e) { console.warn('[AEM Embed] import map injection skipped:', e); }
})();
```

## 8. Make the site crawlable for the concierge

`*.aem.page` / `*.aem.live` are `noindex` + `Disallow: /` by design. Use a **production domain** (BYO CDN) or a **proxy** (`{{PROXY}}`) that serves the content with `Allow: /`. Point the concierge crawl at `{{PROXY}}`.

Fix the stale boilerplate `sitemap-index.xml` (it points at `www.aemshop.net`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://{{PROXY}}/sitemap.xml</loc>
  </sitemap>
</sitemapindex>
```

## 9. Concierge knowledge sources

- **Product catalog JSON** (flat schema): array of `{ productID, _id, productName, productDescription, productPageURL, productImageURL, productRating }`. Pull real products from Catalog Service:
  ```bash
  curl -s "https://catalog-service-sandbox.adobe.io/graphql" \
    -H "Content-Type: application/json" -H "x-api-key: <key>" \
    -H "Magento-Environment-Id: <env>" -H "Magento-Store-View-Code: default" \
    -H "Magento-Store-Code: main_website_store" -H "Magento-Website-Code: base" -H "Store: default" \
    --data '{"query":"query{productSearch(phrase:\"\",page_size:50){items{productView{name sku urlKey shortDescription images{url}}}}}"}'
  ```
- **`site_urls.csv`** — single `url` column from `{{PROXY}}/sitemap.xml`; drop `nav`, `footer`, `mini-cart`, `empty-cart`, `/products/default`, `/templates/**`.

---

## Appendix — Gotchas

- **DA sheets need a header row** (`key|value`, `title|path`, `path|groups|actions`, `name|path`); data starts row 2. Missing header = config silently ignored.
- **PDP routing** = `folders.json` mapping **and** a published `/products/default`. Both required.
- **AEM Assets** needs the `darkalley` env var (Cloud Manager restart) **and** `aem.repositoryId` in the `data` sheet.
- **Template images** must be **absolute URLs** — relative `./x.png` breaks on insert.
- **Edit ≠ Preview/Publish.** DA `permissions` = editing; "Not authorized to preview" = missing from `access/admin.json` (`author`/`publish`). Access config takes emails/`*@domain`, not IMS group tuples.
- **LLM widget shows `placeholder`** = missing `@dropins` import map in the embed iframe → `scripts/aem-embed.js` fix.
- **Widget `domain`** must be unique per template for submission (separate from CSP and from rendering).
- **Concierge can't crawl** `*.aem.page`/`*.aem.live` (noindex + Disallow) → production domain or proxy.
- **`sitemap-index.xml`** ships pointing at `www.aemshop.net` — repoint it.
