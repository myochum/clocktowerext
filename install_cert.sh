#!/usr/bin/env bash
mkcert -install \
    -cert-file localhost.pem \
    -key-file localhost-key.pem \
    localhost

# Keep certificates for Vite (don't copy to webpack or delete)
echo "✅ Certificates ready for Vite at:"
echo "   📄 localhost.pem"
echo "   🔑 localhost-key.pem"