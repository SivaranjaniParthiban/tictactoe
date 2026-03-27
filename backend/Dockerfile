# Stage 1: Build the TypeScript module
FROM node:18-alpine AS builder

WORKDIR /app

RUN npm install -g esbuild

COPY src ./src

RUN esbuild src/main.ts \
    --bundle \
    --platform=node \
    --target=es2017 \
    --outfile=build/main.js \
    --external:@heroiclabs/nakama-runtime

# Stage 2: Final Nakama image
FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

# Cache bust - increment this number to force Railway to rebuild
ARG CACHE_BUST=7

COPY --from=builder /app/build/main.js /nakama/data/modules/main.js
COPY config.yml /nakama/data/config.yml
COPY entrypoint.sh /nakama/entrypoint.sh
COPY nakama-wrapper.sh /usr/local/bin/nakama
RUN chmod +x /nakama/entrypoint.sh /usr/local/bin/nakama

ENTRYPOINT ["/nakama/entrypoint.sh"]
