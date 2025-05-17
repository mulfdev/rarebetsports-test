#!/bin/bash

COOKIE_FILE="cookies.txt"

if [ ! -f "$COOKIE_FILE" ]; then
  echo "Error: Cookie file '$COOKIE_FILE' not found. Please login first."
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: $0 <sleep_entry_id>"
  echo "Please provide the ID of the sleep entry to fetch."
  exit 1
fi

SLEEP_ENTRY_ID="$1"

echo "Attempting to fetch sleep entry with ID: $SLEEP_ENTRY_ID"

curl -X GET \
  http://localhost:3000/sleep/"$SLEEP_ENTRY_ID" \
  -b "$COOKIE_FILE" \
  -v | jq . 

echo ""
