---
title: Parse a 100K-Line Log File Without Loading It Into Memory
slug: parse-100k-line-log-without-loading
series: linux
seriesNo: 08
date: 2026-03-30
readTime: 4 min
excerpt: awk streams line by line in constant memory — safe to run on a 10GB log on a live production server without OOMing the box.
tags: [linux, awk, logs]
prereqs: [grep and awk basics, Access to log files, Basic piping in bash]
---

The wrong way to count errors in a huge log is to load it into a script that holds the whole thing in memory. On a live box, that's how you OOM the node you're trying to debug. `awk` streams.

## Constant-memory counting

```bash
$ awk '/ERROR/{count++} END{print count " errors"}' app.log
4821 errors
```

awk reads **one line at a time**, updates a counter, and discards the line. Memory usage is flat whether the file is 100KB or 100GB. There's no array, no buffer growing — just a running integer.

## Why this matters on production

A 10GB log loaded by a naive Python script can allocate 10GB+ of RAM. On a box already under pressure, that triggers the OOM killer — possibly killing the *application* you're debugging. awk's streaming model is safe to run anywhere.

## Build a real report in one pass

```bash
$ awk '
  /ERROR/ {err++}
  /WARN/  {warn++}
  /timeout/ {to++}
  END {printf "errors:%d warns:%d timeouts:%d\n", err, warn, to}
' app.log
errors:4821 warns:1203 timeouts:88
```

One read of the file produces three counts. Compare that to three separate `grep | wc -l` passes — awk does it in a single streaming pass.

## Per-minute error rate

```bash
$ awk '/ERROR/{print substr($1,1,16)}' app.log | uniq -c
```

Truncating the timestamp to the minute and counting gives you an error-rate-over-time histogram — invaluable for finding *when* the incident started.

> If a file might be large and you're on a live server, default to awk. Streaming in constant memory is the safe choice.
