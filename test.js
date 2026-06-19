const { JSDOM } = require('jsdom');
const fs = require('fs');
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++; console.log('  ✗ '+m);} }

(async () => {
  // ── Homepage test ──
  const html = fs.readFileSync('index.html','utf8');
  const postsJson = fs.readFileSync('posts.json','utf8');
  const dom = new JSDOM(html, {
    runScripts:'dangerously', resources:'usable', url:'https://blog.eknathalabs.com/',
    beforeParse(window){
      // No fetch mock: the offline build inlines posts into window.__POSTS__,
      // so the homepage must render with NO network at all.
      window.fetch = () => { throw new Error('OFFLINE: fetch must not be called'); };
      window.localStorage = { _s:{}, getItem(k){return this._s[k]??null}, setItem(k,v){this._s[k]=''+v}, removeItem(k){delete this._s[k]} };
      window.IntersectionObserver = class { observe(){} disconnect(){} };
      window.requestAnimationFrame = (cb)=>cb();
    }
  });
  // wait for async boot
  await new Promise(r=>setTimeout(r, 600));
  const d = dom.window.document;

  console.log('HOMEPAGE (offline — no fetch)');
  ok(html.includes('window.__POSTS__ = [{'), 'posts inlined into index.html (offline-ready)');
  ok(!html.includes("fetch('/posts.json'"), 'no runtime fetch of posts.json remains');
  ok(html.includes('/assets/fonts/fonts.css'), 'local self-hosted font stylesheet wired');
  const cards = d.querySelectorAll('#posts-grid .post-card');
  ok(cards.length === 14, `grid renders 14 cards (got ${cards.length})`);
  ok(d.querySelectorAll('.post-card-link[href^="/p/"]').length === 14, 'all cards are real links to /p/ (14)');
  ok(d.getElementById('fc-all').textContent === '14', `fc-all = 14 (got ${d.getElementById('fc-all').textContent})`);
  ok(d.getElementById('fc-linux').textContent === '7', `linux count = 7 (got ${d.getElementById('fc-linux').textContent})`);
  ok(d.getElementById('fc-k8s').textContent === '2', `k8s grid count = 2 (got ${d.getElementById('fc-k8s').textContent})`);
  ok(d.getElementById('fc-dotfiles').textContent === '2', `dotfiles = 2 (got ${d.getElementById('fc-dotfiles').textContent})`);
  ok(d.querySelector('.featured-post .btn-read').getAttribute('href') === '/p/crashloopbackoff-3am/', 'featured links to real page');
  ok(d.getElementById('feat-title').innerHTML.includes('<em>'), 'featured title rendered from JSON with em accent');
  ok(d.getElementById('feat-excerpt').textContent.includes('payment service'), 'featured excerpt populated from JSON');
  ok(d.querySelector('a[href="/feed.xml"]'), 'RSS link wired to feed.xml');
  ok(d.querySelector('script[type="application/ld+json"]'), 'homepage has JSON-LD');
  // latest sidebar populated
  ok(d.getElementById('latest-list').children.length === 4, `latest sidebar has 4 items (got ${d.getElementById('latest-list').children.length})`);
  // tracker
  ok(d.querySelectorAll('.tracker-tab').length === 6, 'tracker has 6 series tabs');

  // data-slug present for cross-page sync
  ok([...cards].every(c=>c.dataset.slug), 'every card has data-slug');

  console.log(`  → ${pass} passed, ${fail} failed`);

  // ── Post page test ──
  console.log('POST PAGE');
  let pp=pass, pf=fail;
  const post = fs.readFileSync('p/crashloopbackoff-3am/index.html','utf8');
  ok(post.includes('BlogPosting'), 'post has BlogPosting JSON-LD');
  ok(post.includes('og:type') && post.includes('article'), 'post has article OG meta');
  ok(post.includes('rel="canonical"') && post.includes('/p/crashloopbackoff-3am/'), 'canonical URL set');
  ok(/<h2>Step 1/.test(post), 'markdown H2 rendered');
  ok(post.includes('post-snippet'), 'terminal snippet rendered');
  ok(post.includes("KEY  = 'read::' + SLUG"), 'ring keyed by slug (syncs with homepage)');
  ok(post.includes('scrollPct'), 'fractional scroll-depth logic present');
  ok(post.includes('class="pn prev"') || post.includes('pn next'), 'prev/next nav present');
  ok(post.includes('toggleComplete'), 'click-to-complete present');

  // verify scrollPct math: a post page with known dims
  const ppDom = new JSDOM(post, { runScripts:'dangerously',
    beforeParse(w){
      w.localStorage={_s:{},getItem(k){return this._s[k]??null},setItem(k,v){this._s[k]=''+v},removeItem(k){delete this._s[k]}};
      w.requestAnimationFrame=cb=>cb();
      Object.defineProperty(w.HTMLElement.prototype,'offsetHeight',{get(){return 3000}});
    }});
  await new Promise(r=>setTimeout(r,100));
  const fg = ppDom.window.document.getElementById('rrf-fg');
  ok(fg && fg.style.strokeDasharray, 'ring stroke-dasharray initialized');

  console.log(`  → ${pass-pp} passed, ${fail-pf} failed`);
  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  process.exit(fail?1:0);
})();
