#!/bin/bash

COOKIE_FILE="cookies.txt"
BASE_URL="http://localhost:3000"


if [ ! -f "$COOKIE_FILE" ] || [ ! -s "$COOKIE_FILE" ]; then
  echo "Error: Cookie file '$COOKIE_FILE' not found or empty. Please login first using login.sh."
  exit 1
fi

echo "Attempting to fetch weekly sleep statistics..."

HTTP_STATUS=$(curl -X GET \
  "${BASE_URL}/sleep/stats/weekly" \
  -b "$COOKIE_FILE" \
  -H "Accept: application/json" \
  -s -w "%{http_code}" -o response.tmp -v 2> curl_verbose.tmp)


RESPONSE_BODY=$(cat response.tmp)
VERBOSE_OUTPUT=$(cat curl_verbose.tmp)
rm -f response.tmp curl_verbose.tmp

echo ""
echo "--- cURL Verbose Output ---"
echo "${VERBOSE_OUTPUT}"
echo "-------------------------"
echo ""
echo "HTTP Status Code: ${HTTP_STATUS}"
echo ""

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "Successfully fetched weekly sleep statistics (HTTP ${HTTP_STATUS}):"
  echo "$RESPONSE_BODY" | jq .
else
  echo "Failed to fetch weekly sleep statistics. HTTP Status: ${HTTP_STATUS}"
  echo "Response Body (if any):"
  if [ -n "$RESPONSE_BODY" ]; then
    # Try to pretty-print if it's JSON, otherwise just cat
    if echo "$RESPONSE_BODY" | jq . > /dev/null 2>&1; then
      echo "$RESPONSE_BODY" | jq .
    else
      echo "$RESPONSE_BODY"
    fi
  else
    echo "No response body."
  fi
  exit 1
fi

echo ""
