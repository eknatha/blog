---
title: Pod Stuck in Terminating — 4 Root Causes and How to Fix Each
slug: pod-stuck-terminating-4-causes
series: k8s
seriesNo: 02
date: 2026-04-05
readTime: 6 min
excerpt: Finalizers, PVCs, network policies, and webhook timeouts. Four reasons a pod won't die — and the right fix for each, instead of reaching for --force.
tags: [kubernetes, debugging, finalizers]
prereqs: [kubectl basics, Kubernetes cluster access, Basic understanding of Pods]
---

A pod stuck in `Terminating` for minutes is one of the most reached-for `--force --grace-period=0` situations in Kubernetes — and force is almost always the wrong fix. It hides the cause and can leave orphaned resources. Here are the four real causes.

## Cause 1 — Finalizers

A **finalizer** is a key that blocks deletion until some controller does cleanup. If that controller is gone or broken, the pod hangs forever:

```bash
$ kubectl get pod stuck-pod -o jsonpath='{.metadata.finalizers}'
["example.com/cleanup"]
```

If the owning controller is genuinely dead, remove the finalizer (carefully):

```bash
$ kubectl patch pod stuck-pod -p '{"metadata":{"finalizers":null}}'
```

## Cause 2 — Volume detach hanging

A pod with a PVC can't terminate until its volume detaches. If the node is unreachable or the storage backend is slow, it stalls:

```bash
$ kubectl describe pod stuck-pod | grep -A3 Events
Warning  FailedUnmount   ... timed out waiting for volume to detach
```

The fix is at the storage/node layer, not the pod — confirm the node is healthy and the CSI driver is running.

## Cause 3 — A long preStop hook or grace period

```bash
$ kubectl get pod stuck-pod -o jsonpath='{.spec.terminationGracePeriodSeconds}'
300
```

A 5-minute grace period plus a slow `preStop` hook means the pod is *correctly* waiting. It's not stuck — it's draining. Check the hook before assuming a bug.

## Cause 4 — A failing admission webhook

A validating/mutating webhook that times out can block the delete API call itself:

```bash
$ kubectl get validatingwebhookconfigurations
$ kubectl describe ... # check failurePolicy: Fail
```

If a webhook with `failurePolicy: Fail` is unreachable, *every* mutation — including deletes — blocks. Fix or temporarily relax the webhook.

> Reach for `--force` and you'll delete the API object while the real pod and its volumes linger on the node. Find the cause first.
