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
    console.log(str)
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
        add_to_playlist(message.data.video_hash,message.data.thumbnail_url)
    }
    else
    {
        console.log("Something went wrong (handle_message)");
    }
}

/*
get_search_results=function(begin,end)
{
    var yt_urls={};

    for(var i=0;i<(end-begin);i++)
    {
        yt_urls[i]='https://www.youtube.com/watch?v=M7XM597XO94';
    }

    return yt_urls;
};
*/

function create_search_thumbnail(div_id,link_id,thumbnail_url,request)
{
    /*Add new Thumbnail*/
    $('<div>',{
        id:div_id,
        class:'search_results_thumbail_div',
    }).appendTo('#search_results');

    $('<a>',{
        id:link_id,
        href:'#',
        click:function(){on_search_thumbnail_clicked(div_id, link_id,request);return false;}
    }).appendTo('#'+div_id);

    $('<img>',{
        //src:'thumbnail-'+img_index+'.png',
        src:thumbnail_url,
        class:'thumbnail'
    }).appendTo('#'+link_id);
}

function add_search_thumbnail(index,yt_url,thumbnail_url, yt_code)
{
    var img_index=Math.floor((Math.random() * 3) + 1);
    var link_id='search-thumbnail-link-'+index;
    var div_id='search-thumbnail-div-'+index;
    var request={};
    request.type='add_to_playlist';
    request.index=index;
    request.yt_url=yt_url;
    request.yt_code=yt_code;
    request.thumbnail_url=thumbnail_url;

    create_search_thumbnail(div_id,link_id,thumbnail_url,request);
};

function on_search_thumbnail_clicked(old_div_id, old_link_id, request)
{
    var div_id=old_div_id;
    var index=$("#"+div_id).index();
    var link_id=old_link_id;
    var img_id='search-results-thumbnail-'+index;
    var spinner_id='search-results-thumbnail-spinner-'+index;

    /*Remove current Thumbnail*/
    $("#"+link_id).remove()

    /*Add new Thumbnail*/
    $('<img>',{
        id:img_id,
        src:request.thumbnail_url,
        class:'thumbnail'
    }).appendTo('#'+div_id);

    $('<div>',{
        id:spinner_id,
        class:'spinner'
    }).appendTo('#'+div_id);

    /*Signal Server*/
    ws.send(JSON.stringify(request));
};

function on_search_thumbnail_click_processed(old_div_id, thumbnail_url)
{
    var div_id=old_div_id;
    var index=$("#"+div_id).index();
    var link_id='search-thumbnail-link-'+index;

    /*Remove current Children*/
    $("#"+old_div_id).empty()

    create_search_thumbnail(div_id,link_id,thumbnail_url,request);
}

add_to_playlist=function(video_hash,thumbnail_url)
{
    var div_id='playlist-thumbnail-div-'+video_hash;
    var link_1_id='playlist-thumbnail-link-1-'+video_hash;
    var link_2_id='playlist-thumbnail-link-2-'+video_hash;
    var play_request={};
    var delete_request={};

    play_request.type='play';
    play_request.video_hash=video_hash;

    delete_request.type='delete';
    delete_request.video_hash=video_hash;

    console.log(play_request);
    console.log(JSON.stringify(play_request));
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

function display_search_results(yt_codes)
{
    //var search_results=get_search_results(0,100);

    console.log(yt_codes);
    for (var i=0;i<yt_codes.length;i++)
    {
        add_search_thumbnail(i,'http://www.youtube.com/results?'+yt_codes[i],'https://img.youtube.com/vi/'+yt_codes[i]+'/0.jpg', yt_codes[i]);
    }

    //generate_page_numbers(0,300);
};
