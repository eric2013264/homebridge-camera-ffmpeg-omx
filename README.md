# homebridge-camera-ffmpeg-omx

ffmpeg plugin for [Homebridge](https://github.com/nfarina/homebridge). Optimized for Rapsberry Pi via GPU encoding.

## Update
Forked from legotheboss who forked it from Khaos.
legotheboss did a great job optimizing it for Raspberry Pi but Khaos has added features to it since.
1. Homekit accessory fields such as serial number and manufacturer
2. The ability to sustain the stream for >1-2 minutes
3. Customizable options: Packetsize, bitrate, vcodec (default h264_omx)

## Installation

1. Install ffmpeg on your Raspberry Pi.
    
    a. Download this package: `sudo wget goo.gl/gMGA81 -O ffmpeg.deb`
    
    b. Install this package: `sudo dpkg -i ffmpeg.deb`
    
    c. Ensure that the user you are running homebridge as has access to /dev/vchiq.  ie `sudo usermod -aG video login` where login is the user you are running homebridge as. 

2. Install this plugin using: npm install -g homebridge-camera-ffmpeg-omx
3. Edit ``config.json`` and add the camera.
3. Run Homebridge
4. Add extra camera accessories in Home app. The setup code is the same as homebridge.

### Config.json Example

    {
      "platform": "Camera-ffmpeg-omx",
      "cameras": [
        {
          "name": "Camera Name",
          "videoConfig": {
          	"source": "-re -i rtsp://myfancy_rtsp_stream",
            "stillImageSource": "-i http://faster_still_image_grab_url/this_is_optional.jpg",
          	"maxStreams": 2,
          	"maxWidth": 1280,
          	"maxHeight": 720,
          	"maxFPS": 30
          }
        }
      ]
    }
