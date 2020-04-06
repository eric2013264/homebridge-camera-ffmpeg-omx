# homebridge-camera-ffmpeg-omx

## Update
1. Homekit accessory fields such as serial number and manufacturer.
2. The ability to sustain the stream for >1-2 minutes.
3. Customizable options: Packetsize, bitrate, vcodec (default h264_omx).
3a. Stream resolution can be forced now, previously it would be checked against a recommended max and reduced.
4. Forced snapshots saved to Google Drive to be 1920x1080 instead of the requested snapshot resolution (640x480) in the image buffer

