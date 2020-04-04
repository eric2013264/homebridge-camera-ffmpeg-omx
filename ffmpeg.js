'use strict';
var uuid, Service, Characteristic, StreamController;

var crypto = require('crypto');
var fs = require('fs');
var ip = require('ip');
var spawn = require('child_process').spawn;

module.exports = {
  FFMPEG: FFMPEG
};

function FFMPEG(hap, cameraConfig) {
  uuid = hap.uuid;
  Service = hap.Service;
  Characteristic = hap.Characteristic;
  StreamController = hap.StreamController;

  var ffmpegOpt = cameraConfig.videoConfig;
  this.name = cameraConfig.name;
  if (!ffmpegOpt.source) {
    throw new Error("Missing source for camera.");
  }
  this.vcodec = ffmpegOpt.vcodec;
  this.ffmpegSource = ffmpegOpt.source;
  this.ffmpegImageSource = ffmpegOpt.stillImageSource;

  this.services = [];
  this.streamControllers = [];

  this.pendingSessions = {};
  this.ongoingSessions = {};

  var numberOfStreams = ffmpegOpt.maxStreams || 2;
  var videoResolutions = [];

  this.packetsize = ffmpegOpt.packetSize || 1317;
  this.maxBitrate = ffmpegOpt.maxBitrate || 300;
  this.debug = ffmpegOpt.debug;

  var maxWidth = ffmpegOpt.maxWidth;
  var maxHeight = ffmpegOpt.maxHeight;
  var maxFPS = (ffmpegOpt.maxFPS > 30) ? 30 : ffmpegOpt.maxFPS;

  if (maxWidth >= 320) {
    if (maxHeight >= 240) {
      videoResolutions.push([320, 240, maxFPS]);
      if (maxFPS > 15) {
        videoResolutions.push([320, 240, 15]);
      }
    }

    if (maxHeight >= 180) {
      videoResolutions.push([320, 180, maxFPS]);
      if (maxFPS > 15) {
        videoResolutions.push([320, 180, 15]);
      }
    }
  }

  if (maxWidth >= 480) {
    if (maxHeight >= 360) {
      videoResolutions.push([480, 360, maxFPS]);
    }

    if (maxHeight >= 270) {
      videoResolutions.push([480, 270, maxFPS]);
    }
  }

  if (maxWidth >= 640) {
    if (maxHeight >= 480) {
      videoResolutions.push([640, 480, maxFPS]);
    }

    if (maxHeight >= 360) {
      videoResolutions.push([640, 360, maxFPS]);
    }
  }

  if (maxWidth >= 1280) {
    if (maxHeight >= 960) {
      videoResolutions.push([1280, 960, maxFPS]);
    }

    if (maxHeight >= 720) {
      videoResolutions.push([1280, 720, maxFPS]);
    }
  }

  if (maxWidth >= 1920) {
    if (maxHeight >= 1080) {
      videoResolutions.push([1920, 1080, maxFPS]);
    }
  }

  let options = {
    proxy: false, // Requires RTP/RTCP MUX Proxy
    srtp: true, // Supports SRTP AES_CM_128_HMAC_SHA1_80 encryption
    video: {
      resolutions: videoResolutions,
      codec: {
        profiles: [0, 1, 2], // Enum, please refer StreamController.VideoCodecParamProfileIDTypes
        levels: [0, 1, 2] // Enum, please refer StreamController.VideoCodecParamLevelTypes
      }
    },
    audio: {
      codecs: [
        {
          type: "OPUS", // Audio Codec
          samplerate: 24 // 8, 16, 24 KHz
        },
        {
          type: "AAC-eld",
          samplerate: 16
        }
      ]
    }
  }

  this.createCameraControlService();
  this._createStreamControllers(numberOfStreams, options);
}

FFMPEG.prototype.handleCloseConnection = function(connectionID) {
  this.streamControllers.forEach(function(controller) {
    controller.handleCloseConnection(connectionID);
  });
}

FFMPEG.prototype.handleSnapshotRequest = function(request, callback) {
  let resolution = request.width + 'x' + request.height;
  var imageSource = this.ffmpegImageSource !== undefined ? this.ffmpegImageSource : this.ffmpegSource;
  let ffmpeg = spawn('ffmpeg', (imageSource + ' -t 1 -s '+ resolution + ' -f image2 -').split(' '), {env: process.env});
  console.log("Snapshot from " + this.name + " at " + resolution);
  var imageBuffer = Buffer.alloc(0);
  ffmpeg.stdout.on('data', function(data) {
    imageBuffer = Buffer.concat([imageBuffer, data]);
  });
  ffmpeg.on('close', function(code) {
    callback(undefined, imageBuffer);
  });
}

FFMPEG.prototype.prepareStream = function(request, callback) {
  var sessionInfo = {};

  let sessionID = request["sessionID"];
  let targetAddress = request["targetAddress"];

  sessionInfo["address"] = targetAddress;
  if (this.debug) {
    console.log("Preparing stream with session ID:" + uuid.unparse(sessionID) + " at " + targetAddress);
  }
  var response = {};

  let videoInfo = request["video"];
  if (videoInfo) {
    let targetPort = videoInfo["port"];
    let srtp_key = videoInfo["srtp_key"];
    let srtp_salt = videoInfo["srtp_salt"];

    // SSRC is a 32 bit integer that is unique per stream
    let ssrcSource = crypto.randomBytes(4);
    ssrcSource[0] = 0;
    let ssrc = ssrcSource.readInt32BE(0, true);

    let videoResp = {
      port: targetPort,
      ssrc: ssrc,
      srtp_key: srtp_key,
      srtp_salt: srtp_salt
    };

    response["video"] = videoResp;

    sessionInfo["video_port"] = targetPort;
    sessionInfo["video_srtp"] = Buffer.concat([srtp_key, srtp_salt]);
    sessionInfo["video_ssrc"] = ssrc;
  }

  let audioInfo = request["audio"];
  if (audioInfo) {
    let targetPort = audioInfo["port"];
    let srtp_key = audioInfo["srtp_key"];
    let srtp_salt = audioInfo["srtp_salt"];

    // SSRC is a 32 bit integer that is unique per stream
    let ssrcSource = crypto.randomBytes(4);
    ssrcSource[0] = 0;
    let ssrc = ssrcSource.readInt32BE(0, true);

    let audioResp = {
      port: targetPort,
      ssrc: ssrc,
      srtp_key: srtp_key,
      srtp_salt: srtp_salt
    };

    response["audio"] = audioResp;

    sessionInfo["audio_port"] = targetPort;
    sessionInfo["audio_srtp"] = Buffer.concat([srtp_key, srtp_salt]);
    sessionInfo["audio_ssrc"] = ssrc;
  }

  let currentAddress = ip.address(this.interfaceName);
  var addressResp = {
    address: currentAddress
  };

  if (ip.isV4Format(currentAddress)) {
    addressResp["type"] = "v4";
  } else {
    addressResp["type"] = "v6";
  }

  response["address"] = addressResp;
  this.pendingSessions[uuid.unparse(sessionID)] = sessionInfo;

  callback(response);
}

FFMPEG.prototype.handleStreamRequest = function(request) {
  var sessionID = request["sessionID"];
  var requestType = request["type"];

  if (sessionID) {
    let sessionIdentifier = uuid.unparse(sessionID);
    if (requestType == "start") {
      var sessionInfo = this.pendingSessions[sessionIdentifier];
      if (sessionInfo) {
        var width = 1280;
        var height = 720;
        var fps = 30;
        var bitrate = 300;
        var vcodec = this.vcodec || "h264_omx";
        var packetsize = this.packetsize || 1316; // 188 * 7
        var bitrate = this.maxBitrate;

        let videoInfo = request["video"];
        if (videoInfo) {
          width = videoInfo["width"];
          height = videoInfo["height"];

          let expectedFPS = videoInfo["fps"];
          if (expectedFPS < fps) {
            fps = expectedFPS;
          }

          if (videoInfo["max_bit_rate"] < bitrate) {
            bitrate = videoInfo["max_bit_rate"];
          }
        }

        let targetAddress = sessionInfo["address"];
        let targetVideoPort = sessionInfo["video_port"];
        let videoKey = sessionInfo["video_srtp"];
        let videoSsrc = sessionInfo["video_ssrc"];
        if (this.debug) {
	  console.log("Started stream with session ID: " +  uuid.unparse(sessionID) + " at " + targetAddress);
        }
        let ffmpegCommand = this.ffmpegSource + ' -threads 0 -vcodec ' + vcodec + ' -an -pix_fmt yuv420p -r '+ fps +' -f rawvideo -tune zerolatency -vf scale='+ width +':'+ height +' -b:v '+ bitrate +'k -bufsize '+ bitrate +'k -payload_type 99 -ssrc ' + videoSsrc + ' -f rtp -srtp_out_suite AES_CM_128_HMAC_SHA1_80 -srtp_out_params '+videoKey.toString('base64')+' srtp://'+targetAddress+':'+targetVideoPort+'?rtcpport='+targetVideoPort+'&localrtcpport='+targetVideoPort+'&pkt_size=' + packetsize;
        //console.log(ffmpegCommand);
        console.log("Started streaming video from " + this.name + " with " + width + "x" + height + "@" + bitrate + "kBit|" + fps + "fps|packet size:" + packetsize + " to " + sessionInfo["address"]);

        let ffmpeg = spawn('ffmpeg', ffmpegCommand.split(' '), {env: process.env});
        // needed or else stream closes within 1-2 minutes
        ffmpeg.stderr.on('data', function(data) {
          // Do not log to the console if debugging is turned off
          if(this.debug){
            console.log(data.toString());
          }
        }.bind(this));
        ffmpeg.on('error', function(error){
            console.log("An error occurs while making stream request");
        });
        ffmpeg.on('close', (code) => {
          if(code == null || code == 0 || code == 255){
            console.log("Stream closed");
          } else {
            console.log("ERROR: FFmpeg exited with code " + code);
            //console.log(ffmpeg.stderr);
            for(var i=0; i < this.streamControllers.length; i++){		            //console.log(ffmpeg.stderr);
              var controller = this.streamControllers[i];
              if(controller.sessionIdentifier === sessionID){
                controller.forceStop();
              }
            }
          }
        });
        this.ongoingSessions[sessionIdentifier] = ffmpeg;
      }

      delete this.pendingSessions[sessionIdentifier];
    } else if (requestType == "stop") {
      var ffmpegProcess = this.ongoingSessions[sessionIdentifier];
      if (ffmpegProcess) {
        ffmpegProcess.kill('SIGTERM');
      }

      delete this.ongoingSessions[sessionIdentifier];
      console.log("Stream ended");
    }
  }
}

FFMPEG.prototype.createCameraControlService = function() {
  var controlService = new Service.CameraControl();

  this.services.push(controlService);
}

// Private

FFMPEG.prototype._createStreamControllers = function(maxStreams, options) {
  let self = this;

  for (var i = 0; i < maxStreams; i++) {
    var streamController = new StreamController(i, options, self);

    self.services.push(streamController.service);
    self.streamControllers.push(streamController);
  }
}
