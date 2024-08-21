#!/bin/bash
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
node $SCRIPT_DIR/dist/pm2Service.js "$@"