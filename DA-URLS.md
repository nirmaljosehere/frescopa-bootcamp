# DA + EDS Brand-Visibility HOL — Setup Guide

A reusable playbook to stand up a **Document Authoring (DA) + Edge Delivery (EDS)** commerce
site with product pages, AEM Assets, template/block libraries, lab permissions, and a **Brand
Concierge (MCP / LLM App)** — as built for `frescopa-bootcamp`.

Generic steps use `{{PLACEHOLDERS}}`. Concrete values for this instance are in **Appendix A**.
Common pitfalls are in **Appendix B**.

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
| `{{MCP}}` | MCP endpoint | `1883744-nirmaltest-stage.adobeio-static.net/api/v1/.../mcp` |

Delivery hosts: `https://main--{{SITE}}--{{ORG}}.aem.page` (preview) · `…​.aem.live` (live).

## How to run the admin/config calls (auth)

- **Config Service (`admin.hlx.page/config/…`)** — from a browser tab **logged into `admin.hlx.page`**, call with `fetch(url, { credentials: 'include' })`. A `POST` **replaces** that config resource; `GET` first to see current contents.
- **DA source API (`admin.da.live/source/…`)** — needs a **Bearer token**: da.live → DevTools → Network → any `admin.da.live` request → copy `authorization: Bearer …`. Upload with `--form 'data=@file'` (curl) or `FormData` (console). Creates folders implicitly.
- **DA sheets** (config / library / permissions) — edit in the `da.live/config` UI. **Row 1 must be the header** (`key|value`, `title|path`, `path|groups|actions`, `name|path`); data starts row 2.

---

## 1. Create the site

Use the DA Commerce **Site Creator** (`da.live/app/adobe-commerce/storefront-tools/tools/site-creator/`) or copy a boilerplate, then connect GitHub `{{ORG}}/{{SITE}}` with content source **DA** (`content.da.live/{{ORG}}/{{SITE}}`).

- Authoring: `https://da.live/#/{{ORG}}/{{SITE}}`
- Site config: `https://da.live/config#/{{ORG}}/{{SITE}}`
- Commerce config lives in repo `config.json` (`commerce-endpoint`, headers → your ACO/Catalog Service tenant).

## 2. PDP routing (folder mapping)

Products render through **one template + a folder mapping** (not a page per product):

1. Author + **publish** a template doc at **`/products/default`** containing a `product-details` block with a fallback `defaultSku`.
2. Add the mapping in the Config Service:
   ```
   POST https://admin.hlx.page/config/{{ORG}}/sites/{{SITE}}/folders.json
   { "/products": "/products/default" }
   ```
Now `/products/{urlkey}/{sku}` resolves to the template and the block fetches the SKU from your catalog. (404 on a valid SKU = template not published **or** mapping missing.)

## 3. AEM Assets in DA

1. **Cloud Manager** → environment → Configuration → add variable `ADOBE_PROVIDED_CLIENT_ID = darkalley` (type *Variable*). Triggers a ~10–20 min restart.
2. DA site config → **`data`** sheet → add `aem.repositoryId` = `{{AEM_AUTHOR_HOST}}` (no `https://`, no trailing slash).
3. Reload the DA editor. An **image icon** appears in the toolbar → picks from AEM Assets. Assets must be **published/approved** to appear.

## 4. Templates library

1. Author the template doc, e.g. `/templates/{name}`.
2. Create sheet **`/library/templates`** (`key | value`): `Display Name | https://content.da.live/{{ORG}}/{{SITE}}/templates/{name}`.
3. Site config → **`library`** tab (`title | path`): `Templates | https://content.da.live/{{ORG}}/{{SITE}}/library/templates.json`.

Authors: new doc → Sidekick → **Library → Templates** → inserts the layout. Use **absolute image URLs** in templates (relative `./` breaks when inserted elsewhere).

## 5. Blocks library

1. Block example docs at **`/library/blocks/{block}`** — one block instance each, optionally followed by a `Library Metadata` table with a `Description`.
2. Sheet **`/library/blocks`** (`name | path`): `Block Name | https://content.da.live/{{ORG}}/{{SITE}}/library/blocks/{block}`.
3. Site config → **`library`** tab: `Blocks | https://content.da.live/{{ORG}}/{{SITE}}/library/blocks.json`.

Authors: Sidekick → **Library → Blocks** → previews + insert.

## 6. Permissions — TWO separate systems

**6a. DA content edit** — DA **org** config `https://da.live/config#/{{ORG}}/` → **`permissions`** sheet (`path | groups | actions`):
```
/{{SITE}}/**   {{IMS_ORG_ID}}/{{GROUP_NAME}}   write
CONFIG         {{IMS_ORG_ID}}/{{GROUP_NAME}}   read      (optional: read site config)
```
`groups` accepts emails or `{{IMS_ORG_ID}}/{Group Name}` tuples. `write` = read+edit+delete.

**6b. Preview / publish** — aem.live **site** access (NOT the DA permissions sheet):
```
POST https://admin.hlx.page/config/{{ORG}}/sites/{{SITE}}/access/admin.json
{
  "role": {
    "admin":   ["owner@company.com"],
    "author":  ["owner@company.com", "*@{{LAB_DOMAIN}}"],   // author = preview
    "publish": ["owner@company.com", "*@{{LAB_DOMAIN}}"]     // publish = go-live
  },
  "requireAuth": "auto"
}
```
Roles: `author`=preview, `publish`=live, `admin`=config. Accepts emails / `*@domain` wildcards (IMS group tuples are **not** supported here — use wildcards/emails). Users **log out/in** after a change. ("Not authorized to preview" = this step is missing.)

## 7. Brand Concierge / LLM App (MCP)

- App Builder LLM app exposes an MCP server at `{{MCP}}`; register it as a custom connector/plugin in the host (ChatGPT/Claude).
- Action metadata (name, description, inputSchema, CSP, widget) is edited in the **llm-apps UI**, then downloaded as `actions.json` (don't hand-edit `actions.json` — the pipeline overwrites). Handler logic lives in the repo (`actions/{name}/index.js`).
- **EDS widgets** (render an authored page in the widget iframe):
  - `eds_widget.script_url` = `https://main--{{SITE}}--{{ORG}}.aem.page/scripts/aem-embed.js`
  - `eds_widget.widget_embed_url` = the authored widget page
  - `resource_meta.csp.resourceDomains` / `connectDomains` = the EDS origin (+ AEM Assets delivery host, fonts, proxy)
  - `resource_meta.domain` = a **unique** origin per widget (required for app submission; ignored by Claude, used by other hosts)
- **Widget shows only `placeholder`** → the embed iframe lacks the `@dropins` import map. Fixed in `scripts/aem-embed.js`: it injects the map (absolute URLs, own origin) before importing any block. Applies to all EDS widgets; no impact on normal page delivery.

## 8. Make the site crawlable for the concierge

`*.aem.page` / `*.aem.live` send `x-robots-tag: noindex` + `robots.txt: Disallow: /` **by design**, so a concierge crawl gets nothing. Options:
- **Production domain** via BYO CDN (`aem.live/docs/byo-cdn-setup`) — removes noindex, or
- a **proxy** (`{{PROXY}}`) that serves the EDS content with `Allow: /` and no noindex.
- Fix the stale **`sitemap-index.xml`** (boilerplate points to `www.aemshop.net`) → point at the site's real sitemap.
- Point the concierge website link / crawl at `{{PROXY}}`, not the aem hosts.

## 9. Concierge knowledge sources

- **Product catalog JSON** (flat schema): array of `{ productID, _id, productName, productDescription, productPageURL, productImageURL, productRating }`. Pull real products from Catalog Service `productSearch`; use catalog delivery URLs for images; host launch/demo products on the site.
- **`site_urls.csv`** — single `url` column, built from `{{PROXY}}/sitemap.xml`; drop utility fragments (`nav`, `footer`, `mini-cart`, `empty-cart`) and helpers (`/products/default`, `/templates/**`).

---

## Appendix A — This instance (`frescopa-bootcamp`)

**Authoring**
- DA site: https://da.live/#/nirmaljosehere/frescopa-bootcamp
- Site config: https://da.live/config#/nirmaljosehere/frescopa-bootcamp
- Org config (permissions): https://da.live/config#/nirmaljosehere/
- Template doc: https://da.live/edit#/nirmaljosehere/frescopa-bootcamp/templates/product-landing-page

**Content source (auth-gated)**
- Root: https://content.da.live/nirmaljosehere/frescopa-bootcamp
- Library sheets: `…/library/templates.json`, `…/library/blocks.json`

**Delivery**
- Preview: https://main--frescopa-bootcamp--nirmaljosehere.aem.page/
- Live: https://main--frescopa-bootcamp--nirmaljosehere.aem.live/
- Crawlable proxy: https://frescopa-demo.vercel.app/
- Concierge page: `/concierge`

**Config Service (auth-gated)**
- Site config: https://admin.hlx.page/config/nirmaljosehere/sites/frescopa-bootcamp.json
- Folder mapping: `…/folders.json` → `{ "/products": "/products/default" }`
- Access: `…/access/admin.json` → admin `nirmalj@adobe.com`; author+publish `*@adobe.com`, `*@emea.aephandsonlabs.com`

**Values**
- AEM Assets repo (`aem.repositoryId`): `author-p135360-e1341441.adobeaemcloud.com`
- IMS org: `8AB51935659C10E40A495FA2@AdobeOrg` · group `Brand visibility Bootcamp 2026 - Internal`
- Lab users: `bv-lab-u01…u50@emea.aephandsonlabs.com`
- MCP endpoint: `https://1883744-nirmaltest-stage.adobeio-static.net/api/v1/.../mcp`
- Embed script: https://main--frescopa-bootcamp--nirmaljosehere.aem.page/scripts/aem-embed.js

**Code / infra**
- EDS repo: https://github.com/nirmaljosehere/frescopa-bootcamp
- LLM app repo: https://github.com/nirmaljosehere/frescopa-llm-app

## Appendix B — Gotchas

- **DA sheets need a header row.** `data`→`key|value`, `library`→`title|path`, `permissions`→`path|groups|actions`, blocks→`name|path`. Data starts row 2. (Missing header = config silently ignored.)
- **PDP routing** = folder mapping in `folders.json` (Config Service), **and** a published `/products/default`. Both required.
- **AEM Assets** needs the `darkalley` env var (Cloud Manager restart) **and** `aem.repositoryId` in the `data` sheet.
- **Template images** must be **absolute URLs** — relative `./x.png` breaks when the template is inserted into another doc.
- **Edit ≠ Preview/Publish.** DA `permissions` grants editing; "Not authorized to preview" = missing from aem.live `access/admin.json` (`author`/`publish`). Access config takes emails/`*@domain`, **not** IMS group tuples.
- **LLM widget shows `placeholder`** = missing `@dropins` import map in the embed iframe → fixed in `scripts/aem-embed.js`.
- **Widget `domain`** must be unique per template for app submission (separate from CSP; separate from rendering).
- **Concierge can't crawl** `*.aem.page`/`*.aem.live` (noindex + Disallow). Use a production domain or the proxy.
- **`sitemap-index.xml`** ships pointing at `www.aemshop.net` — repoint it to the real sitemap.
