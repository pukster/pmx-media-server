/*Websocket Server*/
var ws;

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

    if (message.type=='search_yt')
    {
        display_search_results(message.data);
    }
    else if (message.type=='add_to_playlist')
    {
        on_search_thumbnail_click_processed(message.data);
        add_to_playlist(message.data)
    }
    else
    {
        console.log("Something went wrong (handle_message)");
    }
}

function get_search_spinner_id(data)
{
    return 'search-results-thumbnail-spinner-'+data.html_id;
}

function get_search_download_id(data)
{
    return 'search-results-thumbnail-download-'+data.html_id;
}

function get_search_error_id(data)
{
    return 'search-results-thumbnail-error-'+data.html_id;
}

function get_playlist_thumbnail_div_id(data)
{
    return 'search-results-thumbnail-error-'+data.html_id;
}

function get_playlist_thumbnail_link_1_id(data)
{
    return 'playlist-thumbnail-link-1-'+data.html_id;
}

function get_playlist_thumbnail_link_2_id(data)
{
    return 'playlist-thumbnail-link-2-'+data.html_id;
}

function create_search_thumbnail(index,data)
{
    var div_id='search-thumbnail-div-'+index;
    var link_id='search-thumbnail-link-'+index;
    var request={};
    var video_id=data.video_id;
    var thumbnail_url=data.thumbnail_url;
    var spinner_id=get_search_spinner_id(data);
    var download_id=get_search_download_id(data);
    var error_id=get_search_error_id(data);

    request.type='add_to_playlist';
    request.index=index;
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
    $('<img>',{
        src:'download.icon.png',
        id:download_id,
        class:'delete_icon'
    }).appendTo('#'+link_id).hide();

    //Create Unsuccessful Download icon
    $('<img>',{
        src:'error.icon.png',
        id:error_id,
        class:'error_icon'
    }).appendTo('#'+link_id).hide();

    console.log(data);
    if (data.downloaded>0)
    {
        $('#'+download_id).show();
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
    var spinner_id=get_search_spinner_id(data);
    var download_id=get_search_download_id(data);
    var error_id=get_search_error_id(data);

    $('#'+spinner_id).hide();

    if (data.download_error>0)
    {
        $('#'+download_id).show();
    }

    if (data.downloaded>0)
    {
        $('#'+download_id).show();
        $('#'+error_id).hide();
    }
    else if (data.download_error>0)
    {
        $('#'+error_id).show();
        $('#'+download_id).hide();
    }
}

add_to_playlist=function(data)
{
    var video_id=data.video_id;
    var thumbnail_url=data.thumbnail_url;
    var div_id=get_playlist_thumbnail_div_id(data);
    var link_1_id=get_playlist_thumbnail_link_1_id(data);
    var link_2_id=get_playlist_thumbnail_link_2_id(data);
    var play_request={};
    var delete_request={};

    //If the file was not downloaded, ignore
    if (data.downloaded==0)
    {
        return false;
    }

    play_request.type='play';
    play_request.playlist_id=data.playlist_id;

    delete_request.type='delete';
    delete_request.playlist_id=data.playlist_id;

    $('<div>',{
        id:div_id,
        class:'playlist_reel_thumbail_div',
    }).appendTo('#playlist_reel');

    $('<a>',{
        id:link_1_id,
        href:'#',
        click:function(){ws.send(JSON.stringify(play_request));return false;}
    }).appendTo('#'+div_id);

    $('<img>',{
        src:thumbnail_url,
        class:'thumbnail'
    }).appendTo('#'+link_1_id);

    $('<a>',{
        id:link_2_id,
        href:'#',
        click:function(){ws.send(JSON.stringify(delete_request));return false;}
    }).appendTo('#'+div_id);
    $('<img>',{
        src:'x.icon.png',
        class:'delete_icon',
        click:function(){ws.send(JSON.stringify(delete_request));return false;}
    }).appendTo('#'+link_2_id);
};

remove_from_playlist=function(index)
{
    console.log("Removing " + index + " from playlist");

    return false;
};

play_from_playlist=function(index)
{
    console.log("Playing " + index + " from playlist");

    return false;
};

/*
add_playlist_thumbnail=function(index,yt_url,img_path)
{
    var div_id='playlist-thumbnail-div-'+index;
    var link_1_id='playlist-thumbnail-link-1-'+index;
    var link_2_id='playlist-thumbnail-link-2-'+index;

    $('<div>',{
        id:div_id,
        class:'playlist_reel_thumbail_div',
    }).appendTo('#playlist_reel');

    $('<a>',{
        id:link_id,
        href:'#',
        click:function(){play_from_playlist(index);return false;}
    }).appendTo('#'+div_id);

    $('<img>',{
        src:'thumbnail-'+index+'.png',
        class:'thumbnail'
    }).appendTo('#'+link_1_id);

    $('<img>',{
        src:'x.icon.png',
        class:'delete_icon'
    }).appendTo('#'+link_2_id);
};
*/

generate_random_current_playlist_thumbnail=function(yt_urlurl)
{
    var result='';
    var index=Math.floor((Math.random() * 3) + 1);
    var playlist_div=document.getElementById('playlist_reel');
    var child_num=playlist_div.childElementCount;

    result+='<div class="playlist_reel_thumbail_div">';
    result+='<a href="#" onclick="play_from_playlist(';
    result+=child_num;
    result+=');">';
    result+='<img src="thumbnail-';
    result+=index;
    result+='.png" class="thumbnail">';
    result+='</a>';
    result+='<a href="#" onclick="play_from_playlist(';
    result+=child_num;
    result+=');">';
    result+='<img src="play.icon.png" class="play_icon">';
    result+='</a>';
    result+='<a href="#" onclick="remove_from_playlist(';
    result+=child_num;
    result+=');">';
    result+='<img src="x.icon.png" class="delete_icon">';
    result+='</a>';
    result+='</div>';

    return result;
};

generate_page_numbers=function(begin,end)
{
    var result='';

    $('div',{
        id:'page_numbers_div',
        class:'search_pages'
    }).appendTo('#search_results');

    for (var i=0;i<(end-begin);i++)
    {
        $('<a>',{
            href:'http://www.youtube.com',
            text:' '+begin+i+' '
        }).appendTo('#page_numbers_div');
    }
};

function display_search_results(data)
{
    for (var i=0;i<data.length;i++)
    {
        create_search_thumbnail(i, data[i]);
    }
};
