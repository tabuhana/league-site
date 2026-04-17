# syntax=docker/dockerfile:1
FROM node:20-slim

WORKDIR /app

# Native-build toolchain for better-sqlite3. Prebuilt binaries are usually
# available for node 20, but keeping python/make/g++ around makes the build
# robust if a prebuilt artifact can't be fetched.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first so Docker can cache this layer independently of
# source changes. This project is bun-authored, so there's no package-lock.json
# to feed `npm ci` — use `npm install` and let it resolve against package.json.
COPY package.json ./
RUN npm install --no-audit --no-fund

# Build the Next.js app with source.
COPY . .
RUN npm run build

# Railway mounts a persistent Volume here. Create the mount point so a fresh
# container has somewhere to put the SQLite file even before the volume
# attaches.
RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATABASE_PATH=/data/riven.db
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["npm", "start"]
