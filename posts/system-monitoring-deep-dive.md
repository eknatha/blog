---
title: System Monitoring Deep Dive: What top Doesn't Tell You (and What Does)
slug: system-monitoring-deep-dive
series: linux
seriesNo: 03
date: 2026-04-17
readTime: 8 min
excerpt: Everyone knows top. But when a server crawls and top shows nothing obvious, where do you look? This covers the full stack: CPU steal time, memory pressure vs swap usage, I/O wait, and the vmstat + iostat combo that actually tells you what's blocking your system.
tags: [linux, monitoring, performance, iostat, vmstat]
prereqs: [Basic Linux CLI, top/htop usage, sudo access]
---

`top` is where everyone starts and where most people stop. But the most common "the server is slow and top looks fine" incidents are invisible to top's default view. Here's the rest of the stack.

## I/O wait — the slowdown top hides

```bash
$ vmstat 2 5
 r  b   swpd   free   buff   cache   wa  st
 4  8      0  12000   2000  400000   68   0  ← wa=68% I/O wait!
```

**`wa` is the percentage of time the CPU sat idle waiting for disk.** 68% means two-thirds of your "CPU time" is the processor twiddling its thumbs waiting for I/O. top's load average looks high, but the CPU isn't the bottleneck — the disk is. The `b` column (processes blocked on I/O) confirms it.

## Confirm at the device level

```bash
$ iostat -x 2 | grep -v "^$"
sda   r/s: 0.0   w/s: 842.0   await: 180ms   ← saturated
```

`await` is average latency per I/O in milliseconds. Healthy SSD await is single digits. **180ms means the disk is saturated** — likely a runaway writer or a failing drive. `%util` near 100% confirms saturation.

## CPU steal — the noisy-neighbour tax

The `st` column is **steal time** — CPU cycles your VM wanted but the hypervisor gave to another tenant:

```bash
$ vmstat 2
 ... st
      14   ← 14% stolen by neighbours
```

If `st` is consistently high on a cloud VM, your instance is being starved by co-tenants. No amount of in-guest tuning fixes it — you resize or move.

## Memory pressure vs swap usage

People panic at *any* swap usage. That's wrong. The question is whether you're **actively swapping**:

```bash
$ vmstat 2
 si  so
  0  4200   ← so = pages swapping OUT per second
```

`si`/`so` (swap in/out) near zero with swap *used* is fine — the kernel parked idle pages. `so` continuously above zero means you're thrashing, and that's the emergency.

## The decision tree

| Symptom | Look at | Cause |
|---------|---------|-------|
| High load, low CPU | `wa` in vmstat | I/O bottleneck |
| High load on cloud VM | `st` | noisy neighbour |
| Slow despite free RAM | `si`/`so` | active swapping |
| One core pinned | `top` then `-1` | single-threaded hog |

> top tells you *something* is wrong. vmstat and iostat tell you *what*.
