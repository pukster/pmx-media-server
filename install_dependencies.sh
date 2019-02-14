#!/bin/bash

#installation Hyperion
sudo apt-get install libqtcore4 libqtgui4 libqt4-network libusb-1.0-0 libprotobuf7 ca-certificates
cd /tmp && wget -N https://raw.github.com/tvdzwan/hyperion/master/bin/install_hyperion.sh &amp;&amp; sudo sh ./install_hyperion.sh

#copy config from sd card
sudo cp hyperion.config.json /etc/hyperion.config.json

#Hyperion restart + test
sudo killall hyperiond
/usr/bin/hyperiond /etc/hyperion.config.json &lt;/dev/null &gt;/dev/null 2&gt;&amp;1 &amp;
hyperion-remote --effect &quot;Rainbow swirl fast&quot; --duration 3000
