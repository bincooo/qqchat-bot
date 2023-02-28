#!/bin/bash

PID=`ps -ef|grep Xvfb|grep -v grep|awk '{print $2}'`
if [ -n "$PID" ]; then
  export DISPLAY=:99
else
  Xvfb :99 -ac & export DISPLAY=:99
fi

if [ $ENABLED_X11VNC == 'yes' ]; then
  x11vnc -display :99 -forever -bg -o /var/log/x11vnc.log -rfbport 5900
fi

cd /app
npm run dev -y