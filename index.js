var me = (process.env.MY_NAME || require('sillyname')()); //.replace(/\s/gm, '-');
console.log('me is %s', me);
var mqtt = require('mqtt');
//var say = require('say');
var path = require('path');
var fs = require('fs');
var tmpdir = require('osenv').tmpdir;
var officeRoom = process.env.OFFICE_ROOM || 'colabs';
var client = mqtt.connect(process.env.HUBOT_URL || 'ws://localhost:8080/master');
var Mopidy = require('mopidy');
var cld = require('cld');
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
  var events = ['play', 'pause', 'next', 'clear', 'say'];

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

  if (~topic.indexOf('say')) {
    console.log('say');
    return say(message.text, message.lang);
  }
});

function play(link) {
  return mopidy.tracklist.setSingle(true)
    .done(function() {
      mopidy.tracklist
        .add(
          null,
          0,
          link
        ).done(function(data) {
          mopidy.playback.play();
        });
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

function say(what, lang) {
  if (lang == null) {
    return cld.detect(what, function(err, detection) {
      if (err) {
        console.error(err);
      }
      var lng = detection ? detection.languages[0].code : 'en';
      speak(what, lng);
    });
  }
  speak(what, lang);
}

function speak(what, lng) {
  var fileName = path.join(tmpdir(), Math.random().toString().slice(2, 12) + '.wav');
  console.log('fileanem=', fileName);
  request({
    url: 'http://translate.google.com/translate_tts',
    qs: {
      tl: lng,
      q: what
    },
    headers: {
      'User-Agent': 'Mozilla/5.0'
    },
    encoding: null
  }, function(err, resp, body) {
    //console.log(err, resp.headers, resp.statusCode);
  })
    .on('error', function(err) {
      console.error(err);
    })
    .on('end', function() {
      console.log('play', 'file://' + fileName)
      play('file://' + fileName);
    })
    .pipe(fs.createWriteStream(fileName));
}
