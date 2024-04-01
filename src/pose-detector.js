import '@tensorflow/tfjs-backend-webgl'
import '@mediapipe/pose'

import * as bodySegmentation from '@tensorflow-models/body-segmentation'
import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs-core'

const keypointsNames = {
  0: 'nose',
  1: 'rightEyeInner',
  2: 'rightEye',
  3: 'rightEyeOuter',
  4: 'leftEyeInner',
  5: 'leftEye',
  6: 'leftEyeOuter',
  7: 'rightEar',
  8: 'leftEar',
  9: 'mouthRight',
  10: 'mouthLeft',
  11: 'rightShoulder',
  12: 'leftShoulder',
  13: 'rightElbow',
  14: 'leftElbow',
  15: 'rightWrist',
  16: 'leftWrist',
  17: 'rightPinky',
  18: 'leftPinky',
  19: 'rightIndex',
  20: 'leftIndex',
  21: 'rightThumb',
  22: 'leftThumb',
  23: 'rightHip',
  24: 'leftHip',
  25: 'rightKnee',
  26: 'leftKnee',
  27: 'rightAnkle',
  28: 'leftAnkle',
  29: 'rightHeel',
  30: 'leftHeel',
  31: 'rightFootIndex',
  32: 'leftFootIndex',
}

class PoseDetector {
  constructor({ flipHorizontal = true, maskColorA = { r: 0, g: 0, b: 0, a: 0 }, maskColorB = { r: 255, g: 255, b: 255, a: 255 } } = {}) {
    this.isWebcamLoaded = false
    this.isDetectorLoaded = false
    this.pose = null
    this.mask = null
    this.webcam = null
    this.detector = null

    this.flipHorizontal = flipHorizontal
    this.maskColorA = maskColorA
    this.maskColorB = maskColorB

    this.initResources()
  }

  async initResources() {
    await tf.setBackend('webgl')
    await tf.ready()
    this.webcam = createCapture(VIDEO, () => {
      this.isWebcamLoaded = true
      console.log('Webcam loaded')
      this.startDetection()
    })
    this.webcam.size(640, 480).hide()
    this.mask = createGraphics(320, 240)

    poseDetection
      .createDetector(poseDetection.SupportedModels.BlazePose, {
        runtime: 'tfjs',
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

  drawWebcam(x = 0, y = 0, w = width, h = height) {
    push()
    if (this.flipHorizontal) {
      translate(width, 0)
      scale(-1, 1)
      image(this.webcam, width - (x + w), y, w, h)
    } else {
      image(this.webcam, x, y, w, h)
    }
    pop()
  }

  drawMask(x = 0, y = 0, w = width, h = height) {
    push()
    if (this.flipHorizontal) {
      translate(width, 0)
      scale(-1, 1)
      image(this.mask, width - (x + w), y, w, h)
    } else {
      image(this.mask, x, y, w, h)
    }
    pop()
  }

  startDetection() {
    if (this.isWebcamLoaded && this.isDetectorLoaded) {
      this.detectPose()
    }
  }

  async detectPose() {
    if (!this.isWebcamLoaded || !this.isDetectorLoaded) return

    try {
      const poses = await this.detector.estimatePoses(this.webcam.elt, { enableSmoothing: true })
      if (poses.length > 0) {

        console.log(poses[0].keypoints)
        this.pose = poses[0].keypoints.reduce((acc, kp) => {
          if (kp.score > 0.8) {
            acc[kp.name] = kp
            if (this.flipHorizontal) acc[kp.name].x = width - kp.x
          }
          return acc
        }, {})


        const segmentation = poses[0].segmentation
        if (segmentation) {
          const maskAux = await bodySegmentation.toBinaryMask(segmentation, this.maskColorA, this.maskColorB, false, 0.5)
          if (maskAux?.data.length > 0) {
            this.mask.clear()
            this.mask.loadPixels()
            this.mask.pixels.set(maskAux.data)
            this.mask.updatePixels()
          }
        }
      }

      tf.dispose(poses)
      requestAnimationFrame(this.detectPose.bind(this))
    } catch (error) {
      console.error('Error detecting pose:', error)
    }
  }
}

window.PoseDetector = PoseDetector
