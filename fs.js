var fs_reverse = require( "fs-reverse" );
var db = require( "dbstream" );
var util = require( "util" );
var sift = require( "sift" );
var fs = require( "fs" );

// enable mocking the fs_reverse
if ( fs_reverse.stream ) {
    fs_reverse = fs_reverse.stream;
}

util.inherits( Cursor, db.Cursor );
function Cursor ( file ) {
    Cursor.super_.call( this );
    this._file = file;
}

Cursor.prototype._save = function( obj, callback ) {
    if ( !obj.id ) {
        obj.id = Math.random().toString( 36 ).substr( 2 );
    }
    fs.appendFile( this._file, JSON.stringify( obj ) + "\n", callback );
};

Cursor.prototype._remove = function ( obj, callback ) {
    obj = { id: obj.id, $removed: true };
    fs.appendFile( this._file, JSON.stringify( obj ) + "\n", callback );
}

Cursor.prototype._load = function () {
    if ( this._loading ) return;
    this._loading = true;

    var sifter = sift( this._query );
    var limit = this._limit || Infinity;
    var skip = this._skip || 0;
    var sort = this._sort || [];
    var that = this;

    var seen = {};
    var results = [];
    fs_reverse( this._file, { flags: "r" } )
        .on( "error", function ( err ) {
            that.emit( "error", err );
        })
        .on( "data", function ( obj ) {
            if ( !obj.trim() ) return; // skip empty lines
            try {
                obj = JSON.parse( obj.trim() );
            } catch ( err ) {
                return this.emit( "error", err );
            }

            // skip seen objects
            if ( seen[ obj.id ] ) return;
            seen[ obj.id ] = true;

            // skip removed objects
            if ( obj.$removed ) return;

            // skip objects that don't meet the query criteria
            if ( !sifter.test( obj ) ) return;
            results.push( obj );
        })
        .on( "end", function() {
            results.reverse()
            results.sort( function ( d1, d2 ) {
                for ( var s = 0 ; s < sort.length ; s += 1 ) {
                    s = sort[ s ];
                    if ( d1[ s.key ] == d2[ s.key ] ) continue;
                    return d1[ s.key ] > d2[ s.key ] 
                        ? s.direction : -s.direction;
                }
                return 0;
            })

            results.splice( 0, skip )
            results.splice( limit );
            results.forEach( that.push.bind( that ) );
            that.push( null );
            that._loading = false;
        });
};

function compact ( from, to ) {
    return new Cursor( from )
        .find({})
        .pipe( new Cursor( to ) );
}

module.exports.connect = function ( file ) {
    util.inherits( FilesystemCursor, Cursor );
    function FilesystemCursor () {
        FilesystemCursor.super_.call( this, file );
    }

    // create the file if it doesn't exist
    if ( !fs.existsSync( file ) ) {
        fs.appendFileSync( file, "\n" );
    }

    return {
        Cursor: FilesystemCursor,
        compact: function( to ) { return compact( file, to ); }
    }
}