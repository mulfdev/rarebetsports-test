#!/bin/bash

curl -X GET http://localhost:3000/sleep -b cookies.txt -v | jq .
