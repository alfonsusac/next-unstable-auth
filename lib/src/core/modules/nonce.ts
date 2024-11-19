// This file controls the nonce generation and verification for this library.

export function generateNonce() {
  return crypto.randomUUID()
}