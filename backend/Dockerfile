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

COPY --from=builder /app/build/main.js /nakama/data/modules/main.js
COPY config.yml /nakama/data/config.yml

# Strip postgres:// from DATABASE_URL and pass directly via flag
CMD ["sh", "-c", "DB=$(echo $DATABASE_URL | sed 's|postgres://||') && \
    nakama migrate up --database.address $DB && \
    nakama \
      --config /nakama/data/config.yml \
      --database.address $DB \
      --socket.port 7350 \
      --console.port 7351 \
      --http.port 7349 \
      --runtime.path /nakama/data/modules \
      --runtime.js_entrypoint main.js"]
