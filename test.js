var stream = require( "stream" );
var fs = require( "fs" );
var fs_reverse = require( "fs-reverse" );

// create the mock fs
var _files = {};
fs.appendFile = function ( file, buffer, callback ) {
    _files[ file ] || ( _files[ file ] = "" );
    process.nextTick(function() {
        _files[ file ] += buffer;
        callback();
    })
}

fs_reverse.stream = function ( file ) {
    var s = new stream.Readable({ objectMode: true });
    var data = _files[ file ].split( "\n" );
    s._read = function() {
        if ( data.length == 0 ) {
            this.push( null );
            return 
        }
        this.push( data.pop() + "\n" ); 
    }
    return s;
};

var db = require( "./fs" );
var test = require( "dbstream/test" );

describe( "Filesystem", function () {
    it( "Implements the API", test( db.connect( "test" ) ) )
})
