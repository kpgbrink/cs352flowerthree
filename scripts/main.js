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
controls.minDistance = 10;;
controls.maxDistance = 5000.0;
//controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set( 0, 0, 0 );

// Add point light that circles
const pointLight = new THREE.PointLight('#ffffff', .9, 10000, .9);
pointLight.position.set(0, 250, 1000);
const pointLightEuler = new THREE.Euler(0, .02, 0);
scene.add(pointLight);
const updatePointLightPosition = function() {
    pointLight.position.applyEuler(pointLightEuler);
}


const stemGeometry = new THREE.BoxGeometry(1, 1, 1);
const stemMaterial = new THREE.MeshPhongMaterial({color: '#0fff00'});



class StemPart {
    constructor(prevStemPart) {
        this.object = new THREE.Mesh(stemGeometry, stemMaterial);
        this.object.scale.set(10, 25, 10);
        
        const getRandRot = function () {return Math.random*.2 -.1};
        if (prevStemPart) {
            console.log('prevStemPart');
            // copy prevStem rotation
            //this.object.rotation.copy(prevStemPart);
            // rotate randomly
            this.object.rotation.x += .2;
            this.object.rotation.y += .1;
            this.object.rotation.z += .1;
        }
        
        this.object.updateMatrix();
    }
    
    // Get Middles for growing and animating the stem
    getTopMiddle() {
        return this.getMiddle(new THREE.Vector3(0, .5, 0));
    }
    getBottomMiddle() {
        return this.getMiddle(new THREE.Vector3(0, -.5, 0));        
    }
    getMiddle(vecOut) {
        vecOut.applyMatrix4(this.object.matrix);
        return vecOut;
    }
    
    // run after rotations
    placeStem(prevStemPart) {
        let connectTop = prevStemPart.getTopMiddle();
        let connectBottom = this.getBottomMiddle();
        this.object.position.copy(connectTop.sub(connectBottom));
    }
    
    // Todo
    animate() {
        
    }
}

class Stem {
    constructor(stemMax=1000) {
        // Object holder
        this.stemObjects = [];
        this.growing = true;
        this.stemMax = stemMax;
    }
    
    stemTip() {
        return this.stemObjects[this.stemObjects.length-1];
    }
    
    addObject() {
        let stemPart = new StemPart(this.stemTip());
        if (this.stemObjects.length > 0) {
            stemPart.placeStem(this.stemTip());
        } else {
            stemPart.object.position.set(0, -500, 0);
        }
        scene.add(stemPart.object);
        
        console.log(stemPart);
        console.log(this.stemObjects.length);
        
        this.stemObjects.push(stemPart);
    }
    
    trimStem() {
        scene.remove(this.stemObjects.pop().object);
    }
    
    // Checks growing. Runs on update
    checkGrowing() {
        if (this.growing) {
            return this.stemObjects.length < this.stemMax;
        } else {
            return !(this.stemObjects.length > 0);
        }
    }
    
    update() {
        this.growing = this.checkGrowing();
        if (this.growing) {
            this.addObject();
        } else {
            this.trimStem();
        }
    }
}


class FlowerScene {
    constructor() {
        this.stem = new Stem();
        this.render();
    }

    render() {
      requestAnimationFrame( () => this.render() );
      // Update the stem
      this.stem.update();
       
        
        
      updatePointLightPosition();
        
      renderer.render( scene, camera );
    }
}

const flowerScene = new FlowerScene();

