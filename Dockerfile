FROM bincooo/chrome-vnc:latest

WORKDIR /app

ADD . /app
ADD Enter /usr/local/bin
RUN chmod +x /usr/local/bin/Enter
RUN chmod +x /app/docker-entrypoint.sh

ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=DontWarn
RUN apt-get update \
  && apt-get install -y make gcc \
  && rm -rf /var/lib/apt/lists/*

RUN npm i
#ENTRYPOINT ["tail","-f","/dev/null"]
ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]
# Xvfb :99 -ac & export DISPLAY=:99
# x11vnc -display :99 -forever -bg -o /var/log/x11vnc.log -rfbport 5900