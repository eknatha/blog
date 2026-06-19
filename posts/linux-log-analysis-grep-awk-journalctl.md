---
title: Linux Log Analysis for DevOps: grep, awk, journalctl and What to Actually Look For
slug: linux-log-analysis-grep-awk-journalctl
series: linux
seriesNo: 02
date: 2026-04-23
readTime: 6 min
excerpt: Logs are the single best source of truth in any incident — but only if you know where to look. Covers the real workflow: systemd journals, filtering failed auth attempts, extracting signal from noise with grep and awk, and tail patterns that actually tell you something.
tags: [linux, logs, grep, awk, journalctl]
prereqs: [Basic bash, grep basics, systemd familiarity]
---

Logs are the best source of truth in any incident — *if* you can extract signal from the noise. The skill isn't knowing grep exists; it's knowing what to count and what to ignore.

## Spot a brute-force in one line

```bash
$ grep "Failed password" /var/log/auth.log | wc -l
4821  ← brute force in progress
```

A handful of failures is normal. Nearly five thousand is an attack. Follow up by counting *which IPs*:

```bash
$ grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head
```

The `sort | uniq -c | sort -rn` pattern is the workhorse of log analysis — it collapses any column into a ranked frequency table.

## Turn an access log into an HTTP status histogram

```bash
$ awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -5
   2043 200
    831 404
     12 500
```

Twelve 500s is your incident. The 404s tell you about scanners or a broken deploy. `awk '{print $9}'` pulls the status field — adjust the column number to your log format.

## Use journalctl's structured filters

The systemd journal beats tailing raw files because it understands units, priorities, and time:

```bash
$ journalctl -u nginx --since "1 hour ago" -p err
✓ filtered to errors only — 3 lines, root cause visible
```

`-p err` filters by priority so you skip thousands of info lines. `-u` scopes to one service. `--since` bounds the window. Together they turn a firehose into three relevant lines.

## What to actually look for

- **Sudden frequency changes** — a line that appears 4000× when it normally appears 4×
- **First occurrence timestamps** — when did the new error *start*? That's your change window.
- **Correlated bursts** — errors across multiple services at the same second usually mean a shared dependency (DB, DNS, network).

> Don't read logs top to bottom. *Count* them, *rank* them, then read only the outliers.
