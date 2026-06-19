---
title: TIF #01 — df Shows 100% But du Disagrees
slug: tif-df-shows-100-but-du-disagrees
series: tif
seriesNo: 01
date: 2026-04-21
readTime: 2 min
excerpt: Deleted log files held open by a running process. The space won't free until the file handle closes — here's the one-liner that finds the culprit.
tags: [linux, storage, lsof]
prereqs: [Basic Linux CLI, df/du commands, Root or sudo access]
---

**The symptom:** `df` says the disk is 100% full. `du` adds up to far less. The gap is real space you can't see.

```bash
$ df -h /var
/dev/sda1   50G   50G   0   100%
$ du -sh /var
31G
```

19GB missing. `du` walks the directory tree, but a **deleted file that's still open** has no directory entry — so du can't count it, while df (reading the filesystem superblock) still sees the blocks as used.

## The fix

```bash
$ lsof +L1 | grep deleted
java  1847  /var/log/app.log (deleted)  27GB
```

A process is writing to a log that was `rm`'d (probably by a botched logrotate). The inode stays allocated until the **last file handle closes**. You don't need to find the file — just signal the process:

```bash
$ kill -HUP 1847     # makes most loggers reopen their files
```

Space returns instantly. If the process can't reopen on HUP, truncate the handle in place:

```bash
$ : > /proc/1847/fd/3
```

> Deleting a file a process has open doesn't free space. Closing the handle does.
