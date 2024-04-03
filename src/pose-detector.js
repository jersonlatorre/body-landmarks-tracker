import '@tensorflow/tfjs-backend-webgl'
import '@mediapipe/pose'

import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs-core'

class PoseDetector {
  constructor({ flipHorizontal = true } = {}) {
    this.isWebcamLoaded = false
    this.isDetectorLoaded = false
    this.webcam = null
    this.detector = null
    this.flipHorizontal = flipHorizontal

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
      .size(width, height)
      .hide()

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
        poses[0].keypoints.forEach((kp) => {
          if (kp.score > 0.8) {
            const camelCaseName = toCamelCase(kp.name)
            this[camelCaseName] = {
              x: this.flipHorizontal ? 640 - kp.x : kp.x,
              y: kp.y,
              score: kp.score,
            }
          }
        })
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

window.PoseDetector = PoseDetector
