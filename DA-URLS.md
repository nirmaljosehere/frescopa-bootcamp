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

## Code / infra
- GitHub repo: https://github.com/nirmaljosehere/frescopa-bootcamp
- AEM Assets repository (DA `aem.repositoryId`): `author-p135360-e1341441.adobeaemcloud.com`

## Config notes / gotchas
- **DA config sheets need a header row.** `data` sheet → row 1 `key | value`; `library` sheet → row 1 `title | path`. Data starts row 2.
- **PDP routing** is a folder mapping in the Config Service (`folders.json`): `{ "/products": "/products/default" }` — not a repo file. Requires the `/products/default` template doc to be published.
- **AEM Assets in DA** requires: AEM env var `ADOBE_PROVIDED_CLIENT_ID=darkalley` (Cloud Manager, needs restart) + `aem.repositoryId` in the DA `data` config sheet. Assets must be published/approved to appear.
