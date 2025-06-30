#!/bin/bash
cd /home/kavia/workspace/code-generation/tictactrack-95632-95642/tic_tac_toe_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

