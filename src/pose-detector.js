import '@tensorflow/tfjs-backend-webgl'
import '@mediapipe/pose'

import * as bodySegmentation from '@tensorflow-models/body-segmentation'
import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs-core'

class PoseDetector {
  constructor({ flipHorizontal = true } = {}) {
    // constructor({ flipHorizontal = true, maskColorA = { r: 0, g: 0, b: 0, a: 255 }, maskColorB = { r: 0, g: 0, b: 0, a: 0 } } = {}) {
    this.isWebcamLoaded = false
    this.isDetectorLoaded = false
    this.pose = null
    // this.mask = null
    this.webcam = null
    this.detector = null

    this.flipHorizontal = flipHorizontal
    // this.maskColorA = maskColorA
    // this.maskColorB = maskColorB

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

  // drawMask(x = 0, y = 0, w = width, h = height) {
  //   push()
  //   if (this.flipHorizontal) {
  //     translate(width, 0)
  //     scale(-1, 1)
  //     image(this.mask, width - (x + w), y, w, h)
  //   } else {
  //     image(this.mask, x, y, w, h)
  //   }
  //   pop()
  // }

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
        this.pose = poses[0].keypoints.reduce((acc, kp) => {
          const camelCaseName = toCamelCase(kp.name)
          if (kp.score > 0.8) {
            acc[camelCaseName] = {
              x: this.flipHorizontal ? width - kp.x : kp.x,
              y: kp.y,
              score: kp.score,
            }
          } else {
            acc[camelCaseName] = null
          }
          return acc
        }, {})

        // const segmentation = poses[0].segmentation
        // if (segmentation) {
        //   const maskAux = await bodySegmentation.toBinaryMask(segmentation, this.maskColorA, this.maskColorB, false, 0.7)
        //   if (maskAux?.data.length > 0) {
        //     this.mask.clear()
        //     this.mask.loadPixels()
        //     this.mask.pixels.set(maskAux.data)
        //     this.mask.updatePixels()
        //   }
        // }
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
