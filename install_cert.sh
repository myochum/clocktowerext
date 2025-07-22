#!/usr/bin/env bash

# Step 1: Install the local Certificate Authority
echo "🔧 Installing mkcert Certificate Authority..."
mkcert -install

# Step 2: Generate certificates for localhost
echo "📜 Generating certificates for localhost..."
mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost

# Keep certificates for Vite (don't copy to webpack or delete)
echo "✅ Certificates ready for Vite at:"
echo "   📄 localhost.pem"
echo "   🔑 localhost-key.pem"