FROM bincooo/chrome-vnc:latest

WORKDIR /app

ADD . /app
ADD Enter /usr/local/bin
RUN chmod +x /usr/local/bin/Enter
RUN chmod +x /app/docker-entrypoint.sh
RUN npm config set registry http://mirrors.cloud.tencent.com/npm

RUN npm i
#ENTRYPOINT ["tail","-f","/dev/null"]
ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]
# Xvfb :99 -ac & export DISPLAY=:99
# x11vnc -display :99 -forever -bg -o /var/log/x11vnc.log -rfbport 5900