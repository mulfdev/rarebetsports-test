#!/bin/bash

RANDOM_SUFFIX=$(date +%s | sha256sum | base64 | head -c 8)
USERNAME="testuser_$RANDOM_SUFFIX"
PASSWORD="SecurePassword123!"

echo "Attempting to sign up user: $USERNAME"

curl -X POST \
  http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\"
  }" \
  -v

echo ""
echo "SIGNUP COMPLETE."
echo "Username for login: $USERNAME" 
echo "Password for login: $PASSWORD"
