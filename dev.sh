#!/bin/bash
# Development docker-compose shortcut
# Usage: ./dev.sh up, ./dev.sh down, ./dev.sh logs, etc.

docker-compose --file .devcontainer/docker-compose.dev.yml "$@"
