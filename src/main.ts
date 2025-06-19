import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import { GLTFLoader, Timer } from "three/examples/jsm/Addons.js";
import GUI from "lil-gui";
import hologramVertex from "./shaders/hologram/vertex.glsl";
import hologramFragment from "./shaders/hologram/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI();
gui.close();

// Canvas
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const [width, height] = [
  (canvas.width = window.innerWidth),
  (canvas.height = window.innerHeight),
];

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */

const gltfLoader = new GLTFLoader();

/**
 *  Textures
 */

/**
 * Material
 */
const material = new THREE.ShaderMaterial({
  vertexShader: hologramVertex,
  fragmentShader: hologramFragment,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uColor: new THREE.Uniform(new THREE.Color("#5900ff")),
  },
});

gui
  .addColor(material.uniforms.uColor, "value")
  .name("Hologram Color")
  .onChange(() => {
    material.needsUpdate = true;
  });

/**
 * Objects
 */
// Torus knot
const torusKnot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32),
  material
);
torusKnot.position.x = 3;
scene.add(torusKnot);

// Sphere
const sphere = new THREE.Mesh(new THREE.SphereGeometry(), material);
sphere.position.x = -3;
scene.add(sphere);

// Suzanne
let suzanne: THREE.Group | null = null;
gltfLoader.load("/models/suzanne.glb", (gltf) => {
  suzanne = gltf.scene;
  suzanne.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).material = material;
    }
  });
  scene.add(suzanne);
});

/**
 * Camera
 */

// Base camera
const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
camera.position.set(7, 7, 7);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const rendererParameters = {
  clearColor: "#1d1f2a",
};

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setClearColor(rendererParameters.clearColor);
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

gui.addColor(rendererParameters, "clearColor").onChange(() => {
  renderer.setClearColor(rendererParameters.clearColor);
}).name("Background Color");

/**
 * Animation loop
 */

const timer = new Timer();

const tick = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();
  // const deltaTime = timer.getDelta();

  // update controls to enable damping
  controls.update();

  // Rotate objects
  if (suzanne) {
    suzanne.rotation.x = -elapsedTime * 0.1;
    suzanne.rotation.y = elapsedTime * 0.2;
  }

  sphere.rotation.x = -elapsedTime * 0.1;
  sphere.rotation.y = elapsedTime * 0.2;

  torusKnot.rotation.x = -elapsedTime * 0.1;
  torusKnot.rotation.y = elapsedTime * 0.2;

  // Update material uniforms
  material.uniforms.uTime.value = elapsedTime;

  // render
  renderer.render(scene, camera);

  // request next frame
  window.requestAnimationFrame(tick);
};

tick();

/**
 * Handle window resize
 */

function handleResize() {
  const visualViewport = window.visualViewport!;
  const width = visualViewport.width;
  const height = visualViewport.height;

  canvas.width = width;
  canvas.height = height;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Usar el evento 'resize' de visualViewport para móviles
 */

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleResize);
} else {
  window.addEventListener("resize", handleResize);
}
