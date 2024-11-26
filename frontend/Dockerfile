# Step 1: Build react app first, we want to serve production version.
FROM node:18-alpine as builder

# Use app dir for storage and build.
WORKDIR /app

# Copy package.json and package-lock.json to the working directory for managing dependencies (if any).
COPY package*.json ./

# Install dependencies with npm.
RUN npm install --production

# Copy the rest of the application code to image.
COPY . .

# Build the React application for deployment.
RUN npm run build

# Step 2: Use busybox for serving. npm-based runs are not ideal for production, and we want a lightweight server.
FROM busybox:1.37.0

# Move to the same app dir again.
WORKDIR /app

# Copy the deployment files from Stage 1.
COPY --from=builder /app/build .

# Expose port 3000 for serving React app.
EXPOSE 3000

# Serve the static files using busybox's builtin httpd server --this is more reliable and more lightweight for production.
CMD ["busybox", "httpd", "-f", "-p", "0.0.0.0:3000"]
