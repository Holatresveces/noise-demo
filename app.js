import * as THREE from 'three';
import img from './images/img02.png';
import noise from './images/noise1.jpg';
import dat from 'dat.gui';

const textureLoader = new THREE.TextureLoader();
const imageTexture = textureLoader.load(img);
imageTexture.wrapS = THREE.MirroredRepeatWrapping;
imageTexture.wrapT = THREE.MirroredRepeatWrapping;
const noiseTexture = textureLoader.load(noise);
noiseTexture.wrapS = THREE.MirroredRepeatWrapping;
noiseTexture.wrapT = THREE.MirroredRepeatWrapping;

const imageWidth = 795;
const imageHeight = 912;
const imageAspect = 795/912;

const debugObject = {
  strength: 0.2,
  speed: 0.5,
  distortionScale: 2
}
const gui = new dat.GUI();

gui.add(debugObject, 'strength', 0, 2, 0.01).onChange(() => {
  uniforms.uStrength.value = debugObject.strength;
});
gui.add(debugObject, 'speed', 0, 2, 0.01).onChange(() => {
  uniforms.uSpeed.value = debugObject.speed;
});
gui.add(debugObject, 'distortionScale', 0.3, 5, 0.01).onChange(() => {
  uniforms.uDistortionScale.value = debugObject.distortionScale;
});


const container = document.querySelector('.webgl-container');

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const scene = new THREE.Scene();

const clock = new THREE.Clock();

const camera = new THREE.PerspectiveCamera(45, sizes.width/sizes.height, 0.1, 100);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(sizes.width, sizes.height);
container.appendChild(renderer.domElement);

const resize = () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  renderer.setSize(sizes.width, sizes.height);
  camera.aspect = sizes.width/sizes.height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

const uniforms = {
  uTime: { value: 0 },
  uNoise: {value: noiseTexture},
  uSpeed: {value: debugObject.speed},
  uStrength: {value: debugObject.strength},
  uTexture: {value: imageTexture},
  uAmplitude: {value: debugObject.amplitude},
  uDistortionScale: {value: debugObject.distortionScale}
}

const mesh = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(1, 1, 1, 1),
  new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform sampler2D uTexture;
      uniform sampler2D uNoise;
      uniform float uStrength;
      uniform float uSpeed;
      uniform float uDistortionScale;
      varying vec2 vUv;

      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        float noise = snoise(vUv * uDistortionScale + uTime * uSpeed);
        gl_FragColor = texture2D(uTexture, vUv + noise * uStrength);
      }
    `
  })
);

mesh.scale.x = imageAspect;

scene.add(mesh);

const tick = () => {
  uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
  requestAnimationFrame(tick)
}

tick();