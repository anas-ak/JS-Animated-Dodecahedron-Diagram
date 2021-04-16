console.clear();
const dims = new Vec2(500, 500);
const correct = p => p.addNew(dims.scaleNew(.5));

const Rad2Deg = 180/Math.PI;

const mat_world = new Mat4();
const camera = new Vec3(0.35, -0.16, -1);
const camera_o = new Vec3(0.35, -0.16, -1).normalise().scale(1);
const lookAt = new Vec3(0, 0, 0);
const up = new Vec3(0,1,0);
let mat_proj = Mat4.perspective(2., dims.x/dims.y, 0.01, 1000.);
let mat_view, mat_transform, FOV;
const scale = dims.y * .01;

const orbit = new Quat();

const run = () => {
    requestAnimationFrame(run);

    orbit.rotateX(.005);
    orbit.rotateY(.002);

    const m = Mat3.fromQuat(orbit);
    camera.resetToVector(camera_o.transformByMat3New(m));
    calculateTransform();
    draw();
}

setTimeout(() => {
    run();
}, 10)

const calculateTransform = () => {
    mat_view = Mat4.lookAt(
        camera,
        lookAt,
        up 
    );
    FOV = Math.atan(1 / mat_proj.all ) * 2.0 * Rad2Deg;
    FOV = dims.x * 0.6;
}

let moving = false;
window.addEventListener('pointerdown', (e) => { moving = true; });
window.addEventListener('pointerup', (e) => { moving = false; })
window.addEventListener('pointermove', (e) => { 
    const p = e.clientY / window.innerHeight;
    camera_o.normalise().scale((p)*159 + 1)
    mat_proj = Mat4.perspective(2. - p * 1.5, dims.x/dims.y, 0.01, 1000.)
});

class Vertex {
    constructor(x, y, z) {
        if(x instanceof Vec3) {
            this.position = x.divideScalar(scale);
          } else {
            this.position = (new Vec3(x, y, z)).divideScalar(scale);
          }
          
          this.radius = 10.;
          this.scale = 0.;
    }

    get screenPosition() {
        const pos = new Vec4(this.position.x, this.position.y, this.position.z, 1.);
        pos.transformByMat4(mat_view);
        pos.transformByMat4(mat_world);
        pos.transformByMat4(mat_proj);

        this.scale = FOV / ( FOV + pos.z * scale );
        return new Vec2(pos.x * this.scale, pos.y * this.scale).scale(scale);
    }
}

class Dodecahedron {
    constructor(r) {
      r = r || 0.5;
  
      var phi = (1 + Math.sqrt(5)) / 2;
      var a = 0.5;
      var b = 0.5 * 1 / phi;
      var c = 0.5 * (2 - phi);
  
      this.vertices = [
        new Vec3( c,  0,  a),
        new Vec3(-c,  0,  a),
        new Vec3(-b,  b,  b),
        new Vec3( 0,  a,  c),
        new Vec3( b,  b,  b),
        new Vec3( b, -b,  b),
        new Vec3( 0, -a,  c),
        new Vec3(-b, -b,  b),
        new Vec3( c,  0, -a),
        new Vec3(-c,  0, -a),
        new Vec3(-b, -b, -b),
        new Vec3( 0, -a, -c),
        new Vec3( b, -b, -b),
        new Vec3( b,  b, -b),
        new Vec3( 0,  a, -c),
        new Vec3(-b,  b, -b),
        new Vec3( a,  c,  0),
        new Vec3(-a,  c,  0),
        new Vec3(-a, -c,  0),
        new Vec3( a, -c,  0)
      ];
  
      this.vertices = this.vertices.map(function(v) { return new Vertex(v.normalise().scale(r)); })
  
      this.faces = [
        [  4,  3,  2,  1,  0 ],
        [  7,  6,  5,  0,  1 ],
        [ 12, 11, 10,  9,  8 ],
        [ 15, 14, 13,  8,  9 ],
        [ 14,  3,  4, 16, 13 ],
        [  3, 14, 15, 17,  2 ],
        [ 11,  6,  7, 18, 10 ],
        [  6, 11, 12, 19,  5 ],
        [  4,  0,  5, 19, 16 ],
        [ 12,  8, 13, 16, 19 ],
        [ 15,  9, 10, 18, 17 ],
        [  7,  1,  2, 17, 18 ]
      ];
    }
    
    render() {
      this.faces.forEach(face => {
        const facePath = new paper.Path();
        facePath.strokeColor = 'lime';
        facePath.strokeWidth = .3;
        face.forEach( (p, i) => {
          const vertex = this.vertices[p];
          const pos = correct(vertex.screenPosition);
          
          if(i == 0) {
            facePath.moveTo(pos);
          } else {
            facePath.lineTo(pos);
          }
        } );
        facePath.closePath();
      });
    }
  }
  
  const mydodeca = new Dodecahedron(220);
  
  const draw = () => {
    paper.project.clear();
    
    const border = new paper.Path.Rectangle([20, 20], dims.subtractScalarNew(10));
    border.strokeColor = 'lime';
        border.strokeWidth = .3;
    
    const cam = camera.clone();
    for(var i = 0; i < 5; i++) {
      const d = i / 5 * Math.PI * 2;
      const c = Math.cos(d);
      const s = Math.sin(d);
      camera.x += s*.04;
      camera.y += c*.04;
      calculateTransform();
      
      mydodeca.render();
      mydodeca.vertices.forEach(vert => {
        const pos = correct(vert.screenPosition);
        const c = new paper.Path.Circle(pos, vert.radius * vert.scale);
        c.strokeColor = 'lime';
      })
    }
    camera.resetToVector(cam);
    lookAt.reset(0,0,0);
    calculateTransform();
  
    // Draw the view now:
    paper.view.draw();
  }
  
  const randomBetween = (min, max) => {
    return Math.random() * (max - min) + min;
  }
  
  
  const hatch = (outline, d, width) => {
    const hatching = new paper.CompoundPath();
    const hatchPath = new paper.CompoundPath();
    
    const x = outline.bounds.x,
          y = outline.bounds.y,
          w = outline.bounds.width,
          h = outline.bounds.height;
  
    const length = Math.hypot(w, h);
    
    const start = new Vec2(Math.sin(d) * length, Math.cos(d) * length);
    const pointer = new Vec2(x - Math.cos(d) * length, y - Math.sin(d) * length);
    
    hatching.moveTo(pointer.x + start.x, pointer.y - start.y);
    
    let _i = 0;
    for (let i = 0; i < length * 2; i += width) {
      hatching.moveTo([pointer.x + start.x, pointer.y - start.y]);
      hatching.lineTo([pointer.x - start.x, pointer.y + start.y]);
      
      pointer.add(new Vec2(Math.cos(d) * width, Math.sin(d) * width));
      
      _i++;
    }
    
    var intersections = hatching.getIntersections(outline);
    for (var i = 0; i < intersections.length; i++) {
      if(i % 2 === 0) {
        hatchPath.moveTo(intersections[i].point);
      } else {
        hatchPath.lineTo(intersections[i].point);
      }

    }
    
    // clean up
    hatching.remove();
    
    return hatchPath;
  }
  
  const setup = () => {
    const defs = {};
    
    // Create the canvas
    const c = document.createElement('canvas');
    c.width = dims.x;
    c.height = dims.y;
    document.body.querySelector('.container').appendChild(c);
    
    // Create an empty project and a view for the canvas:
    defs.t = new paper.Project(c);
  
    defs.originals = new paper.Group({ insert: false }); // Don't insert in DOM.
    defs.content = new paper.Group(); // Don't insert in DOM.
    defs.canvas = c;
    
    return defs;
  }
  
  const defs = setup();
  defs.canvas.addEventListener('click', (e) => draw());
  draw();

