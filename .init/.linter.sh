#!/bin/bash
cd /home/kavia/workspace/code-generation/claude-ai-chat-interface-replica-533-568/claude_ai_chat_interface_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

