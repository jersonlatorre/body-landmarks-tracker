# Body Landmarks Tracker

A library compatible with p5.js for body pose detection.

## Variables

- `nose`
- `leftEyeInner`, `leftEye`, `leftEyeOuter`
- `rightEyeInner`, `rightEye`, `rightEyeOuter`
- `leftEar`, `rightEar`
- `leftMouth`, `rightMouth`
- `leftShoulder`, `rightShoulder`
- `leftElbow`, `rightElbow`
- `leftWrist`, `rightWrist`
- `leftPinky`, `rightPinky`
- `leftIndex`, `rightIndex`
- `leftThumb`, `rightThumb`
- `leftHip`, `rightHip`
- `leftKnee`, `rightKnee`
- `leftAnkle`, `rightAnkle`
- `leftHeel`, `rightHeel`
- `leftFootIndex`, `rightFootIndex`
- `neckBase`, `pelvis`, `mouth`
- `landmarks`: Array containing all the landmarks.

## Methods

- `createBodyTracker()`: Creates a new body tracker. This method will create a button to start tracking.
- `drawLandmarks()`: Visualizes the detected body landmarks on the canvas.
- `drawVideo(x = 0, y = 0, w = width, h = height)`: Draws the video feed on the canvas. Can be customized with position and size.
- `distanceBetween(p1, p2)`: Returns the Euclidean distance between landmarks `p1` and `p2`.
- `directionBetween(p1, p2)`: Returns the direction angle formed by landmarks `p1` and `p2`, normalized to the range of -1 to 1.
- `drawImageBetween(img, p1, p2)`: Draws an image stretched between landmarks `p1` and `p2`, aligning it with the line connecting these points.

## Notes

- Compatible with Node.js version 16.x.
- Use `npm install` for installing dependencies (avoid using `yarn` or `pnpm`).
