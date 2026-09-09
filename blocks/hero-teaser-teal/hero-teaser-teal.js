/**
 * Hero Teaser (Teal) variant.
 * Renders a solid teal, rounded-corner banner with a text column and an
 * accompanying image. Mirrors the source `teaser left frescopa-background-blue`
 * pattern: heading + intro paragraphs alongside an image.
 *
 * Expected authored structure (cards/columns-like rows):
 *   row 1: image (picture)
 *   row 2: text content (heading + paragraphs)
 * Authors may also provide a single combined row; the block adapts.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // Identify the image cell vs the text/content cell.
  let imageCell = null;
  const textParts = [];

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (!imageCell && cell.querySelector('picture, img')) {
        imageCell = cell;
      } else {
        textParts.push(cell);
      }
    });
    // Handle rows that themselves are the content holder (no inner cells).
    if (row.children.length === 0 && row.textContent.trim()) {
      textParts.push(row);
    }
  });

  block.textContent = '';

  const text = document.createElement('div');
  text.className = 'hero-teaser-teal-text';
  textParts.forEach((part) => {
    while (part.firstChild) text.append(part.firstChild);
  });
  block.append(text);

  if (imageCell) {
    const media = document.createElement('div');
    media.className = 'hero-teaser-teal-media';
    const pic = imageCell.querySelector('picture') || imageCell.querySelector('img');
    if (pic) media.append(pic);
    block.append(media);
  } else {
    block.classList.add('hero-teaser-teal-no-image');
  }
}
