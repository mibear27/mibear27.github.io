/* global imagelib */
/* global studio */
/* global mibear */
/* global bootbox */
/* global JSZip */

// -----------------------------------------------------------------------
//

var match_state = function( str ) {
    str = str.toLocaleLowerCase();
    
    var patten = [
        [ /disable/g, "disable", "diabled" ],
        [ /highlight/g, "highlight", "pressed" ],
        [ /select/g, "select", "checked" ],
        [ /normal/g, "normal", "normal" ],
        [ /_ov/g, "_ov", "pressed" ],
        [ /2x/g, "2x", "normal" ],
    ];
    
    var name = str.split( "." )[0].replace( /[\{\}\[\]\/?,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi, "" );
    var match, r, l;
    
    for( var i = 0; i < patten.length; i++ ) {
        match = str.match( patten[i][0] );
        if( match ) {
            r = name.search( patten[i][1] );
            if( r >= 0 ) { name = name.substring( 0, r ); }
//            if( name.endsWith( "_" ) || name.endsWith( "-" ) ) { name = name.substring( 0, name.length - 1 ); }
            l = name[ name.length - 1 ]; 
            if( l == "-" || l == "_" ) { name = name.substring( 0, name.length - 1 ); }
            return [ name, patten[i][2] ];
        }
    }
    
    return [ name, "normal" ];
};

// -----------------------------------------------------------------------
// state
// -----------------------------------------------------------------------
var State = new function() {
    var $this = this;
    
    // util function
    $this.objInit = function( $obj, item, id ) {
        if( item[id] ) {
            mibear.load_image( $obj.find( "img" ).get( 0 ), item[id] );
        }
        
        $obj.attr( "id", "rtState_" + id );
        $obj.find( "h3" ).text( id );
        
        if( item[id] && item[id].name ) {
            $obj.find( "h6" ).text( item[id].name );
        }
        
        $obj.find( "#btRemove" ).click( [ $obj, item, id ], function( evt ) {
            var $obj = evt.data[0];
            var item = evt.data[1];
            var id = evt.data[2]
            
            bootbox.confirm( "'" + $obj.find( "h3" ).text() + "' 삭제하시겠습니까?", function( ret ) {
                if( ret ) {
                    $obj.remove();
                    delete item[id];
                }
            });
        });

        // file open
        var $o = $obj.find( "#inOpen" );
        $o.attr( "id", "inOpen-" + id );
        $o.filestyle( { badge: false, input: false, icon: false, buttonText: "열기" } );

        $obj.find( "#inOpen-" + id ).change( [ $obj, item, id ], function( evt ) {
            var $obj = evt.data[0];
            var item = evt.data[1];
            var id = evt.data[2]
            item[id] = this.files[0];
            mibear.load_image( $obj.find( "img" ).get( 0 ), item[id] );
            $obj.find( "h6" ).text( item[id].name );
        });
    };    
};

// -----------------------------------------------------------------------
// DlgAppendState
// -----------------------------------------------------------------------
var DlgAppendState = function( $obj, $ostate ) {
    this.$obj = $obj;
    this.$ostate = $ostate;
    this.$select = null;
    this.$content = null;
    this.item = null;
    
    //
    var $this = this; 

    $obj.find( "#btOk" ).click( function() {
        $this.append();
        $this.$obj.modal( "hide" );
    });
    
    // function
    this.modal = function( item, $content ) {
        $this.item = item;
        $this.$content = $content;
        
        // init
        $this.$obj.find( ".list-group-item" ).each( function() {
            $(this).removeClass( "active" );
            $(this).removeClass( "disabled" );
            $(this).unbind( "click" );
            $(this).unbind( "dblclick" );
        });
        
        var on_select = function( evt ) {
            if( $this.$select ) {
                $this.$select.removeClass( "active" );
            }
            $(this).addClass( "active" );
            $this.$select = $(this);
            
            if( evt.data ) {
                $this.append();
                $this.$obj.modal( "hide" );
            }          
        }
        
        $this.$obj.find( ".list-group-item" ).click( false, on_select );
        $this.$obj.find( ".list-group-item" ).dblclick( true, on_select );
        
        //
        var $o;
        for( var id in item ) {
            $o = $this.$obj.find( "#" + id ); 
            $o.addClass( "disabled" );
            $o.unbind( "click" );
        }
                
        //
        $this.$obj.modal();
    };
    
    this.append = function() {
        if( !$this.$ostate ) { return false; }
        
        var $active = $this.$obj.find( ".active" );
        if( $active.length == 0 ) { return false; }
        var id = $active.attr( "id" );
        
        var $o = $this.$ostate.clone();
        $this.item[id] = null;
        
        State.objInit( $o, $this.item, id );
        
        //
        $o.removeClass( "hide" );
        $this.$content.append( $o );
    }
};

// -----------------------------------------------------------------------
// DlgSetup
// -----------------------------------------------------------------------
var DlgSetup = function( $obj ) {
    var $this = this;
    
    //
    $this.$obj = $obj;
    
    $this.$sl_size = $obj.find( "#inBaseSize" );
    $this.$tx_size = $obj.find( "#txBaseSize" ); 
    $this.$sl_padding = $obj.find( "#inPadding" );
    $this.$tx_padding = $obj.find( "#txPadding" );
    
    $this.$sl_size.on( "slide", function( evt ) {
        $this.$tx_size.text( evt.value );
    });
    
    $this.$sl_size.on( "slideStart", function( evt ) {
        $this.$tx_size.text( evt.value );
    });
    
    $this.$sl_padding.on( "slide", function( evt ) {
        $this.$tx_padding.text( evt.value );
    });

    $this.$sl_padding.on( "slideStart", function( evt ) {
        $this.$tx_padding.text( evt.value );
    });
    
    // function
    this.modal = function( settings, f ) {
        var t, $o;
        
        t = settings ? settings.size : 4;
        $this.$sl_size.slider( "setValue", t );
        $this.$tx_size.text( "" + t );
        
        t = settings ? settings.padding : 0;
        $this.$sl_padding.slider( "setValue", t );
        $this.$tx_padding.text( "" + t );
        
        $this.$obj.modal();
        
        $o = $this.$obj.find( "#btOk" );
        
        $o.unbind( "click" );
        $o.click( function() {
           $this.$obj.modal( "hide" );
           var settings = { size : 0, padding : 0 };
           settings.size = $this.$sl_size.slider( "getValue" );
           settings.padding = $this.$sl_padding.slider( "getValue" );
           f( settings );
        });
    }
};

// -----------------------------------------------------------------------
// load
// -----------------------------------------------------------------------
$( function() {
    // ui init
    $(".mb-slide").slider();
    
    //
    var dlgAppendState = new DlgAppendState( $("#dlgAppendSatae"), $("#rtState") );
    var dlgSetup = new DlgSetup( $("#dlgSetup") );
    
    //
    var settings = { size : 16, padding : 0 };
    var item_settings = {};
    
    //
    $("#rtNavbar #inAppend").change( function() {
        var files = this.files;
        var r, items = {};
        for( var i = 0; i < files.length; i++ ) {
            r = match_state( files[i].name );
            if( !( r[0] in items ) ) {
                items[ r[0] ] = {};
            }
            items[ r[0] ][ r[1] ] = files[i]; // { id : { state : file } }
        }
        
        //
        var $content = $("#rtIconContainer"); 
        var $icon = $("#rtIcon");
        var $state = $("#rtState");
        
        var item, $oitem, $ocontent, $ostate;
        for( var id in items ) {
            if( $content.find( "#rtIcon_" + id ).length > 0  ) {
                console.log( "already " + id + " !!!" );
                continue;
            }
            
            if( id in item_settings ) {
                delete item_settings[id];
            }
            item = items[id];
            $oitem = $icon.clone();
            $oitem.attr( "id", "rtIcon_" + id );
            
            // info
            $oitem.find( "#inFile" ).val( id );
            $ocontent = $oitem.find( "#rtStateContainer" );
            
            //
            $oitem.find( "#btSetup" ).click( id, function( evt ) {
                var is = item_settings[ evt.data ] || settings;
                dlgSetup.modal( is, function( s ) {
                    item_settings[ evt.data ] = s;
                });
            });
                       
            //
            $oitem.find( "#btAppend" ).click( [ item, $ocontent ], function( evt ) {
                dlgAppendState.modal( evt.data[0], evt.data[1] );
            });
            
            //
            $oitem.find( "#btRemove" ).click( $oitem, function( evt ){
                var $oitem = evt.data;
                bootbox.confirm( "'" + $oitem.find( "#inFile" ).val() + "' 삭제하시겠습니까?", function( ret ) {
                    if( ret ) {
                        $oitem.remove();
                    }
                });
            });
            
            //
            for( var idx in item ) {
                $ostate = $state.clone();
                State.objInit( $ostate, item, idx );
                
                $ostate.removeClass( "hide" );
                $ocontent.append( $ostate );
            }
            
            $oitem.removeClass( "hide" );
            $content.prepend( $oitem );
        }
        
        $(this).val( null );
    });

    $("#rtNavbar #btSetup").click( function() {
        dlgSetup.modal( settings, function( s ) {
            settings = s;
        });
    });
    
    //
    $("#rtNavbar #btSave").click( function() {
        if( $(".mb-icon-item").length <= 1 ) {
            return;
        }
        
        var zip = new JSZip();
        var zr = zip.folder( "res" );
        var canvas = document.createElement( "canvas" );
        
        $(".mb-icon-item").each( function() {
            var id = $(this).find( "#inFile" ).val();
            var $container = $(this).find( "#rtStateContainer" );
            var $objs = $container.find( "img" );
            var len = $objs.length;
            var img, state;
            
            var st;
            if( id in item_settings ) {
                st = item_settings[ id ];
            }
            else {
                st = settings;
            }
            
            // option
            var opt_s = st.size; // base size
            var opt_p = st.padding;  // padding
            var opt_t = opt_s + opt_p * 2; // total
            
            var drawable = {};
            
            //
            var ctx, src_size, src_rect, mult, icon_size, tar_rect, out_ctx, tmp_ctx;
            for( var i = 0; i < len; i++ ) {
                img = $objs[i];
                state = $(img).parent().find( "h3" ).text();
                
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                ctx = canvas.getContext( "2d" );
                ctx.drawImage( img, 0, 0 );
                
                src_size = { w : ctx.canvas.width, h : ctx.canvas.height };
                src_rect = { x : 0, y : 0, w : src_size.w, h : src_size.h };
                
                drawable[state] = id + "_" + state + ".png";
                
                for( var density in { "xxxhdpi" : 1, "xxhdpi" : 1, "xhdpi": 1, "hdpi" : 1, "mdpi" : 1 } ) {
                    mult = studio.util.getMultBaseMdpi( density );
                    icon_size = studio.util.multRound( { w : opt_t, h : opt_t }, mult );
                    tar_rect = studio.util.multRound( { x : opt_p, y : opt_p, w : opt_s, h : opt_s }, mult );
                
                    out_ctx = imagelib.drawing.context( icon_size );
                    tmp_ctx = imagelib.drawing.context( icon_size );
                
                    imagelib.drawing.drawCenterInside( tmp_ctx, ctx, tar_rect, src_rect );
                    imagelib.drawing.copy( out_ctx, tmp_ctx, icon_size );
                    
                    zr.folder( "drawable-" + density ).add( drawable[state], out_ctx.canvas.toDataURL().match( /;base64,(.+)/ )[1], { base64 : true } );
                }
            }
            
            if( Object.keys( drawable ).length > 1 ) {
                var xml = '<?xml version="1.0" encoding="utf-8"?>\n' +
                          '<selector xmlns:android="http://schemas.android.com/apk/res/android">\n';
                          
                if( "diabled" in drawable ) {
                    xml += '<item android:state_enabled="false" android:drawable="@drawable/' + drawable.diabled + '" />\n';
                }                          

                if( "pressed" in drawable ) {
                    xml += '<item android:state_pressed="true" android:drawable="@drawable/' + drawable.pressed + '" />\n';
                }
                
                if( "normal" in drawable ) {
                    xml += '<item android:drawable="@drawable/' + drawable.normal + '" />\n';
                }
                xml += '</selector>';
                
                zr.folder( "drawable" ).add( id + ".xml", xml );
            }
            
        });
        
        location.href = "data:application/zip;base64," + zip.generate();
    });
});