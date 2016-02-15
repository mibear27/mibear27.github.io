/* global $ */

// -----------------------------------------------------------------------
// GSAPI
// -----------------------------------------------------------------------
var GSAPI = function() {
};
GSAPI.prototype = {
    _get_func : function( cmd, ctx, callback ) {
        $.getJSON( "/control/" + cmd, function() {
        })
        .done( function( data ) {
            callback( { "ctx" : ctx, "state" : 0, "data" : data } );
        })
        .fail( function() {
            callback( { "ctx" : ctx, "state" : 1, "data" : null } );
        })
    },
    _post_func : function( cmd, data, ctx, callback ) {
        $.post( "/control/" + cmd, { data : JSON.stringify( data ) })
        .done( function( data ) {
            callback( { "ctx" : ctx, "state" : 0, "data" : JSON.parse( data ) } );
        })
        .fail( function() {
            callback( { "ctx" : ctx, "state" : 1, "data" : null } );
        })
    },
    getLabels : function( ctx, callback ) {
        this._get_func( "label", ctx, callback );
    },
    appendLabel : function( name, ctx, callback ) {
        this._post_func( "label", { "cmd" : "append", "name" : name }, ctx, callback );
    },
    removeLabel : function( id, ctx, callback ) {
        this._post_func( "label", { "cmd" : "remove", "id" : id }, ctx, callback );
    },
    updateLabel : function( id, name, ctx, callback ) {
        this._post_func( "label", { "cmd" : "update", "id" : id, "name" : name }, ctx, callback );
    },
    getAlbums : function( ctx, callback ) {
        this._get_func( "getAlbums", ctx, callback );
    },
    getPhotos : function( page, sort, search, ctx, callback ) {
        var param = {
            "page"   : [ page, 10, 0, 0 ], // [ "page", "block", "count", "total" ]
            "sort"   : sort,   // [ [ type, order ], ... ]
            "search" : search, // { "label" : "", "album" : "", "tag" : "", "memo" : "", "date" : [ "", "" ] }
        };
        
        $.post( "/control/photo", { data : JSON.stringify( param ) })
        .done( function( data ) {
            var res = JSON.parse( data );
            console.log( "page : " + res[0][0] + " : " + res[0][1] + " : " + res[0][2] + " : " + res[0][3] );
            callback( { "ctx" : ctx, "state" : 0, "data" : res, "page" : res[0], "items" : res[1] } );
        })
        .fail( function() {
            callback( { "ctx" : ctx, "state" : 1, "data" : null } );
        });
    },
    appendPhoto : function( form_data, ctx, callback ) {
        $.ajax( {
            url : "/control/photo",
            processData : false,
            contentType : false,
            data : form_data,
            type : "POST",
            success : function( data ) {
                var res = JSON.parse( data );
                callback( { "ctx" : ctx, "state" : 0, "data" : res } );
            },
            error : function() {
                callback( { "ctx" : ctx, "state" : 1, "data" : null } );
            }
        });
    }
};

var API = new GSAPI();

// -----------------------------------------------------------------------
// mibear util
// -----------------------------------------------------------------------
var mibear = new function() {
    var $this = this;

    // -------------------------------------------------------------------
    // define
    /*
        ui
        - build_drop_list( $drop, data, name, first )
        - onload_image_scale( w, h, cb )
        - load_image( img, file, func )
        
        date
        - string_to_date( str )
        - string_to_datefmt( str )    
        - date_to_string( dt )
    */
    
    // -------------------------------------------------------------------
    // ui
    // -------------------------------------------------------------------
    
    $this.build_drop_list = function( $drop, data, name, first ) {
        name = name || "라벨";
        first = first || "전부";
        //
        $drop.empty();
        $drop.prev( "button" ).eq( 0 ).attr( "mbid", "0" );
        $drop.append( '<li><a href="#" class="drop-item" mbid="0">' + first + "</a></li>" );
        $drop.append( '<li class="divider"></li>' );
        for( var id in data ) {
            $drop.append( '<li><a href="#" class="drop-item" mbid="' + data[id].id + '">' + data[id].name + "</a></li>" );
        }
        if( name ) {
            $drop.find( ".drop-item" ).click( $drop, function( evt ) {
                var $drop = evt.data;
                var id = $(this).attr( "mbid" ); 
                var msg = "";
                if( id == "0" ) {
                    msg = name;
                }
                else {
                    msg = $(this).text();
                }
                var $o = $drop.prev( "button" ).eq( 0 );
                $o.html( msg + ' <span class="caret"></span>' );
                $o.attr( "mbid", id );
                $drop.dropdown( "toggle" );
                return false;
            });
        }
    };
    
    $this.onload_image_scale = function( w, h, cb ) {
        var dw = w || 400;
        var dh = h || 300;
        var callback = cb || null;

        //
        return function() {
            var ratio = 0;
            var width = $(this).width();
            var height = $(this).height();
            
            if( height != dh ) {
                ratio = dh / height;
                width = width * ratio;
                $(this).css( "height", dh );
                $(this).css( "width", width );
            }
            
            if( callback ) {
                callback( this );
            }
            
            $(this).removeClass( "fade" )
        };
    };
    
    $this.load_image = function( img, file, func ) {
        img.src = ( window.URL || window.webkitURL ).createObjectURL( file );
        img.onload = func || function() {};
    };

    // -------------------------------------------------------------------
    // date
    // -------------------------------------------------------------------
    
    $this.string_to_date = function( str ) {
        return new Date( str.substr( 0, 4 ), ( parseInt( str.substr( 4, 2 ) ) - 1 ), str.substr( 6, 2 ),
            str.substr( 8, 2 ), str.substr( 10, 2 ), str.substr( 12, 2 ) );
    }
    
    $this.string_to_datefmt = function( str ) {
        return "" + str.substr( 0, 4 ) + "년 " + str.substr( 4, 2 ) + "월 " + str.substr( 6, 2 ) + "일";
    }
    
    $this.date_to_string = function( dt ) {
        var date = dt.toISOString().slice( 0, 10 ).replace( /-/g, "" );
        var time = dt.toISOString().slice( 11, 18 ).replace( /:/g, "" );
        return date + time;
    }
};

//

var studio = {};
var imagelib = {};