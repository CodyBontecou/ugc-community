import assert from 'node:assert/strict';
const base = process.argv[2] || 'https://ugc.community';
const slugs = ['find-paid-ugc-jobs', 'apply-for-ugc-jobs', 'compare-ugc-compensation', 'ugc-job-brief-template'];
for (const slug of slugs) {
  const path = `/tutorials/${slug}`;
  const res = await fetch(base + path);
  const html = await res.text();
  assert.equal(res.status, 200, path);
  assert.ok(html.includes(`rel="canonical" href="https://ugc.community${path}"`), `canonical ${slug}`);
  assert.ok(html.includes('"@type":"Article"'), `article ${slug}`);
  assert.ok(html.includes(`href="${path}/content.md"`), `markdown link ${slug}`);
  assert.ok(html.includes('2026-10-25'), `date ${slug}`);
  assert.ok(html.includes('Frequently asked questions'), `rendered body ${slug}`);
  const md = await fetch(base + path + '/content.md');
  assert.equal(md.status, 200);
  assert.ok(md.headers.get('content-type').startsWith('text/markdown'));
  assert.equal(md.headers.get('x-robots-tag'), 'noindex');
  assert.ok(md.headers.get('link').includes(new URL(path, base).href));
  assert.ok((await md.text()).includes('## Frequently asked questions'));
  console.log(`PASS ${slug}: HTML, body, canonical, article schema, date, Markdown`);
}
const sitemap = await (await fetch(base + '/sitemap.xml')).text();
const index = await (await fetch(base + '/tutorials')).text();
for (const slug of slugs) {
  assert.ok(sitemap.includes(`https://ugc.community/tutorials/${slug}</loc>`));
  assert.ok(index.includes(`href="/tutorials/${slug}"`));
}
assert.ok((await (await fetch(base + '/about')).text()).includes('href="/tutorials"'));
assert.equal((await fetch(base + '/tutorials/unknown-guide/content.md')).status, 404);
assert.equal((await fetch(base + '/tutorials/getting-started/content.md')).status, 404);
console.log('PASS sitemap, index, footer discovery, unknown and unsupported Markdown 404');
