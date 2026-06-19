---
title: Linux Networking Commands I Actually Use in Production (Not Just ping)
slug: linux-networking-commands-production
series: linux
seriesNo: 04
date: 2026-04-10
readTime: 6 min
excerpt: ping tells you a host is alive. But which process is holding port 8080? Why is DNS resolution slow only for this one service? Why is the connection established but no traffic flowing? Real production toolkit: ss, lsof -i, dig, tcpdump — with actual use cases for each.
tags: [linux, networking, ss, tcpdump, dns]
prereqs: [Basic Linux CLI, TCP/IP basics, sudo access]
---

`ping` proves a host is alive. It proves nothing about *why your app can't talk to it*. These are the four commands I reach for when the network "works" but the application doesn't.

## Which process owns this port?

```bash
$ ss -tulnp | grep 8080
tcp LISTEN 0 128 *:8080 users:(("java",pid=3241,fd=42))
```

`ss` is the modern `netstat` — faster and clearer. `-tulnp` = TCP + UDP, listening, numeric ports, with process. When two services fight over a port, this tells you instantly who won.

## Is it DNS? (It's usually DNS.)

```bash
$ dig +short api.internal @10.0.0.2
;; connection timed out   ← internal DNS down
```

Querying a *specific* resolver with `@10.0.0.2` isolates whether the problem is the resolver or the record. `+short` strips the noise. If the public resolver answers and the internal one times out, you've found your blast radius.

## Established but silent — capture the actual packets

```bash
$ tcpdump -i eth0 -n port 8080 -c 20
✓ SYN_SENT but no SYN-ACK — firewall rule missing
```

When a connection shows `ESTABLISHED` in ss but no data flows, tcpdump shows the truth at the wire. A SYN going out with no SYN-ACK coming back means a firewall or security group is silently dropping the return path. `-c 20` stops after 20 packets so you're not flooded.

## The mental model

- **`ss`** — what's listening and who connected (socket state)
- **`lsof -i`** — same, indexed by process/file
- **`dig`** — name resolution, per-resolver
- **`tcpdump`** — ground truth at the packet level

> Work down the stack: socket state first, then DNS, then packets. Don't reach for tcpdump until ss has told you the connection exists.
