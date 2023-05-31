#FROM bincooo/chrome-vnc:latest
FROM debian:bullseye-slim

ADD . /app
ADD Enter /usr/local/bin
RUN chmod +x /usr/local/bin/Enter
RUN chmod +x /app/docker-entrypoint.sh
RUN chmod +x /app/qqchat-bot-linux
ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=DontWarn

RUN apt-get update \
  && apt-get install -y make gcc g++ \
  && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]