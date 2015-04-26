var stream = require( "stream" );
var assert = require( "assert" );
var fs = require( "fs" );
var fs_reverse = require( "fs-reverse" );

mock();

var db = require( "./fs" );
var test = require( "dbstream/test" );

describe( "Filesystem", function () {

    it( "Reads from an empty file", function ( done ) {
        var connection = db.connect( "dbfile2" );
        new connection.Cursor()
            .find({})
            .on( "data", function (){
                done( new Error( "No data should be emitted" ) )
            })
            .on( "end", function () {
                done();
            })
    });

    it( "Loads data in order", function ( done ) {
        var connection = db.connect( "dbfile3" );
        var writer = new connection.Cursor();
        writer.write( { id: 1, name: "hello" } );
        writer.write( { id: 2, name: "world" } );
        writer.write( { id: 1, name: "foo" } );
        writer.write( { id: 2, name: "bar" } );
        writer.end();

        writer.on( "finish", function () {
            var reader = new connection.Cursor().find({})
            var results = []
            reader.on( "data", results.push.bind( results ) );
            reader.on( "end", function () {
                assert.deepEqual( results, [ 
                    { id: 1, name: "foo" },
                    { id: 2, name: "bar" }
                ]);
                done();
            })
        })


    })

    it( "Implements the API", test( db.connect( "dbfile1" ) ) )
});

function mock() {
    // create the mock fs
    var _files = {};
    fs.appendFile = function ( file, buffer, callback ) {
        process.nextTick(function() {
            fs.appendFileSync( file, buffer );
            callback();
        })
    }
    fs.appendFileSync = function ( file, buffer ) {
        _files[ file ] || ( _files[ file ] = "" );
        _files[ file ] += buffer;
    }

    fs.existsSync = function ( file ) {
        return !!_files[ file ];
    }

    fs_reverse.stream = function ( file ) {
        var s = new stream.Readable({ objectMode: true });
        var data = null;
        s._read = function() {
            if ( data == null ) {
                if ( typeof _files[ file ] == "undefined" ) {
                    var err = "ENOENT 34, File doesn't exist";
                    return s.emit( "error", new Error( err ) );
                }
                if ( _files[ file ].length == 0 ) {
                    var err = "Offset is out of bounds"; // trigger fs-rever error
                    return s.emit( "error", new Error( err ) );
                }
                data = _files[ file ].split( "\n" );
            }

            if ( data.length == 0 ) {
                this.push( null );
                return 
            }
            this.push( data.pop() + "\n" ); 
        }
        return s;
    };
}
