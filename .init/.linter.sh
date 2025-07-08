#!/bin/bash
cd /home/kavia/workspace/code-generation/bountyhub-2004-2013/bounty_board_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

