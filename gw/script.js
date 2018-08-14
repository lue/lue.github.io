var mic, fft, col, img, scaley, scalex, f, fdot;
var greeting;
var message, fontsize = 10;

function setup() {
    frameRate(30);

    f = [];
    fdot = 0;

    message = "";
    textSize(fontsize);

    // fill(255,255,255);  // text is white
    // greeting = createElement('h2', 'Try to whistle.');
    // greeting.position(20, 5);
    //
    // textAlign(CENTER);
    // textSize(50);

    var canvas = createCanvas(window.innerWidth, window.innerHeight);
    img = createImage(window.innerWidth, window.innerHeight);

    scaley=Math.round(canvas.height/240);
    scalex=Math.round(canvas.width/240);

    // console.log(window.innerWidth, window.innerHeight);
    // console.log(canvas.height,canvas.width);
    // console.log(scale,scalex);

    img.loadPixels();
    for(var x = 0; x < img.width; x++) {
        for(var y = 0; y < img.height; y++) {
            var a = map(0, 0, img.height, 255, 0);
            img.set(x, y, [0, 0, 0, a]);
        }
    }
    img.updatePixels();

    col = 0;
    noFill();

    mic = new p5.AudioIn();
    mic.start();
    fft = new p5.FFT(0.01, 1024);
    fft.setInput(mic);
}


function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    img.loadPixels();
    img.resize(window.innerWidth, window.innerHeight);
    scaley=Math.round(window.innerHeight/240);
    scalex=Math.round(window.innerWidth/240);

    // console.log(window.innerWidth, window.innerHeight);
    // console.log(canvas.height,canvas.width);
    // console.log(scale,scalex);

    img.updatePixels();
}

function draw() {
    background(255);

    var spectrum = fft.analyze();
    var nyquist = 22050;

    fill(255,255,255);  // text is white
    textSize(20);
    var spec_max = Math.max(...spectrum.slice(6, 1024));
    let spec_i = 6 + spectrum.slice(6, 1024).indexOf(spec_max);
    var spec_f = 26.075*(spec_i) - 50.4; // stupid fit
    //var temp = _.indexOf(spectrum, _.max(spectrum));
    // text("centroid: "+round(spec_f)+" Hz " + round(spec_max), 10, 40);

    image(img, 0, 0);
    img.loadPixels();

    for(var x = col*scalex; x < (col+1)*scalex; x++) {
        for (var y = 0; y < img.height / scaley; y++) {
            var a = map(spectrum[y + 6], 0, img.height, 255, 0);
            for (var i = 0; i < scaley; i++) {
                img.set(x, scaley * y + i, [0, 0, 0, a]);
            }
        }
    }

    for (var y = 0; y < img.height; y++) {
        img.set((col+1)*scalex, y, [0, 255, 0, 255]);
    }


    if(spec_max>190) {
        for(var x = col*scalex; x < (col+1)*scalex; x++) {
            for (var i = 0; i < scaley; i++) {
                img.set(x, scaley * (spec_i - 6) + i, [255, 0, 0, 128]);
            }
        }
        f.push(spec_f)
    }
    else {
        if(f.length>5) {
            var estim = [];
            // var temp = 0;
            for(var i = 1; i < f.length; i++) {
                fdot = ((f[i]-f[i-1]) / (1.0/30.0));
                estim.push(Math.pow(f[i], -11./5.)*Math.pow(fdot,3./5.));
            }
            var esum = 0;
            var nesum = 0;
            for(var i = 0; i < estim.length; i++) {
                if(estim[i] > 0) {
                    esum = esum + estim[i];
                    nesum = nesum + 1;
                }
            }
            esum = esum / nesum;
            //https://en.wikipedia.org/wiki/Chirp_mass
            var M = 5523 * esum;
            var Msum = M * Math.pow(4,5/3);
            // (speed of light)**3 / (gravitational constant) * (5/96*pi**(-8/3))**(3/5) in (solar mass / sec)
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
        else {
            if(f.length>0) {
                message = "Signal was too short... Try to be louder.";
            }
        }
        f = [];
        fdot = [];

    }


    col++;
    if(col>img.width/scalex) col=0;
    img.updatePixels();

    text(message, 10, 20);
}
