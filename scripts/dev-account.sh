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

account="$(gh api user)"
login_name="$(jq -r '.login' <<< "${account}")"
git_email="$(jq -r '.email // empty' <<< "${account}")"

if [[ -z "${git_email}" ]]; then
    git_email="${login_name}@users.noreply.github.com"
fi

git config --global user.name "${login_name}"
git config --global user.email "${git_email}"
git config --global init.defaultBranch main

echo
echo "==> Done. This account is now in use:"
gh auth status --hostname github.com
echo "Git user:  $(git config --global --get user.name)"
echo "Git email: $(git config --global --get user.email)"
