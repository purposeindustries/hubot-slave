var me = (process.env.MY_NAME || require('sillyname')()); //.replace(/\s/gm, '-');
console.log('me is %s', me);
var mqtt    = require('mqtt');
var spawn = require('child_process').spawn;
var officeRoom = process.env.OFFICE_ROOM || 'colabs';
var client  = mqtt.connect(process.env.HUBOT_URL || 'ws://localhost:8080/master');
var Mopidy = require('mopidy');
var noop = function() {};
var mopidy = new Mopidy({
  webSocketUrl: process.env.MOPIDY_URL || 'ws://localhost:6680/mopidy/ws/',
  callingConvention: 'by-position-only',
  console: {
    log: noop,
    warn: noop,
    error: noop
  }
});
var request = require('request');
client.on('connect', function () {
  var data = JSON.stringify({
    name: me,
    officeRoom: officeRoom
  });
  client.publish('identify', data);
  var events = ['play', 'pause', 'next', 'clear'];

  events.forEach(function(evName) {
    client.subscribe([
      'device/' + me.toLowerCase() + '/' + evName,
      'office-room/' + officeRoom + '/' + evName
    ]);
  });
});

client.on('message', function (topic, buff) {
  var message;
  try {
    message = JSON.parse('' + buff);
  } catch(x) {
    console.error(x);
  }

  console.log('message', topic, message, '' + buff);
  if (~topic.indexOf('play')) {
    console.log('data', message);
    if (/youtu/.test(message.link)) {
      return play('yt:' + message.link);
    }
    if (/(soundcloud|sndcld)/.test(message.link)) {
      return playSC(message.link);
    }
  }

  if (~topic.indexOf('pause')) {
    console.log('pause')
    return pause();
  }

  if (~topic.indexOf('next')) {
    console.log('next');
    return next();
  }

  if (~topic.indexOf('clear')) {
    console.log('clear');
    return clear();
  }
});

function play(link) {
  return mopidy.tracklist.add(
    null,
    0,
    link
  ).done(function(data) {
    mopidy.playback.play();
  });
}

function pause() {
  mopidy.playback.pause();
}

function next() {
  mopidy.playback.next();
}

function clear() {
  mopidy.tracklist
    .clear();
}
function playSC(link) {
  request({
    url: 'https://api.soundcloud.com:443/resolve.json',
    qs: {
      url: link,
      client_id: process.env.SC_CLIENT_ID || '93e33e327fd8a9b77becd179652272e2'
    },
    json: true
  }, function(err, resp, body) {
    if (body && body.id) {
      play('soundcloud:song.' + body.id);
    }
  });
}
