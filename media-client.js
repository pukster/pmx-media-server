/*Websocket Server*/
var ws;
var playlist=[];

function connect() {

    // Connect to Web Socket
    ws = new WebSocket("ws://localhost:9001/");

    // Set event handlers.
    ws.onopen = function() {
        output("onopen");
    };

    ws.onmessage = function(e) {
        // e.data contains received string.
        output("onmessage: " + e.data);
        handle_message(e.data);
    };

    ws.onclose = function() {
        output("onclose");
    };

    ws.onerror = function(e) {
        output("onerror");
        console.log(e)
    };

}

function onSubmit() {
    var input = document.getElementById("search_bar_input");
    // You can send message to the Web Socket using ws.send.
    var request={};
    request.search_string=input.value;
    request.type='search_yt';

    ws.send(JSON.stringify(request));
    output(JSON.stringify(request));
    input.value = "";
    input.focus();
}

function onCloseClick() {
    ws.close();
}

/*
 * Not Supported
 */
function output(str) {
    /*
  var log = document.getElementById("log");
  var escaped = str.replace(/&/, "&amp;").replace(/</, "&lt;").
    replace(/>/, "&gt;").replace(/"/, "&quot;"); // "
  log.innerHTML = escaped + "<br>" + log.innerHTML;
  */
}

function handle_message(message)
{
    message=JSON.parse(message)

    if (message.type=='connection_established')
    {
        for (var i=0;i<message.data.length;i++)
        {
            add_to_playlist(message.data[i]);
            create_playlist_thumbnail(message.data[i]);
        }
    }
    else if (message.type=='search_yt')
    {
        clear_search_results();
        display_search_results(message.data);
    }
    else if (message.type=='add_to_playlist')
    {
        on_search_thumbnail_click_processed(message.data.video);
        if (message.data.video.downloaded>0)
        {
            add_to_playlist(message.data.playlist);
            create_playlist_thumbnail(message.data.playlist);
        }
    }
    else if (message.type=='play_playlist_video')
    {
        console.log('Handling play_playlist_video');
    }
    else if (message.type=='pause_playlist_video')
    {
        console.log('Handling pause_playlist_video');
    }
    else if (message.type=='delete_playlist_video')
    {
        console.log('Handling delete_playlist_video');
    }
    else
    {
        console.log("Invalid message type: " + message.type);
    }
}

function get_search_thumbnail_div_id(data)
{
    return 'search-thumbnail-'+data.html_id;
}

function get_search_thumbnail_link_id(data)
{
    return 'search-thumbnail-link'+data.html_id;
}

function get_search_thumbnail_spinner_id(data)
{
    return 'search-results-thumbnail-spinner-'+data.html_id;
}

function get_search_thumbnail_download_span_id(data)
{
    return 'search-results-thumbnail-download-splan-'+data.html_id;
}

function get_search_thumbnail_error_id(data)
{
    return 'search-results-thumbnail-error-'+data.html_id;
}

function get_search_thumbnail_span_id(data)
{
    return 'search-thumbnail-span-'+data.html_id;
}

function get_playlist_thumbnail_div_id(data)
{
    return 'playlist-thumbnail-'+data.html_id;
}

function get_playlist_thumbnail_link_1_id(data)
{
    return 'playlist-thumbnail-link-1-'+data.html_id;
}

function get_playlist_thumbnail_link_2_id(data)
{
    return 'playlist-thumbnail-link-2-'+data.html_id;
}

function get_playlist_thumbnail_play_link_id(data)
{
    return 'playlist-thumbnail-play-link'+data.html_id;
}

function get_playlist_thumbnail_pause_link_id(data)
{
    return 'playlist-thumbnail-pause-link'+data.html_id;
}

function get_playlist_thumbnail_delete_span_id(data)
{
    return 'playlist-thumbnail-delete-span-'+data.html_id;
}

function get_playlist_thumbnail_play_div_id(data)
{
    return 'playlist-thumbnail-play-div-'+data.html_id;
}

function get_playlist_thumbnail_pause_div_id(data)
{
    return 'playlist-thumbnail-pause-div-'+data.html_id;
}

function create_search_thumbnail(data)
{
    var div_id=get_search_thumbnail_div_id(data);
    var link_id=get_search_thumbnail_link_id(data);
    var spinner_id=get_search_thumbnail_spinner_id(data);
    //var download_id=get_search_thumbnail_download_id(data);
    var error_id=get_search_thumbnail_error_id(data);
    var download_span_id=get_search_thumbnail_download_span_id(data);
    var request={};
    var video_id=data.video_id;
    var thumbnail_url=data.thumbnail_url;

    request.type='add_to_playlist';
    request.video_id=video_id;

    /*Add new Thumbnail*/
    $('<div>',{
        id:div_id,
        class:'search_results_thumbail_div',
    }).appendTo('#search_results');

    $('<a>',{
        id:link_id,
        href:'#',
        click:function(){on_search_thumbnail_clicked(spinner_id,request);return false;}
    }).appendTo('#'+div_id);

    $('<img>',{
        src:thumbnail_url,
        class:'thumbnail'
    }).appendTo('#'+link_id);

    //Create Spinner
    $('<div>',{
        id:spinner_id,
        class:'spinner'
    }).appendTo('#'+div_id).hide();

    //Create Successful Download icon
    $('<span>',{
        id:download_span_id,
        class:'checkmark',
    }).appendTo('#'+link_id).hide();
    $('<div>',{
        class:'checkmark_circle',
    }).appendTo('#'+download_span_id);
    $('<div>',{
        class:'checkmark_stem',
    }).appendTo('#'+download_span_id);
    $('<div>',{
        class:'checkmark_kick',
    }).appendTo('#'+download_span_id);
    //Create Unsuccessful Download icon
    $('<img>',{
        src:'error.icon.png',
        id:error_id,
        class:'error_icon'
    }).appendTo('#'+link_id).hide();

    if (data.downloaded>0)
    {
        $('#'+download_span_id).show();
    }
    else if (data.download_error>0)
    {
        $('#'+error_id).show();
    }
}

function on_search_thumbnail_clicked(spinner_id,request)
{
    $('#'+spinner_id).show();
    /*Signal Server*/
    ws.send(JSON.stringify(request));
};

function on_search_thumbnail_click_processed(data)
{
    var spinner_id=get_search_thumbnail_spinner_id(data);
    //var download_id=get_search_thumbnail_download_id(data);
    var download_span_id=get_search_thumbnail_download_span_id(data);
    var error_id=get_search_thumbnail_error_id(data);

    $('#'+spinner_id).hide();

    if (data.download_error>0)
    {
        $('#'+download_span_id).show();
    }

    if (data.downloaded>0)
    {
        $('#'+download_span_id).show();
        $('#'+error_id).hide();
    }
    else if (data.download_error>0)
    {
        $('#'+error_id).show();
        $('#'+download_span_id).hide();
    }
}

function create_playlist_thumbnail(data)
{
    var video_id=data.video_id;
    var thumbnail_url=data.thumbnail_url;
    var div_id=get_playlist_thumbnail_div_id(data);
    var link_1_id=get_playlist_thumbnail_link_1_id(data);
    var link_2_id=get_playlist_thumbnail_link_2_id(data);
    var play_link_id=get_playlist_thumbnail_play_link_id(data);
    var pause_link_id=get_playlist_thumbnail_pause_link_id(data);
    var delete_span_id=get_playlist_thumbnail_delete_span_id(data);
    var play_div_id=get_playlist_thumbnail_play_div_id(data);
    var pause_div_id=get_playlist_thumbnail_pause_div_id(data);

    //Thumbnail
    $('<div>',{
        id:div_id,
        class:'playlist_reel_thumbail_div',
    }).appendTo('#playlist_reel');

    $('<a>',{
        id:link_1_id,
        href:'#',
        click:function(){play_playlist_video(data);return false;}
    }).appendTo('#'+div_id);

    $('<img>',{
        src:thumbnail_url,
        class:'thumbnail'
    }).appendTo('#'+link_1_id);

    //Delete Icon
    $('<a>',{
        id:link_2_id,
        href:'#',
        click:function(){delete_playlist_video(data);return false;}
    }).appendTo('#'+div_id);
    $('<span>',{
        id:delete_span_id,
        class:'crossmark',
    }).appendTo('#'+link_2_id);
    $('<div>',{
        class:'crossmark_circle',
    }).appendTo('#'+delete_span_id);
    $('<div>',{
        class:'crossmark_stem',
    }).appendTo('#'+delete_span_id);
    $('<div>',{
        class:'crossmark_kick',
    }).appendTo('#'+delete_span_id);

    //Play Icon
    $('<a>',{
        id:play_link_id,
        href:'#',
        click:function(){play_playlist_video(data);return false;}
    }).appendTo('#'+div_id);
    $('<div>',{
        id:play_div_id,
        class:'play_icon',
    }).appendTo('#'+play_link_id).hide();

    //Pause Icon
    $('<a>',{
        id:pause_link_id,
        href:'#',
        click:function(){pause_playlist_video(data);return false;}
    }).appendTo('#'+div_id);
    $('<div>',{
        id:pause_div_id,
        class:'pause_icon',
    }).appendTo('#'+pause_link_id).hide();

    //Only show if currently active
    if (data.active>0)
    {
        $('#'+pause_div_id).show();
    }
};

function clear_search_results()
{
    $('#search_results').empty();
}

function display_search_results(data)
{
    for (var i=0;i<data.length;i++)
    {
        create_search_thumbnail(data[i]);
    }
}

function add_to_playlist(data)
{
    playlist[playlist.length]=data;
}

function hide_playlist_thumbnail_play_icon(data)
{
    var play_div_id=get_playlist_thumbnail_play_div_id(data);

    $('#'+play_div_id).hide();
}

function hide_playlist_thumbnail_pause_icon(data)
{
    var pause_div_id=get_playlist_thumbnail_pause_div_id(data);

    $('#'+pause_div_id).hide();
}

function show_playlist_thumbnail_play_icon(data)
{
    var play_div_id=get_playlist_thumbnail_play_div_id(data);

    $('#'+play_div_id).show();
}

function show_playlist_thumbnail_pause_icon(data)
{
    var pause_div_id=get_playlist_thumbnail_pause_div_id(data);

    $('#'+pause_div_id).show();
}

function play_playlist_video(data)
{
    var play_div_id=get_playlist_thumbnail_play_div_id(data);
    var pause_div_id=get_playlist_thumbnail_pause_div_id(data);
    var play_request={};

    //Hide active play icon (incase not this one)
    for (var i=0;i<playlist.length;i++)
    {
        if (playlist[i].active>0)
        {
            break;
        }
    }

    if (i<playlist.length)
    {
        //Deactive old active playlist
        playlist[i].active=0;

        hide_playlist_thumbnail_pause_icon(playlist[i]);
        hide_playlist_thumbnail_play_icon(playlist[i]);
    }

    //Hide play icons and show pause icon
    hide_playlist_thumbnail_play_icon(data);
    show_playlist_thumbnail_pause_icon(data);

    //Change Thumbnail to now point to pause video
    var link_1_id=get_playlist_thumbnail_link_1_id(data);
    $('#'+link_1_id).unbind('click');
    $('#'+link_1_id).click(function(){pause_playlist_video(data);return false;});
    //$('#'+link_1_id).attr('onclick','function(){pause_playlist_video(data);return false;}');

    //Activate new active playlist
    for (var i=0;i<playlist.length;i++)
    {
        if (playlist[i].id==data.id)
        {
            break;
        }
    }

    if (i>=playlist.length)
    {
        console.log("Error: current playlist video not found");
    }

    playlist[i].active=1;

    play_request.type='play_playlist_video';
    play_request.playlist_id=data.id;

    ws.send(JSON.stringify(play_request));
}

function pause_playlist_video(data)
{
    var play_div_id=get_playlist_thumbnail_play_div_id(data);
    var pause_div_id=get_playlist_thumbnail_pause_div_id(data);
    var pause_request={};

    //Hide pause icon and show play icon
    $('#'+play_div_id).show();
    $('#'+pause_div_id).hide();

    //Change Thumbnail to now point to play video
    var link_1_id=get_playlist_thumbnail_link_1_id(data);
    $('#'+link_1_id).unbind('click');
    $('#'+link_1_id).click(function(){play_playlist_video(data);return false;});
    //$('#'+link_1_id).attr('onclick','function(){play_playlist_video(data);return false;}');

    pause_request.type='pause_playlist_video';
    pause_request.playlist_id=data.id;

    ws.send(JSON.stringify(pause_request));
}

function delete_playlist_video(data)
{
    var div_id=get_playlist_thumbnail_div_id(data);
    var delete_request={};

    delete_request.type='delete_playlist_video';
    delete_request.playlist_id=data.id;

    $('#'+div_id).remove();

    for (var i=0;i<playlist.length;i++)
    {
        if (playlist[i].id===data.id)
        {
            break;
        }
    }

    if (i>=playlist.length)
    {
        console.log("Error: could not remove playlist video");
    }

    ws.send(JSON.stringify(delete_request));

    var active_status=playlist[i].active;

    //If this is active, make the next one active
    if(active_status>=1)
    {
        if (playlist.length===1)
        {
            //will be empty. Do nothing
        }
        else if (i===playlist.length-1)
        {
            //if it's the last element, take the previous one
            var next_playlist_video_data=playlist[i-1];
            play_playlist_video(next_playlist_video_data);
        }
        else
        {
            //take the next one
            var next_playlist_video_data=playlist[i+1];
            play_playlist_video(next_playlist_video_data);
        }
    }
    else
    {console.log("not active");}

    playlist.splice(i,1);
};
