const video = document.querySelector("#video");
let predictAge = [];

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("playing", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detection = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    const resizeDetection = faceapi.resizeResults(detection, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizeDetection);
    faceapi.draw.drawFaceLandmarks(canvas, resizeDetection);
    faceapi.draw.drawFaceExpressions(canvas, resizeDetection);
    // console.log(resizeDetection);

    const age = resizeDetection[0].age;
    const interpolatedAge = interpolatedAgePredictions(age);

    const bottomRight = {
      x: resizeDetection[0].detection.box.bottomRight.x - 50,
      y: resizeDetection[0].detection.box.bottomRight.y,
    };

    new faceapi.draw.DrawTextField(
      [`${faceapi.utils.round(interpolatedAge, 0)} years`],
      bottomRight
    ).draw(canvas);
    // console.log(interpolatedAge);
  }, 100);
});

function interpolatedAgePredictions(age) {
  predictAge = [age].concat(predictAge).slice(0, 30);

  const avgpredictedAge =
    predictAge.reduce((total, a) => total + a) / predictAge.length;

  return avgpredictedAge;
}
