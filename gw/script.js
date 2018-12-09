var mic, fft, col, img, scaley, scalex, f, fdot;
var greeting;
var message, fontsize = 10;
var started;
var img_height, img_width;

function setup() {
    frameRate(30);

    f = [];
    fdot = 0;

    started = true;

    message = "Start whistling!";
    textSize(fontsize);

    // fill(255,255,255);  // text is white
    // greeting = createElement('h2', 'Try to whistle.');
    // greeting.position(20, 5);
    //
    // textAlign(CENTER);
    // textSize(50);

    let canvas = createCanvas(window.innerWidth, window.innerHeight);
	// canvas.parent('myContainer');

	img_height = 200;//window.innerHeight/2
	img_width = 200;//window.innerWidth/2
    img = createImage(img_width, img_height);
    scaley=1;//Math.round(img_height/120);
    scalex=Math.round(img_width/240);

    // console.log(window.innerWidth, window.innerHeight);
    // console.log(canvas.height,canvas.width);
    // console.log(scale,scalex);

    img.loadPixels();
    for(var x = 0; x < img_width; x++) {
        for(var y = 0; y < img_height; y++) {
            // var a = map(0, 0, img.height, 255, 0);
            img.set(x, y, [0, 0, 0,0]);
        }
    }
    img.updatePixels();

    col = 0;
    noFill();

    mic = new p5.AudioIn();
    mic.start();
    fft = new p5.FFT(0.01, 1024);
    fft.setInput(mic);


    loop();
}


function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    // img.loadPixels();
    // img.resize(window.innerWidth, window.innerHeight);
    // scaley=Math.round(img.height/120);
    scalex=Math.round(img.width/240);

    // console.log(window.innerWidth, window.innerHeight);
    // console.log(canvas.height,canvas.width);
    // console.log(scale,scalex);

    //img.updatePixels();
}

function draw() {
    background(255);

    let spectrum = fft.analyze();
    let nyquist = 22050;

    fill(255,255,255);  // text is white
    textSize(20);
    let spec_max = Math.max(...spectrum.slice(6, 1024));
    let spec_i = 6 + spectrum.slice(6, 1024).indexOf(spec_max);
    let spec_f = 26.075*(spec_i) - 50.4; // stupid fit
    //var temp = _.indexOf(spectrum, _.max(spectrum));
    // text("centroid: "+round(spec_f)+" Hz " + round(spec_max), 10, 40);

    // image(img, 0, 0, window.innerWidth, window.innerHeight);
    image(img, 0, 0, window.innerWidth, window.innerHeight);
    img.loadPixels();

    for(let x = col*scalex; x < (col+1)*scalex; x++) {
        for (let y = 0; y < img.height / scaley; y++) {
            let a = map(spectrum[y + 6], 0, img.height, 255, 0);
            for (let i = 0; i < scaley; i++) {
                img.set(x, scaley * y + i, [0, 0, 0, a]);
            }
        }
    }

    for (let y = 0; y < img_height; y++) {
//        img.set((col+1)*scalex, y, [0, 255, 0, 255]);
        img.set((col+1)*scalex, y, [0, 255, 0, 255]);
    }


    if(spec_max>150) {
        for(let x = col*scalex; x < (col+1)*scalex; x++) {
            for (let i = 0; i < scaley; i++) {
                img.set(x, scaley * (spec_i - 6) + i, [255, 0, 0, 128]);
            }
        }
        f.push(spec_f)
    }
    else {
        if(f.length>3) {
            let estim = [];
            for(let i = 1; i < f.length; i++) {
                fdot = ((f[i]-f[i-1]) / (1.0/30.0));
                estim.push(Math.pow(f[i], -11./5.)*Math.pow(fdot,3./5.));
			}
            let esum = 0;
            let nesum = 0;
            for(let i = 0; i < estim.length; i++) {
                if(estim[i] > 0) {
                    esum = esum + estim[i];
                    nesum = nesum + 1;
                }
            }
            esum = esum / nesum;
            //https://en.wikipedia.org/wiki/Chirp_mass
            let M = 5523 * esum;
            // (speed of light)**3 / (gravitational constant) * (5/96*pi**(-8/3))**(3/5) in (solar mass / sec)
            let Msum = M / Math.pow(1./4.,3./5.);
            if(nesum > 0.0*(f.length-1)) {
                message = "It sounded like something merged in a \nM = " +
                    Math.round(Msum * 100) / 100 +
                    " Solar mass ";
                if(Msum > 1.4) {message += "Black Hole";}
                else {message += "Compact Object";}
            }
            else {
                message = "It sounded strange...";
            }
        }
        // else {
        //     if(f.length>2) {
        //         message = "Signal was too short... Try to be louder.";
        //     }
        // }
        f = [];
        fdot = [];

    }

    col++;

    if(col>img.width/scalex) col=0;

    img.updatePixels();

    text(message, 10, window.innerHeight-40);
}


function mousePressed() {
    if(started)  {
        noLoop();
        started = false;
    }
    else  {
        loop();
        started = true;
    }
}