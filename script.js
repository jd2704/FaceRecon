const video = document.getElementById('video');
const captureButton = document.getElementById('capture-button');
const resultSection = document.getElementById('result-section');
const capturedImage = document.getElementById('captured-image');
const accountInfo = document.getElementById('account-info');

const accounts = [
    { name: "Alice", descriptors: [] }, // Example data
    { name: "Bob", descriptors: [] }
];

async function loadModels() {
    await faceapi.nets.faceDetectionNet.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
}

async function startVideo() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
    video.play();
}

function captureImage() {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    video.addEventListener('play', async () => {
        const detections = await faceapi.detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        if (resizedDetections.length > 0) {
            const faceDescriptor = resizedDetections[0].descriptor;
            const bestMatch = findBestMatch(faceDescriptor);
            displayResult(bestMatch);
        }
    });
}

function findBestMatch(faceDescriptor) {
    const labeledDescriptors = accounts.map(acc => new faceapi.LabeledFaceDescriptors(acc.name, acc.descriptors));
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
    return faceMatcher.findBestMatch(faceDescriptor);
}

function displayResult(bestMatch) {
    const name = bestMatch.label !== 'unknown' ? bestMatch.label : 'Unknown person';
    capturedImage.src = video.srcObject; // Placeholder, you should capture an image instead
    accountInfo.textContent = `Account: ${name}`;
    resultSection.style.display = 'block';
}

captureButton.addEventListener('click', captureImage);

loadModels().then(startVideo);
