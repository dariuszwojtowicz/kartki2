var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 't5g4s6sdf6df8df7df2df1d2fd6df4';

module.exports = new function() {
    this.encrypt = function(text){
        var cipher = crypto.createCipher(algorithm,password)
        var crypted = cipher.update(text,'utf8','hex')
        crypted += cipher.final('hex');
        return crypted;
    }
}