/** Creates an element with the given class and children (falsy children are skipped). */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  children: Array<Node | null | false | undefined> = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  children.forEach(child => {
    if (child) node.appendChild(child);
  });
  return node;
}

/** Creates a button that doesn't let its click bubble to the (clickable) card around it. */
export function button(className: string, label: string, onClick: () => void): HTMLButtonElement {
  const node = el('button', className);
  node.type = 'button';
  node.textContent = label;
  node.onclick = event => {
    event.stopPropagation();
    onClick();
  };
  return node;
}
