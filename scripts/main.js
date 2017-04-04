'use strict';

const scene = new THREE.Scene();
scene.add( new THREE.AmbientLight( 0x555555 ) );
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
const pointLight = new THREE.PointLight('#ffffff', .9, 100000, 1);
pointLight.position.set(0, 250, 10000);
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
        this.prevStemPart = prevStemPart;
        
        this.rotationDifference = [0,0,0];
        
        
        // Start at random rotation
        if (this.prevStemPart) {
            //console.log('prevStemPart');
            // copy prevStem rotation
            this.copyPrevStemRotation(prevStemPart);
            
        }
        
    }
    
    randRotate() {
        const getRandRot = function () {return Math.random()*.01*-.005};
        
        this.rotationDifference[0] += getRandRot();
        this.rotationDifference[1] += getRandRot();
        this.rotationDifference[2] += getRandRot();
        // rotate randomly
        this.rotate(this.rotationDifference[0], 
                    this.rotationDifference[1],
                    this.rotationDifference[2]);
    }
    
    rotate(x, y, z) {
        this.object.rotation.x += x;
        this.object.rotation.y += y;
        this.object.rotation.z += z;
        this.object.updateMatrix();
    }
    
    copyPrevStemRotation(prevStemPart) {
        if (this.prevStemPart) {
            this.object.rotation.copy(this.prevStemPart.object.rotation);
            this.object.updateMatrix();
        }
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
    placeStem() {
        if (!this.prevStemPart) {
            console.log('prevStemPart', this.prevStemPart);   
            return; 
        }
        //console.log('prevStemPart', this.prevStemPart);
        let connectTop = this.prevStemPart.getTopMiddle();
        let connectBottom = this.getBottomMiddle();
        //console.log('connectTop',connectTop);
        //console.log('connectBottom', connectBottom);
        //this.object.updateMatrix();
        this.object.position.copy(connectTop/*.sub(connectBottom)*/);
        //this.object.updateMatrix();
    }
    
    // Todo
    animate() {
        
    }
}

class Stem {
    constructor(stemMax=100, startPosition) {
        // Object holder
        this.stemObjects = [];
        this.growing = true;
        this.stemMax = stemMax;
        this.startPosition = startPosition;
    }
    
    stemTip() {
        return this.stemObjects[this.stemObjects.length-1];
    }
    
    addObject() {
        let stemPart = new StemPart(this.stemTip());
        
        if (this.stemObjects.length > 0) {
            stemPart.placeStem();
        } else {
            stemPart.object.position.copy(this.startPosition);
        }
        scene.add(stemPart.object);
        
        //console.log(stemPart);
        //console.log(this.stemObjects.length);
        
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
    
    // Randomly rotate the object by a bit.
    stemObjectMove(stemPart) {
        //console.log(stemPart);
        // copy parent rotation if it exists
        stemPart.copyPrevStemRotation();
        // randomly rotate part
        stemPart.randRotate(.01, .01, .03);

        stemPart.placeStem();
    }
    
    // Move the stem
    move() {
        for (let stemPart of this.stemObjects) {
            this.stemObjectMove(stemPart);
            
        }
    }
    
    update() {
        this.move();
        
        this.growing = this.checkGrowing();
        
        if (this.growing) {
            this.addObject();
        } else {
            this.trimStem();
        }
    }
}

class BaseStem {
    constructor() {
        this.stem = new Stem(1000, new THREE.Vector3(0, -500, 0));
        this.getRandMakeNewStem();
        this.stems = [];
    }
    
    getRandMakeNewStem() {
        this.randMakeNew = this.stem.stemObjects.length + Math.floor(Math.random() * 100);
    }
    
    getRandStemLength() {
        return Math.floor(Math.random() * (this.stem.stemObjects.length-1) + 1);
    }
    
    update() {
        this.stem.update();
        for (let stem of this.stems) {
            stem.update();
        }
        if (this.stem.growing) {
            if (this.stem.stemObjects.length == this.randMakeNew) {
                console.log('make new stem');
                console.log(this.stem.stemTip().object.position);
                this.getRandMakeNewStem();
                console.log(this.getRandStemLength());
                this.stems.push(new Stem(this.getRandStemLength(),
                                        this.stem.stemTip().object.position,
                                        true));
                
            }
        }
    }
}


class FlowerScene {
    constructor() {
        this.baseStem = new BaseStem();
        this.render();
    }

    render() {
      requestAnimationFrame( () => this.render() );
      // Update the stem
      this.baseStem.update();
       
        
        
      updatePointLightPosition();
        
      renderer.render( scene, camera );
    }
}

const flowerScene = new FlowerScene();

