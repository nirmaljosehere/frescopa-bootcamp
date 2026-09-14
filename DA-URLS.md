# Frescopa Bootcamp — Key DA / EDS URLs

Org: `nirmaljosehere` · Site: `frescopa-bootcamp` · Content source: DA (Document Authoring)

## Authoring (DA)
- DA site (content browser): https://da.live/#/nirmaljosehere/frescopa-bootcamp
- Site config (data + library sheets): https://da.live/config#/nirmaljosehere/frescopa-bootcamp
- Template doc (edit): https://da.live/edit#/nirmaljosehere/frescopa-bootcamp/templates/product-landing-page
- Templates library sheet (edit): https://da.live/edit#/nirmaljosehere/frescopa-bootcamp/library/templates

## Content source (raw, auth-gated)
- DA content root: https://content.da.live/nirmaljosehere/frescopa-bootcamp
- Template source: https://content.da.live/nirmaljosehere/frescopa-bootcamp/templates/product-landing-page
- Library sheet source: https://content.da.live/nirmaljosehere/frescopa-bootcamp/library/templates.json

## Delivery
- Preview: https://main--frescopa-bootcamp--nirmaljosehere.aem.page/
- Live: https://main--frescopa-bootcamp--nirmaljosehere.aem.live/
- PDP example (live): https://main--frescopa-bootcamp--nirmaljosehere.aem.live/products/new-hire-gift-set-with-jaggery-backpack/adb288
- Concierge page: https://main--frescopa-bootcamp--nirmaljosehere.aem.page/concierge

## Admin / config APIs (auth-gated)
- DA source API (create/update docs): `POST https://admin.da.live/source/nirmaljosehere/frescopa-bootcamp/{path}`
- AEM admin config service (site config): https://admin.hlx.page/config/nirmaljosehere/sites/frescopa-bootcamp.json
- Folder mapping (PDP routing): https://admin.hlx.page/config/nirmaljosehere/sites/frescopa-bootcamp/folders.json

## Access & permissions (two separate systems)
Edit access and preview/publish access are granted in **different** places:

**1. DA content edit** — DA **org** config → `permissions` sheet (`https://da.live/config#/nirmaljosehere/`).
Columns `path | groups | actions`. Grant edit on the site:
- `/frescopa-bootcamp/**` | `8AB51935659C10E40A495FA2/Brand visibility Bootcamp 2026 - Internal` | `write`
- (`groups` accepts emails or `{IMS Org ID}/{Group Name}` tuples; `write` = read+edit+delete)

**2. Preview / publish** — aem.live **site** access config (Config Service), NOT the DA permissions sheet.
Endpoint: `POST https://admin.hlx.page/config/nirmaljosehere/sites/frescopa-bootcamp/access/admin.json`
Roles: `author` = preview, `publish` = go-live, `admin` = config. Accepts emails / `*@domain` wildcards (IMS group tuples are not supported here). Working config:
```json
{
  "role": {
    "admin":   ["nirmalj@adobe.com"],
    "author":  ["nirmalj@adobe.com", "*@adobe.com", "*@emea.aephandsonlabs.com"],
    "publish": ["nirmalj@adobe.com", "*@adobe.com", "*@emea.aephandsonlabs.com"]
  },
  "requireAuth": "auto"
}
```
- Lab test users: `bv-lab-u01…u50@emea.aephandsonlabs.com` → covered by `*@emea.aephandsonlabs.com`.
- After changing access, users must **log out/in** of DA to refresh.

## LLM App (Brand Concierge / MCP) embed
- MCP endpoint: `https://1883744-nirmaltest-stage.adobeio-static.net/api/v1/.../mcp`
- LLM app repo: https://github.com/nirmaljosehere/frescopa-llm-app
- Crawlable proxy (bypasses aem.live `noindex`): https://frescopa-demo.vercel.app/ — point the concierge website link / crawl here, not at `*.aem.page`/`*.aem.live` (those send `x-robots-tag: noindex` + `Disallow: /`).
- EDS widget embed script: `https://main--frescopa-bootcamp--nirmaljosehere.aem.page/scripts/aem-embed.js`

## Code / infra
- GitHub repo: https://github.com/nirmaljosehere/frescopa-bootcamp
- AEM Assets repository (DA `aem.repositoryId`): `author-p135360-e1341441.adobeaemcloud.com`

## Config notes / gotchas
- **DA config sheets need a header row.** `data` sheet → row 1 `key | value`; `library` sheet → row 1 `title | path`. Data starts row 2.
- **PDP routing** is a folder mapping in the Config Service (`folders.json`): `{ "/products": "/products/default" }` — not a repo file. Requires the `/products/default` template doc to be published.
- **AEM Assets in DA** requires: AEM env var `ADOBE_PROVIDED_CLIENT_ID=darkalley` (Cloud Manager, needs restart) + `aem.repositoryId` in the DA `data` config sheet. Assets must be published/approved to appear.
- **Edit ≠ Preview/Publish.** DA `permissions` sheet grants *editing*; "Not authorized to preview" means the user isn't in the aem.live `access` config (`author`/`publish` roles). Fix in `access/admin.json`, not the DA permissions sheet.
- **LLM App widget shows only `placeholder`** in ChatGPT: the embed iframe has no `@dropins` import map, so bare specifiers fail. Fixed in `scripts/aem-embed.js` — it injects the import map (absolute URLs, own origin) before importing any block. Only affects `<aem-embed>` contexts; normal page delivery is unchanged.
- **Concierge can't crawl the site:** `*.aem.page`/`*.aem.live` are `noindex` + `Disallow: /` by design. Use a production domain or the Vercel proxy (`frescopa-demo.vercel.app`).
