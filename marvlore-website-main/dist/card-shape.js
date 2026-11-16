// Shared design rule: circular radius = 8% of the untransformed short edge.
export const CARD_CORNER_RATIO = .08;
export const cardCornerRadius = (width, height) => Math.min(width, height) * CARD_CORNER_RATIO;

// Mark future card surfaces with data-card-shape to opt into the same rule.
export function observeCardCorners(root = document) {
 const selector = '[data-card-shape],.work-card,.work-image,.awards-track figure,.contact-tile,.contact-phone,.location,.chat-button,#dialog-content img';
 const observed = new WeakSet();
 const resize = new ResizeObserver(entries => {
  for (const entry of entries) {
   const box = entry.borderBoxSize?.[0];
   const width = box?.inlineSize ?? entry.target.offsetWidth;
   const height = box?.blockSize ?? entry.target.offsetHeight;
   if (width > 0 && height > 0) entry.target.style.borderRadius = `${cardCornerRadius(width, height)}px`;
  }
 });
 const visit = (node, callback) => {
  if (node.nodeType !== 1 && node.nodeType !== 9) return;
  if (node.matches?.(selector)) callback(node);
  node.querySelectorAll(selector).forEach(callback);
 };
 const add = element => {
  if (!observed.has(element)) { observed.add(element); resize.observe(element, {box:'border-box'}); }
 };
 visit(root, add);
 const mutations = new MutationObserver(records => {
  for (const record of records) {
   record.removedNodes.forEach(node => visit(node, element => {
    if (!element.isConnected) { resize.unobserve(element); observed.delete(element); }
   }));
   record.addedNodes.forEach(node => visit(node, add));
  }
 });
 mutations.observe(root, {childList:true, subtree:true});
 return () => { mutations.disconnect(); resize.disconnect(); };
}
