#!/bin/bash

# Source and destination CouchDB credentials
SOURCE_HOST="http://18.139.82.238:5984"
SOURCE_USER="admin"
SOURCE_PASSWORD="h@n@"

DESTINATION_HOST="http://couchdb:5984"
DESTINATION_USER="admin"
DESTINATION_PASSWORD="h@n@"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq could not be found. Please install it to run this script."
    exit 1
fi

# Fetch and process the list of databases directly from the source server
echo "Fetching the list of databases from the source..."
db_list=$(curl -s -X GET "$SOURCE_HOST/_all_dbs" -u "$SOURCE_USER:$SOURCE_PASSWORD" | jq -r '.[] | select(. != "_replicator" and . != "_users")')

# Loop through each database in the fetched list and create it on the destination
for db in $db_list; do
    echo "Creating database: $db on destination server"

    # Create the database on the destination
    curl -s -X PUT "$DESTINATION_HOST/$db" -u "$DESTINATION_USER:$DESTINATION_PASSWORD" -H "Content-Type: application/json"

    echo "Database $db created on destination server."
done

echo "All eligible databases have been created on the destination server."
