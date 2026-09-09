export default function decorate(block) {
  // First paragraph (eyebrow) gets a marker class so it can be styled
  // distinctly from the heading.
  const firstP = block.querySelector(':scope p');
  if (firstP) firstP.classList.add('hero-banner-solid-eyebrow');
}
