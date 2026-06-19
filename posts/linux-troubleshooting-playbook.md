---
title: My Linux Troubleshooting Playbook — 16 Steps from Any Production Incident
slug: linux-troubleshooting-playbook
series: linux
seriesNo: 01
date: 2026-04-28
readTime: 7 min
excerpt: Production systems fail. The gap between a 5-minute fix and a 3-hour war room is a structured approach. Here's the exact 16-step workflow I've used across 7 years of cloud ops — from load averages to tracing deleted files holding disk space hostage.
tags: [linux, troubleshooting, sre, incident-response]
prereqs: [Basic Linux CLI, systemctl basics, sudo access]
---

The difference between a 5-minute fix and a 3-hour war room is rarely knowledge — it's **method**. Under pressure, people poke at random. A playbook removes the guessing. This is the exact top-to-bottom sequence I run on any "the box is misbehaving" incident.

## The first 60 seconds

```bash
$ uptime
10:25:01 up 5 days,  load average: 4.20, 3.80, 2.10  ← spike!
```

Load average tells you the *trend* before you know the cause. The three numbers are 1, 5, and 15-minute averages. **4.20, 3.80, 2.10 means load is climbing** — the problem is active right now, not recovering. If they were 2.10, 3.80, 4.20 you'd be looking at the tail end of something already passing.

## Narrowing the resource

Load can be CPU, I/O wait, or run-queue depth. Split them apart:

```bash
$ vmstat 2 3
$ ps aux --sort=-%cpu | head -5
$ ps aux --sort=-%mem | head -5
```

If `wa` (I/O wait) in vmstat is high, you have a disk problem masquerading as load. If `%cpu` is pinned by one process, you have a runaway. Check both before deciding.

## The classic trap — disk "full" but du disagrees

```bash
$ df -h /var
/dev/sda1   50G   50G   0   100%
$ du -sh /var
/var   31G
```

19GB unaccounted for. This is almost always a **deleted file still held open** by a running process — the inode isn't freed until the last file handle closes:

```bash
$ lsof | grep deleted
java  1847  /var/log/app.log (deleted)  27GB
```

Send the process a HUP or restart it and the space returns instantly — no need to find and delete anything.

## The 16 steps, condensed

1. `uptime` — load trend
2. `dmesg -T | tail` — kernel OOM / hardware errors
3. `vmstat 2` — CPU vs I/O wait split
4. `free -h` — memory and swap pressure
5. `ps aux --sort=-%cpu` — top CPU
6. `ps aux --sort=-%mem` — top memory
7. `df -h` — disk fullness
8. `du -sh /*` — where the space went
9. `lsof | grep deleted` — phantom disk usage
10. `iostat -xz 1` — disk saturation/latency
11. `ss -s` — socket summary
12. `journalctl -p err --since "30 min ago"` — recent errors
13. `systemctl --failed` — dead units
14. `netstat`/`ss -tulnp` — listening ports
15. `last`/`who` — who touched the box
16. Diff against a known-good baseline

> The value isn't memorizing 16 commands — it's running them **in order** so you never skip the obvious cause to chase an exotic one.

After seven years of cloud ops, almost every incident I've handled lives somewhere in this list. Structure beats brilliance at 3 AM.
