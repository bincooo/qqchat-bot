FROM ligaard/jdk17-gradle73:latest
WORKDIR /app
ADD . /app

RUN sed -i s/deb.debian.org/mirrors.tencent.com/g /etc/apt/sources.list
RUN apt-get update \
  && apt-get install -y wget unzip \
  && rm -rf /var/lib/apt/lists/*
RUN wget https://github.com/iTXTech/mirai-console-loader/releases/download/v2.1.2/mcl-2.1.2.zip
RUN unzip mcl-2.1.2.zip
RUN chmod +x mcl
RUN ./mcl --disable-module updater
#ENTRYPOINT ["tail","-f","/dev/null"]
ENTRYPOINT ["./mcl"]
