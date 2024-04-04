import '@tensorflow/tfjs-backend-webgl'
import '@mediapipe/pose'

import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs-core'

class PoseDetector {
  constructor({ flipHorizontal = true, cameraWidth = 640, cameraHeight = 480 } = {}) {
    this.isWebcamLoaded = false
    this.isDetectorLoaded = false
    this.webcam = null
    this.detector = null
    this.flipHorizontal = flipHorizontal
    this.cameraWidth = cameraWidth
    this.cameraHeight = cameraHeight

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
      .size(this.cameraWidth, this.cameraHeight)
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
          const camelCaseName = toCamelCase(kp.name)
          if (kp.score > 0.8) {
            const scaledX = kp.x * (width / this.cameraWidth)
            const scaledY = kp.y * (height / this.cameraHeight)
            this[camelCaseName] = {
              x: this.flipHorizontal ? width - scaledX : scaledX,
              y: scaledY,
              score: kp.score,
            }
          } else {
            this[camelCaseName] = null
          }
        })

        // Calcula neckBase si ambos hombros están disponibles
        if (this['leftShoulder'] && this['rightShoulder']) {
          this.neckBase = {
            x: (this['leftShoulder'].x + this['rightShoulder'].x) / 2,
            y: (this['leftShoulder'].y + this['rightShoulder'].y) / 2,
          }
        } else {
          delete this.neckBase
        }

        // Calcula pelvis si ambas caderas están disponibles
        if (this['leftHip'] && this['rightHip']) {
          this.pelvis = {
            x: (this['leftHip'].x + this['rightHip'].x) / 2,
            y: (this['leftHip'].y + this['rightHip'].y) / 2,
          }
        } else {
          delete this.pelvis
        }
      }

      tf.dispose(poses)
      requestAnimationFrame(this.detectPose.bind(this))
    } catch (error) {
      console.error('Error detecting pose:', error)
    }
  }

  distanceBetween(name1, name2) {
    let p1 = this[name1]
    let p2 = this[name2]
    if (!p1 || !p2) return 0
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
  }

  directionBetween(name1, name2) {
    let p1 = this[name1]
    let p2 = this[name2]
    if (!p1 || !p2) return 0
    let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
    console.log(angle)
    return map(angle, -Math.PI / 2, Math.PI / 2, -1, 1)
  }
}

function toCamelCase(s) {
  return s.replace(/(_\w)/g, (m) => m[1].toUpperCase())
}

window.PoseDetector = PoseDetector
