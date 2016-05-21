const testChannel = require('./testChannel.js');

module.exports = {
  bootstrap: (pusher) => {
    [testChannel].map((channel) => {
      channel(pusher);
    });
    return pusher;
  }
}