#!/usr/bin/env bash
mkcert -install \
    -cert-file localhost.pem \
    -key-file localhost-key.pem \
    localhost
cat localhost.pem localhost-key.pem > node_modules/webpack-dev-server/ssl/server.pem
rm localhost.pem localhost-key.pem