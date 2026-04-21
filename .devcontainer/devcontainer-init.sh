#!/usr/bin/env bash
set -euo pipefail

# VS Code's devcontainer port-forwarding tunnel connects to the container via
# ::1 (IPv6 loopback). The apps bind to 0.0.0.0 (IPv4 only). socat bridges
# the IPv6 loopback to the IPv4 listeners so both Docker port-mapping and
# VS Code's tunnel work correctly.
#
# IPv4 socket (app)  : 0.0.0.0:3000 / 0.0.0.0:4000
# IPv6 socket (socat): [::]:3000 / [::]:4000  (ipv6only=1, no conflict)

socat TCP6-LISTEN:3000,ipv6only=1,fork,reuseaddr TCP4:127.0.0.1:3000 &
socat TCP6-LISTEN:4000,ipv6only=1,fork,reuseaddr TCP4:127.0.0.1:4000 &

echo "socat IPv6->IPv4 bridges started for ports 3000 and 4000"
