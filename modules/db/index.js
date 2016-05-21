var mysql = require("mysql"),
    Promise = require("bluebird");
    
module.exports = new function() {
    var connect = null,
        config = require("../../config.js");

    var start = function() {
        connect = mysql.createConnection(config.db);

        connect.connect(function(err) {
            if (err) {
                console.error('Błąd połączenia MySQL: ' + err.stack);
                return;
            }
        });

        connect.on('error', function(err) {
            console.log('Błąd połączenia z bazą MySQL', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                this.start();
            } else {
                throw err;
            }
        });
    }
    
    this.connection = function() {
        return mysql.createConnection(config.db);
    }

    this.query = function(query, query_from, conn) {
        conn = conn || connect;       
        return new Promise(function(resolve, reject) {
            conn.query(query, function(err, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    
    //start();
}