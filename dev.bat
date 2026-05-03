@echo off
REM Development docker-compose shortcut
REM Usage: dev.bat up, dev.bat down, dev.bat logs, etc.

docker-compose --file .devcontainer/docker-compose.dev.yml %*
