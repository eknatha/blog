---
title: CrashLoopBackOff at 3 AM — How I Traced It in 8 Minutes
slug: crashloopbackoff-3am
series: k8s
seriesNo: 01
date: 2026-04-18
readTime: 7 min
featured: true
excerpt: A payment service was restarting every 90 seconds. No alerts fired on the actual root cause. Here's the exact kubectl sequence that exposed a silent selector mismatch — and why this pattern will happen again.
tags: [kubernetes, debugging, production]
prereqs: [kubectl basics, Kubernetes cluster access, Service/Endpoint concepts]
---

The pager went off at 3:04 AM. `payment-api` was in **CrashLoopBackOff**, restarting every 90 seconds. The alert that fired said "pod not ready" — useless. It told me *what*, not *why*. Here is the exact sequence I ran, and why it found the root cause in 8 minutes.

## Step 1 — Confirm the blast radius

```bash
$ kubectl get pods -n payment-svc
payment-api-6d4f9b   0/1   CrashLoopBackOff   7   3m
```

Seven restarts in three minutes. The restart count is the single most useful number on this screen — it tells you the pod *starts*, runs briefly, then dies. That rules out image-pull and scheduling problems immediately.

## Step 2 — Read the previous container's logs

A crashing pod's *current* logs are often empty — it hasn't gotten far enough to log anything. The `--previous` flag reads the **last terminated** container instead:

```bash
$ kubectl logs payment-api-6d4f9b --previous
FATAL: Cannot connect to postgres
dial tcp: connection refused
```

So the app dies on startup because it can't reach Postgres. But Postgres was healthy. The connection was being *refused*, not timing out — meaning nothing was listening at that address.

## Step 3 — Inspect the Service the app dials

```bash
$ kubectl describe svc postgres-svc -n payment-svc
Endpoints:   <none>          ← found it
```

**`Endpoints: <none>`** is the smoking gun. A Service with no endpoints routes to nothing — every connection gets refused. The Service exists, but it's matching zero pods.

## Step 4 — Why are there no endpoints?

A Service finds pods by **label selector**. If the selector doesn't match any running pod's labels, you get an empty endpoint list:

```bash
$ kubectl get svc postgres-svc -o jsonpath='{.spec.selector}'
{"app":"postgres-db"}
$ kubectl get pods -l app=postgres -n payment-svc
NAME            READY   STATUS
postgres-0      1/1     Running
```

There it is. The Service selects `app=postgres-db`. The actual pod is labelled `app=postgres`. Someone renamed the deployment label weeks ago and never updated the Service. It only surfaced now because the payment pod restarted and re-resolved DNS.

## The fix

```bash
$ kubectl patch svc postgres-svc -n payment-svc \
    -p '{"spec":{"selector":{"app":"postgres"}}}'
service/postgres-svc patched
```

Endpoints populated instantly, the payment pod's next restart succeeded, and the CrashLoop cleared.

## Why this will happen again

A selector mismatch produces **no error anywhere**. The Service is valid YAML. The pod is healthy. There's no event, no warning — just an empty endpoint list that silently black-holes traffic. The lesson: when a client gets *connection refused* to an in-cluster Service, check `Endpoints:` before anything else. Nine times out of ten it's `<none>`, and the cause is a label that drifted.
