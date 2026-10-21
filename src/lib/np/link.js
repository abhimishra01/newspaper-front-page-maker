// Share link: the words and settings go in the part of the address after "#".
// Browsers never send that part to a server. Photos are never put in a link.
const b64url = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** State -> "z<deflated base64url>" (or "j<base64url>" where the browser cannot compress). */
export async function encodeState(state) {
  const json = new TextEncoder().encode(JSON.stringify(state));
  if (typeof CompressionStream === 'function') return 'z' + b64url(await pipe(json, new CompressionStream('deflate-raw')));
  return 'j' + b64url(json);
}

/** Code -> state object, or null when the code is broken. */
export async function decodeState(code) {
  try {
    const kind = code[0], body = unb64url(code.slice(1));
    let bytes;
    if (kind === 'z' && typeof DecompressionStream === 'function') bytes = await pipe(body, new DecompressionStream('deflate-raw'));
    else if (kind === 'j') bytes = body;
    else return null;
    if (bytes.length > 200000) return null;
    const s = JSON.parse(new TextDecoder().decode(bytes));
    return s && typeof s === 'object' ? s : null;
  } catch {
    return null;
  }
}
