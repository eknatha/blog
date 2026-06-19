---
title: CKA Prep After 7+ Years of Cloud Ops — What Surprised Me
slug: cka-prep-after-7-years-cloud-ops
series: pe
seriesNo: 02
date: 2026-03-20
readTime: 9 min
excerpt: The exam isn't hard if you know Kubernetes. Except I thought I knew Kubernetes. Week 1 notes from someone with years of cloud ops who still got humbled by the CKA.
tags: [cka, kubernetes, certification]
prereqs: [Kubernetes cluster experience, kubectl comfort, Cloud ops background]
---

I've run Kubernetes in production for years. I assumed the CKA would be a formality. Week one of prep humbled me — not because the material was new, but because the *exam* tests things production rarely makes you do by hand.

## Surprise 1 — Speed is the real exam

The CKA is performance-based: you fix real clusters under a clock. Knowing the answer isn't enough; you need it *fast*. In production I'd open the docs, think, type carefully. The exam gives you minutes per task. That changes everything about how you work.

## Surprise 2 — kubectl imperative commands matter more than YAML

In production I write declarative manifests and `apply` them. The exam rewards **imperative speed**:

```bash
$ kubectl create deploy web --image=nginx --replicas=3 --dry-run=client -o yaml > web.yaml
$ kubectl expose deploy web --port=80 --dry-run=client -o yaml >> svc.yaml
```

Generating a manifest skeleton with `--dry-run=client -o yaml` and editing it is *far* faster than writing YAML from scratch. I'd never bothered learning this because in real life I have my templates. Under the clock, it's essential.

## Surprise 3 — Set up these aliases on day one

```bash
alias k=kubectl
export do='--dry-run=client -o yaml'    # k create deploy x --image=nginx $do
export now='--grace-period=0 --force'
```

The exam lets you configure your shell. These three save real seconds on every task.

## Surprise 4 — etcd backup/restore and static pods

The topics I'd never touched in managed clouds (EKS/GKE handle them) are exactly what the CKA drills:

- `etcdctl snapshot save` / `restore`
- static pod manifests in `/etc/kubernetes/manifests`
- manual `kubeadm` upgrades

Managed Kubernetes had abstracted these away for me. The exam assumes you run the control plane yourself.

## The honest takeaway

> Years of *using* Kubernetes is not the same as years of *operating the control plane by hand*. The CKA tests the second thing.

If you're coming from managed cloud, budget time for etcd, kubeadm, and raw imperative kubectl. The concepts are familiar; the muscle memory isn't.
