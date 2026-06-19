# ✍️ EknathaLabs Blog

> **Real DevOps. Real Fixes. No Fluff.**
> Linux war stories, Kubernetes debugging deep-dives, and a Platform Engineer's transition — documented in public.

🌐 **Live:** [blog.eknathalabs.com](https://blog.eknathalabs.com)

---

## 📖 About

The source for the EknathaLabs Blog — a technical blog by **Eknatha Reddy Puli**, written from production experience, not documentation. No filler, no clean-lab tutorials — just real scenarios, real commands, and what actually fixed it.

---

## 🏗️ Architecture — Markdown + build step

Posts are **Markdown files with YAML frontmatter** — the single source of truth. A zero-dependency Node build step turns them into the homepage index, one real indexable page per post, an RSS feed, and a sitemap. Nothing about a post is duplicated anywhere.

```
posts/*.md                 <- write here (frontmatter + Markdown)
   |
   v  node build.js
   |
   |-- posts.json          -> homepage fetches this to render cards, search, counts, tracker
   |-- p/<slug>/index.html -> one real page per post (SEO-indexable, OG meta, JSON-LD)
   |-- sitemap.xml         -> every post URL + homepage
   |-- feed.xml            -> RSS 2.0 (the old dead RSS link now points here)
```

The homepage (`index.html`) no longer hardcodes post cards — it `fetch()`es `posts.json` at runtime and renders linked cards. The featured hero is also populated from the post marked `featured: true`. Add a post once, in one file, and it appears everywhere.

---

## ✏️ How to add a post (~2 min)

1. Create `posts/my-post-slug.md` with frontmatter + Markdown body:

```
---
title: My Post Title — With an Em-Dash Accent
slug: my-post-slug          # optional; auto-derived from title if omitted
series: linux               # linux | k8s | pe | dotfiles | tif | tips
seriesNo: 06                # number shown in the "· #NN" badge
date: 2026-05-01            # YYYY-MM-DD (sorts newest-first)
readTime: 5 min             # optional; auto-estimated from word count if omitted
excerpt: One or two sentences shown on the card and in social previews.
tags: [linux, debugging, sre]
prereqs: [Basic Linux CLI, sudo access]
# featured: true            # set on exactly ONE post to feature it in the hero
---

Your **Markdown** body. Fenced code blocks that start with `$ ` render as
terminal snippets with a copy button. Headings, lists, tables, blockquotes,
inline code, bold, italic, and links all work.
```

2. Run the build:

```
node build.js
```

3. Commit and push. Done.

Supported Markdown: `#`–`####` headings, fenced code (shell blocks get terminal styling), ordered/unordered lists, tables, blockquotes, `---` rules, inline code/bold/italic/links.

---

## 📚 Series

| Series | Description |
|--------|-------------|
| ◈ **Linux 100** | Hands-on Linux scenarios for DevOps engineers |
| ☸ **Kubernetes War Stories** | Real cluster failures, debugging, and post-mortems |
| ⬡ **Platform Eng in Progress** | Honest journal of a DevOps to Platform Engineering transition |
| ⚙ **My Dotfiles Explained** | `.bashrc`, `.vimrc`, `tmux`, aliases — every line annotated |
| ⚡ **Today I Fixed** | Micro-posts: one problem, one fix |
| ◎ **Quick Tips** | Short, focused DevOps tips |

---

## 🔌 Offline

The site is **offline-first**. The build step inlines all post data directly into `index.html` (`window.__POSTS__`), so the homepage renders with **zero network requests** — no `fetch`, no API. Post pages are fully self-contained too (no runtime requests at all). Once GitHub Pages has served the site once, the browser caches it and it works with no connection.

**Fonts:** run the one-time fetch script to self-host the typefaces for pixel-identical offline rendering:

```
./fetch-fonts.sh      # downloads woff2 files into assets/fonts/ (run once)
node build.js
git add assets/fonts && git commit -m "Self-host fonts for offline"
```

Until you run it, the page uses Google Fonts when online and falls back to system fonts (Georgia / Courier New / sans-serif) offline — fully functional either way, just not pixel-identical.

> **Note:** absolute paths (`/p/...`, `/assets/...`) mean the site must be *served* (GitHub Pages, or any local server like `python3 -m http.server`). It is offline-capable when served; it is not designed for double-clicking a raw `file://` page.

---

## 🔄 Reading progress

The reading ring is **scroll-depth driven**. On a post page it fills as you read (real fractional progress, not a binary toggle) and locks to ✓ when you reach the end. Click it any time to mark read/unread manually.

Progress is keyed by **post slug** in `localStorage`, so the homepage cards, the per-series progress tracker, and the post pages all stay in sync — finish a post, and its card shows ✓ on the homepage.

---

## 🧪 Tests

A jsdom suite checks the homepage renders from `posts.json` (card count, links, badge counts, featured hero, sidebar, tracker) and that post pages carry correct SEO meta, render Markdown, and wire the scroll ring.

```
npm install        # installs jsdom (dev only)
node build.js
npm test
```

---

## 🗂️ Project structure

```
blog.eknathalabs.com/
├── index.html          # homepage — fetches posts.json, renders cards + hero
├── build.js            # static build: posts/*.md -> posts.json + pages + feeds + inlines data
├── fetch-fonts.sh      # one-time: self-host Google Fonts for offline (run on your machine)
├── test.js             # jsdom test suite (verifies offline render too)
├── posts/              # <- SOURCE OF TRUTH: one Markdown file per post
├── assets/fonts/       # self-hosted woff2 + fonts.css (after fetch-fonts.sh)
├── templates/
│   └── post.html       # per-post page template (scroll-depth reading ring)
├── p/<slug>/index.html # GENERATED — do not edit by hand
├── posts.json          # GENERATED — homepage index
├── sitemap.xml         # GENERATED
├── feed.xml            # GENERATED — RSS 2.0
├── og-image.png        # social card (1200x630)
├── .nojekyll           # REQUIRED on GitHub Pages so /p serves
└── CNAME
```

> **GitHub Pages note:** `.nojekyll` must exist (it does) or Pages' Jekyll step can block folders. Generated files (`p/`, `posts.json`, `sitemap.xml`, `feed.xml`) are committed so Pages serves them directly — no CI required.

---

## ⚙️ Deploy

Pure static. Run the build, commit everything (including generated files), push:

```
node build.js
git add -A && git commit -m "Add post: my-post-slug" && git push
```

No build server, no production dependencies. The only dependency (`jsdom`) is dev-only, for tests.

---

*Built and maintained by **Eknatha** · part of the [EknathaLabs](https://eknathalabs.com) ecosystem.*
