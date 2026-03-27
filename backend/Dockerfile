# Stage 1: Build the TypeScript module
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --save-dev esbuild || npm init -y && npm install --save-dev esbuild

COPY src ./src

RUN npx esbuild src/main.ts \
    --bundle \
    --platform=node \
    --target=es2017 \
    --outfile=build/main.js \
    --external:@heroiclabs/nakama-runtime

# Stage 2: Final Nakama image
FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

COPY --from=builder /app/build/main.js /nakama/data/modules/main.js
COPY config.yml /nakama/data/config.yml

CMD ["/nakama/nakama", "--config", "/nakama/data/config.yml"]
