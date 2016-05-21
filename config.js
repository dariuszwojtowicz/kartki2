module.exports = {
  server : {
    port: 3000,
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
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "karteczki_db"
  }
};