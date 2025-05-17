#!/bin/bash

COOKIE_FILE="cookies.txt"

if [ ! -f "$COOKIE_FILE" ]; then
  echo "Error: Cookie file '$COOKIE_FILE' not found. Please login first."
  exit 1
fi

MIN_SLEEP_HOURS=5
MAX_SLEEP_HOURS=9

MIN_START_HOUR=21 # 9 PM
MAX_START_HOUR=25 # Equivalent to 1 AM next day for calculation ease

# Use provided date or default to today
if [ -n "$1" ]; then
  # Validate if the provided argument is a valid date format (YYYY-MM-DD)
  if [[ "$1" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    DATE_OF_SLEEP_FOR_ENTRY="$1"
    echo "Using provided date for sleep entry: $DATE_OF_SLEEP_FOR_ENTRY"
  else
    echo "Error: Invalid date format provided. Please use YYYY-MM-DD."
    echo "Usage: $0 [YYYY-MM-DD]"
    exit 1
  fi
else
  DATE_OF_SLEEP_FOR_ENTRY=$(date +%F) # Default to today's date
  echo "No date provided, using today's date for sleep entry: $DATE_OF_SLEEP_FOR_ENTRY"
fi


MIN_SLEEP_MINUTES=$((MIN_SLEEP_HOURS * 60))
MAX_SLEEP_MINUTES=$((MAX_SLEEP_HOURS * 60))
RANGE_MINUTES=$((MAX_SLEEP_MINUTES - MIN_SLEEP_MINUTES))
RANDOM_OFFSET_MINUTES=$((RANDOM % (RANGE_MINUTES + 1)))
SLEEP_DURATION_MINUTES=$((MIN_SLEEP_MINUTES + RANDOM_OFFSET_MINUTES))
SLEEP_DURATION_HOURS=$(echo "$SLEEP_DURATION_MINUTES / 60" | bc -l | awk '{printf "%.2f", $1}')

START_HOUR_RANGE=$((MAX_START_HOUR - MIN_START_HOUR))
RANDOM_START_HOUR_OFFSET=$((RANDOM % (START_HOUR_RANGE + 1)))
SLEEP_START_HOUR_CALC=$((MIN_START_HOUR + RANDOM_START_HOUR_OFFSET)) # Could be > 23

RANDOM_START_MINUTE=$((RANDOM % 60))


if [[ "$OSTYPE" == "darwin"* ]]; then # macOS
  DATE_OF_SLEEP_SECONDS=$(date -j -f "%Y-%m-%d" "$DATE_OF_SLEEP_FOR_ENTRY" "+%s")
else # Linux
  DATE_OF_SLEEP_SECONDS=$(date -d "$DATE_OF_SLEEP_FOR_ENTRY" "+%s")
fi

DAY_OFFSET_FOR_START=0
ACTUAL_START_HOUR=$SLEEP_START_HOUR_CALC
if [ "$SLEEP_START_HOUR_CALC" -ge 24 ]; then
  ACTUAL_START_HOUR=$((SLEEP_START_HOUR_CALC - 24))
  DAY_OFFSET_FOR_START=1 # Sleep starts on the next calendar day
fi

SLEEP_TIME_SECONDS=$((DATE_OF_SLEEP_SECONDS + (DAY_OFFSET_FOR_START * 24 * 60 * 60) + (ACTUAL_START_HOUR * 60 * 60) + (RANDOM_START_MINUTE * 60)))

WAKE_UP_TIME_SECONDS=$((SLEEP_TIME_SECONDS + (SLEEP_DURATION_MINUTES * 60)))

if [[ "$OSTYPE" == "darwin"* ]]; then # macOS
  SLEEP_START_DATETIME=$(date -r "$SLEEP_TIME_SECONDS" -u "+%Y-%m-%dT%H:%M:%S.000Z")
  WAKE_UP_DATETIME=$(date -r "$WAKE_UP_TIME_SECONDS" -u "+%Y-%m-%dT%H:%M:%S.000Z")
else # Linux
  SLEEP_START_DATETIME=$(date -d "@$SLEEP_TIME_SECONDS" -u "+%Y-%m-%dT%H:%M:%S.000Z")
  WAKE_UP_DATETIME=$(date -d "@$WAKE_UP_TIME_SECONDS" -u "+%Y-%m-%dT%H:%M:%S.000Z")
fi


echo "Attempting to add sleep entry..."
echo "Target Date of Sleep: $DATE_OF_SLEEP_FOR_ENTRY"
echo "Calculated Sleep Time (UTC): $SLEEP_START_DATETIME"
echo "Calculated Wake Up Time (UTC): $WAKE_UP_DATETIME"
echo "Calculated Sleep Duration: $SLEEP_DURATION_MINUTES minutes ($SLEEP_DURATION_HOURS hours)"

curl -X POST \
  http://localhost:3000/sleep \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" \
  -d "{
    \"dateOfSleep\": \"$DATE_OF_SLEEP_FOR_ENTRY\",
    \"sleepTime\": \"$SLEEP_START_DATETIME\",
    \"wakeUpTime\": \"$WAKE_UP_DATETIME\"
  }" \
  -v 

echo ""
