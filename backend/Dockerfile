FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0
COPY build/main.js /nakama/data/modules/main.js
COPY config.yml /nakama/data/config.yml
```

Then in Railway, set the start command:
```
/nakama/nakama --config /nakama/data/config.yml
