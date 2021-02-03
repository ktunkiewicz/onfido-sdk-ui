#!/usr/bin/env bash
set -o errexit
set -o pipefail
set -o nounset

CERTS_DIR="./certs"
FRONTEND_DIR="./frontend"

rm -rf "$CERTS_DIR"
mkdir -p "$CERTS_DIR"
cp ../{key,cert}.pem "$CERTS_DIR"

rm -rf "$FRONTEND_DIR"
mkdir -p "$FRONTEND_DIR"

cp ../../dist/index.html "$FRONTEND_DIR"
cp ../../dist/demo.min.js{,.map} "$FRONTEND_DIR"
cp ../../dist/onfido.min.js{,.map} "$FRONTEND_DIR"
cp ../../dist/onfido.crossDevice.min.js{,.map} "$FRONTEND_DIR"
cp ../../dist/onfido.vendors~crossDevice.min.js{,.map} "$FRONTEND_DIR"

cp ../../dist/onfido.vendors~crossDevice.css{,.map} "$FRONTEND_DIR"
cp ../../dist/style.css{,.map} "$FRONTEND_DIR"
