var distances = [];
var maxDistance;
var spacer;
var nj = require('numjs');
var global_step;
var img_ref;

function setup() {
  N = 128;
  scale = 4


  resizeCanvas(window.innerWidth, window.innerHeight);
  scale = Math.min(window.innerWidth/N, window.innerHeight/N);
  // fft = new p5.FFT();
  maxDistance = dist(width/2, height/2, width, height);

  icfield();



  img = createImage(width, height);
  // img.loadPixels();
  // for(var x = 0; x < N; x++) {
  //   for(var y = 0; y < N; y++) {
  //     img.set(x, y, [ic.get(x,y,0)*16+128, ic.get(x,y,0)*16+128, ic.get(x,y,0)*16+128, 255]);
  //     // img.set(x, y, [k.get(x,y)*64+128, k.get(x,y,0)*64+128, k.get(x,y,0)*64+128, 255]);
  //       // img.set(x, y, [128,128,255, 255]);
  //   }
  // }
  // img.updatePixels();


  // xp = nj.array([N/2, N/2]);
  // yp = nj.array([N/4, N/2]);
  //
  // vxp = nj.array([-0.1, 0.1,0,0]);
  // vyp = nj.array([0, 0,0,0]);

  // for(var i = 0; i<Np; i++){
  //   xp.set(i, Math.random() * N);
  //   yp.set(i, Math.random() * N);
  // }

  c2i00 = nj.zeros(xp.shape)//, 'uint8')
  c2i01 = nj.zeros(xp.shape)//, 'uint8')
  c2i10 = nj.zeros(xp.shape)//, 'uint8')
  c2i11 = nj.zeros(xp.shape)//, 'uint8')

  y00 = nj.zeros(xp.shape)
  y01 = nj.zeros(xp.shape)
  y10 = nj.zeros(xp.shape)
  y11 = nj.zeros(xp.shape)

  spacer = 16;
  global_step = 0;
  // noLoop();  // Run once and stop
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  scale = Math.min(window.innerWidth/N, window.innerHeight/N);
}

function icfield() {
  phi0 = nj.zeros([N,N]);

  // generating random variables
  a = nj.random([N,N]);
  b = nj.random([N,N]);
  z0 = nj.log(a).multiply(-2).pow(0.5).multiply(nj.cos(b.multiply(2.0*3.1415)));
  z1 = nj.log(b).multiply(-2).pow(0.5).multiply(nj.cos(a.multiply(2.0*3.1415)));
  // console.log(z0.get(50,50));
  // console.log(img_ref.get(50,50));
  //   for(var x = 0; x < N; x++) {
  //     for(var y = 0; y < N; y++) {
  //       z0.set(x,y,z0.get(x,y)-0.0015*img_ref.get(x,y)[0]);
  //       z1.set(x,y,z1.get(x,y)-0.0015*img_ref.get(x,y)[0]);
  //     }
  //   }
  //   console.log(z0.get(50,50));

  ic = nj.stack([z0,z1],-1)

  k = nj.zeros([N,N]);
  potential = nj.zeros([N,N]);
  xp = nj.zeros(2);
  xp = nj.zeros(2);
  vxp = nj.zeros(N*N);
  vyp = nj.zeros(N*N);

  for(var x = 0; x < N; x++) {
    for(var y = 0; y < N; y++) {
      kx = x;
      ky = y;
      if (kx>N/2-1) {
        kx = kx-N;
      }
      if (ky>N/2-1) {
        ky = ky-N;
      }
      potential.set(x,y,1./sqrt(kx*kx+ky*ky+2));
      k.set(x,y,2.0*3.1415*sqrt(kx*kx+ky*ky)/N);
    }
  }
  k.set(0,0,1);

  ic_fft = nj.fft(ic);

  pk = k.pow(-1.2);
  // for(var x = 0; x < N; x++) {
  //   for(var y = 0; y < N; y++) {
  //       kk = k.get(x,y)
  //       pk.set(x,y,kk*(1-Math.exp(1./kk)))
  //   }
  // }

  for(var x = 0; x < N; x++) {
    for(var y = 0; y < N; y++) {
        ic_fft.set(x,y,0,ic_fft.get(x,y,0)*pk.get(x,y));
        ic_fft.set(x,y,1,ic_fft.get(x,y,1)*pk.get(x,y));
    }
  }

  Np = N*N;
  xp = nj.zeros(Np);
  yp = nj.zeros(Np);
  vxp = nj.zeros(Np);
  vyp = nj.zeros(Np);

  for(var x = 0; x < N; x++) {
    for(var y = 0; y < N; y++) {
        xp.set(x*N+y,x+0.5);
        yp.set(x*N+y,y+0.5);
    }
  }

  ic = nj.ifft(ic_fft);
  a = 0.01;
  ic_fft_t = nj.zeros([N,N,2]);
// X displacements
  for(var x = 0; x < N; x++) {
    for(var y = 0; y < N; y++) {
        ix = 1.*x;
        if(ix>N/2){ix=ix-N}
        iy = 1.*y;
        if(iy>N/2){iy=iy-N}
        t1 = a*ic_fft.get(x,y,0)*ix/k.get(x,y)/k.get(x,y);
        t2 = a*ic_fft.get(x,y,1)*ix/k.get(x,y)/k.get(x,y);
        ic_fft_t.set(x,y,0,t2);
        ic_fft_t.set(x,y,1,-t1);
    }
  }
  sx=nj.ifft(ic_fft_t);
  // sx=sx.slice(null,null,[0,1])
  for(var x = 0; x < N; x++) {
    for(var y = 0; y < N; y++) {
      xp.set(x*N+y,xp.get(x*N+y)+sx.get(x,y,0)*a);
      xp.get(x*N+y)
    }
  }
// Y displacements
for(var x = 0; x < N; x++) {
  for(var y = 0; y < N; y++) {
      ix = 1.*x;
      if(ix>N/2){ix=ix-N}
      iy = 1.*y;
      if(iy>N/2){iy=iy-N}
      t1 = a*ic_fft.get(x,y,0)*iy/k.get(x,y)/k.get(x,y);
      t2 = a*ic_fft.get(x,y,1)*iy/k.get(x,y)/k.get(x,y);
      ic_fft.set(x,y,0,t2);
      ic_fft.set(x,y,1,-t1);
  }
}
sy=nj.ifft(ic_fft);
for(var x = 0; x < N; x++) {
  for(var y = 0; y < N; y++) {
    yp.set(x*N+y,yp.get(x*N+y)+sy.get(x,y,0)*a);
    yp.get(x*N+y)
  }
}





  for(var i = 0; i < xp.shape[0]; i++){
    if( xp.get(i)>N){xp.set(i, xp.get(i)-N)}
    if( xp.get(i)<0){xp.set(i, xp.get(i)+N)}
    if( yp.get(i)>N){yp.set(i, yp.get(i)-N)}
    if( yp.get(i)<0){yp.set(i, yp.get(i)+N)}
  }

}

function mouseClicked() {
  global_step = 0;
  icfield();
  Loop();
}


function draw() {
  background(0);
  // This embedded loop skips over values in the arrays based on
  // the spacer variable, so there are more values in the array
  // than are drawn here. Change the value of the spacer variable
  // to change the density of the points

  // image(a, 0, 0);
  mdens = nj.zeros(N*N)
  global_step += 1;
  // Evaluate "cloud in cell" coefficients
  // and assign densities on a grid mdens
  for(var i = 0; i < xp.shape[0]; i++){
    x = Math.floor(xp.get(i));
    y = Math.floor(yp.get(i));
    dx = xp.get(i) % 1;
    dy = yp.get(i) % 1;
    tx = 1. - dx;
    ty = 1. - dy;
    y00.set(i, tx*ty)
    y10.set(i, dx*ty)
    y01.set(i, tx*dy)
    y11.set(i, dx*dy)
    if( x+1 > N-1 ){
      if( y+1 > N-1 ){
        c2i00.set(i, x*N+y);
        c2i10.set(i, y);
        c2i01.set(i, x*N+0);
        c2i11.set(i, 0);
      } else {
        c2i00.set(i, x*N+y);
        c2i10.set(i, y);
        c2i01.set(i, x*N+y+1);
        c2i11.set(i, y+1);
      }
    } else {
      if( y+1 > N-1 ){
        c2i00.set(i, x*N+y);
        c2i10.set(i, (1+x)*N+y);
        c2i01.set(i, x*N);
        c2i11.set(i, (1+x)*N);
      } else {
        c2i00.set(i, x*N+y);
        c2i10.set(i, (1+x)*N+y);
        c2i01.set(i, x*N+y+1);
        c2i11.set(i, (1+x)*N+y+1);
      }
    }
    mdens.set(c2i00.get(i), mdens.get(c2i00.get(i)) + y00.get(i));
    mdens.set(c2i10.get(i), mdens.get(c2i10.get(i)) + y10.get(i));
    mdens.set(c2i01.get(i), mdens.get(c2i01.get(i)) + y01.get(i));
    mdens.set(c2i11.get(i), mdens.get(c2i11.get(i)) + y11.get(i));
  }
  // reshpaing mdens to 2d array
  mdens = mdens.reshape([N,N]);

  // Evaluating potential
  phi0 = (nj.convolve(mdens, potential));

  // Evaluating forces
  fx = nj.zeros([N,N]);
  fy = nj.zeros([N,N]);

  for(var i = 1; i < N-1; i++){
    fy.slice(null, [i,i+1]).assign(phi0.slice(null, [i+1,i+2]).subtract(phi0.slice(null, [i-1,i])), false);
    fx.slice([i,i+1], null).assign(phi0.slice([i+1,i+2], null).subtract(phi0.slice([i-1,i], null)), false);
  }
  i = 0;
  fy.slice(null, [i,i+1]).assign(phi0.slice(null, [i+1,i+2]).subtract(phi0.slice(null, [N-1, N])), false);
  fx.slice([i,i+1], null).assign(phi0.slice([i+1,i+2], null).subtract(phi0.slice([N-1, N], null)), false);
  i = N;
  fy.slice(null, [i,i+1]).assign(phi0.slice(null, [0,1]).subtract(phi0.slice(null, [0,1])), false);
  fx.slice([i,i+1], null).assign(phi0.slice([0,1], null).subtract(phi0.slice([0,1], null)), false);

  // Reshaping grid forces to 1D
  fx = fx.reshape(N*N);
  fy = fy.reshape(N*N);

  // Forces on particles
  pax = nj.zeros(xp.shape[0]);
  pay = nj.zeros(yp.shape[0]);

  dt = .1;
  for(var i = 0; i < xp.shape[0]; i++){
    pax.set(i, fx.get(c2i00.get(i))*y00.get(i)+
               fx.get(c2i10.get(i))*y10.get(i)+
               fx.get(c2i01.get(i))*y01.get(i)+
               fx.get(c2i11.get(i))*y11.get(i));
    pay.set(i, fy.get(c2i00.get(i))*y00.get(i)+
              fy.get(c2i10.get(i))*y10.get(i)+
              fy.get(c2i01.get(i))*y01.get(i)+
              fy.get(c2i11.get(i))*y11.get(i));
    vxp.set(i, vxp.get(i)+pax.get(i)*dt)
    vyp.set(i, vyp.get(i)+pay.get(i)*dt)
    xp.set(i, xp.get(i)+vxp.get(i)*dt)
    yp.set(i, yp.get(i)+vyp.get(i)*dt)
    if( xp.get(i)>N){xp.set(i, xp.get(i)-N)}
    if( xp.get(i)<0){xp.set(i, xp.get(i)+N)}
    if( yp.get(i)>N){yp.set(i, yp.get(i)-N)}
    if( yp.get(i)<0){yp.set(i, yp.get(i)+N)}

  }
  // console.log(xp.get(0));

  // Update image
  img.loadPixels();
    for (var x = 0; x < N; x += 1) {
      for (var y = 0; y < N; y += 1) {
        img.set(x, y, mdens.get(x,y,0)*128+128);
      }
    }
    // for (var x = 0; x < xp.shape; x += 1) {
    //   img.set(xp.get(x)*scale, yp.get(x)*scale, [255,255,255,255]);
    // }
    stroke(255);
    for (var x = 0; x < xp.shape; x += 1) {
      point(xp.get(x)*scale, yp.get(x)*scale);
    }
    img.updatePixels();
  image(img, 0, 0);

  if(global_step>50){noLoop()}
}
