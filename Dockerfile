# Use an official Node.js image as the base image for building the Angular app
FROM node:16 AS build

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install Angular dependencies
RUN npm install

# Copy the rest of the application files to the container
COPY . .

# Build the Angular application
RUN npm run build --prod

# Use an Nginx image to serve the Angular app
FROM nginx:alpine

# Copy your custom Nginx configuration file
COPY ./nginx.conf /etc/nginx/nginx.conf

# Copy the built Angular app to Nginx's web root directory
COPY --from=build /app/dist/adminlte /usr/share/nginx/html

# Expose port 80 to make the app accessible
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
