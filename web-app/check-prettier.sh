#!/bin/bash

if [ -f "$NVM_DIR/nvm.sh" ]
then
    \. "$NVM_DIR/nvm.sh";
    nvm use;
fi

# Enable corepack for yarn
export PATH="/usr/lib/node_modules/corepack/shims:$PATH"
corepack enable 2>/dev/null || true
corepack prepare yarn@4.9.4 --activate 2>/dev/null || true

yarn install
yarn prettier --check .
