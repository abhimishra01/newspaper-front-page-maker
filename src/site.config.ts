// ONE config file. Change values here; every page reads from it.
// Keep this file plain (no type-only syntax): scripts/deploy.mjs imports it directly.
const cfg = {
  name: 'Newspaper Front Page Maker',          // shown in header, title, footer
  domain: 'bingemind.com',                     // no https://, no www.
  cloudflareProject: 'newspaper-front-page-maker', // Cloudflare Pages project name (used by npm run deploy)
  keyword: 'newspaper generator with photo',   // main keyword
  keywords: ['newspaper generator', 'newspaper front page maker', 'newspaper template printable', 'birthday newspaper template', 'fake newspaper generator', 'newspaper maker online free pdf'],
  tagline: 'Free, private and print ready',
  description:
    'Make a newspaper front page with your photo. Three classic layouts, edit every word, print Letter or A4 PDF or post it. Free, no sign-up, no watermark.',
  email: 'hello@bingemind.com',                // contact email (shown on the Contact, Privacy and Terms pages)
  ga4: '',                                     // GA4 measurement ID, e.g. 'G-XXXXXXXXXX'. Empty = Google Analytics off
  adsense: '',                                 // AdSense publisher ID, e.g. 'ca-pub-1234567890123456'. Empty = ads off
  brand: '#25406b',                            // brand color (hex): newsprint navy; no other tool uses this hue
  locale: 'en-US',                             // BCP 47 language tag
  ogImage: '/og.png',                          // 1200x630 file in public/
  category: 'DesignApplication',               // schema.org applicationCategory
  owner: 'Newspaper Front Page Maker',         // name used in legal pages
};

// Bingemind mode (SITE_MODE=bingemind): the tool lives at bingemind.com/newspaper-front-page-maker/.
// Canonical links always name that address. Legal pages name Bingemind as the owner.
const bingemind = process.env.SITE_MODE === 'bingemind';
export default {
  ...cfg,
  domain: 'bingemind.com/newspaper-front-page-maker',
  origin: 'https://bingemind.com/newspaper-front-page-maker',
  bingemind,
  owner: bingemind ? 'Bingemind' : cfg.owner,
  contactWord: bingemind ? 'Contact' : 'Email',
  contactHref: bingemind ? 'https://bingemind.com/#contact' : `mailto:${cfg.email}`,
  contactLabel: bingemind ? 'bingemind.com/#contact' : cfg.email,
};
