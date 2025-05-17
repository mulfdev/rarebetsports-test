#!/bin/bash

PASSWORD="SecurePassword123!" 

COOKIE_FILE="cookies.txt" # File to store cookies

if [ -z "$1" ]; then
  echo "Usage: $0 <username>"
  echo "Please provide the username generated from the signup step as an argument."
  exit 1
fi

USERNAME="$1" 

echo "Attempting to login user: $USERNAME"

rm -f "$COOKIE_FILE"

curl -X POST \
  http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\"
  }" \
  -c "$COOKIE_FILE" \
  -v 

echo "" # Newline
if [ -f "$COOKIE_FILE" ] && [ -s "$COOKIE_FILE" ]; then
  echo "Login successful for user '$USERNAME'. Session cookie saved to '$COOKIE_FILE'."
  echo "Contents of $COOKIE_FILE:"
  cat "$COOKIE_FILE"
else
  echo "Login may have failed for user '$USERNAME' or cookie was not saved. Check verbose output above."
fi
