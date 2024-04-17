FROM almalinux/9-base:latest

ARG NODE_VER=16.20.2
RUN <<EOT
  set -ex
  curl https://nodejs.org/dist/v${NODE_VER}/node-v${NODE_VER}-linux-x64.tar.gz | \
    tar --strip-components 1 -C /usr/local -xzf-
  rm -f /usr/local/{CHANGELOG.md,LICENSE,README.md}
EOT

ARG UID=1000
ARG GID=1000
RUN groupadd -g ${GID} albs && useradd --create-home -u ${UID} -g ${GID} albs
USER albs

WORKDIR /home/albs

COPY package-lock.json .
RUN <<EOT
  set -ex
  npm ci --no-fund --no-audit --ignore-scripts --global-style
  npm config set prefix "/home/albs/node_modules"
  npm config set update-notifier false
  rm -r .npm package-lock.json
EOT

WORKDIR /home/albs/code
