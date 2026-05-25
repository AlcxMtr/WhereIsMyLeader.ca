# Use a lightweight Node Alpine image
FROM node:22-alpine

# Set the environment variable so the script knows to use the Docker volume path
ENV NODE_ENV=production

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install python/make/g++ to compile better-sqlite3, install packages, then remove the build tools to keep the image small
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install \
    && apk del .build-deps

# Copy the rest of the scraper code
COPY . .

# Run the scraper
CMD ["npm", "start"]