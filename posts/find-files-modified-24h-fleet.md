---
title: Find All Files Modified in Last 24 Hours Across a Fleet
slug: find-files-modified-24h-fleet
series: linux
seriesNo: 12
date: 2026-04-15
readTime: 5 min
excerpt: Using find -mtime to audit changes across a fleet of nodes — and how to safely exclude virtual filesystems so you don't drown in /proc noise.
tags: [linux, find, fleet]
prereqs: [find command basics, SSH access to nodes, Basic shell scripting]
---

After an incident, the first question is "what changed?" `find -mtime` answers it — but naively run, it drowns you in `/proc` and `/sys` churn. Here's the version that's actually usable across a fleet.

## The single-node command

```bash
$ find / -mtime -1 -type f \
    -not \( -path "/proc/*" -o -path "/sys/*" \) 2>/dev/null
/etc/nginx/nginx.conf
/var/log/auth.log
/tmp/.ICE-unix/1234
```

`-mtime -1` = modified in the last 24 hours. `-type f` = files only. The `-not \( ... \)` excludes the virtual filesystems that change constantly and tell you nothing. `2>/dev/null` hides permission-denied noise.

## Why -mtime -1 and not -mtime 1

This trips people up. `-mtime 1` means "modified *exactly* 1 day ago" (24–48h window). `-mtime -1` means "*less than* 1 day ago." For incident auditing you almost always want the minus.

## Across the fleet

```bash
for node in $(cat nodes.txt); do
  echo "=== $node ==="
  ssh "$node" 'find /etc /var/log -mtime -1 -type f 2>/dev/null'
done
```

Scope to `/etc` and `/var/log` rather than `/` — those are where meaningful changes live, and it runs in seconds instead of minutes. Pipe through `sort | uniq -c` across nodes to spot a change that landed on *every* box (a config push) versus *one* box (manual tampering).

## Sharpen the window

```bash
$ find /etc -newermt "2026-04-15 02:00" -type f    # changed since a timestamp
$ find /etc -mmin -30 -type f                       # last 30 minutes
```

`-newermt` lets you anchor to the exact moment the incident began, which is far more precise than a 24-hour bucket.

> "What changed?" is the fastest path to root cause. `find -mtime` is how you answer it before reaching for config management diffs.
