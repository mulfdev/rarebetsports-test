#!/bin/bash

COOKIE_FILE="cookies.txt"

if [ ! -f "$COOKIE_FILE" ]; then
  echo "Error: Cookie file '$COOKIE_FILE' not found. Please login first."
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: $0 <sleep_entry_id>"
  exit 1
fi

SLEEP_ENTRY_ID="$1"

JSON_PAYLOAD='{
  "dateOfSleep": "2025-12-25",
  "wakeUpTime": "2025-12-25T10:00:00.000Z"
}'


echo "Attempting to edit sleep entry with ID: $SLEEP_ENTRY_ID"
echo "With fixed payload: $JSON_PAYLOAD"

curl -X PATCH \
  http://localhost:3000/sleep/"$SLEEP_ENTRY_ID" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" \
  -d "$JSON_PAYLOAD" \
  -v

echo ""
