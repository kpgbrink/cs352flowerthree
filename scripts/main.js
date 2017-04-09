'use strict';


// Statistics
const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

// Gui interface 
const gui = new dat.GUI({
    height : 5 * 32 - 1
});

const params = {
    growStop: true,
    wind: .01,
    size: 100,
};

gui.add(params, 'growStop');
gui.add(params, 'size', 10, 120);
gui.add(params, 'wind', -5, 5, .01);

const scene = new THREE.Scene();
scene.add( new THREE.AmbientLight( 0x555555 ) );
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 100000 );
const renderer = new THREE.WebGLRenderer();
new THREEx.WindowResize(renderer, camera).trigger();

document.body.appendChild( renderer.domElement );

camera.position.set( 30000, 750, 2000 );

// Add camera controls
const controls = new THREE.OrbitControls( camera );
controls.enablePan = false;
//controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set( 0, 0, 0 );

// Add point light that circles
const pointLight = new THREE.PointLight('#ffffff', .9, 100000, 1);
const pointLight2 = new THREE.PointLight('#ffffff', .9, 100000, 1);
pointLight.position.set(0, 250, 10000);
pointLight2.position.set(0, 250, -10000);
const pointLightEuler = new THREE.Euler(0, .02, 0);
scene.add(pointLight);
scene.add(pointLight2);
const updatePointLightPosition = function() {
    pointLight.position.applyEuler(pointLightEuler);
    pointLight2.position.applyEuler(pointLightEuler);
}


const stemGeometry = new THREE.BoxGeometry(1, 1, 1);
const stemMaterial = new THREE.MeshPhongMaterial({color: '#0fff00'});


// ---------------------------------- StemPart
class StemPart {
    constructor(prevStemPart) {
        this.object = new THREE.Mesh(stemGeometry, stemMaterial);
        this.object.scale.set(70, 200 , 70);
        this.prevStemPart = prevStemPart;
        this.rotationDifference = [0,0,0];
        
        
        // Start at random rotation
        if (this.prevStemPart) {
            //console.log('prevStemPart');
            // copy prevStem rotation
            this.copyPrevStemRotation();
            
        }
        
    }
    
    randRotate() {
        const getRandRot = function () {return Math.random()*.001 - .0005};
        
        
        this.rotationDifference[0] += getRandRot();
        this.rotationDifference[1] += getRandRot();
        this.rotationDifference[2] += getRandRot();
    
        // rotate randomly
        this.rotate(this.rotationDifference[0] * params.wind, 
                    this.rotationDifference[1] * params.wind,
                    this.rotationDifference[2] * params.wind);
    }
    
    rotate(x, y, z) {
        this.object.rotation.x += x;
        this.object.rotation.y += y;
        this.object.rotation.z += z;
        this.object.updateMatrix();
    }
    
    copyPrevStemRotation() {
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

// ---------------------------------------- Stem
class Stem {
    constructor(stemMax=100, startPosition, deleteSelf=true, parentStem) {
        // Object holder
        this.stems = []; // holds other stems underneath it.
        this.stemObjects = [];
        this.growing = true;
        this.stemMax = stemMax;
        this.startPosition = startPosition;
        this.deleteSelf = deleteSelf;
        this.deleted = false;
        this.parentStem = parentStem;
    }
    
    stemTip() {
        return this.stemObjects[this.stemObjects.length-1];
    }
    
    addObject() {
        let stemPart;
        // if new stem part and parent stem object
        if (this.stemObjects.length == 0 && this.parentStem) {
            //console.log('stemPart is different Kristofer Brink');
            stemPart = new StemPart(this.parentStem);
            // Rotation for new stem object
            stemPart.rotationDifference[0] = Math.random() * Math.PI;
            stemPart.rotationDifference[1] = Math.random() * Math.PI* 2;
            stemPart.rotationDifference[2] = Math.random() * Math.PI;
        } else {
            stemPart = new StemPart(this.stemTip());
        }
        
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
    
  
    
    // Randomly rotate the object by a bit.
    stemObjectMove(stemPart) {
        
        
        stemPart.copyPrevStemRotation();
        //console.log(stemPart);
        stemPart.randRotate();
        // copy parent rotation if it exists
        // randomly rotate part
        

        stemPart.placeStem();
    }
    
    // Move the stem
    move() {
        
        for (const stemPart of this.stemObjects) {
            this.stemObjectMove(stemPart);
        }
    }
    
    setRandMakeNewStem() {
        this.randMakeNew = this.stemObjects.length + Math.floor(Math.random() * 10 + 3);
    }
    
    getRandStemLength() {
        return (this.stemMax - this.stemObjects.length * 2);
    }
    
    stemBranchDelete() {
        for (let stemObject of this.stemObjects) {
            //console.log('removing object');
            scene.remove(stemObject.object);
        }
        for (let stem of this.stems) {
            stem.stemBranchDelete();
        }
        this.deleted = true;
    }
     // Checks growing. Runs on update
    checkGrowing() {
        if (this.growing) {
            return this.stemObjects.length < this.stemMax;
        } else {
            return !(this.stemObjects.length > 0);
        }
    }
    
    updateStemBranches() {
        
        // delete self if stop growing and delete self
        if (this.stemObjects.length == 0 && !this.growing && this.deleteSelf) {
            //console.log('deleteting self');
            this.stemBranchDelete();
            this.deleted = true;
        }
        
        // update branched stems and check if deleted.
        for (let i = this.stems.length-1; i >= 0; i--) {
            if (this.stems[i].deleted) {
                this.stems.splice(i, 1);
            } else {
                this.stems[i].update();
            }
        }
        
        // If stem size is one then set the ranomMakeNe
        if (this.stemObjects.length == 1) {
            this.setRandMakeNewStem();
        }
        
       
        
        if (this.growing) {
            //console.log(this.randMakeNew);
            if (this.stemObjects.length == this.randMakeNew) {
                
                //console.log('make new stem');
                //console.log(this.stemTip().object.position);
                this.setRandMakeNewStem();
                //console.log(this.getRandStemLength());
                this.stems.push(new Stem(this.getRandStemLength(),
                                        this.stemTip().object.position,
                                        true,
                                        this.stemTip()));
                
            }
        }
    }
    
    update(size=null) {
        // update the stem size
        this.stemMax = size?size:this.stemMax;
        
        this.updateStemBranches();
        if (this.deleted) {
            return;
        }
       
        
        this.growing = this.checkGrowing();
        
        if (this.growing) {
            this.addObject();
        } else {
            if (this.stemObjects.length && (!params.growStop)) {
                this.trimStem();
            }
        }
        this.move();
        
    }
    
    
}

class BaseStem {
    constructor() {
        this.stem = new Stem(params.size, new THREE.Vector3(0, -500, 0), false);
    }
    
    update() {
        this.stem.update(params.size);
    }
}


class FlowerScene {
    constructor() {
        this.baseStem = new BaseStem();
        this.render();
    }

    render() {
      stats.begin();
      // Update the stem
      this.baseStem.update();
      updatePointLightPosition();
      renderer.render( scene, camera );
        
      stats.end();
      requestAnimationFrame( () => this.render() );
    }
}

const flowerScene = new FlowerScene();

