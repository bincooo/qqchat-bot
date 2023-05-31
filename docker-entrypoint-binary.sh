#!/bin/bash

echo ' '
echo ' give me the star, thank ~'
echo '+------------------------------------------------------+'
echo "|                     DISPLAY $DISPLAY                      |"
echo '|                     X11VNC 5900                      |'
echo '|              github: bincooo/qqchat-bot              |'
echo '|                   please wait ...                    |'
echo '+------------------------------------------------------+'
echo ' '


cd /app
wx-voice compile
cp -rf /usr/local/lib/node_modules/wx-voice/silk /app
./qqchat-bot-linux