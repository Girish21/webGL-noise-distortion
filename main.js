import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

import fragmentShader from './shaders/fragment.frag?raw'
import vertexShader from './shaders/vertex.vert?raw'

import image1 from './assets/thum.jpeg'
import image2 from './assets/thum1.jpeg'
import image3 from './assets/thum2.jpeg'
import image4 from './assets/thum3.jpeg'
import image5 from './assets/thum4.jpeg'
import image6 from './assets/thum5.jpeg'
import image7 from './assets/thum6.jpeg'
import image8 from './assets/thum7.jpeg'
import image9 from './assets/thum8.jpeg'
import image10 from './assets/thum9.jpeg'

import { Vector2 } from 'three'

/**
 * Dot screen shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */

const CustomShaderPass = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
  },

  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

		uniform sampler2D tDiffuse;
		uniform float uTime;

		varying vec2 vUv;

		void main() {

      vec2 newUV = vUv;

      vec2 centeredUV = vUv - vec2(.5);
      centeredUV += .1 * cos(2. * centeredUV.yx + uTime + vec2(1.2, 4.1));
      centeredUV += .1 * cos(2.4 * centeredUV.yx + 1.4 * uTime + vec2(3.1, 8.4));
      centeredUV += .1 * cos(4.7 * centeredUV.yx + 2.6 * uTime + vec2(4.9, 1.7));
      centeredUV += .3 * cos(7.3 * centeredUV.yx + 3.6 * uTime + vec2(8.2, 5.1));

      newUV.x = mix(vUv.x, length(centeredUV), 1.);
      newUV.y = mix(vUv.y, 0., 1.);

			vec4 color = texture2D( tDiffuse, newUV );

			gl_FragColor = color;
		}`,
}

const ImageUrls = [
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8,
  image9,
  image10,
]

const textureLoader = new THREE.TextureLoader()

const ImageTextures = ImageUrls.map(img => textureLoader.load(img))

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
}

const mouse = {
  x: 0,
  y: 0,
}

const canvas = document.getElementById('webGL')

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera()
const controls = new OrbitControls(camera, canvas)
const renderer = new THREE.WebGLRenderer({ canvas })
const composer = new EffectComposer(renderer)
const clock = new THREE.Clock()

controls.enableDamping = true

camera.fov = 75
camera.aspect = size.width / size.height
camera.far = 100
camera.near = 0.1
camera.position.set(0, 0, 1)

composer.addPass(new RenderPass(scene, camera))

scene.add(camera)

const planeGeometry = new THREE.PlaneBufferGeometry(1.9 / 2, 1 / 2, 1)
const planeMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uTexture: { value: null },
  },
})

const meshes = []

for (let i = 0; i < ImageTextures.length; i++) {
  const texture = ImageTextures[i]
  const material = planeMaterial.clone()
  material.uniforms.uTexture.value = texture
  const planeMesh = new THREE.Mesh(planeGeometry, material)
  planeMesh.position.x = i - 1
  planeMesh.position.y = -1
  planeMesh.rotation.z = Math.PI / 2
  meshes.push(planeMesh)
  scene.add(planeMesh)
}

const effect1 = new ShaderPass(CustomShaderPass)
composer.addPass(effect1)

function resizeHandler() {
  size.height = window.innerHeight
  size.width = window.innerWidth

  camera.aspect = size.width / size.height
  camera.updateProjectionMatrix()

  renderer.setSize(size.width, size.height)
  composer.setSize(size.width, size.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}
resizeHandler()

window.addEventListener('resize', resizeHandler)

function tick() {
  const elapsedTime = clock.getElapsedTime()

  planeMaterial.uniforms.uTime.value = elapsedTime
  effect1.uniforms.uTime.value = elapsedTime / 4

  controls.update()

  composer.render()

  window.requestAnimationFrame(tick)
}
tick()

const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
const event = isTouch ? 'touchmove' : 'mousemove'
let timeoutId
window.addEventListener(event, e => {
  if (isTouch && e.touches?.[0]) {
    const touchEvent = e.touches[0]
    mouse.x = (touchEvent.clientX / size.width) * 2 - 1
    mouse.y = (-touchEvent.clientY / size.height) * 2 + 1
  } else {
    mouse.x = (e.clientX / size.width) * 2 - 1
    mouse.y = (-e.clientY / size.height) * 2 + 1
  }

  clearTimeout(timeoutId)
  timeoutId = setTimeout(() => {
    mouse.x = 0
    mouse.y = 0
  }, 1000)
})
