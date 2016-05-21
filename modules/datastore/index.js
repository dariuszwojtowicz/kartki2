var Promise = require("bluebird"),
    db = require("../db");

module.exports = new function() {
    this.connection = function() {
        return db.connection();
    }
    
    this.get = function(table_name, query, conn) {
        var select = "*", where= "", group_by= "", order_by= "", limit="", having = "";
        if (query) {
            select = query.select;
            where = query.where ? " WHERE " + query.where : "";
            group_by = query.group_by ? " GROUP BY " + query.group_by : "";
            order_by = query.order_by ? " ORDER BY " + query.order_by : "";
            limit = query.limit ? " LIMIT " + query.limit : "";

            if(group_by && where){
                return;
            } else if (group_by) {
                having = query.having ? " HAVING " + query.having : "";
            }
        }
        return db.query("SELECT " + column(select) + " FROM " + table_name + where + group_by + having + order_by + limit, from(), conn)
        .then(function(response) {
            return response;
        });
    }


    this.post = function(table_name, query, conn) {
        var values = null;

        if (query) {
            values = query.values;
        }
        return db.query("INSERT INTO " + table_name + " " + new_value(values), from(), conn)
        .then(function(response) {
            return response;
        });
    }

    this.update = function(table_name, query, conn) {
        var where = "", sets = null;
        if (query) {
            sets = query.set;
            where = query.where ? " WHERE " + query.where : "";
        }
        if (!where || where == "") {
            return;
        }
        return db.query("UPDATE " + table_name + " SET " + set(sets) + where, from(), conn)
        .then(function(response) {
            return response;
        });
    }

    this.delete = function(table_name, query, conn) {
        var where = "";
        if (query && query.where) {
            where = " WHERE " + query.where;
        } else {
            return;
        }
        return db.query("DELETE FROM " + table_name + where, from(), conn)
        .then(function(response) {
            return response;
        });
    }

    this.search = function(table_name, query, conn) {
        query.query = query.query.replace(/'/g,"\\'");
        var words = query.query.split(" ").join("|");
        var sql = "SELECT MIN(fit) as fit, " + query.top_select + " FROM (";
        var limit = query.limit ? " LIMIT "+ query.limit : "";
        var not_in = query.not_in ? " WHERE id NOT IN  " + query.not_in : "";
        var unions = [];
        var columns = query.columns;
        var regexes = [];
        for (var i = 0; i < columns.length; i++) {
            var cols = columns[i];
            var regex = "";
            for (var j = 0; j < cols.length-1; j++) {
                regex += "lower(" + cols[j] + ") REGEXP '.*(" + words + ").*' AND ";
            }
            regex += "lower(" + cols[cols.length-1] + ") REGEXP '.*(" + words + ").*'";
            regexes[i] = regex;
        }

        for (var i = 0; i < columns.length; i++) {
            unions[i] = "SELECT " + i + " AS fit, " + query.select.join(", ") + " FROM " + table_name + " GROUP BY " + query.group_by + " HAVING " + query.having + regexes[i];
        }
        sql += unions.join(" UNION ") + ") X GROUP BY " + query.top_group_by + " ORDER BY fit";
        sql = "SELECT " + query.top_select + " FROM (" + sql + ") Y "+ not_in + " ORDER BY fit " +  limit;
        return db.query(sql, from(), conn)
        .then(function(response) {
            return response;
        });
    }

    this.custom_query = function(custom_query, conn) {
        return db.query(custom_query, from(), conn)
        .then(function(response) {
            return response;
        });
    }

    function from() {
        return new Error().stack.split("\n")[3];
    }

    function column(columns) {
        var column = "*";
        if (columns) {
            column = "";
            for (var i in columns) {
                column += columns[i] + ", ";
            };
            column = column.substring(0, column.length - 2);
        }
        return column;
    }

    function new_value(data) {
        if (!data) {
            return;
        }
        var values = " VALUES", columns;
        if (!Array.isArray(data)) {
            data = [data];
        }
        for (var i in data) {
            columns = [];
            var row = [];
            for (var col in data[i]) {
                columns.push(col);
                if (data[i][col] == undefined) {
                    row.push('null');
                } else if (data[i][col] == ""){
                    row.push("''");
                } else if (isNaN(data[i][col]) && (data[i][col].indexOf('SELECT') < 0)){
                    var val = data[i][col].replace(/'/g,"\\'");
                    row.push("'" + val + "'");
                } else {
                    row.push(data[i][col]);
                }
            };
            columns = "("+columns.join()+")";
            values += i == 0 ? '' : ',';
            values += "("+row.join()+")";
        }
        return columns+values;
    }

    function set(sets) {
        var set = "";
        if (sets) {
            for (var key in sets) {
                if (isNaN(sets[key]) || sets[key] === "") {
                    var val = sets[key].replace(/'/g,"\\'");
                    set += " " + key + "='" + val + "',";
                } else {
                    set += " " + key + "=" + sets[key] + ",";
                }
            };
            set = set.substring(0, set.length - 1);
        }
        return set.toString();
    }
}
