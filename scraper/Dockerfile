# Use a lightweight Node Alpine image
FROM node:22-alpine

# Set the environment variable so the script knows to use the Docker volume path
ENV NODE_ENV=production

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install python/make/g++ to compile better-sqlite3, install packages, then remove the build tools to keep the image small
RUN apk add --no-cache ca-certificates && \
    update-ca-certificates && \
    apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm ci --omit=dev \
    && apk del .build-deps

# Copy the rest of the scraper code
COPY . .

# Run the scraper
# Run node directly (not via npm) so it receives SIGTERM from 'docker stop'
CMD ["node", "scraper.js"]