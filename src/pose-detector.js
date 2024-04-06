import '@tensorflow/tfjs-backend-webgl'
import '@mediapipe/pose'

import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs-core'

window.isInputVideoFlipped = null
window.inputVideo = null
window.nose = null
window.leftEyeInner = null
window.leftEye = null
window.leftEyeOuter = null
window.rightEyeInner = null
window.rightEye = null
window.rightEyeOuter = null
window.leftEar = null
window.rightEar = null
window.leftMouth = null
window.mouthLeft = null
window.rightMouth = null
window.mouthRight = null
window.leftShoulder = null
window.rightShoulder = null
window.leftElbow = null
window.rightElbow = null
window.leftWrist = null
window.rightWrist = null
window.leftPinky = null
window.rightPinky = null
window.leftIndex = null
window.rightIndex = null
window.leftThumb = null
window.rightThumb = null
window.leftHip = null
window.rightHip = null
window.leftKnee = null
window.rightKnee = null
window.leftAnkle = null
window.rightAnkle = null
window.leftHeel = null
window.rightHeel = null
window.leftFootIndex = null
window.rightFootIndex = null
window.neckBase = null
window.pelvis = null
window.mouth = null
window.keypoints = []
window.inputVideoUrl = null

class PoseDetector {
  constructor({ url = null, flip = true } = {}) {
    this.isVideoLoaded = false
    this.isDetectorLoaded = false
    this.detector = null

    isInputVideoFlipped = flip
    inputVideoUrl = url

    createButton('Start Capture')
      .position(10, 10)
      .mousePressed(() => {
        this.initResources()
      })
  }

  async initResources() {
    await tf.setBackend('webgl')
    await tf.ready()

    if (window.inputVideoUrl) {
      console.log('Loading video')
      inputVideo = createVideo(window.inputVideoUrl, () => {
        console.log('Video loaded')
        inputVideo.play()
        inputVideo.loop()
        inputVideo.volume(0)
        this.isVideoLoaded = true
        console.log('Video playing, starting detection')
        if (this.isDetectorLoaded) {
          this.startDetection()
        }
      }).hide()
    } else {
      console.log('Loading webcam')
      inputVideo = createCapture(VIDEO, () => {
        this.isVideoLoaded = true
        console.log('Webcam loaded')
        this.startDetection()
      }).hide()
    }

    poseDetection
      .createDetector(poseDetection.SupportedModels.BlazePose, {
        runtime: 'mediapipe',
        modelType: 'full',
        enableSegmentation: true,
        maxPoses: 1,
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose',
      })
      .then((det) => {
        this.detector = det
        this.isDetectorLoaded = true
        console.log('Detector loaded')
        this.startDetection()
      })
  }

  startDetection() {
    if (this.isVideoLoaded && this.isDetectorLoaded) {
      this.detectPose()
    }
  }

  async detectPose() {
    if (!this.isVideoLoaded || !this.isDetectorLoaded) return

    try {
      const poses = await this.detector.estimatePoses(inputVideo.elt, { enableSmoothing: true })
      if (poses.length > 0) {
        keypoints = []
        poses[0].keypoints.forEach((kp) => {
          let camelCaseName = toCamelCase(kp.name)
          if (kp.score > 0.7) {
            const scaleX = width / inputVideo.width
            const scaleY = height / inputVideo.height

            let adjustedX = kp.x * scaleX
            const adjustedY = kp.y * scaleY

            if (isInputVideoFlipped) {
              adjustedX = width - adjustedX
            }

            if (camelCaseName === 'mouthLeft') {
              camelCaseName = 'leftMouth'
            }

            if (camelCaseName === 'mouthRight') {
              camelCaseName = 'rightMouth'
            }

            window[camelCaseName] = {
              x: adjustedX,
              y: adjustedY,
            }

            keypoints.push({ x: adjustedX, y: adjustedY, name: camelCaseName })
          } else {
            window[camelCaseName] = null
          }
        })

        // calcula neckBase si ambos hombros están disponibles
        if (leftShoulder && rightShoulder) {
          neckBase = {
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2,
          }
          keypoints.push({ x: neckBase.x, y: neckBase.y, name: 'neckBase' })
        } else {
          neckBase = null
        }

        // calcula pelvis si ambas caderas están disponibles
        if (leftHip && rightHip) {
          pelvis = {
            x: (leftHip.x + rightHip.x) / 2,
            y: (leftHip.y + rightHip.y) / 2,
          }
          keypoints.push({ x: pelvis.x, y: pelvis.y, name: 'pelvis' })
        } else {
          pelvis = null
        }

        // calcula la boca si ambas mejillas están disponibles
        if (leftMouth && rightMouth) {
          mouth = {
            x: (leftMouth.x + rightMouth.x) / 2,
            y: (leftMouth.y + rightMouth.y) / 2,
          }
          keypoints.push({ x: mouth.x, y: mouth.y, name: 'mouth' })
        } else {
          mouth = null
        }
      }

      tf.dispose(poses)
      requestAnimationFrame(this.detectPose.bind(this))
    } catch (error) {
      console.error('Error detecting pose:', error)
    }
  }
}

function toCamelCase(s) {
  return s.replace(/(_\w)/g, (m) => m[1].toUpperCase())
}

window.drawVideo = (x = 0, y = 0, w = width, h = height) => {
  if (!inputVideo) return
  push()
  imageMode(CORNER)
  if (isInputVideoFlipped) {
    translate(width, 0)
    scale(-1, 1)
    image(inputVideo, width - (x + w), y, w, h)
  } else {
    image(inputVideo, x, y, w, h)
  }
  pop()
}

window.drawKeypoints = ({ size = 8, color = 'white' } = {}) => {
  if (!keypoints) return
  push()
  fill(color)
  noStroke()
  keypoints.forEach((k) => {
    if (
      k.name === 'leftEyeInner' ||
      k.name === 'leftEyeOuter' ||
      k.name === 'rightEyeInner' ||
      k.name === 'rightEyeOuter' ||
      k.name === 'leftMouth' ||
      k.name === 'rightMouth' ||
      k.name === 'leftPinky' ||
      k.name === 'rightPinky' ||
      k.name === 'leftThumb' ||
      k.name === 'rightThumb'
    ) {
    } else {
      circle(k.x, k.y, size)
    }
  })
  pop()
}

window.drawSkeleton = ({ thickness = 2, color = 'white' } = {}) => {
  if (!keypoints) return
  push()
  stroke(color)
  strokeWeight(thickness)
  noFill()
  line(neckBase?.x, neckBase?.y, mouth?.x, mouth?.y)
  line(leftShoulder?.x, leftShoulder?.y, rightShoulder?.x, rightShoulder?.y)
  line(leftShoulder?.x, leftShoulder?.y, leftElbow?.x, leftElbow?.y)
  line(rightShoulder?.x, rightShoulder?.y, rightElbow?.x, rightElbow?.y)
  line(leftElbow?.x, leftElbow?.y, leftWrist?.x, leftWrist?.y)
  line(rightElbow?.x, rightElbow?.y, rightWrist?.x, rightWrist?.y)
  line(leftShoulder?.x, leftShoulder?.y, leftHip?.x, leftHip?.y)
  line(rightShoulder?.x, rightShoulder?.y, rightHip?.x, rightHip?.y)
  line(leftHip?.x, leftHip?.y, leftKnee?.x, leftKnee?.y)
  line(rightHip?.x, rightHip?.y, rightKnee?.x, rightKnee?.y)
  line(leftHip?.x, leftHip?.y, rightHip?.x, rightHip?.y)
  line(leftKnee?.x, leftKnee?.y, leftAnkle?.x, leftAnkle?.y)
  line(leftAnkle?.x, leftAnkle?.y, leftHeel?.x, leftHeel?.y)
  line(rightAnkle?.x, rightAnkle?.y, rightHeel?.x, rightHeel?.y)
  line(leftHeel?.x, leftHeel?.y, leftFootIndex?.x, leftFootIndex?.y)
  line(rightHeel?.x, rightHeel?.y, rightFootIndex?.x, rightFootIndex?.y)
  line(rightKnee?.x, rightKnee?.y, rightAnkle?.x, rightAnkle?.y)
  line(leftWrist?.x, leftWrist?.y, leftIndex?.x, leftIndex?.y)
  line(rightWrist?.x, rightWrist?.y, rightIndex?.x, rightIndex?.y)
  line(mouth?.x, mouth?.y, nose?.x, nose?.y)
  line(nose?.x, nose?.y, leftEye?.x, leftEye?.y)
  line(nose?.x, nose?.y, rightEye?.x, rightEye?.y)
  line(leftEye?.x, leftEye?.y, leftEar?.x, leftEar?.y)
  line(rightEye?.x, rightEye?.y, rightEar?.x, rightEar?.y)
  pop()
}

window.createPoseDetector = ({ url = null, flip = null } = {}) => {
  flip = flip !== null ? flip : url ? false : true
  return new PoseDetector({ url, flip })
}

window.distanceBetween = (p1, p2) => {
  if (!p1 || !p2) return 0
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

window.directionBetween = (p1, p2) => {
  if (!p1 || !p2) return 0
  let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
  return map(angle, -Math.PI / 2, Math.PI / 2, -1, 1)
}
