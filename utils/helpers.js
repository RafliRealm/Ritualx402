export function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export function encodeMetadataHex(obj) {
  return '0x' + Array.from(new TextEncoder().encode(JSON.stringify(obj)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
