'use strict';

const Hapi = require('hapi'),
    Pusher = require('pusher'),
    Promise = require("bluebird"),
    Joi = require('joi'),
    store = require('./modules/datastore'),
    crypto = require('./modules/crypto'),
    config = require("./config.js"),
    server = new Hapi.Server(),
    pusher = new Pusher(config.pusher),
    bootstrapChannels = require('./channels').bootstrap;

server.register(require('inert'), (err) => {
    if (err) {
        throw err;
    } 
});
        
server.connection(config.server);

var level_number_to_cardSetId = {
    2 : [2,3],
    3 : [4,5,6],
    4 : [7,8,9],
    5 : [10,11,12]
};

server.route({
    method: ['POST'],
    path: '/login',
    config: {
        handler: function(request, reply) {
            var user = request.payload,
                conn = store.connection();
                
            var schema = Joi.object().keys({
                login: Joi.string().min(3).max(30).required(),
                password: Joi.string().min(3).max(20).required(),
            });
             
            Joi.validate(user, schema, function (err, value) {
                if (err) {
                    reply(err.details[0].message).header('validation-error', err.details[0].message).code(400);
                } else {
                    conn.connect(function(err) {
                        if (err) {
                            conn.end();
                            reply().header('api-message', 'Problem with database connection before request').code(500);
                        } else {
                            store.get("`users`", {
                                select: ["id", "login", "email"],
                                where: "login ='" + user.login + "' AND password='" + crypto.encrypt(encodeURIComponent(user.password)) + "'"
                            }, conn)
                            .then(function(data) {                                    
                                if (data[0]) {
                                    conn.end();
                                    data[0]['isAuthenticated'] = 1;
                                    reply(data[0]).code(200);                                            
                                } else {
                                    conn.end();
                                    reply().header('api-message', 'Invalid login/password combination').code(401);
                                }
                            })
                            .error(function(e) {
                                conn.end();
                                reply().header('api-message', 'Database request error on user login:' + e).code(400);
                            });
                        }
                    });
                }
            });
        }
    }
});

server.route({
    method: ['POST'],
    path: '/register',
    config: {
        handler: function(request, reply) {
            console.log('Registration');
            var user = request.payload,
                user_id;
                
            var schema = Joi.object().keys({
                login: Joi.string().min(3).max(30).required(),
                password: Joi.string().min(3).max(20).required(),
                passwordRepeat: Joi.string().min(3).max(20).required(),
                email: Joi.string().email().required()
            });
             
            Joi.validate(user, schema, function (err, value) {
                if (err) {
                    reply(err.details[0].message).header('validation-error', err.details[0].message).code(400);
                } else if (user.password !== user.passwordRepeat) {
                    reply('password is not equal to password confirmation').header('validation-error', 'password is not equal to password confirmation').code(400);
                } else {                    
                    var conn = store.connection();
                    conn.connect(function(err) {
                        if (err) {
                            conn.end();
                            reply().header('api-message', 'Problem with database connection before request').code(500);
                        } else {
                            conn.beginTransaction(function(err) {
                                if (err) {
                                    conn.end();
                                    reply().header('api-message', 'Error on transaction start').code(500);
                                }
                                store.get("`users`", {
                                    select: ["id"],
                                    where: "login ='" + user.login + "' OR email='" + user.email + "'"
                                }, conn)
                                .then(function(data) {
                                    if (data[0]) {
                                        conn.end();
                                        return reply().code(409);
                                    } else {
                                        store.post("`users`", {
                                            values: {
                                                login: encodeURIComponent(user.login),
                                                password: crypto.encrypt(encodeURIComponent(user.password)),
                                                email: user.email,
                                                rank: '2'
                                            }, 
                                        }, conn)
                                        .then(function(data) {
                                            user_id = data.insertId;
                                            store.post("`userLevels`", {
                                                values: {
                                                    userId: user_id,
                                                    number: 1,
                                                    cardSetId: 1,
                                                    isFinished: 0
                                                }
                                            }, conn)
                                            .then(function (data1) {
                                                var rand = Math.round(Math.random());
                                                var firstCount = 0;
                                                var secondCound = 0;
                                                
                                                if(rand === 0){
                                                    firstCount = 2;
                                                }
                                                else{
                                                    secondCound = 2;
                                                }
                                                Promise.all([
                                                    store.post("`levelCards`", {
                                                        values: {
                                                            userLevelId: data1.insertId,
                                                            cardId: 1,
                                                            count: firstCount
                                                        }
                                                    }, conn),
                                                    store.post("`levelCards`", {
                                                        values: {
                                                            userLevelId: data1.insertId,
                                                            cardId: 2,
                                                            count: secondCound
                                                        }
                                                    }, conn)
                                                ])
                                                .then(function () {
                                                    store.post("`userLevels`", {
                                                        values: {
                                                            userId: user_id,
                                                            number: 0,
                                                            isFinished: 0
                                                        }
                                                    }, conn)
                                                    .then(function () {
                                                        conn.commit(function(err) {
                                                            if (err) {
                                                                conn.end();
                                                                return conn.rollback(function() {
                                                                    reply().header('api-message', 'Rollback on commit: ' +err).code(500);
                                                                });
                                                            } else {
                                                                conn.end();
                                                                reply().code(201);
                                                            }
                                                        });     
                                                    })                                          
                                                    .error(function(e) {
                                                        return conn.rollback(function() {
                                                            conn.end();
                                                            reply().header('api-message', 'Database request error: '+e).code(400);
                                                        });
                                                    });
                                                })                                          
                                                .error(function(e) {
                                                    return conn.rollback(function() {
                                                        conn.end();
                                                        reply().header('api-message', 'Database request error: '+e).code(400);
                                                    });
                                                });
                                            })                                          
                                            .error(function(e) {
                                                return conn.rollback(function() {
                                                    conn.end();
                                                    reply().header('api-message', 'Database request error: '+e).code(400);
                                                });
                                            });
                                        })
                                        .error(function(e) {
                                            return conn.rollback(function() {
                                                conn.end();
                                                reply().header('api-message', 'Database request error: '+e).code(400);
                                            });
                                        });
                                    }
                                })
                                .error(function(e) {
                                    return conn.rollback(function() {
                                        conn.end();
                                        reply().header('api-message', 'Database request error: '+e).code(400);
                                    });
                                });
                            });
                        }
                    });
                }
            });
        }
    }
});

server.route({
    method: ['GET'],
    path: '/users/{id}/levels',
    config: {
        handler: function(request, reply) {
            var conn = store.connection();
            var user_id = request.params.id;

            conn.connect(function(err) {
                if (err) {
                    conn.end();
                    reply().header('api-message', 'Problem with database connection before request').code(500);
                } else {
                    store.get("`userLevels` ul " + 
                    "LEFT JOIN `cardSets` cs ON ul.cardSetId = cs.id",
                    {
                        select: ["ul.id", "ul.isFinished", "cs.name", "cs.description", "cs.numberOfCards as numberOfLevelCards", "(select count(*) from levelCards where userLevelId = ul.id) as numberOfUserCards"],
                        where: "ul.userId = " + user_id
                    }, conn)
                    .then(function(data) {
                        conn.end();
                        reply(data).code(200);
                    })
                    .error(function(e) {
                        conn.end();
                        reply().header('api-message', 'Database request error on user login:' + e).code(400);
                    });
                }
            });
        }
    }
});

server.route({
    method: ['GET'],
    path: '/levels/{id}/cards',
    config: {
        handler: function(request, reply) {
            var conn = store.connection();
            var user_level_id = request.params.id;

            conn.connect(function(err) {
                if (err) {
                    conn.end();
                    reply().header('api-message', 'Problem with database connection before request').code(500);
                } else {
                    store.get("`levelCards` lc JOIN `userLevels` ul ON lc.userLevelId = ul.id " + 
                    "LEFT JOIN `cards` c ON lc.cardId = c.id",
                    {
                        select: ["lc.id", "lc.cardId", "lc.count", "c.imagePath", "ul.isFinished"],
                        where: "lc.userLevelId = " + user_level_id
                    }, conn)
                    .then(function(data) {
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].isFinished) {
                                data[i].count = 1;
                            }
                        }
                        conn.end();
                        reply(data).code(200);
                    })
                    .error(function(e) {
                        conn.end();
                        reply().header('api-message', 'Database request error on user login:' + e).code(400);
                    });
                }
            });
        }
    }
});

server.route({
    method: ['GET'],
    path: '/rank',
    config: {
        handler: function(request, reply) {
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
    }
});

server.route({
    method: ['GET'],
    path: '/users',
    config: {
        handler: function(request, reply) {
            var conn = store.connection();
            var login = request.query.login;
            var where = login ? " where login like '%" + login + "%'" : '';

            conn.connect(function(err) {
                if (err) {
                    conn.end();
                    reply().header('api-message', 'Problem with database connection before request').code(500);
                } else {
                    store.custom_query(
                        'select login, id from users' + where, conn)
                    .then(function(data) {
                        conn.end();
                        reply(data).code(200);
                    })
                    .error(function(e) {
                        conn.end();
                        reply().header('api-message', 'Database request error on user login:' + e).code(400);
                    });
                }
            });
        }
    }
});

server.route({
    method: ['GET'],
    path: '/users/{id}/notifications',
    config: {
        handler: function(request, reply) {
            var conn = store.connection();
            var user_id = request.params.id;

            conn.connect(function(err) {
                if (err) {
                    conn.end();
                    reply().header('api-message', 'Problem with database connection before request').code(500);
                } else {
                    store.get("`notifications`",
                    {
                        select: ["id", "message"],
                        where: "userId = " + user_id,
                        order_by: "id desc",
                    }, conn)
                    .then(function(data) {
                        conn.end();
                        reply(data).code(200);
                    })
                    .error(function(e) {
                        conn.end();
                        reply().header('api-message', 'Database request error on user login:' + e).code(400);
                    });
                }
            });
        }
    }
});

server.route({
    method: ['GET'],
    path: '/img/{file*}',
    config: {
        handler: function(request, reply) {
            reply.file('images/'+request.params.file);
        }
    }
});

server.route({
    method: ['POST'],
    path: '/cards/{id}',
    config: {
        handler: function(request, reply) {
            var parameters = request.payload,
                conn = store.connection();
                
            var schema = Joi.object().keys({
                fromUserId: Joi.number().integer().min(0).required(),
                toUserId: Joi.number().integer().min(0).required(),
                fromUserLogin: Joi.string().required(),
            });
            
            var fromUserId = parameters.fromUserId,
                fromUserLogin = parameters.fromUserLogin,
                toUserId = parameters.toUserId,
                cardId = request.params.id,
                number = null,
                cards_to_schowek = [];
                
            var closed_conn_counter = 0,
                to_store = 0,
                in_store = false,
                level_finished = false;
             
            Joi.validate(parameters, schema, function (err, value) {
                if (err) {
                    conn.end();
                    reply(err.details[0].message).header('validation-error', err.details[0].message).code(400);
                } else {
                    conn.connect(function(err) {
                        if (err) {
                            conn.end();
                            reply().header('api-message', 'Problem with database connection before request').code(500);
                        } else {
                            store.get("`levelCards` lc JOIN `userLevels` us ON lc.userLevelId = us.id", { // Patrzymy czy użytkownik jest w posiadaniu kartki, którą chce wysłać
                                select: ["lc.id as id"],
                                where: "us.userId =" + fromUserId + " AND lc.count > 0 AND us.isFinished = 0 AND lc.cardId=" + cardId
                            }, conn)
                            .then(function(data) {
                                if (data[0]) { // Jeśli jest w posiadaniu to wysyłamy
                                    store.get("`levelCards` lc", { // Patrzymy czy odbiorca wykonuje aktualnie level zawierający wysyłaną kartkę
                                        select: ["id"],
                                        where: "lc.cardId =" + cardId + " AND lc.userLevelId = (SELECT id FROM userLevels WHERE number > 0 AND isFinished = 0 AND userId = " + toUserId + ")"
                                    }, conn)
                                    .then(function(data1) {
                                        if (data1[0]) { // Jeśli jest taki level to: 
                                            store.custom_query("UPDATE `levelCards` SET count = count + 1 WHERE id = " + data1[0].id, conn) //zwiększamy liczbę wysyłanej kartki w posiadaniu odbiorcy o 1
                                            .then(function(){
                                                store.get("`userLevels`", { // Bierzemy sobie level, który aktualnie wykonuje odbiorca
                                                    select: ["id, number"],
                                                    where: "isFinished = 0 AND number > 0 AND userId = " + toUserId
                                                }, conn)
                                                .then(function(userLevel) { // Bierzemy wszystkie kartki z tego levelu
                                                    store.get("`levelCards` lc", {
                                                        select: ["lc.id, lc.count"],
                                                        where: "lc.userLevelId = (SELECT id from userlevels WHERE isFinished = 0 AND number > 0 AND userId = " + toUserId + ")" 
                                                    }, conn)
                                                    .then(function(cards) {
                                                        var isFinished = 1,
                                                            points = userLevel[0].number * 10,
                                                            userLevelId = userLevel[0].id;
                                                        number = userLevel[0].number;
                                                            
                                                        for (var i = 0; i < cards.length; i++) {
                                                            if (cards[i].count < 1) {
                                                                isFinished = 0;
                                                            }
                                                        }
                                                        if (isFinished) { // Jeśli po otrzymaniu kartki level zostaje ukończony to:
                                                            level_finished = true;
                                                            Promise.all([
                                                                store.custom_query("UPDATE `users` SET rank = rank + " + points + " WHERE id = " + toUserId, conn), // Dajemy punkty za ukończenie levelu
                                                                store.get("`levelCards` lc JOIN `userlevels` ul ON lc.userLevelId = ul.id", { // Bierzemy kartki, które z ukończonego levelu trzeba przenieść do schowka
                                                                    select: ["lc.cardId as id, (lc.count - 1) as count"],
                                                                    where: "ul.isFinished = 0 AND ul.number > 0 AND lc.count > 1 AND ul.userId = " + toUserId
                                                                }, conn)
                                                            ])                                                        
                                                            .then(function(responses) {
                                                                cards_to_schowek = responses[1];
                                                                store.update("`userlevels`", { // Oznaczamy level jako zakończony
                                                                    set: {
                                                                        isFinished: 1
                                                                    },
                                                                    where: "number > 0 AND isFinished = 0 AND userId = " + toUserId
                                                                }, conn)
                                                                .then(function() {
                                                                    if (cards_to_schowek.length > 0) { // Jeśli są jakieś kartki, które należy przenieść do schowka to przenosimy
                                                                        var counter = 0;
                                                                        for (var i = 0; i < cards_to_schowek.length; i++) {
                                                                            var query_ = "SELECT distinct counter, (case when (cardId = " + cards_to_schowek[i].id +
                                                                            " AND userLevelId = (SELECT id FROM userLevels WHERE isFinished = 0 AND number = 0 AND userId = " + toUserId +
                                                                            " )) then id else 0 end) as id from (SELECT '" + i + "' as counter, id, cardId, userLevelId FROM `levelCards` lc) x";
                                                                            store.custom_query(query_, conn)
                                                                            .then(function(data3) {
                                                                                var counter_ = data3[0].counter;
                                                                                if (data3[0].id > 0) { // Jeśli dana kartka jest już w schowku odbiorcy to zwiększamy jej ilość
                                                                                    store.custom_query("UPDATE `levelCards` SET count = count + " + cards_to_schowek[counter_].count + " WHERE id = " + data3[0].id, conn)
                                                                                    .then(function() {
                                                                                        counter++;
                                                                                        if (counter == cards_to_schowek.length - 1) {
                                                                                            conn.commit(function(err) {
                                                                                                if (err) {
                                                                                                    conn.end();
                                                                                                    return conn.rollback(function() {
                                                                                                        reply().header('api-message', 'Rollback on commit: ' +err).code(500);
                                                                                                    });
                                                                                                } else {
                                                                                                    closed_conn_counter++;
                                                                                                    if (closed_conn_counter == 3) {
                                                                                                        server.app.pusher_obj.trigger('global', 'card-received',
                                                                                                        {
                                                                                                            "user_id" : toUserId,
                                                                                                            "message": "Kartka od " + fromUserLogin + " trafiła do poziomu " + number + "." 
                                                                                                        });
                                                                                                        setTimeout(function() {
                                                                                                            server.app.pusher_obj.trigger('global', 'level-finished',
                                                                                                            {
                                                                                                                "user_id" : toUserId,
                                                                                                                "message": "Level " + number + " został ukończony!" 
                                                                                                            });
                                                                                                        }, 3000);
                                                                                                        var conn10 = store.connection();
                                                                                                        conn10.connect(function(err) {
                                                                                                            if (err) {
                                                                                                                conn10.end();
                                                                                                                reply().header('api-message', 'Problem with database connection before request').code(500);
                                                                                                            } else {
                                                                                                                store.post("`notifications`", {
                                                                                                                    values: {
                                                                                                                        userId: toUserId,
                                                                                                                        message: "Kartka od " + fromUserLogin + " trafiła do poziomu " + number + "." 
                                                                                                                    }
                                                                                                                }, conn10)
                                                                                                                .then(function() {                                                                                                                        
                                                                                                                    store.post("`notifications`", { 
                                                                                                                        values: {
                                                                                                                            userId: toUserId,
                                                                                                                            message: "Level " + number + " został ukończony!"
                                                                                                                        }
                                                                                                                    }, conn10)
                                                                                                                    .then(function() {
                                                                                                                        conn10.commit(function(err) {
                                                                                                                            conn10.end();
                                                                                                                        });     
                                                                                                                    })                                                                                
                                                                                                                })
                                                                                                            }
                                                                                                        });
                                                                                                       reply().code(201);
                                                                                                    }                                                                                            
                                                                                                    conn.end();
                                                                                                }
                                                                                            });    
                                                                                        }                                                                              
                                                                                    })
                                                                                } else { // Jeśli kartki jeszcze nie ma w schowku odbiorcy to ją wkładamy
                                                                                    store.post("`levelCards`", {
                                                                                        values: {
                                                                                            userLevelId: "(SELECT id FROM userLevels WHERE isFinished = 0 AND number = 0 AND userId = " + toUserId + ")",
                                                                                            cardId: cards_to_schowek[counter_].id,
                                                                                            count: cards_to_schowek[counter_].count
                                                                                        }
                                                                                    }, conn)
                                                                                    .then(function() {
                                                                                        counter++;
                                                                                        if (counter == cards_to_schowek.length) {
                                                                                            conn.commit(function(err) {
                                                                                                if (err) {
                                                                                                    conn.end();
                                                                                                    return conn.rollback(function() {
                                                                                                        reply().header('api-message', 'Rollback on commit: ' +err).code(500);
                                                                                                    });
                                                                                                } else {
                                                                                                    closed_conn_counter++;
                                                                                                    if (closed_conn_counter == 3) {
                                                                                                        server.app.pusher_obj.trigger('global', 'card-received',
                                                                                                        {
                                                                                                            "user_id" : toUserId,
                                                                                                            "message": "Kartka od " + fromUserLogin + " trafiła do poziomu " + number + "." 
                                                                                                        });
                                                                                                        setTimeout(function() {
                                                                                                            server.app.pusher_obj.trigger('global', 'level-finished',
                                                                                                            {
                                                                                                                "user_id" : toUserId,
                                                                                                                "message": "Level " + number + " został ukończony!" 
                                                                                                            });
                                                                                                        }, 3000);
                                                                                                        var conn11 = store.connection();
                                                                                                        conn11.connect(function(err) {
                                                                                                            if (err) {
                                                                                                                conn11.end();
                                                                                                                reply().header('api-message', 'Problem with database connection before request').code(500);
                                                                                                            } else {
                                                                                                                store.post("`notifications`", {
                                                                                                                    values: {
                                                                                                                        userId: toUserId,
                                                                                                                        message: "Kartka od " + fromUserLogin + " trafiła do poziomu " + number + "." 
                                                                                                                    }
                                                                                                                }, conn11)
                                                                                                                .then(function() {                                                                                                                        
                                                                                                                    store.post("`notifications`", { 
                                                                                                                        values: {
                                                                                                                            userId: toUserId,
                                                                                                                            message: "Level " + number + " został ukończony!"
                                                                                                                        }
                                                                                                                    }, conn11)
                                                                                                                    .then(function() {
                                                                                                                        conn11.commit(function(err) {
                                                                                                                            conn11.end();
                                                                                                                        });     
                                                                                                                    })                                                                                
                                                                                                                })
                                                                                                            }
                                                                                                        });
                                                                                                       reply().code(201);
                                                                                                    }     
                                                                                                    conn.end();
                                                                                                }
                                                                                            });    
                                                                                        }      
                                                                                    })
                                                                                }
                                                                            })
                                                                        }
                                                                    } else {
                                                                        closed_conn_counter++;
                                                                    }
                                                                    var cardSetIds_list = level_number_to_cardSetId[number + 1]; // Losujemy zestaw kartek dla nowego poziomu
                                                                    var cardSetId = cardSetIds_list[Math.floor(Math.random()*cardSetIds_list.length)];
                                                                    var conn3 = store.connection();
                                                                    conn3.connect(function(err) {
                                                                        if (err) {
                                                                            conn3.end();
                                                                            reply().header('api-message', 'Problem with database connection before request').code(500);
                                                                        } else {
                                                                            store.post("`userLevels`", { // Tworzymy nowy poziom
                                                                                values: {
                                                                                    userId: toUserId,
                                                                                    number: number + 1,
                                                                                    cardSetId: cardSetId,
                                                                                    isFinished: 0
                                                                                }
                                                                            }, conn3)
                                                                            .then(function (userlevel) {
                                                                                store.get("`cards` c JOIN `cardSets` cs ON c.cardSetId = cs.id", { // Bierzemy wszystkie kartki z wylosowanego zestawu
                                                                                    select: ["c.id"],
                                                                                    where: "cs.id = " + cardSetId
                                                                                }, conn3)
                                                                                .then(function(new_cards) {
                                                                                    var ids = new_cards.map(function(e) {return e.id}).sort(),
                                                                                        min = ids[0],
                                                                                        which = Math.floor(Math.random() * (number + 2)) + min;
                                                                                    var all_inserted = 0;
                                                                                    for (var j = 0; j < new_cards.length; j++) {
                                                                                        store.post("`levelCards`", { // Wsadzamy wszystkie kartki do nowego levelu
                                                                                            values: {
                                                                                                userLevelId: userlevel.insertId,
                                                                                                cardId: new_cards[j].id,
                                                                                                count: new_cards[j].id == which ? number + 2 : 0
                                                                                            }
                                                                                        }, conn3)
                                                                                        .then(function() {
                                                                                            all_inserted++;
                                                                                            if (all_inserted == new_cards.length) {
                                                                                                conn3.commit(function(err) {
                                                                                                    if (err) {
                                                                                                        conn3.end();
                                                                                                        return conn3.rollback(function() {
                                                                                                            reply().header('api-message', 'Rollback on commit: ' +err).code(500);
                                                                                                        });
                                                                                                    } else {
                                                                                                        closed_conn_counter++;
                                                                                                        if (closed_conn_counter == 3) {
                                                                                                            server.app.pusher_obj.trigger('global', 'card-received',
                                                                                                            {
                                                                                                                "user_id" : toUserId,
                                                                                                                "message": "Kartka od " + fromUserLogin + " trafiła do poziomu " + number + "." 
                                                                                                            });
                                                                                                            setTimeout(function() {
                                                                                                                server.app.pusher_obj.trigger('global', 'level-finished',
                                                                                                                {
                                                                                                                    "user_id" : toUserId,
                                                                                                                    "message": "Level " + number + " został ukończony!" 
                                                                                                                });
                                                                                                            }, 3000);
                                                                                                            var conn9 = store.connection();
                                                                                                            conn9.connect(function(err) {
                                                                                                                if (err) {
                                                                                                                    conn9.end();
                                                                                                                    reply().header('api-message', 'Problem with database connection before request').code(500);
                                                                                                                } else {
                                                                                                                    store.post("`notifications`", {
                                                                                                                        values: {
                                                                                                                            userId: toUserId,
                                                                                                                            message: "Kartka od " + fromUserLogin + " trafiła do poziomu " + number + "." 
                                                                                                                        }
                                                                                                                    }, conn9)
                                                                                                                    .then(function() {                                                                                                                        
                                                                                                                        store.post("`notifications`", { 
                                                                                                                            values: {
                                                                                                                                userId: toUserId,
                                                                                                                                message: "Level " + number + " został ukończony!"
                                                                                                                            }
                                                                                                                        }, conn9)
                                                                                                                        .then(function() {
                                                                                                                            conn9.commit(function(err) {
                                                                                                                                conn9.end();
                                                                                                                            });     
                                                                                                                        })                                                                                
                                                                                                                    })
                                                                                                                }
                                                                                                            });
                                                                                                           reply().code(201);
                                                                                                        }
                                                                                                        conn3.end();
                                                                                                    }
                                                                                                });
                                                                                            }                                                                            
                                                                                        })
                                                                                    }
                                                                                })
                                                                            })
                                                                        }
                                                                    })
                                                                })
                                                            })
                                                        } else {
                                                            to_store = 1;
                                                            conn.commit(function(err) {
                                                                if (err) {
                                                                    conn.end();
                                                                    return conn.rollback(function() {
                                                                        reply().header('api-message', 'Rollback on commit: ' +err).code(500);
                                                                    });
                                                                } else {
                                                                    closed_conn_counter++;
                                                                    if (closed_conn_counter == 2) {
                                                                        server.app.pusher_obj.trigger('global', 'card-received',
                                                                        {
                                                                            "user_id" : toUserId,
                                                                            "message": "Kartka od " + fromUserLogin + " trafiła do poziomu " + number + "." 
                                                                        });
                                                                        var conn8 = store.connection();
                                                                        conn8.connect(function(err) {
                                                                            if (err) {
                                                                                conn8.end();
                                                                                reply().header('api-message', 'Problem with database connection before request').code(500);
                                                                            } else {
                                                                                store.post("`notifications`", {
                                                                                    values: {
                                                                                        userId: toUserId,
                                                                                        message: "Kartka od " + fromUserLogin + " trafiła do poziomu " + number + "." 
                                                                                    }
                                                                                }, conn8)
                                                                                .then(function() {
                                                                                    conn8.commit(function(err) {
                                                                                        conn8.end();
                                                                                    });
                                                                                })                                                                            
                                                                            }
                                                                        });
                                                                       reply().code(201);
                                                                    }                                                                                            
                                                                    conn.end();
                                                                }
                                                            });
                                                        }
                                                    })
                                                })
                                            })
                                            .error(function(e) {
                                                return conn.rollback(function() {
                                                    conn.end();
                                                    reply().header('api-message', 'Database request error: '+e).code(400);
                                                });
                                            });    
                                        } else { // Jeśli odbiorca nie gra teraz levelu z wysyłaną kartką to wsadzamy mu tą kartkę do schowka
                                            in_store = true;
                                            to_store = 1;
                                            store.get("`levelCards` lc", { // Patrzymy czy w schowku odbiorcy jest już wysyłana kartka
                                                select: ["id"],
                                                where: " lc.cardId =" + cardId + " AND lc.userLevelId = (SELECT id FROM userLevels WHERE isFinished = 0 AND number = 0 AND userId = " + toUserId + ")"
                                            }, conn)
                                            .then(function(data2) {
                                                if (data2[0]) { // Jeśli jest taka kartka to zwiększamy jej ilość o 1
                                                    store.custom_query("UPDATE `levelCards` SET count = count + 1 WHERE id = " + data2[0].id, conn)
                                                    .then(function() {
                                                        conn.commit(function(err) {
                                                            if (err) {
                                                                conn.end();
                                                                return conn.rollback(function() {
                                                                    reply().header('api-message', 'Rollback on commit: ' +err).code(500);
                                                                });
                                                            } else {
                                                                closed_conn_counter++;
                                                                if (closed_conn_counter == 2) {
                                                                    server.app.pusher_obj.trigger('global', 'card-received',
                                                                    {
                                                                        "user_id" : toUserId,
                                                                        "message": "Kartka od " + fromUserLogin + " trafiła do schowka." 
                                                                    });
                                                                    var conn7 = store.connection();
                                                                    conn7.connect(function(err) {
                                                                        if (err) {
                                                                            conn7.end();
                                                                            reply().header('api-message', 'Problem with database connection before request').code(500);
                                                                        } else {
                                                                            store.post("`notifications`", {
                                                                                values: {
                                                                                    userId: toUserId,
                                                                                    message: "Kartka od " + fromUserLogin + " trafiła do schowka." 
                                                                                }
                                                                            }, conn7)
                                                                            .then(function() {
                                                                                conn7.commit(function(err) {
                                                                                    conn7.end();
                                                                                });
                                                                            })                                                                            
                                                                        }
                                                                    });
                                                                    reply().code(201);
                                                                }
                                                                conn.end();
                                                            }
                                                        });     
                                                    })
                                                } else {  // Jeśli w schowku odbiorcy jeszcze nie ma tej kartki to ją wsadzamy                                          
                                                    store.post("`levelCards`", {
                                                        values: {
                                                            userLevelId: "(SELECT id FROM userLevels WHERE isFinished = 0 AND number = 0 AND userId = " + toUserId + ")",
                                                            cardId: cardId,
                                                            count: 1
                                                        }
                                                    }, conn)
                                                    .then(function() {
                                                        conn.commit(function(err) {
                                                            if (err) {
                                                                conn.end();
                                                                return conn.rollback(function() {
                                                                    reply().header('api-message', 'Rollback on commit: ' +err).code(500);
                                                                });
                                                            } else {
                                                                closed_conn_counter++;
                                                                if (closed_conn_counter == 2) {
                                                                    server.app.pusher_obj.trigger('global', 'card-received',
                                                                    {
                                                                        "user_id" : toUserId,
                                                                        "message": "Kartka od " + fromUserLogin + " trafiła do schowka." 
                                                                    });
                                                                    var conn6 = store.connection();
                                                                    conn6.connect(function(err) {
                                                                        if (err) {
                                                                            conn6.end();
                                                                            reply().header('api-message', 'Problem with database connection before request').code(500);
                                                                        } else {
                                                                            store.post("`notifications`", {
                                                                                values: {
                                                                                    userId: toUserId,
                                                                                    message: "Kartka od " + fromUserLogin + " trafiła do schowka." 
                                                                                }
                                                                            }, conn6)
                                                                            .then(function() {
                                                                                conn6.commit(function(err) {
                                                                                    conn6.end();
                                                                                });
                                                                            })                                                                            
                                                                        }
                                                                    });
                                                                   reply().code(201);
                                                                }
                                                                conn.end();
                                                            }
                                                        });       
                                                    })
                                                }
                                            })
                                            .error(function(e) {
                                                return conn.rollback(function() {
                                                    conn.end();
                                                    reply().header('api-message', 'Database request error: '+e).code(400);
                                                });
                                            });    
                                        }
                                        var conn2 = store.connection();
                                        conn2.connect(function(err) {
                                            if (err) {
                                                conn2.end();
                                                reply().header('api-message', 'Problem with database connection before request').code(500);
                                            } else {
                                                Promise.all([
                                                    store.custom_query("UPDATE `levelCards` SET count = count - 1 WHERE id = " + data[0].id, conn2), // Zabieramy wysyłaną kartkę nadawcy
                                                    store.custom_query("UPDATE `users` SET rank = rank + 1 WHERE id = " + toUserId, conn2) // Zwiększamy ranking odbiorcy o 1 (za otrzymanie kartki)
                                                ])
                                                .then(function() {
                                                    conn2.commit(function(err) {
                                                        if (err) {
                                                            conn2.end();
                                                            return conn2.rollback(function() {
                                                                reply().header('api-message', 'Rollback on commit: ' +err).code(500);
                                                            });
                                                        } else {
                                                            closed_conn_counter++;
                                                            if ((to_store == 1 && closed_conn_counter == 2) || (to_store == 0 &&  closed_conn_counter == 3)) {
                                                                var received_message = in_store ? "Kartka od " + fromUserLogin + " trafiła do schowka." : "Kartka od " + fromUserLogin + " trafiła do poziomu " + number + "."; 
                                                                server.app.pusher_obj.trigger('global', 'card-received',
                                                                {
                                                                    "user_id" : toUserId,
                                                                    "message": received_message
                                                                });
                                                                if (level_finished) {
                                                                    setTimeout(function() {
                                                                        server.app.pusher_obj.trigger('global', 'level-finished',
                                                                        {
                                                                            "user_id" : toUserId,
                                                                            "message": "Level " + number + " został ukończony!" 
                                                                        });
                                                                    }, 3000);
                                                                }
                                                                var conn5 = store.connection();
                                                                conn5.connect(function(err) {
                                                                    if (err) {
                                                                        conn5.end();
                                                                        reply().header('api-message', 'Problem with database connection before request').code(500);
                                                                    } else {
                                                                        store.post("`notifications`", {
                                                                            values: {
                                                                                userId: toUserId,
                                                                                message: received_message
                                                                            }
                                                                        }, conn5)
                                                                        .then(function() {
                                                                            if (level_finished) {
                                                                                store.post("`notifications`", { 
                                                                                    values: {
                                                                                        userId: toUserId,
                                                                                        message: "Level " + number + " został ukończony!" 
                                                                                    }
                                                                                }, conn5)
                                                                                .then(function() {
                                                                                    conn5.commit(function(err) {
                                                                                        conn5.end();
                                                                                    });     
                                                                                })                                                                                
                                                                            } else {
                                                                                conn5.commit(function(err) {
                                                                                    conn5.end();
                                                                                });
                                                                            }
                                                                        })
                                                                    }
                                                                });
                                                               reply().code(201);
                                                            }
                                                            conn2.end();
                                                        }
                                                    });     
                                                })
                                                .error(function(e) {
                                                    return conn2.rollback(function() {
                                                        conn2.end();
                                                        reply().header('api-message', 'Database request error: '+e).code(400);
                                                    });
                                                });
                                            }
                                         });
                                    })
                                    .error(function(e) {
                                        return conn.rollback(function() {
                                            conn.end();
                                            reply().header('api-message', 'Database request error: '+e).code(400);
                                        });
                                    });                                       
                                } else { // Jeśli nie jest w posiadaniu to nam przykro
                                    reply().header('api-message', 'Card does not belong to sender').code(401);
                                }
                            })
                            .error(function(e) {
                                reply().header('api-message', 'Database request error on user login:' + e).code(400);
                            });
                        }
                    });
                }
            });
        }
    }
});


server.start((err) => {
    if (err) {
        throw err;
    }

    /*
      Pusher server setup
    */
    server.app.pusher_obj = bootstrapChannels(pusher);
    console.log('Server running at:', server.info.uri);
});