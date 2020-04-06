# homebridge-camera-ffmpeg-omx

Homebridge plugin for streaming its camera feed developed by KhaosT and optimized for the Raspberry Pi's GPU by legotheboss.

Adding certain features back to optimized version that are present in KhaosT's newer versions.
Tweaking small things.

## Updates
1. Camera now has Homekit accessory fields such as serial number, manufacturer, and firmware version that can be modified from the config file.
2. The stream can be kept open indefinietly. Previously would end in 1-2 minutes.
3. Certain options are customizable from the config file again (taken out for optimization).
    - Packetsize, bitrate, vcodec, resolution (see below).

## Tweaks
1. Stream resolution can be forced now, previously it would be checked against a recommended max and reduced.
2. Snapshots saved to Google Drive are 1920x1080 instead of the requested snapshot resolution (640x480)

## Issues
- Under KhaosT's known issue #363: "it was identified that if the plugin/camera is slow to respond to the snapshot request, HomeKit will send the notification without the photo. Have not determined what the timeout is for the photo yet." So flipping the switch generated in the home app results in a blank black photo of size 0KB being stored to Google Drive. Not sure where this delay is supposed to go.
