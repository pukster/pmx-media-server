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
video_dir='/path/to/videos' #UPDATE THIS
mydb=None
yt_url='https://www.youtube.com/watch?v='
yt_thumbnail='https://img.youtube.com/vi'

def connect_db ():
    global mydb

    mydb=mysql.connector.connect(
            host="127.0.0.1",
            port="3306",
            user="pmxuser",
            passwd="password",
            database="MediaServer"
            )
    mycursor=mydb.cursor()

def disconnect_db ():
    global mydb

    mydb.close()

def read_yt_video_db (video_id, date=False):
    global mydb

    mycursor=mydb.cursor()

    mycursor.execute("SELECT id,title,url,thumbnail_url,video_id,html_id,video_filename,video_path,download_error,downloaded,create_date,download_date,delete_date From YoutubeMovies Where video_id='{}'".format(video_id))

    results=mycursor.fetchall()

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
        data['html_id']=results[0][5]
        data['video_filename']=results[0][6]
        data['video_path']=results[0][7]
        data['download_error']=results[0][8]
        data['downloaded']=results[0][9]
        if (date==True):
            data['create_date']=results[0][10]
            data['download_date']=results[0][11]
            data['delete_date']=results[0][12]

    return data

def is_yt_video_in_db (video_id):
    if (len(read_yt_video_db(video_id))>0):
        return True
    else:
        return False

def add_video_db (video_id):
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

def search_video (search_string,start_index=0,finish_index=10):
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
        add_video_db (video_id)
        video_ids_3.append(read_yt_video_db (video_id))

    return video_ids_3

def download_video(url,video_path):
    cmd="./download_yt.sh"
    result=subprocess.run([cmd,url,video_path])

    if (result.returncode==0):
        print ("Successfully downloaded {} to {}".format(url,video_path))
    elif (result.returncode==1):
        print ( "USAGE: download_yt URL filename")
        print ("{} {} {}".format(cmd,url,video_path))
    elif (result.returncode==2):
        print ("mp4 video not found")
    else:
        print ("Something went wrong")
        raise Exception

    return result.returncode

def get_playlist_count(video_fid=None):
    global mydb

    mycursor=mydb.cursor()

    if (video_fid==None):
        mycursor.execute("Select id,video_fid,html_id,active From Playlist")
    else:
        mycursor.execute("Select id,video_fid,html_id,active From Playlist Where video_fid='{}'".format(video_fid))

    results=mycursor.fetchall()

    mycursor.close()

    return len(results)

def read_all_playlists():
    global mydb

    mycursor=mydb.cursor()

    mycursor.execute("SELECT Playlist.id, Playlist.video_fid,Playlist.html_id,Playlist.active,YoutubeMovies.url,YoutubeMovies.thumbnail_url,YoutubeMovies.video_filename from Playlist INNER JOIN YoutubeMovies ON Playlist.video_fid=YoutubeMovies.id WHERE Playlist.delete_date IS NULL")
    results=mycursor.fetchall()

    mycursor.close()

    # Convert to dictionary
    full_data=[]
    for result in results:
        data={}
        data['id']=result[0]
        data['video_fid']=result[1]
        data['html_id']=result[2]
        data['active']=result[3]
        data['url']=result[4]
        data['thumbnail_url']=result[5]
        data['video_filename']=result[6]

        full_data.append(data)

    return full_data

def get_playlist_active_count():
    global mydb

    mycursor=mydb.cursor()

    mycursor.execute("SELECT Playlist.id, Playlist.video_fid,Playlist.html_id,Playlist.active,YoutubeMovies.url,YoutubeMovies.thumbnail_url from Playlist INNER JOIN YoutubeMovies ON Playlist.video_fid=YoutubeMovies.id WHERE Playlist.active > 0 ")

    result=mycursor.fetchall()

    mycursor.close()

    if (len(result)>1):
        print ("Error: can't have more than 1 active playlist video")
        raise Exception

    return len(result)

def has_playlist_active():
    return get_playlist_active_count()>0

def read_playlist_active():
    global mydb

    mycursor=mydb.cursor()

    mycursor.execute("SELECT Playlist.id, Playlist.video_fid,Playlist.html_id,Playlist.active,Playlist.paused,YoutubeMovies.url,YoutubeMovies.thumbnail_url from Playlist INNER JOIN YoutubeMovies ON Playlist.video_fid=YoutubeMovies.id WHERE Playlist.active > 0 ")

    result=mycursor.fetchall()

    mycursor.close()

    if (len(result)>1):
        print ("Error: can't have more than 1 active playlist video")
        raise Exception

    # Convert to dictionary
    data={}
    data['id']=result[0][0]
    data['video_fid']=result[0][1]
    data['html_id']=result[0][2]
    data['active']=result[0][3]
    data['paused']=result[0][4]
    data['url']=result[0][5]
    data['thumbnail_url']=result[0][6]

    return data

def read_playlist_video_fid(video_fid):
    global mydb

    mycursor=mydb.cursor()

    mycursor.execute("Select id,video_fid,html_id,active,paused From Playlist Where video_fid='{}' and delete_date IS NULL".format(video_fid))

    results=mycursor.fetchall()

    mycursor.close()

    # Convert to dictionary
    full_data=[]
    for result in results:
        data={}
        data['id']=result[0]
        data['video_fid']=result[1]
        data['html_id']=result[2]
        data['active']=result[3]
        data['puased']=result[4]

        full_data.append(data)

    return full_data

def read_playlist_html_id(html_id):
    global mydb

    mycursor=mydb.cursor()

    mycursor.execute("SELECT Playlist.id, Playlist.video_fid,Playlist.html_id,Playlist.active,Playlist.paused,YoutubeMovies.url,YoutubeMovies.thumbnail_url from Playlist INNER JOIN YoutubeMovies ON Playlist.video_fid=YoutubeMovies.id WHERE Playlist.html_id = '{}' and Playlist.delete_date IS NULL".format(html_id))

    result=mycursor.fetchall()

    mycursor.close()

    # Convert to dictionary
    data={}
    data['id']=result[0][0]
    data['video_fid']=result[0][1]
    data['html_id']=result[0][2]
    data['active']=result[0][3]
    data['paused']=result[0][4]
    data['url']=result[0][5]
    data['thumbnail_url']=result[0][6]

    return data

def is_a_video_playing():
    return has_playlist_active()

def add_to_playlist(video_result):
    global mydb
    global video_dir

    mycursor=mydb.cursor()

    video_fid=video_result['id']
    playlist_count=get_playlist_count(video_fid)
    html_id="{}-{}".format(video_result['html_id'],playlist_count)

    if (is_a_video_playing()):
        active=0
    else:
        active=1

    sql="INSERT INTO Playlist (video_fid,html_id,active) VALUES ('{}','{}','{}')".format(
            video_fid,
            html_id,
            active,
            )

    mycursor.execute(sql)
    mydb.commit()

    mycursor.close()

    return read_playlist_html_id(html_id)

# Get video info
# Download video
# Add video to playlist
def search_thumbnail_clicked(video_id):
    # This should never happen
    if (not is_yt_video_in_db (video_id)):
        print("Attempting to process video not in DB: {}".format(video_id))
        raise Exception

    # Get the video from the DB
    video_result=read_yt_video_db (video_id)

    if (video_result['downloaded']>0):
        # if it has been downloaded successfully, skip this step
        pass
    elif (video_result['download_error']>0):
        # If there was a download error, skip this step (JS will handle it)
        print("download_error set to true. Skipping: {}".format(video_id))
    else:
        # If it has not been downloaded, attempt to download it
        returncode=download_video(video_result['url'],video_result['video_path'])

        if (returncode>0):
            #Something went wrong, write error to DB
            mark_yt_video_download_error_db (video_id)
        else:
            #Download successful, write to DB
            mark_yt_video_downloaded_db (video_id)

    #Get the updated video result
    video_result=read_yt_video_db (video_id)

    #At this point it should have either been downloaded or resulted in an error
    if (video_result['download_error']==0):
        #If downloaded successfully, return playlist info
        return {'video':video_result, 'playlist':add_to_playlist(video_result)}
    elif (video_result['downloaded']>0):
        # If error, return empty playlist (JS will handle the error)
        return {'video':video_result, 'playlist':None}
    else:
        #Should never make it here
        print ("Something went wrong")
        raise Exception

def deactivate_active_playlist_video():
    global mydb

    mycursor=mydb.cursor()

    sql="UPDATE Playlist SET active = FALSE WHERE active = TRUE"

    mycursor.execute(sql)
    mydb.commit()

    mycursor.close()

def set_active_playlist_video(playlist_id):
    global mydb

    mycursor=mydb.cursor()

    sql="UPDATE Playlist SET active = TRUE WHERE id = '{}'".format(
            playlist_id
            )

    mycursor.execute(sql)
    mydb.commit()

    mycursor.close()

def unpause_playlist_video():
    global mydb

    mycursor=mydb.cursor()

    sql="UPDATE Playlist SET paused = FALSE WHERE paused = TRUE"

    mycursor.execute(sql)
    mydb.commit()

    mycursor.close()

def pause_playlist_video(playlist_id):
    global mydb

    mycursor=mydb.cursor()

    sql="UPDATE Playlist SET paused = TRUE WHERE id = '{}'".format(
            playlist_id
            )

    mycursor.execute(sql)
    mydb.commit()

    mycursor.close()

def retire_playlist_video(playlist_id):
    global mydb

    mycursor=mydb.cursor()

    sql="UPDATE Playlist SET delete_date = now() WHERE id = '{}'".format(
            playlist_id
            )

    mycursor.execute(sql)
    mydb.commit()

    mycursor.close()

#TODO
#Freelancer to implement signalling scheme here
#Assume first ip address as the master and the
#others as the slave. Pmxplayers should launch and
#wait for instructions. They should never shut down,
#even if their video has finished, unless signalled
#to do so
def launch_pmxplayers(ip_addresses):
    pass

#TODO
#Freelancer to implement signalling scheme here
#Release the pmxplayer instances and allow them to
#exit.
def shut_down_pmxplayers():
    pass

#TODO
#Freelancer to implement signalling scheme here
#Signal pmxplayer instances to start playback
# @video_filename filename of video to be played on
# all raspis. It is assumed that the same video
# folder will be mounted across all raspis as well
# as this media-server.
def pmxplayer_play(video_filename):
    pass

#TODO
#Freelancer to implement signalling scheme here
#Signal the pmxplayer instances to pause playback
def pmxplayer_pause():
    pass

#TODO
#Freelancer to implement signalling scheme here
#Signal the pmxplayer instances to resume playback
def pmxplayer_unpause():
    pass

#TODO
#Freelancer to implement signalling scheme here
#Signal the pmxplayer instances to stop playback
def pmxplayer_stop():
    pass

#TODO
#Freelancer to implement signalling scheme here
#Listen for pmxplayer to signal that the playback
#finished. Should play next video in playlist.
def pmxplayer_finished():
    pass

#move to the next playlist video. Return to first if
#at end of list
#NOTE: This method has not been tested
def next_playlist_video ():
    playlist_videos=read_all_playlists()

    #Should never be called if playlist is empty
    if (len(playlist_videos)==0):
        print("Error: playlist empty")
        raise Exception

    #If it is the only file, auto repeat
    if (len(playlist_videos)==0):
        video_filename=playlist_videos[0]['video_filename']
    else:
        for i,elem in enumerate(playlist_videos):
            if (elem['active']>0):
                break

        if (i > len(playlist_videos)):
            print("Error: Active playlist not found")
            raise Exception
        else:
            deactivate_active_playlist_video()
            #It's the last one, go back to the beginning
            if (i==len(playlist_videos)):
                set_active_playlist_video(playlist_videos[0]['id'])
                video_filename=playlist_videos[0]['video_filename']
            #Just go to the next one (i already incremented)
            else:
                set_active_playlist_video(playlist_videos[i]['id'])
                video_filename=playlist_videos[i]['video_filename']

    pmxplayer_play(video_filename)

def play_playlist_video (playlist_id):
    #If there is a video playing OR paused
    if (is_a_video_playing()):
        pmxplayer_stop()

    unpause_playlist_video()
    deactivate_active_playlist_video()
    set_active_playlist_video(playlist_id)

    pmxplayer_play(playlist_id)
    print("Playing Playlist Video {}".format(playlist_id))

def pause_playlist_video (playlist_id):
    pause_playlist_video(playlist_id)

    pmxplayer_pause()
    print("Pausing Playlist Video {}".format(playlist_id))

def unpause_playlist_video (playlist_id):
    unpause_playlist_video()

    pmxplayer_unpause()
    print("Unpausing Playlist Video {}".format(playlist_id))

def delete_playlist_video (playlist_id):
    retire_playlist_video(playlist_id)
    print("Deleting Playlist {}".format(playlist_id))

