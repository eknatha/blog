---
title: My tmux Config — Split Panes, Session Persistence & the One Plugin That Saved Me
slug: tmux-config-explained
series: dotfiles
seriesNo: 02
date: 2026-04-14
readTime: 7 min
excerpt: Named sessions per cluster, pane layouts for logs + shell + metrics, and the plugin that survives a dropped SSH connection so you never lose a long-running job again.
tags: [tmux, dotfiles, terminal]
prereqs: [tmux installed, Basic terminal usage, Read .bashrc post first]
---

tmux is the difference between losing a 40-minute migration to a dropped SSH session and not caring that your laptop slept. Here's the config that runs every day.

## A saner prefix and instant reload

```bash
# ~/.tmux.conf
unbind C-b
set -g prefix C-a          # easier to reach than C-b
bind r source-file ~/.tmux.conf \; display "reloaded"
```

`C-a` as prefix is reachable without contorting your hand. `prefix r` reloads the config without restarting the server.

## The layout I open for every incident

```bash
bind L split-window -h \; split-window -v \; select-pane -L
```

One keystroke gives me a three-pane layout: big shell on the left, logs top-right (`journalctl -f`), metrics bottom-right (`watch kubectl top pods`). Everything I need to watch an incident, in one window.

## Named sessions per cluster

```bash
$ tmux new -s prod-eu
$ tmux new -s staging
$ tmux attach -t prod-eu
```

Naming sessions after clusters means I never fat-finger a command into the wrong environment — the session name is right there in the status bar.

## The one plugin: tmux-resurrect

```bash
# in .tmux.conf, via TPM
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @continuum-restore 'on'
```

**tmux-resurrect** saves your entire session layout — windows, panes, working directories, even running programs — to disk. **tmux-continuum** auto-saves every 15 minutes and restores on server start. A reboot no longer means rebuilding six windows of context by hand.

> A dropped connection should cost you nothing. tmux + resurrect is how you make that true.
