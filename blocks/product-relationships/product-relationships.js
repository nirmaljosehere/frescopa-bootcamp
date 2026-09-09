import { events } from '@dropins/tools/event-bus.js';
import {
  CS_FETCH_GRAPHQL,
  getProductLink,
  fetchPlaceholders,
} from '../../scripts/commerce.js';

const RELATED_PRODUCTS_QUERY = `
  query GET_RELATED_PRODUCTS($skus: [String!]!) {
    products(skus: $skus) {
      sku
      links {
        linkTypes
        product {
          sku
          name
          urlKey
          images(roles: ["thumbnail"]) {
            url
            label
          }
          ... on SimpleProductView {
            price {
              final {
                amount {
                  value
                  currency
                }
              }
            }
          }
        }
      }
    }
  }
`;

function formatPrice(amount) {
  if (!amount || amount.value == null) return '';
  try {
    return new Intl.NumberFormat(document.documentElement.lang || 'en-US', {
      style: 'currency',
      currency: amount.currency || 'USD',
    }).format(amount.value);
  } catch (e) {
    return `${amount.value} ${amount.currency || ''}`.trim();
  }
}

function renderCard(product) {
  const href = getProductLink(product.urlKey, product.sku);
  const image = product.images?.[0];
  const price = formatPrice(product.price?.final?.amount);

  const item = document.createElement('div');
  item.className = 'product-relationships__item';

  const imageHtml = image?.url
    ? `<span class="product-relationships__item-image">
         <img src="${image.url}" alt="${image.label || product.name || ''}" loading="lazy">
       </span>`
    : '<span class="product-relationships__item-image"></span>';

  item.innerHTML = `
    <a href="${href}" class="product-relationships__item-link">
      ${imageHtml}
      <span class="product-relationships__item-name">${product.name || ''}</span>
      ${price ? `<span class="product-relationships__item-price">${price}</span>` : ''}
    </a>
  `;

  return item;
}

async function fetchRelatedProducts(sku) {
  const { data } = await CS_FETCH_GRAPHQL.fetchGraphQl(RELATED_PRODUCTS_QUERY, {
    method: 'GET',
    variables: { skus: [sku] },
  });

  const links = data?.products?.[0]?.links || [];
  return links
    .filter((link) => link.linkTypes?.includes('related') && link.product?.sku)
    .map((link) => link.product);
}

export default async function decorate(block) {
  const labels = await fetchPlaceholders();
  const heading = labels.Custom?.RelatedProducts || 'Related Products';

  let rendered = false;

  const renderRelated = async (sku) => {
    if (rendered || !sku) return;

    let products = [];
    try {
      products = await fetchRelatedProducts(sku);
    } catch (e) {
      console.error('Failed to load related products:', e);
      return;
    }

    if (!products.length) return;
    rendered = true;

    const fragment = document.createRange().createContextualFragment(`
      <h2 class="product-relationships__heading">${heading}</h2>
      <div class="product-relationships__grid"></div>
    `);
    const grid = fragment.querySelector('.product-relationships__grid');
    products.forEach((product) => grid.appendChild(renderCard(product)));

    block.replaceChildren(fragment);
  };

  const eventProduct = events.lastPayload('pdp/data');
  if (eventProduct?.sku) {
    renderRelated(eventProduct.sku);
  }

  events.on('pdp/data', (data) => {
    if (data?.sku) renderRelated(data.sku);
  }, { eager: true });
}
