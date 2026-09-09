import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards-numbered
 * Ordered cards with a number badge. Each card has an image and a rich body
 * (heading + bold sub-headings + paragraphs). Source: sustainability
 * "section numbered cards".
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-numbered-card-image';
      else div.className = 'cards-numbered-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
