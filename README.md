dbstream-fs
===========

File-system based database compatible with the [dbstream](https://github.com/avinoamr/dbstream) API

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
* Returns a dbstream [Cursor](https://github.com/avinoamr/dbstream#cursor) object


