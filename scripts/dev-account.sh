#!/usr/bin/env bash
set -euo pipefail

if gh auth status --hostname github.com >/dev/null 2>&1; then
    echo "==> GitHub account currently used in this container:"
    gh auth status --hostname github.com
    echo

    read -r -p "Sign in with a different account? (y/N): " do_login
    if [[ "${do_login}" =~ ^[Yy]$ ]]; then
        gh auth logout --hostname github.com
        gh auth login --hostname github.com --git-protocol https --web
    fi
else
    echo "==> No GitHub account is configured. Starting browser sign-in."
    gh auth login --hostname github.com --git-protocol https --web
fi

gh auth setup-git --hostname github.com

login_name="$(gh api user --jq .login)"
default_email="$(gh api user --jq '.email // empty')"
noreply_email="${login_name}@users.noreply.github.com"

read -r -p "git user.name  [${login_name}]: " git_name
read -r -p "git user.email [${default_email:-${noreply_email}}]: " git_email

git config --global user.name "${git_name:-${login_name}}"
git config --global user.email "${git_email:-${default_email:-${noreply_email}}}"
git config --global init.defaultBranch main

echo
echo "==> Done. This account is now in use:"
gh auth status --hostname github.com
git config --global --get user.name
git config --global --get user.email
