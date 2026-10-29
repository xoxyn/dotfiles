#!/usr/bin/env bash

CATEGORIES=(
    "WORKFLOW"
    "PROGRAMMING"
    "CLIENT"
    "WASTED"
    "STOP"
)

selected=$(printf "%s\n" "${CATEGORIES[@]}" |
    sk --color="bw") || exit 0

if [[ "$selected" == "STOP" ]]; then
    timew stop
    tmux set -g @timew ""
else
    timew start "$selected"
    tmux set -g @timew "$selected "
fi
