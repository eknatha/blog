# ✍️ EknathaLabs Blog

> **Real DevOps. Real Fixes. No Fluff.**
> Linux war stories, Kubernetes debugging deep-dives, and a Platform Engineer's transition — documented in public.

🌐 **Live:** [blog.eknathalabs.com](https://blog.eknathalabs.com)

---

## 📖 About

This is the source for the EknathaLabs Blog — a technical blog written by **Eknatha Reddy Puli**

Every post is written from production experience, not documentation. No filler, no tutorials that only work in a clean lab — just real scenarios, real commands, and what actually fixed it.

---

## 📚 Series

| Series | Description | Colour |
|--------|-------------|--------|
| ◈ **Linux 100 Challenges** | 100 hands-on Linux scenarios for DevOps engineers | 🟢 Green |
| ☸ **Kubernetes War Stories** | Real cluster failures, debugging sessions, and post-mortems | 🔵 Blue |
| ⬡ **Platform Eng in Progress** | Honest journal of a DevOps → Platform Engineering transition | 🟡 Amber |
| ⚙ **My Dotfiles Explained** | `.bashrc`, `.vimrc`, `tmux`, and aliases — every line annotated | 🌸 Pink |
| ⚡ **Today I Fixed** | Micro-posts: one problem, one fix, under 2 minutes | 🟩 Mint |
| ◎ **Quick Tips** | 300-word focused DevOps tips | 🟣 Purple |

---

## 🗂️ Project Structure

```
blog.eknathalabs.com/
├── index.html          # Main blog homepage (single-file, self-contained)
├── og-image.png        # Open Graph preview image (1200×630)
├── README.md           # This file
└── posts/              # (planned) Individual post pages
    ├── crashloop-3am/
    ├── pod-terminating/
    └── ...
```

---

## ⚡ Adding a New Post

All posts live inside `index.html` as `<article class="post-card">` blocks.

**Steps (takes ~2 minutes):**

1. Open `index.html` and find this comment:

   ```html
   <!-- ╔═══ NEW POST GOES HERE — paste above this line ═══╗ -->
   ```

2. Copy any existing `<article class="post-card">` block and paste **above** that comment.

3. Update the four `data-*` attributes on the `<article>` tag:

   ```html
   <article class="post-card"
     data-series="k8s"
     data-tags="kubernetes oomkilled memory debugging"
     data-date="2026-04-28"
     data-title="OOMKilled — How to Read dmesg and kubectl top Together">
   ```

   | Attribute | Values | Purpose |
   |-----------|--------|---------|
   | `data-series` | `linux` `k8s` `pe` `dotfiles` `tif` `tips` | Powers filter bar |
   | `data-tags` | space-separated keywords | Powers live search |
   | `data-date` | `YYYY-MM-DD` | Powers "Latest Posts" sidebar sort |
   | `data-title` | exact post title | Powers search click & sidebar links |

4. Update the HTML inside: series pill class, title, excerpt, date, read-time, and tag spans.

5. **That's it.** Filter counts, sidebar badges, article total, and the Latest Posts widget all update automatically on page load — no config files to touch.

---

## 🔍 Features

- **Live search** — press `/` anywhere on the page to search by title, tags, or series
- **Reading progress bar** — thin green line at the top tracks scroll depth
- **Filter bar** — filter posts by series; counts auto-sync with actual content
- **Latest Posts sidebar** — automatically shows the 4 most recent posts by date
- **Scroll animations** — cards fade in as they enter the viewport
- **Newsletter form** — subscribe widget (wire to your email provider in the JS)
- **Toast notifications** — shared feedback system across search, subscribe, load more
- **Full SEO** — `<title>`, `<meta description>`, Open Graph, Twitter Card tags
- **Responsive** — works on mobile, tablet, and desktop

---

## 🛠️ Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Hosting | GitHub Pages | Free, fast, deploy on push |
| Build | Zero — plain HTML | No build step, no dependencies, instant deploy |
| Fonts | IBM Plex Mono + Playfair Display + DM Sans | Terminal identity + editorial authority |
| Styling | Vanilla CSS (CSS variables) | Zero runtime, full control |
| JS | Vanilla ES6 | No framework overhead — search, filter, observer all native |

---

## 🚀 Deployment

This blog is a **single `index.html` file** deployed via GitHub Pages.

```bash
# Clone the repo
git clone https://github.com/eknatha/blog.eknathalabs.com
cd blog.eknathalabs.com

# Make your changes (add a post, tweak styles)
# No build step needed.

# Deploy
git add .
git commit -m "post: add TIF #02 — inode exhaustion"
git push origin main
# GitHub Pages picks it up automatically in ~30 seconds
```

**Custom domain setup** (already configured via CNAME):
```
blog.eknathalabs.com → eknathareddyp.github.io/blog.eknathalabs.com
```

---

## 🔗 EknathaLabs Ecosystem

| Property | URL | Purpose |
|----------|-----|---------|
| 🏠 Main Site | [eknathalabs.com](https://eknathalabs.com) | DevOps learning platform |
| ✍️ Blog | [blog.eknathalabs.com](https://blog.eknathalabs.com) | This repo |
| 🧪 Labs | [labs.eknathalabs.com](https://labs.eknathalabs.com) | Hands-on labs |
| 📚 Learn | [learn.eknathalabs.com](https://learn.eknathalabs.com) | Learning resources |
| 🎤 Interview Prep | [eknatha.github.io/interview-prep](https://eknatha.github.io/interview-prep) | 12+ DevOps/PE interview guides |
| 💻 Linux CLI Explainer | [eknatha.github.io/linux-command-explainer](https://eknatha.github.io/linux-command-explainer) | Interactive command tool |
| 📊 GitHub Profile Analyzer | [eknatha.github.io/github-profile-analyzer](https://eknatha.github.io/github-profile-analyzer) | Profile scoring tool |

---

## 📅 Publishing Cadence

| Format | Frequency | Avg. Length |
|--------|-----------|-------------|
| Linux 100 / K8s War Stories | Weekly | 5–10 min read |
| Platform Eng in Progress | Bi-weekly | 8–12 min read |
| Today I Fixed | As it happens | 2 min read |
| Quick Tips / Dotfiles | Monthly | 3–7 min read |

---

## 📬 Newsletter

Subscribe at [blog.eknathalabs.com/#newsletter](https://blog.eknathalabs.com/#newsletter)

New post every week. No marketing. Just Linux, Kubernetes, and whatever I broke this week.

---

## 👤 Author

**Eknatha Reddy Puli** 

- 🐙 GitHub: [@eknatha](https://github.com/eknatha)
- 🌐 Site: [eknathalabs.com](https://eknathalabs.com)
- 💼 Stack: Linux · Kubernetes · AWS · Azure · Terraform · CKA+CKS · Scripting · More

---

## 📄 License

Content © 2026 Eknatha / EknathaLabs. All rights reserved.
Code (HTML/CSS/JS structure) is open for reference and inspiration.

---

*Built in public. Written from production. No fluff.*
