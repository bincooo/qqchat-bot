#FROM bincooo/chrome-vnc:latest
FROM bincooo/qqchat-bot:v0.0.2
WORKDIR /app

ADD . /app
ADD Enter /usr/local/bin
RUN chmod +x /usr/local/bin/Enter
RUN chmod +x /app/docker-entrypoint.sh

ENV DISPLAY=:99
ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=DontWarn
#RUN apt-get update \
#  && apt-get install -y make gcc g++ \
#  && rm -rf /var/lib/apt/lists/*

RUN yarn install
#ENTRYPOINT ["tail","-f","/dev/null"]
ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]
# Xvfb :99 -ac & export DISPLAY=:99
# x11vnc -display :99 -forever -bg -o /var/log/x11vnc.log -rfbport 5900