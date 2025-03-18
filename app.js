/***********************************************************
 * 1) samll 3D Box (Splash Screen) - init3DSmallBox()
 ***********************************************************/
let sceneBox, cameraBox, rendererBox, rotatingBox;
function init3DSmallBox() {
  const canvas = document.getElementById('small3DCanvas');
  rendererBox = new THREE.WebGLRenderer({ canvas, alpha: true });
  rendererBox.setSize(canvas.clientWidth, canvas.clientHeight);
  rendererBox.setPixelRatio(window.devicePixelRatio);

  sceneBox = new THREE.Scene();
  cameraBox = new THREE.PerspectiveCamera(45, canvas.clientWidth/canvas.clientHeight, 0.1, 1000);
  cameraBox.position.z = 2;

  const ambientLightBox = new THREE.AmbientLight(0xffffff, 1);
  sceneBox.add(ambientLightBox);

  // Box geometry
  const geoBox = new THREE.BoxGeometry(1,1,1);
  const matBox = new THREE.MeshStandardMaterial({ color: 0x2fb8ff });
  rotatingBox = new THREE.Mesh(geoBox, matBox);
  sceneBox.add(rotatingBox);

  animateSmallBox();
}

function animateSmallBox() {
  requestAnimationFrame(animateSmallBox);
  if (rotatingBox) {
    rotatingBox.rotation.x += 0.01;
    rotatingBox.rotation.y += 0.01;
  }
  rendererBox.render(sceneBox, cameraBox);
}

/***********************************************************
 * 2) AR Logic (Ring, Necklace, Earring, Bracelet)
 ***********************************************************/
let scene, camera, renderer;
let ringModel = null, necklaceModel = null, earringModel = null, braceletModel = null;
let earringModelRight = null;
let holistic, videoElement, mpCamera;
let selectedJewelry = "";
const depthFactor = 2.0;

function initThree() {
    const container = document.getElementById('threeContainer');
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 3);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const loader = new THREE.GLTFLoader();

    // Ring
    loader.load('./ring.glb', (gltf) => {
        ringModel = gltf.scene;
        ringModel.scale.set(0.3, 0.3, 0.3);
        ringModel.visible = false;
        scene.add(ringModel);
    });

    // Necklace
    loader.load('./necklace.glb', (gltf) => {
        necklaceModel = gltf.scene;
        necklaceModel.scale.set(0.9, 0.9, 0.9);
        necklaceModel.visible = false;
        scene.add(necklaceModel);
    });

    // Earrings (Left Ear)
    loader.load('./earrings.glb', (gltf) => {
        earringModel = gltf.scene;
        earringModel.scale.set(0.3, 0.3, 0.3);
        earringModel.visible = false;
        scene.add(earringModel);
    });

    // Earrings (Right Ear)
    loader.load('./earringsright.glb', (gltf) => {
        earringModelRight = gltf.scene;
        earringModelRight.scale.set(0.3, 0.3, 0.3);
        earringModelRight.visible = false;
        scene.add(earringModelRight);
    });

    // Bracelet
    loader.load('./bracelet.glb', (gltf) => {
        braceletModel = gltf.scene;
        braceletModel.scale.set(1, 1, 1);
        braceletModel.visible = false;
        scene.add(braceletModel);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// async function initHolistic() {
//     holistic = new Holistic({
//         locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/${file}`
//     });
//     holistic.setOptions({
//         modelComplexity: 1,
//         smoothLandmarks: true,
//         refineFaceLandmarks: true,
//         minDetectionConfidence: 0.7,
//         minTrackingConfidence: 0.7
//     });
//     holistic.onResults(onHolisticResults);

//     videoElement = document.getElementById('videoElement');
//     const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     videoElement.srcObject = stream;
//     videoElement.style.display = 'block';

//     mpCamera = new Camera(videoElement, {
//         onFrame: async () => {
//             await holistic.send({ image: videoElement });
//         },
//         width: 640,
//         height: 480
//     });
//     mpCamera.start();
// }
async function initHolistic() {
    // Mediapipe Holistic
    holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/${file}`
    });
    holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });
    holistic.onResults(onHolisticResults);

    // कैमरा वीडियो एलिमेंट
    videoElement = document.getElementById('videoElement');

    // हाई-क्वालिटी वीडियो constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 3840 },    // 1920 पिक्सल चौड़ाई (यदि डिवाइस सपोर्ट करे)
        height: { ideal: 2160 },   // 1080 पिक्सल ऊँचाई
        frameRate: { ideal: 30 }   // 30 FPS (इच्छानुसार)
      }
    });

    // वीडियो एलिमेंट को स्ट्रीम सौंपें
    videoElement.srcObject = stream;
    videoElement.style.display = 'block';

    // Mediapipe Camera Utils
    mpCamera = new Camera(videoElement, {
      onFrame: async () => {
        await holistic.send({ image: videoElement });
      },
      width: 1920,   // Camera Utils को भी वही साइज दें
      height: 1080
    });
    mpCamera.start();
}

function onHolisticResults(results) {
    // sab hide hai
    if (ringModel) ringModel.visible = false;
    if (necklaceModel) necklaceModel.visible = false;
    if (earringModel) earringModel.visible = false;
    if (earringModelRight) earringModelRight.visible = false;
    if (braceletModel) braceletModel.visible = false;

    // Earrings
    // if (selectedJewelry === "earring") {
    //     if (results.faceLandmarks && results.faceLandmarks.length > 234 && earringModel) {
    //         const leftEar = results.faceLandmarks[234];
    //         earringModel.visible = true;
    //         let lxPos = leftEar.x * 2 - 1;
    //         let lyPos = -leftEar.y * 2 + 1;
    //         let lzPos = -1 - (leftEar.z * depthFactor);
    //         lxPos -= 0.70;
    //         earringModel.position.set(lxPos, lyPos, lzPos);
    //     }
    //     if (results.faceLandmarks && results.faceLandmarks.length > 454 && earringModelRight) {
    //         const rightEar = results.faceLandmarks[454];
    //         earringModelRight.visible = true;
    //         let rxPos = rightEar.x * 2 - 1;
    //         let ryPos = -rightEar.y * 2 + 1;
    //         let rzPos = -1 - (rightEar.z * depthFactor);
    //         rxPos += 0.79;
    //         earringModelRight.position.set(rxPos, ryPos, rzPos);
    //     }
    // }


    // ----------------- पुराना Earrings Code (COMMENTED OUT) -----------------
/*
if (selectedJewelry === "earring") {
    if (results.faceLandmarks && results.faceLandmarks.length > 234 && earringModel) {
        const leftEar = results.faceLandmarks[234];
        earringModel.visible = true;
        let lxPos = leftEar.x * 2 - 1;
        let lyPos = -leftEar.y * 2 + 1;
        let lzPos = -1 - (leftEar.z * depthFactor);
        lxPos -= 0.70;
        earringModel.position.set(lxPos, lyPos, lzPos);
    }
    if (results.faceLandmarks && results.faceLandmarks.length > 454 && earringModelRight) {
        const rightEar = results.faceLandmarks[454];
        earringModelRight.visible = true;
        let rxPos = rightEar.x * 2 - 1;
        let ryPos = -rightEar.y * 2 + 1;
        let rzPos = -1 - (rightEar.z * depthFactor);
        rxPos += 0.79;
        earringModelRight.position.set(rxPos, ryPos, rzPos);
    }
}
*/
// ----------------- नया Earrings Code -----------------
if (selectedJewelry === "earring") {
    // Left Ear: face landmark index 234, नए offsets के साथ
    if (results.faceLandmarks && results.faceLandmarks.length > 234 && earringModel) {
        const leftEar = results.faceLandmarks[234];
        earringModel.visible = true;
        let lxPos = leftEar.x * 2 - 1;
        let lyPos = -leftEar.y * 2 + 1;
        let lzPos = -1 - (leftEar.z * depthFactor);
        // नए offsets: थोड़ा ज्यादा left और हल्का ऊपर
        lxPos -= 0.63;
        lyPos -= 0.16;
        earringModel.position.set(lxPos, lyPos, lzPos);
    
    }
    // Right Ear: face landmark index 454, नए offsets के साथ
    if (results.faceLandmarks && results.faceLandmarks.length > 454 && earringModelRight) {
        const rightEar = results.faceLandmarks[454];
        earringModelRight.visible = true;
        let rxPos = rightEar.x * 2 - 1;
        let ryPos = -rightEar.y * 2 + 1;
        let rzPos = -1 - (rightEar.z * depthFactor);
        // नए offsets: थोड़ा ज्यादा right और हल्का ऊपर
        rxPos += 0.55;
        ryPos -= 0.16;
        earringModelRight.position.set(rxPos, ryPos, rzPos);
        // necklaceModel.rotation.x = Math.PI / -2;
        // necklaceModel.rotation.y = Math.PI / 1;
    }
}

    // Necklace
    else if (
        selectedJewelry === "necklace" &&
        results.poseLandmarks &&
        results.poseLandmarks.length > 12 &&
        necklaceModel
    ) {
        const leftShoulder = results.poseLandmarks[12];
        const rightShoulder = results.poseLandmarks[11];
        const midX = (leftShoulder.x + rightShoulder.x) / 3;
        const midY = (leftShoulder.y + rightShoulder.y) / 3;
        const midZ = (leftShoulder.z + rightShoulder.z) / 3;

        necklaceModel.visible = true;
        let xPos = midX * 6 - 1;
        let yPos = -midY * 2 + 1;
        const zPos = 0.50 - (midZ * depthFactor);

        yPos -= 0.10;
        xPos -= 1.08;
        yPos -= 0.35;
        necklaceModel.position.set(xPos, yPos, zPos);
        necklaceModel.rotation.x = Math.PI / 9;
        necklaceModel.rotation.y = Math.PI / 9;
    }
    // Ring (DIP #7)
    // else if (
    //     selectedJewelry === "ring" &&
    //     results.rightHandLandmarks &&
    //     results.rightHandLandmarks.length > 8 &&
    //     ringModel
    // ) {
    //     const rightHand = results.rightHandLandmarks;
    //     const dip = rightHand[7];
    //     const pip = rightHand[6];
    //     ringModel.visible = true;
    //     let xPos = dip.x * 2 - 1;
    //     let yPos = -dip.y * 2 + 1;
    //     let zPos = -1 - (dip.z * depthFactor);
    //     ringModel.position.set(xPos, yPos, zPos);
    //     const dx = dip.x - pip.x;
    //     const dy = dip.y - pip.y;
    //     const angle = Math.atan2(dy, dx);
    //     ringModel.rotation.z = 1.90;
    //     ringModel.rotation.x = -Math.PI / 11;
    //     ringModel.rotation.y = 9;
    // }
 // ================== NEW RING CODE (DIP #7) ==================
 // ================== NEW RING CODE (DIP #7) ==================
else if (
    selectedJewelry === "ring" &&
    results.rightHandLandmarks &&
    results.rightHandLandmarks.length > 8 &&
    ringModel
) {
    // दाएँ हाथ के लैंडमार्क्स से DIP (#7) और PIP (#6) निकालें
    const rightHand = results.rightHandLandmarks;
    const dip = rightHand[7];  // DIP landmark (finger tip joint)
    const pip = rightHand[6];  // PIP landmark (joint just above DIP)

    // रिंग मॉडल को दिखाएं
    ringModel.visible = true;
    
    // Mediapipe के 0..1 रेंज को Three.js (-1..+1) में मैप करें:
    const xPos = dip.x * 2 - 1;
    const yPos = -dip.y * 2 + 1;
    const zPos = -1 - (dip.z * depthFactor);
    ringModel.position.set(xPos, yPos, zPos);
    
    // रोटेशन: DIP और PIP के बीच के अंतर से एंगल निकालें
    const dx = dip.x - pip.x;
    const dy = dip.y - pip.y;
    const angle = Math.atan2(dy, dx);
    
    // यहाँ आप रिंग के रोटेशन को सेट कर रहे हैं ताकि वह फिंगर के साथ फिक्स रहे
    ringModel.rotation.z = 1.90;    // यह मान एक्सपेरिमेंट से सेट करें
    ringModel.rotation.x = -Math.PI / 11;
    ringModel.rotation.y = 9;
}


    // Bracelet
    else if (
        selectedJewelry === "bracelet" &&
        results.rightHandLandmarks &&
        results.rightHandLandmarks.length > 0 &&
        braceletModel
    ) {
        const rightHand = results.rightHandLandmarks;
        const wrist = rightHand[0];
        braceletModel.visible = true;
        let xPos = wrist.x * 2 - 1;
        let yPos = -wrist.y * 2 + 1;
        let zPos = -1 - (wrist.z * depthFactor);
        yPos -= 0.05;
        braceletModel.rotation.x = Math.PI / 2;
        braceletModel.scale.set(1.2, 1.2, 1.2);
        braceletModel.position.set(xPos, yPos, zPos);
    }
}

function initButtons() {
    document.getElementById("ringBtn").addEventListener("click", () => {
        selectedJewelry = "ring";
    });
    document.getElementById("necklaceBtn").addEventListener("click", () => {
        selectedJewelry = "necklace";
    });
    document.getElementById("earringBtn").addEventListener("click", () => {
        selectedJewelry = "earring";
    });
    document.getElementById("braceletBtn").addEventListener("click", () => {
        selectedJewelry = "bracelet";
    });
}

// Start AR Button
document.getElementById('startARBtn').addEventListener('click', () => {
    startAR();
    // Splash screen hide, jewelry buttons show
    document.getElementById('splashContainer').style.display = 'none';
    document.getElementById('jewelryButtons').style.display = 'block';
});

async function startAR() {
    await initHolistic();
}

/***********************************************************
 * sabkuch Init
 ***********************************************************/
initThree();
initButtons();
init3DSmallBox();  /*3d box samll */

/***********************************************************
 * Hand Overlay Logic
 ***********************************************************/
function showHandOverlay() {
    const overlay = document.getElementById('handOverlay');
    // 1) ओवरले दिखाएँ
    overlay.style.display = 'block';
  
    // 2) 5 सेकंड बाद ओवरले छिपा दें
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 5000);
  }
  
  /***********************************************************
   * 2) AR Logic (Ring, Necklace, Earring, Bracelet)
   ***********************************************************/
  
  function initButtons() {
    document.getElementById("ringBtn").addEventListener("click", () => {
      selectedJewelry = "ring";
      // Ring बटन पर क्लिक होने पर 5-sec के लिए हाथ दिखाएँ
      showHandOverlay();
    });
  
    document.getElementById("necklaceBtn").addEventListener("click", () => {
      selectedJewelry = "necklace";
    });
    document.getElementById("earringBtn").addEventListener("click", () => {
      selectedJewelry = "earring";
    });
    document.getElementById("braceletBtn").addEventListener("click", () => {
      selectedJewelry = "bracelet";
    });
  
    // Download/Preview बटन
    document.getElementById("downloadBtn").addEventListener("click", () => {
      // Preview/Download Logic
      const link = document.createElement('a');
      link.href = './img/pp.png';
      link.download = 'preview.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
