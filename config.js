module.exports = {
  server : {
    routes: {
      cors:true
    }
  },
  pusher: {
    appId: '204655',
    key: '96a0e9e8773b126c9f44',
    secret: '8ecc3c937f79fa9d344c',
    cluster: 'eu',
    encrypted: true
  },
  db : {
    host: "eu-cdbr-west-01.cleardb.com",
    user: "b99d58c2f0291c",
    password: "a1eeba6f",
    database: "heroku_220b362afa84028"
  }
};