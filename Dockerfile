FROM node:24-bookworm

ARG USERNAME=developer

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        wget \
        gnupg \
        sudo \
        git \
        openssh-client \
        less \
        nano \
        jq \
        unzip \
        zip \
        zsh \
        procps \
        ripgrep \
        build-essential \
        python3 \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p -m 755 /etc/apt/keyrings \
    && wget -nv -O /etc/apt/keyrings/githubcli-archive-keyring.gpg \
        https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
        > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends gh \
    && rm -rf /var/lib/apt/lists/*

RUN usermod -l ${USERNAME} -d /home/${USERNAME} -m node \
    && groupmod -n ${USERNAME} node \
    && echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${USERNAME} \
    && chmod 0440 /etc/sudoers.d/${USERNAME}

ENV HOME=/home/${USERNAME} \
    NPM_CONFIG_PREFIX=/home/${USERNAME}/.npm-global \
    PATH=/home/${USERNAME}/.npm-global/bin:${PATH} \
    GH_CONFIG_DIR=/home/${USERNAME}/.config/gh \
    SHELL=/bin/bash

RUN corepack enable \
    && mkdir -p \
        /home/${USERNAME}/.npm-global \
        /home/${USERNAME}/.config/gh \
        /home/${USERNAME}/.ssh \
        /workspace \
    && chmod 700 /home/${USERNAME}/.ssh \
    && chown -R ${USERNAME}:${USERNAME} /home/${USERNAME} /workspace

COPY --chmod=0755 scripts/dev-account.sh /usr/local/bin/dev-account

USER ${USERNAME}
WORKDIR /workspace

CMD ["sleep", "infinity"]
