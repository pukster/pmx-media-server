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
yt_url='https://www.youtube.com/watch?v='
yt_thumbnail='https://img.youtube.com/vi'

def connect_db ():
    global mydb

    mydb=mysql.connector.connect(
            host="127.0.0.1",
            port="3306",
            user="pi",
            passwd="prilyx123",
            database="MediaServer"
            )
    mycursor=mydb.cursor()

def disconnect_db ():
    global mydb

    mydb.close()

def read_yt_video_db (video_id, date=False):
    global mydb

    mycursor=mydb.cursor()

    #print("Select * From YoutubeMovies Where video_id={}".format(video_id))
    mycursor.execute("Select id,title,url,thumbnail_url,video_id,video_filename,video_path,download_error,downloaded,create_date,download_date,delete_date From YoutubeMovies Where video_id='{}'".format(video_id))

    results=mycursor.fetchall()

    #for result in results:
        #print (result)

    if len (results)>1:
        print ("ERROR: Duplicate video found: {}".format(video_id))
        raise Exception

    mycursor.close()

    # Convert to dictionary
    data={}
    if (len(results)>0):
        data['id']=results[0][0]
        data['title']=results[0][1]
        data['url']=results[0][2]
        data['thumbnail_url']=results[0][3]
        data['video_id']=results[0][4]
        data['video_filename']=results[0][5]
        data['video_path']=results[0][6]
        data['download_error']=results[0][7]
        data['downloaded']=results[0][8]
        if (date==True):
            data['create_date']=results[0][9]
            data['download_date']=results[0][10]
            data['delete_date']=results[0][11]

    return data

def is_yt_video_in_db (video_id):
    if (len(read_yt_video_db(video_id))>0):
        print ('Video already in DB: {}'.format(video_id))
        return True
    else:
        return False

def add_yt_video_db (video_id):
    global mydb
    global video_dir
    global yt_url
    global yt_thumbnail
    global mydb

    mycursor=mydb.cursor()


    data={}

    data['video_id']='{}'.format(video_id)
    data['html_id']='{}'.format(video_id)
    data['video_filename']='{}.mp4'.format(video_id)
    data['video_path']='{}/{}'.format(video_dir,data['video_filename'])
    data['url']='{}{}'.format(yt_url,video_id)
    data['thumbnail_url']='{}/{}/1.jpg'.format(yt_thumbnail,video_id)

    if (not is_yt_video_in_db (data['video_id'])):
        sql="INSERT INTO YoutubeMovies (url,thumbnail_url,video_id,html_id,video_filename,video_path) VALUES ('{}','{}','{}','{}','{}','{}')".format(
                data['url'],
                data['thumbnail_url'],
                data['video_id'],
                data['html_id'],
                data['video_filename'],
                data['video_path']
                )

        mycursor.execute(sql)
        mydb.commit()

    mycursor.close()

def mark_yt_video_download_error_db (video_id):
    global mydb

    mycursor=mydb.cursor()

    if (not is_yt_video_in_db (video_id)):
        print ("Error: Video not found: {}".format(video_id))
        raise Exception

    sql="UPDATE YoutubeMovies SET download_error = '{}' WHERE video_id='{}'".format(
            1,
            video_id
            )

    mycursor.execute(sql)
    mydb.commit()

    mycursor.close()

def mark_yt_video_downloaded_db (video_id):
    global mydb

    mycursor=mydb.cursor()

    if (not is_yt_video_in_db (video_id)):
        print ("Error: Video not found: {}".format(video_id))
        raise Exception

    sql="UPDATE YoutubeMovies SET downloaded = '{}', download_error=0 WHERE video_id='{}'".format(
            1,
            video_id
            )

    mycursor.execute(sql)
    mydb.commit()

    mycursor.close()

# REMOVE
def get_yt_url (code):
    return "http://www.youtube.com/watch?v="+code

def search_yt (search_string,start_index=0,finish_index=10):
    query_string = urllib.parse.urlencode({"search_query" : search_string})
    html_content = urllib.request.urlopen("http://www.youtube.com/results?" + query_string)
    video_ids = re.findall(r'href=\"\/watch\?v=(.{11})', html_content.read().decode())
    video_ids_2=[]
    i=1
    for video_id in video_ids[start_index:finish_index]:
        #duplicates for some reason
        i+=1
        if (i%2==0):
            video_ids_2.append(video_id)
            print (video_id)
        else:
            continue

    video_ids_3=[]

    for video_id in video_ids_2:
        add_yt_video_db (video_id)
        video_ids_3.append(read_yt_video_db (video_id))

    return video_ids_3

def download_video(url,video_path):
    #yt_url=get_yt_url(video_id)
    #print("{}->{}".format(video_id,yt_url))
    result=subprocess.run(["./download_yt.sh",url,video_path])

    if (result.returncode==0):
        print ("Successfully downloaded {} to {}".format(url,video_path))
    elif (result.returncode==1):
        print ( "USAGE: download_yt URL filename")
    elif (result.returncode==2):
        print ("mp4 video not found")
    else:
        print ("Something went wrong")
        raise Exception

    return result.returncode

def read_playlist(video_fid=None):
    global mydb

    mycursor=mydb.cursor()

    if (video_fid==None):
        mycursor.execute("Select id,video_fid,html_id,active From Playlist")
    else:
        mycursor.execute("Select id,video_fid,html_id,active From Playlist Where video_fid='{}'".format(video_fid))

    results=mycursor.fetchall()

    mycursor.close()

    # Convert to dictionary
    full_data=[]
    for result in results:
        data={}
        data['playlist_id']=result[0]
        data['video_fid']=result[1]
        data['html_id']=result[2]
        data['active']=result[3]

        full_data.append(data)

    return full_data

def add_to_playlist(result):
    global mydb
    global video_dir

    mycursor=mydb.cursor()

    print (result['video_id'])
    print (read_yt_video_db(result['video_id']))
    print (read_yt_video_db(result['video_id'])['id'])

    video_fid=read_yt_video_db (result['video_id'])['id']
    playlist_results=read_playlist(video_fid)
    print(playlist_results)

    result['video_fid']='{}'.format(video_fid)
    result['html_id']='{}-{}'.format(result['video_id'],len(playlist_results)+1)

    if (len(playlist_results)==0):
        result['active']=1
    else:
        result['active']=0

        sql="INSERT INTO Playlist (video_fid,html_id,active) VALUES ('{}','{}','{}')".format(
                result['video_fid'],
                result['html_id'],
                result['active'],
                )

        mycursor.execute(sql)
        mydb.commit()

    mycursor.close()

    return result

def process_video (video_id):
    if (not is_yt_video_in_db (video_id)):
        print("Attempting to process video not in DB: {}".format(video_id))
        raise Exception

    result=read_yt_video_db (video_id)

    if (result['download_error']>0):
        print("download_error set to true. Skipping: {}".format(video_id))
    elif (result['downloaded']==0):
        returncode=download_video(result['url'],result['video_path'])

        if (returncode>0):
            #Something went wrong
            mark_yt_video_download_error_db (video_id)
        else:
            mark_yt_video_downloaded_db (video_id)

    if (result['download_error']==0):
        result=add_to_playlist(result)

    return result

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
