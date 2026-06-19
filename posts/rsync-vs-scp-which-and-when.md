---
title: rsync vs scp — Which One and When
slug: rsync-vs-scp-which-and-when
series: tips
seriesNo: 01
date: 2026-03-25
readTime: 3 min
excerpt: rsync wins on resumable transfers and delta sync. scp wins on clean one-liners. Here's the quick decision rule so you stop guessing.
tags: [rsync, scp, linux]
prereqs: [Basic Linux CLI, SSH access]
---

Both copy files over SSH. They are not interchangeable, and reaching for the wrong one wastes time — or bandwidth — at exactly the wrong moment.

## The one-line rule

> **scp** for a quick one-shot copy of a file or two. **rsync** for anything large, repeated, resumable, or that might get interrupted.

## Where scp wins

```bash
$ scp config.yaml user@host:/etc/app/
```

Clean, no flags to remember, installed everywhere. For "grab this one file," scp is less to type and less to think about.

## Where rsync wins — and it's most places

```bash
$ rsync -avz --partial --progress src/ user@host:/dest/
```

- **`-a`** preserves permissions, timestamps, symlinks
- **`-z`** compresses in transit (big win on slow links)
- **`--partial`** keeps partially transferred files so a dropped connection *resumes* instead of restarting
- **delta sync** — on a re-run, rsync transfers only the *changed bytes*, not the whole file

That last point is the killer feature: sync a 5GB directory, change one file, re-run, and rsync moves kilobytes. scp would re-copy all 5GB.

## The trap

scp on a flaky connection that dies at 90% leaves you with nothing — you start over. rsync `--partial` picks up where it stopped. On any transfer that matters, that resumability alone justifies rsync.

> Quick and small: scp. Large, repeated, or unreliable: rsync. When unsure, rsync.
