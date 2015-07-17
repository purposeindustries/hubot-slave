# Mopidy config
```
[logging]
#color = true
#console_format = %(levelname)-8s %(message)s
#debug_format = %(levelname)-8s %(asctime)s [%(process)d:%(threadName)s] %(name)s\n  %(message)s
#debug_file = mopidy.log
#config_file =


[audio]
mixer = software
#mixer_volume =
output = autoaudiosink

[proxy]
#scheme =
#hostname =
#port =
#username =
#password =

[http]
enabled = true
hostname = 127.0.0.1
port = 6680
static_dir =
zeroconf = Mopidy HTTP server on $hostname

[softwaremixer]
enabled = true

[soundcloud]
auth_token = <token>
explore_songs = 25

[stream]
enabled = true
protocols =
    file
    http
    https
    mms
    rtmp
    rtmps
    rtsp
timeout = 5000
metadata_blacklist =
```
