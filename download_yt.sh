#!/bin/bash

if [ $# -ne 2 ]
then
    echo "USAGE: download_yt URL filename"
    exit 1
fi

#echo youtube-dl -F "$1"
#echo $(youtube-dl -F "$1")
#echo $(youtube-dl -F "$1" | grep mp4)
#echo $(youtube-dl -F "$1" | grep mp4 | wc -l)

if [ $(youtube-dl -F "$1" | grep mp4 | wc -l) -gt 0 ]
then
    echo "Found mp4 video"
else
    echo "mp4 video not found"
    exit 2
fi

cd /path/to/video_files #UPDATE THIS

youtube-dl -n -f 'bestvideo[ext=mp4]+bestaudio/bestvideo+bestaudio' --merge-output-format mp4 --output "$2" "$1"

exit 0
