#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   EknathaLabs Blog — Static Build Step
   --------------------------------------------------------------------
   Single source of truth:  posts/*.md   (YAML frontmatter + Markdown body)
   Outputs:
     • posts.json          → index consumed by index.html (cards/search/counts)
     • p/<slug>/index.html → one real, indexable page per post
     • sitemap.xml         → all post URLs + homepage
     • feed.xml            → RSS 2.0 feed (replaces the dead href="#" RSS link)

   Zero npm dependencies. Pure Node. Run:  node build.js
   ════════════════════════════════════════════════════════════════════ */

const fs   = require('fs');
const path = require('path');

const ROOT      = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const OUT_DIR   = path.join(ROOT, 'p');
const SITE      = 'https://blog.eknathalabs.com';
const AUTHOR    = 'Eknatha Reddy Puli';

/* Series registry — keep in sync with the homepage filter buttons. */
const SERIES = {
  linux:    { label: 'Linux 100',      badge: '◈', cls: 'series-linux'    },
  k8s:      { label: 'Kubernetes',     badge: '☸', cls: 'series-k8s'      },
  pe:       { label: 'Platform Eng',   badge: '⬡', cls: 'series-pe'       },
  dotfiles: { label: 'Dotfiles',       badge: '⚙', cls: 'series-dotfiles' },
  tif:      { label: 'Today I Fixed',  badge: '⚡', cls: 'series-tif'      },
  tips:     { label: 'Quick Tips',     badge: '◎', cls: 'series-tips'     },
};

/* ───────────────────────── helpers ───────────────────────── */

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/* Minimal YAML frontmatter parser (flat keys + simple [arrays]). */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    let [, key, val] = kv;
    val = val.trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
    }
    meta[key] = val;
  }
  return { meta, body: m[2] };
}

/* ───────────────────────── Markdown → HTML ─────────────────────────
   Compact, dependency-free renderer covering the constructs these
   posts actually use: headings, fenced code (with terminal styling),
   lists, blockquotes, tables, inline code/bold/italic/links, hr.       */

function renderMarkdown(md) {
  const blocks = [];
  const codeStore = [];

  // 1. Pull out fenced code first so inline rules never touch it.
  md = md.replace(/```(\w*)\r?\n([\s\S]*?)```/g, (_, lang, code) => {
    const id = codeStore.push({ lang, code: code.replace(/\n$/, '') }) - 1;
    return `\u0000CODE${id}\u0000`;
  });

  const lines = md.split(/\r?\n/);
  let i = 0;
  const out = [];

  const inline = (t) => esc(t)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  while (i < lines.length) {
    let line = lines[i];

    // code placeholder
    const cm = line.match(/^\u0000CODE(\d+)\u0000$/);
    if (cm) {
      const { lang, code } = codeStore[+cm[1]];
      const isShell = /^(bash|sh|shell|console|term)?$/.test(lang) &&
                      /^\s*\$\s/m.test(code);
      out.push(renderCode(code, lang, isShell));
      i++; continue;
    }

    // heading
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { const n = h[1].length; out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }

    // hr
    if (/^---+$/.test(line.trim())) { out.push('<hr>'); i++; continue; }

    // blockquote
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
      continue;
    }

    // table
    if (/^\|.*\|$/.test(line.trim()) && /^\|[-:\s|]+\|$/.test((lines[i + 1] || '').trim())) {
      const head = line.trim().slice(1, -1).split('|').map(s => s.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        rows.push(lines[i].trim().slice(1, -1).split('|').map(s => s.trim()));
        i++;
      }
      out.push(
        '<table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        rows.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>'
      );
      continue;
    }

    // unordered / ordered list
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const buf = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '')); i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>` + buf.map(li => `<li>${inline(li)}</li>`).join('') + `</${tag}>`);
      continue;
    }

    // blank
    if (line.trim() === '') { i++; continue; }

    // paragraph (gather until blank / block start)
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' &&
           !/^(#{1,4}\s|>\s?|---+$|\s*([-*]|\d+\.)\s|\|.*\|$|\u0000CODE\d+\u0000$)/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }

  return out.join('\n');
}

/* Terminal-styled code block matching the homepage card-snippet look. */
function renderCode(code, lang, isShell) {
  if (isShell) {
    const body = code.split('\n').map(l => {
      const cmd = l.match(/^\s*\$\s(.*)$/);
      if (cmd) return `<div><span class="cs-prompt">$ </span><span class="cs-cmd">${esc(cmd[1])}</span></div>`;
      return `<span class="cs-out">${esc(l)}</span>`;
    }).join('');
    return `<div class="post-snippet"><div class="cs-bar"><span class="cs-dot r"></span><span class="cs-dot y"></span><span class="cs-dot g"></span><span class="cs-label">eknatha@prod ~</span><button class="cs-copy" onclick="copyCode(this)">copy</button></div><div class="cs-body">${body}</div></div>`;
  }
  return `<div class="post-snippet plain"><div class="cs-bar"><span class="cs-label">${esc(lang || 'code')}</span><button class="cs-copy" onclick="copyCode(this)">copy</button></div><pre class="cs-body"><code>${esc(code)}</code></pre></div>`;
}

function readingTime(body) {
  const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200)) + ' min';
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ───────────────────────── load posts ───────────────────────── */

function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) { console.error('No posts/ directory.'); process.exit(1); }
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = files.map(file => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    if (!meta.title || !meta.series || !meta.date) {
      console.warn(`⚠  ${file} missing title/series/date — skipped`);
      return null;
    }
    if (!SERIES[meta.series]) console.warn(`⚠  ${file} unknown series "${meta.series}"`);
    const slug = meta.slug || slugify(meta.title);
    return {
      slug,
      title:    meta.title,
      series:   meta.series,
      seriesNo: meta.seriesNo || '',
      date:     meta.date,
      excerpt:  meta.excerpt || '',
      tags:     Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []),
      prereqs:  Array.isArray(meta.prereqs) ? meta.prereqs : (meta.prereqs ? [meta.prereqs] : []),
      featured: meta.featured === 'true' || meta.featured === true,
      readTime: meta.readTime || readingTime(body),
      order:    parseInt(meta.order) || 0,
      bodyMd:   body,
      bodyHtml: renderMarkdown(body),
    };
  }).filter(Boolean);

  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

/* ───────────────────────── emit posts.json ───────────────────────── */

function writeIndex(posts) {
  const index = posts.map(p => ({
    slug: p.slug, title: p.title, series: p.series, seriesNo: p.seriesNo,
    date: p.date, excerpt: p.excerpt, tags: p.tags, prereqs: p.prereqs,
    featured: p.featured, readTime: p.readTime, order: p.order,
    url: `/p/${p.slug}/`,
  }));
  // posts.json is still emitted (used by feeds / external tools / debugging)
  fs.writeFileSync(path.join(ROOT, 'posts.json'), JSON.stringify(index, null, 2));
  console.log(`✓ posts.json   (${index.length} posts)`);

  // OFFLINE: inline the same data into index.html so the homepage needs
  // no network and works from file://. We replace the marked block.
  const idxPath = path.join(ROOT, 'index.html');
  if (fs.existsSync(idxPath)) {
    let html = fs.readFileSync(idxPath, 'utf8');
    const block =
      '/* POSTS_DATA_START */\n' +
      'window.__POSTS__ = ' + JSON.stringify(index) + ';\n' +
      '/* POSTS_DATA_END */';
    const re = /\/\* POSTS_DATA_START \*\/[\s\S]*?\/\* POSTS_DATA_END \*\//;
    if (re.test(html)) {
      html = html.replace(re, block);
      fs.writeFileSync(idxPath, html);
      console.log(`✓ index.html   (posts inlined — offline ready)`);
    } else {
      console.warn('⚠  index.html missing POSTS_DATA markers — data not inlined');
    }
  }
}

/* ───────────────────────── emit post pages ───────────────────────── */

function writePostPages(posts) {
  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'post.html'), 'utf8');
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  posts.forEach((p, idx) => {
    const s = SERIES[p.series] || { label: p.series, badge: '•', cls: '' };
    const seriesLabel = `${s.badge} ${s.label}${p.seriesNo ? ' · #' + p.seriesNo : ''}`;
    const prev = posts[idx + 1]; // older
    const next = posts[idx - 1]; // newer

    const navHtml = `
      ${prev ? `<a class="pn prev" href="/p/${prev.slug}/"><span class="pn-dir">← older</span><span class="pn-title">${esc(prev.title)}</span></a>` : '<span class="pn empty"></span>'}
      ${next ? `<a class="pn next" href="/p/${next.slug}/"><span class="pn-dir">newer →</span><span class="pn-title">${esc(next.title)}</span></a>` : '<span class="pn empty"></span>'}`;

    const tagsHtml    = p.tags.map(t => `<span class="tag">${esc(t.startsWith('#') ? t : '#' + t)}</span>`).join('');
    const prereqsHtml = p.prereqs.length
      ? `<div class="prereq-strip"><span class="ps-label">Prerequisites</span>${p.prereqs.map(x => `<span class="prereq-pill">${esc(x)}</span>`).join('')}</div>` : '';

    const jsonld = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: p.title, description: p.excerpt,
      datePublished: p.date, dateModified: p.date,
      author: { '@type': 'Person', name: AUTHOR },
      publisher: { '@type': 'Organization', name: 'EknathaLabs' },
      mainEntityOfPage: `${SITE}/p/${p.slug}/`,
      keywords: p.tags.join(', '),
    });

    const html = tpl
      .replace(/\{\{TITLE\}\}/g,       esc(p.title))
      .replace(/\{\{EXCERPT\}\}/g,     esc(p.excerpt))
      .replace(/\{\{URL\}\}/g,         `${SITE}/p/${p.slug}/`)
      .replace(/\{\{SLUG\}\}/g,        p.slug)
      .replace(/\{\{SERIES_CLASS\}\}/g, s.cls)
      .replace(/\{\{SERIES_LABEL\}\}/g, esc(seriesLabel))
      .replace(/\{\{DATE_ISO\}\}/g,    p.date)
      .replace(/\{\{DATE\}\}/g,        fmtDate(p.date))
      .replace(/\{\{READ_TIME\}\}/g,   esc(p.readTime))
      .replace(/\{\{KEYWORDS\}\}/g,    esc(p.tags.join(', ')))
      .replace(/\{\{PREREQS\}\}/g,     prereqsHtml)
      .replace(/\{\{TAGS\}\}/g,        tagsHtml)
      .replace(/\{\{NAV\}\}/g,         navHtml)
      .replace(/\{\{JSONLD\}\}/g,      jsonld)
      .replace(/\{\{BODY\}\}/g,        p.bodyHtml);

    const dir = path.join(OUT_DIR, p.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  });
  console.log(`✓ p/<slug>/    (${posts.length} pages)`);
}

/* ───────────────────────── sitemap + RSS ───────────────────────── */

function writeSitemap(posts) {
  const urls = [`${SITE}/`, ...posts.map(p => `${SITE}/p/${p.slug}/`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u, k) => `  <url><loc>${u}</loc>${k ? `<lastmod>${posts[k - 1].date}</lastmod>` : ''}</url>`).join('\n') +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  console.log('✓ sitemap.xml');
}

function writeFeed(posts) {
  const items = posts.slice(0, 20).map(p => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE}/p/${p.slug}/</link>
      <guid>${SITE}/p/${p.slug}/</guid>
      <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
      <description>${esc(p.excerpt)}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>EknathaLabs Blog</title>
  <link>${SITE}/</link>
  <description>Real DevOps. Real Fixes. No Fluff.</description>
  <language>en-us</language>${items}
</channel></rss>\n`;
  fs.writeFileSync(path.join(ROOT, 'feed.xml'), xml);
  console.log('✓ feed.xml');
}

/* ───────────────────────── run ───────────────────────── */

console.log('Building EknathaLabs blog…');
const posts = loadPosts();
writeIndex(posts);
writePostPages(posts);
writeSitemap(posts);
writeFeed(posts);
console.log(`Done. ${posts.length} posts → posts.json + ${posts.length} pages.`);
