dbstream-fs
===========

File-system based database compatible with the [dbstream](https://github.com/avinoamr/dbstream) API.

This implementation doesn't implement any indexing logic, which means that the database performance will scale proportionally to the data size. It's recommended to only use it in development environments or very tiny applications.

### Usage

```javascript
var db = require("dbstream-fs");
var connection = db.connect( "file-path" );

// write or update
var cursor = new connection.Cursor()
cursor.write({ id: 1, name: "Hello" });
cursor.write({ id: 2, name: "World" });
cursor.on("finish", function() {
  console.log("Saved 2 objects");
});
cursor.end();

// read
new connection.Cursor()
  .find({ id: 2 })
  .limit( 1 )
  .on("data", function (obj) {
    console.log("Loaded", obj);
  });
```

### API

This module implements the [dbstream](https://github.com/avinoamr/dbstream) API. For the complete documention see: https://github.com/avinoamr/dbstream

###### connect( [file-path] )

* `file-path` a String path to the database file to be used
* Returns a dbstream [Connection](https://github.com/avinoamr/dbstream#connection) object

###### Connection.compact( destination-path )

* `destination-path` is a String path to the desination file 

This method will compact the size of the DB file by removing duplicate or obsolete lines. This is useful because this module always maintains the file in append-mode in order to avoid conflicts and locks. Every insertion, update or even removal will append another line to the file which will therefore always get bigger. You may want to run this command periodically in order to create a new database file that is move concise.
