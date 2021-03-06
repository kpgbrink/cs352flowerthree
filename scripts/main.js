'use strict';


// Statistics
const stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

// Gui interface 
const gui = new dat.GUI({
    height : 5 * 32 - 1
});

let growStop = true;

const params = {
    reGrow: () => {growStop = false; },
    size: 80,
    freezeRotation: false,
    wind: .1,
    petalScaleSpeed: .2,
    petalRotation: 0,
};

gui.add(params, 'reGrow');
gui.add(params, 'size', 10, 130);
gui.add(params, 'freezeRotation');
gui.add(params, 'wind', -5, 5, .01);
gui.add(params, 'petalScaleSpeed', .01, 5, .01);
gui.add(params, 'petalRotation', 0, 1.6, .01)

const scene = new THREE.Scene();
scene.add( new THREE.AmbientLight( 0x333333 ) );
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 10000000 );
const renderer = new THREE.WebGLRenderer();
new THREEx.WindowResize(renderer, camera).trigger();

document.body.appendChild( renderer.domElement );

camera.position.set( 7000, 750, 1000 );

// Add camera controls
const controls = new THREE.OrbitControls( camera );
controls.enablePan = false;
//controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set( 0, 0, 0 );

// Add point light that circles
const pointLight = new THREE.PointLight('#fff0ff', .9, 100000, 1);
const pointLight2 = new THREE.PointLight('#ffffa0', .9, 100000, 1);
pointLight.position.set(0, 10000, 10000);
pointLight2.position.set(0, -10000, -10000);
const pointLightEuler = new THREE.Euler(0, .02, 0);
scene.add(pointLight);
scene.add(pointLight2);
const updatePointLightPosition = function() {
    pointLight.position.applyEuler(pointLightEuler);
    pointLight2.position.applyEuler(pointLightEuler);
}


const stemGeometry = new THREE.BoxGeometry(1, 1, 1);
const stemMaterial = new THREE.MeshPhongMaterial({color: '#4fff44'});

const flowerGeometry = new THREE.SphereGeometry(1, 32, 32);



// Bumpy flower material
const mapHeight = new THREE.TextureLoader().load( "images/flowerBump.jpg" );
mapHeight.anisotropy = 4;
mapHeight.repeat.set( 0.998, 0.998 );
mapHeight.offset.set( 0.001, 0.001 );
mapHeight.wrapS = mapHeight.wrapT = THREE.RepeatWrapping;
mapHeight.format = THREE.RGBFormat;

const flowerMaterial = new THREE.MeshPhongMaterial( {
    color: 0xff3333,
    specular: 0x222222,
    shininess: 25,
    bumpMap: mapHeight,
    bumpScale: 12
} );

const flowerMaterial2 = new THREE.MeshPhongMaterial( {
    color: 0xffaaaa,
    specular: 0x222222,
    shininess: 25,
    bumpMap: mapHeight,
    bumpScale: 12
} );


const petalAmount = 12;
const petalMaxScale = 1.5;

// Flower petals
class FlowerPetals {
    constructor(prevStemPart, stemLength) {
        this.prevStemPart = prevStemPart;
        //console.log(stemLength);
        this.stemLength = stemLength;
        
        this.baseObject = new THREE.Mesh(flowerGeometry, flowerMaterial);
        
        scene.add(this.baseObject);
        
        this.petals = [];
        for (let i = 0; i < petalAmount; i++) {
            const newPetal = this.createPetal(i%2, i * Math.PI/6, i%2==0?flowerMaterial:flowerMaterial2);
            this.petals.push(newPetal);
            this.baseObject.add(newPetal);
        }
        
        this.growing = true;
        this.petalScale = 1;
        
        
    }
    
    
    copyPrevStemRotation() {
        this.baseObject.rotation.copy(this.prevStemPart.object.rotation);
        this.baseObject.updateMatrix();
    }
    
    // Get Middles for growing and animating the stem
    getTopMiddle() {
        return this.getMiddle(new THREE.Vector3(0, .5, 0));
    }
    getMiddle(vecOut) {
        vecOut.applyMatrix4(this.object.matrix);
        return vecOut;
    }
    
    // run after rotations
    place() {
        //console.log('prevStemPart', this.prevStemPart);
        let connectTop = this.prevStemPart.getTopMiddle();
        //console.log('connectTop',connectTop);
        //console.log('connectBottom', connectBottom);
        //this.object.updateMatrix();
        this.baseObject.position.copy(connectTop/*.sub(connectBottom)*/);
        //this.object.updateMatrix();
    }
    
    grow() {
        if (this.petalScale >= petalMaxScale * this.stemLength) {
            this.growing = false;
            return;
        }
        
        this.baseObject.scale.set(this.petalScale, this.petalScale, this.petalScale);
        
        
        this.petalScale += params.petalScaleSpeed;
            
    }
    
    shrink() {
        if (this.petalScale <= 1) {
            
            return false;
        }
        //console.log('e', this.petalScale);
        this.baseObject.scale.set(this.petalScale, this.petalScale, this.petalScale);
        this.petalScale -= params.petalScaleSpeed;
        
        return true;
    }
    
    remove() {
        scene.remove(this.baseObject);
    }
    
    createPetal(y, angle, material) {
        const petal = new THREE.Mesh(flowerGeometry, material);
        petal.scale.set(10, .7, 3);
        petal.position.setX(petal.scale.x);
        const object3d = new THREE.Object3D();
        object3d.add(petal);
        object3d.position.setY(y);
        object3d.rotation.order = 'XYZ';
        object3d.rotation.y = angle;
        return object3d;
    }
    
    petalRotation() {
        for (const petal of this.petals) {
            petal.rotation.z = params.petalRotation;
        }
    }
    
    
    update() {
        this.copyPrevStemRotation();
        this.place();
        this.petalRotation();
        if (this.growing) {
            this.grow();
        }
    }
}

// ---------------------------------- StemPart
class StemPart {
    constructor(prevStemPart) {
        this.object = new THREE.Mesh(stemGeometry, stemMaterial);
        this.object.scale.set(70, 200 , 70);
        scene.add(this.object);
        
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
class Flower {
    constructor(stemMax=100, startPosition, deleteSelf=true, parentStem) {
        // Object holder
        this.stems = []; // holds other stems underneath it.
        this.stemObjects = [];
        this.flowerObject;
        this.growing = 0; // 0 growing, 1 max, 2 destroying
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
        this.randMakeNew = this.stemObjects.length + Math.floor(Math.random() * 8 + 6);
    }
    
    getRandStemLength() {
        return Math.max(1, this.stemMax - this.stemObjects.length * 2);
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

    
    updateStemBranches() {
        
        // delete self if stop growing and delete self
        if (this.stemObjects.length == 0 && this.growing == 3 && this.deleteSelf) {
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
        
        // If stem size is one then set the ranomMakeNew
        if (this.stemObjects.length == 1) {
            this.setRandMakeNewStem();
        }
        
        
        
        if (this.growing == 0) {
            //console.log(this.randMakeNew);
            if (this.stemObjects.length == this.randMakeNew) {
                
                //console.log('make new stem');
                //console.log(this.stemTip().object.position);
                this.setRandMakeNewStem();
                const randLength = this.getRandStemLength();
                if (randLength > 10) {
                    //console.log(this.getRandStemLength());
                    this.stems.push(new Flower(randLength,
                                            this.stemTip().object.position,
                                            true,
                                            this.stemTip()));
                }
                
            }
        }
    }
    
    updateFlowers() {
        if (this.flowerObject) {
            this.flowerObject.update();
        }
    }
    
    update(size=null) {
        // console.log(this.growing);
        // update the stem size
        this.stemMax = size ? size : this.stemMax;
        
        this.updateStemBranches();
        if (this.deleted) {
            return;
        }
       
        // Growing and destroying
       if (this.growing == 0) {
           if (this.stemObjects.length >= this.stemMax) {
               //console.log('grow max');
               this.flowerObject = new FlowerPetals(this.stemTip(), this.stemObjects.length);
               this.growing = 1;
           } else {
               this.addObject();
           }
       } 
        
       // Creating flower
       if (this.growing == 1) {
           // creating flower
           
           
           if (!this.flowerObject.growing) {
                this.growing = 2;
           }
       }
       
       // max
       if (this.growing == 2) {
           if (growStop == false) {
               if (!this.flowerObject.shrink()) {
                   this.flowerObject.remove();
                    this.growing = 3;
               }
           }
       }
       
        // Destorying stem
       if (this.growing == 3) {
           if (this.stemObjects.length) {
               //console.log('trimming')
               this.trimStem();
           } else {
               this.growing = 0;
           }
       }
        
        if (!params.freezeRotation) {
            this.move();
        }
        
        
        this.updateFlowers();
        
    }
}

class BaseFlower {
    constructor() {
        this.stem = new Flower(params.size, new THREE.Vector3(0, -500, 0), false);
    }
    
    update() {
        if (this.stem.stemObjects.length == 0) {
            growStop = true;
        }
        this.stem.update(params.size);
    }
}




// -------------------------------------------------------------- load skybox
var cubeMap = new THREE.CubeTexture( [] );
cubeMap.format = THREE.RGBFormat;
var loader = new THREE.ImageLoader();
loader.load( 'images/skyboxsun25degtest.png', function ( image ) {
    var getSide = function ( x, y ) {
        var size = 1024;
        var canvas = document.createElement( 'canvas' );
        canvas.width = size;
        canvas.height = size;
        var context = canvas.getContext( '2d' );
        context.drawImage( image, - x * size, - y * size );
        return canvas;
    };
    cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
    cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
    cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
    cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
    cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
    cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
    cubeMap.needsUpdate = true;
} );
var cubeShader = THREE.ShaderLib[ 'cube' ];
cubeShader.uniforms[ 'tCube' ].value = cubeMap;
var skyBoxMaterial = new THREE.ShaderMaterial( {
    fragmentShader: cubeShader.fragmentShader,
    vertexShader: cubeShader.vertexShader,
    uniforms: cubeShader.uniforms,
    depthWrite: false,
    side: THREE.BackSide
} );
var skyBox = new THREE.Mesh(
    new THREE.BoxGeometry( 1000000, 1000000, 1000000 ),
    skyBoxMaterial
);
scene.add( skyBox );
			

            
            
// ----------------------------------------------------------  make water
const waterNormals = new THREE.TextureLoader().load( 'images/waternormals.jpg' );
waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
const water = new THREE.Water( renderer, camera, scene, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormals,
    alpha: 	1.0,
    sunDirection: pointLight.position.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 50.0
} );
const mirrorMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry( 500000, 500000 ),
    water.material
);
mirrorMesh.add( water );
mirrorMesh.rotation.x = - Math.PI * 0.5;
scene.add( mirrorMesh );
            
            
            

// Make the flower scene

class FlowerScene {
    constructor() {
        this.baseStem = new BaseFlower();
        this.render();
    }
    
    updateWater() {
        water.material.uniforms.time.value += params.wind * 2;
        water.render();
    }

    render() {
      stats.begin();
      // Update the stem
      this.baseStem.update();
        
      this.updateWater();
        
      updatePointLightPosition();
        
      renderer.render( scene, camera );
        
      stats.end();
      requestAnimationFrame( () => this.render() );
    }
}



const flowerScene = new FlowerScene();
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            