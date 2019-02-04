#!/usr/bin/env python3

import urllib.request
import urllib.parse
import re
import subprocess
import random
import string
import os
import mysql.connector

videos=[]
video_dir='/media/peyman/Alpha/megashare/videos/raspi'
mydb=None
mycursor=None

def connect_db ():
    mydb=mysql.connector.connect(
            host="192.168.0.16",
            port="3306",
            user="pi",
            passwd="prilyx123",
            database="MediaServer"
            )
    mycursor=mydb.cursor()

def read_yt_video_db (video_id):
    mycursor.execute("Select * From YoutubeMovies Where video_id={}".format(video_id))

    results=mycursor.fetchall()

    for result in results:
        print (result)

def add_yt_video_db (data):
    sql="INSERT INTO YoutubeMovies (url,thumbnail_url,video_id,video_filename,video_path,create_date) VALUES ({},{},{},{},{},{})".format(
            data['url'],
            data['thumbnail_url'],
            data['video_id'],
            data['video_filename'],
            data['video_path']
            )

def get_yt_url (code):
    return "http://www.youtube.com/watch?v="+code

def search_yt (search_string,start_index=0,finish_index=10):
    query_string = urllib.parse.urlencode({"search_query" : search_string})
    html_content = urllib.request.urlopen("http://www.youtube.com/results?" + query_string)
    yt_codes = re.findall(r'href=\"\/watch\?v=(.{11})', html_content.read().decode())
    yt_codes_2=[]
    i=1
    for yt_code in yt_codes[start_index:finish_index]:
        #duplicates for some reason
        i+=1
        if (i%2==0):
            yt_codes_2.append(yt_code)
            print (yt_code)
        else:
            continue

    return yt_codes_2

def download_video(yt_code,video_path):
    yt_url=get_yt_url(yt_code)
    print("{}->{}".format(yt_code,yt_url))
    result=subprocess.run(["./download_yt.sh",yt_url,video_path])

    if (result.returncode==0):
        print ("Successfully downloaded {} to {}".format(yt_url,video_path))
    elif (result.returncode==1):
        print ( "USAGE: download_yt URL filename")
    elif (result.returncode==2):
        print ("mp4 video not found")
    else:
        print ("Something went wrong")
        raise Exception

def process_video (yt_code):
    #yt_codes=search_yt(search_string,0,10)
    #yt_code=yt_codes[0]
    #yt_urls=[get_yt_url(yt_code)
    #yt_url=get_yt_url(yt_codes[0])
    video_hash=''.join(random.choices(string.ascii_uppercase + string.digits, k=30))
    video_path=video_hash+'.mp4'
    download_result=download_video(yt_code,video_path)

    d={}
    d['yt_code']=yt_code
    d['video_path']=video_path
    d['video_hash']=video_hash

    videos.append(d)

    return d

def play (video_hash):
    video=None

    for video_t in videos:
        if video_t['video_hash']==video_hash:
            video=video_t

    if (video==None):
        print ("Error: Video not found ({})".format(video_hash))
        return False

    print ("Playing video: {}".format(video['video_path']))

    return True

def delete (video_hash):
    video=None

    for i,video_t in enumerate(videos):
        if video_t['video_hash']==video_hash:
            video=videos.pop(i)
            break

    if (video==None):
        print ("Error: Video not found ({})".format(video_hash))
        return False

    print ("Deleting video: {}".format(video['video_path']))

    return True

def retire (index):
    video_path=videos[index]['video_path']
    full_video_path=videos[index]['full_video_path']
    if (os.path.isfile(full_video_path)):
        os.remove(full_video_path)
    else:
        print ("File not found: {}".format(full_video_path))
        raise Exception

    if (index>=len(videos)):
        print ("Index Error {}".format(index))
        raise Exception

    del videos[index]

    print ("Successfully retired {}".format(video_path))

#if __name__ == "__main__":
    #process("John Wick")
    #process("John Wick")
    #process("John Wick")

    #retire(2)
    #retire(1)
    #retire(0)
