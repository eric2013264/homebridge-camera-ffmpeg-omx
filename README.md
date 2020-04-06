# homebridge-camera-ffmpeg-omx

[![npm](https://img.shields.io/npm/v/homebridge-camera-ffmpeg-omx?style=for-the-badge)](https://www.npmjs.com/package/homebridge-camera-ffmpeg-omx)
[![npm](https://img.shields.io/npm/dt/homebridge-camera-ffmpeg-omx?style=for-the-badge)](https://www.npmjs.com/package/homebridge-camera-ffmpeg-omx)
![npm](https://img.shields.io/npm/dw/homebridge-camera-ffmpeg-omx?style=for-the-badge)
![GitHub repo size](https://img.shields.io/github/repo-size/legotheboss/homebridge-camera-ffmpeg-omx?style=for-the-badge)

[![GitHub issues](https://img.shields.io/github/issues/legotheboss/homebridge-camera-ffmpeg-omx?style=for-the-badge)](https://github.com/legotheboss/homebridge-camera-ffmpeg-omx/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/legotheboss/homebridge-camera-ffmpeg-omx?style=for-the-badge)](https://github.com/legotheboss/homebridge-camera-ffmpeg-omx/pulls)

![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/legotheboss/homebridge-camera-ffmpeg-omx/master?style=for-the-badge)
![Known Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/legotheboss/homebridge-camera-ffmpeg-omx?style=for-the-badge)

![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/legotheboss/homebridge-camera-ffmpeg-omx/Node-CI/master?style=for-the-badge)

[![Donate](https://img.shields.io/badge/donate-paypal-green.svg?style=for-the-badge)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVFJTG8H86SK8&source=url)

## About
<p align="left">
  <img width="100" height="100" src="https://raw.githubusercontent.com/tonesto7/homebridge-smartthings-v2/master/images/hb_tonesto7.png">
    
Homebridge plugin for streaming a camera feed. Developed by KhaosT and optimized for the Raspberry Pi's GPU by legotheboss.

Here I'm adding certain features from KhaosT's newer version back to the Rasp Pi optimized version and tweaking a few features.

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
