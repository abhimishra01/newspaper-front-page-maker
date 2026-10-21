// Safe download name from the newspaper name: "The Birthday Bugle" -> "the-birthday-bugle-letter.png".
export function fileName(paper, formatId, ext) {
  const base = String(paper || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '');
  return `${base || 'front-page'}-${formatId}.${ext}`;
}
