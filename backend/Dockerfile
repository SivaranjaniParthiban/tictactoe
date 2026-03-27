FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

COPY build/main.js /nakama/data/modules/main.js
COPY config.yml /nakama/data/config.yml

CMD ["sh", "-c", "\
  mkdir -p /tmp/modules && \
  echo \"$MAIN_JS_B64\" | base64 -d > /tmp/modules/main.js && \
  DB_ADDR=$(echo \"$DATABASE_URL\" | sed 's|^postgresql://||;s|^postgres://||;s|?.*||') && \
  nakama migrate up --database.address \"$DB_ADDR\" && \
  exec nakama \
    --config /nakama/data/config.yml \
    --database.address \"$DB_ADDR\" \
    --socket.port 7350 \
    --console.port 7351 \
    --http.port 7349 \
    --runtime.path /tmp/modules \
    --runtime.js_entrypoint main.js \
"]
