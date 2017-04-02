'use strict';

const scene = new THREE.Scene();
scene.add( new THREE.AmbientLight( 0x444444 ) );
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 10000 );
const renderer = new THREE.WebGLRenderer();
new THREEx.WindowResize(renderer, camera).trigger();

document.body.appendChild( renderer.domElement );

camera.position.set( 2000, 750, 2000 );

// Add camera controls
const controls = new THREE.OrbitControls( camera );
controls.enablePan = false;
controls.minDistance = 1000.0;
controls.maxDistance = 5000.0;
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set( 0, 0, 0 );




const geometry = new THREE.BoxGeometry( 100, 100, 100 );
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const render = function () {
  requestAnimationFrame( render );
  cube.rotation.x += 0.0;
  cube.rotation.y += 0.0;
  renderer.render( scene, camera );
};

render();
