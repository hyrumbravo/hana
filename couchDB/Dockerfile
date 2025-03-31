# Use the specific CouchDB image as a parent image
FROM jmg2021/ana_db:big

# Optional: Set environment variables, if needed
# ENV COUCHDB_USER=admin
# ENV COUCHDB_PASSWORD=h@n@

# Copy the exported CouchDB data into the container
COPY ./my-couchdb-data /opt/couchdb/data

# Optional: Copy custom configurations if you have any
COPY ./local.ini /opt/couchdb/etc/local.d/

# Expose the CouchDB port
EXPOSE 5984
