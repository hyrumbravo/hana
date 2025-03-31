# Use the Bitnami JasperReports base image
FROM docker.io/jmg2021/hana-jrs:test

# Switch to root to install netcat
USER root

# Install netcat (nc) to resolve the error
RUN apt-get update && apt-get install -y netcat

# Switch back to the non-root user used by Bitnami images (user 1001)
USER 1001

# Copy your data if needed (optional)
COPY --chown=1001:0 ./jrs-data /bitnami/jasperreports

# Expose the port JasperReports runs on
EXPOSE 8081
