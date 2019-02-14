#!/bin/bash

sudo apt-get update
sudo apt-get upgrade

#installation Hyperion
sudo apt-get install libqtcore4 libqtgui4 libqt4-network libusb-1.0-0 libprotobuf9 ca-certificates
cd /tmp && wget -N https://raw.github.com/tvdzwan/hyperion/master/bin/install_hyperion.sh
sudo sh ./install_hyperion.sh

#copy config from sd card
sudo cp hyperion.config.json /etc/hyperion.config.json

#Hyperion restart + test
sudo killall hyperiond
/usr/bin/hyperiond /etc/hyperion.config.json < /dev/null >/dev/null 2>&1 &
hyperion-remote --effect &quot;Rainbow swirl fast&quot; --duration 3000
