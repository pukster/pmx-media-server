from websocket_server import WebsocketServer
import media_server
import json

# Called for every client connecting (after handshake)
def new_client(client, server):
    print("New client connected and was given id %d" % client['id'])

    media_server.connect_db()

    # Debug
    return
    video_id='M7XM597XO94'
    print(media_server.read_yt_video_db(video_id))
    media_server.add_yt_video_db(video_id)
    print(media_server.read_yt_video_db(video_id))
    media_server.mark_yt_video_downloaded_db (video_id)
    print(media_server.read_yt_video_db(video_id))

# Called for every client disconnecting
def client_left(client, server):
    print("Client(%d) disconnected" % client['id'])
    media_server.disconnect_db()


# Called when a client sends a message
def message_received(client, server, message):
        message=json.loads(message)

        reply={}
        if (message['type']=='search_yt'):
            reply={}
            reply['type']='search_yt'
            reply['data']=media_server.search_yt(message['search_string'],0,25)
            #print (reply['data'])
        elif (message['type']=='add_to_playlist'):
            reply['type']='add_to_playlist'
            reply['data']=media_server.process_video(message['video_id'])
        elif (message['type']=='play'):
            reply['type']='play'
            print (message)
            reply['success']=media_server.play(message['video_hash'])
        elif (message['type']=='delete'):
            reply['type']='delete'
            reply['success']=media_server.delete(message['video_hash'])

        server.send_message(client,json.dumps(reply))

PORT=9001
server = WebsocketServer(PORT)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)
server.run_forever()
