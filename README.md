# pmx-media-server
Python media server to complement pmxplayer with a web interface

## Installing
- Follow the instructions here to install a mysql db on ubuntu https://support.rackspace.com/how-to/installing-mysql-server-on-ubuntu/
- Enter the mysql command line by issuing the command `sudo mysql -u root -p`
- Issue the command `source media-db.sql`
- In media-server.py change the line `video_dir='/path/to/video_files'` to point to where you would like to save all downloaded YT video files
- In download-yt.sh change the line `cd /path/to/video_files` to point to the same path

## Running
To run the server, issue the comman `python3 server.py`

To run the client, open `media-client.html` in a browser. You should be able to search for videos, download them and add them to the database and then remove them

## Issues
- Only works over localhost at the moment
