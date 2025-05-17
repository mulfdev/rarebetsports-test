#!/bin/bash

COOKIE_FILE="cookies.txt"

if [ ! -f "$COOKIE_FILE" ]; then
  echo "Error: Cookie file '$COOKIE_FILE' not found. Please login first."
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: $0 <sleep_entry_id>"
  echo "Please provide the ID of the sleep entry to delete."
  exit 1
fi

SLEEP_ENTRY_ID="$1"

echo "Attempting to delete sleep entry with ID: $SLEEP_ENTRY_ID"
read -p "Are you sure you want to delete sleep entry ID $SLEEP_ENTRY_ID? (y/N): " CONFIRMATION
if [[ "$CONFIRMATION" != "y" && "$CONFIRMATION" != "Y" ]]; then
  echo "Deletion cancelled."
  exit 0
fi

curl -X DELETE \
  http://localhost:3000/sleep/"$SLEEP_ENTRY_ID" \
  -b "$COOKIE_FILE" \
  -v 

echo "" 
echo "If successful, you should see a 204 No Content status in the verbose output above."
