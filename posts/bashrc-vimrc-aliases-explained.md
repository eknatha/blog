---
title: My .bashrc, .vimrc & Aliases — Every Line Explained
slug: bashrc-vimrc-aliases-explained
series: dotfiles
seriesNo: 01
date: 2026-04-19
readTime: 11 min
excerpt: 13+ years of ops muscle memory, written down. Prompt tuning, kubectl shortcuts, SSH multiplexing, and the aliases that have saved me thousands of keystrokes.
tags: [dotfiles, bash, productivity]
prereqs: [Basic bash usage, vim basics, SSH key setup]
---

Thirteen years of ops accretes into a dotfiles repo. Most of it is muscle memory I never think about — until someone pairs with me and asks "what was that?" Here's the annotated tour of the lines that actually earn their place.

## A prompt that tells you where you are

```bash
PS1='\[\e[32m\]\u@\h\[\e[0m\]:\[\e[34m\]\w\[\e[0m\]\$ '
```

The user@host in green, path in blue. Cheap, but at 3 AM the colour stops you running a destructive command on prod when you *thought* you were on staging. Add the kube-context if you live in clusters:

```bash
PS1='[\$(kubectl config current-context 2>/dev/null)] '"$PS1"
```

## The aliases that pay rent

```bash
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgpw='kubectl get pods -o wide'
alias kctx='kubectl config use-context'
alias gs='git status -sb'
alias gl='git log --oneline --graph --decorate -20'
alias ..='cd ..'
alias ...='cd ../..'
```

`k` alone has saved me more keystrokes than anything. Pair it with kubectl's own completion so `k get po<tab>` still works:

```bash
source <(kubectl completion bash)
complete -F __start_kubectl k
```

## SSH multiplexing — instant repeat connections

```bash
# ~/.ssh/config
Host *
    ControlMaster auto
    ControlPath ~/.ssh/cm-%r@%h:%p
    ControlPersist 10m
```

The first SSH to a host opens a master connection; every subsequent one **reuses it**, skipping the handshake entirely. On a high-latency link, repeat connections go from two seconds to instant.

## .vimrc essentials for editing configs on servers

```vim
set number relativenumber     " hybrid line numbers for fast jumps
set expandtab shiftwidth=2    " spaces not tabs — YAML safety
set list listchars=tab:»·     " show tabs (the YAML killer)
syntax on
```

`listchars` showing tabs has caught more broken YAML than any linter — a stray tab in a Kubernetes manifest is invisible until you make it visible.

> Dotfiles aren't about being clever. They're about removing the small frictions you hit a hundred times a day, so the hundredth time costs nothing.
