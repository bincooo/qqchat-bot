#!/bin/bash

exec `(Xvfb :99 -ac & export DISPLAY=:99) || export DISPLAY=:99`
echo ''
echo ' give me the star, thank ~'
echo '+------------------------------------------------------+'
echo "|                     DISPLAY $DISPLAY                      |"
echo '|                     X11VNC 5900                      |'
echo '|              github: bincooo/qqchat-bot              |'
echo '|                   please wait ...                    |'
echo '+------------------------------------------------------+'
echo ''
if [ $ENABLED_X11VNC == 'yes' ]; then
  x11vnc -display :99 -forever -bg -o /var/log/x11vnc.log -rfbport 5900
fi

cd /app
node_modules/wx-voice/bin.js compile
npm run dev -y