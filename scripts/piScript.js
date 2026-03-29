let winWidth = 400;
let winHeight = 400;
let inCount = 0;
let totalCount = 0;
let simRunning = true;
let canvas;
function setup() {
    let simWindow = select("#simWindow");
    let playPauseButton = select("#playPause");
    let resetButton = select("#reset");

    canvas = createCanvas(winWidth, winHeight);
    simWindow.child(canvas);

    playPauseButton.mousePressed(playPause);
    resetButton.mousePressed(resetSim);

    setupDisplay();
    drawBase();
    playPauseButton.html("Pause Sim");
    resetButton.html("Reset Sim");
}
function draw() {
    for (let i=0;i<10;i++){
        addPoint();
    }
    updateDisplay();
}
function getTextElements () {
    return [select('#displayInCount'), select('#displayTotalCount'), select('#displayProp'), select('#displayPi')];
}
function setupDisplay() {
    [inCountDiv, totalCountDiv, propDiv, piDiv] = getTextElements();

    inCountDiv.html("In: 0");
    totalCountDiv.html("Total: 0");
    propDiv.html("Proportion: 0");
    piDiv.html("Pi Approximation: 0");
}
function updateDisplay() {
    [inCountDiv, totalCountDiv, propDiv, piDiv] = getTextElements();

    inCountDiv.html("In: "+inCount);
    totalCountDiv.html("Total: "+totalCount);
    let prop = inCount / totalCount;
    let piApprox = prop * 4;
    propDiv.html("Proportion: "+prop.toFixed(15));
    piDiv.html("Pi Approximation: "+piApprox.toFixed(15));
}

function resetSim() {
    canvas.clear();
    drawBase();
    inCount = 0;
    totalCount = 0;
    setupDisplay();
}

function drawBase() {
    strokeWeight(1);
    fill(150);
    square(0,0,400);
    fill(200);
    circle(200,200,400);
}

function addPoint() {
    strokeWeight(0);
    totalCount += 1;
    let x = random(0,400);
    let y = random(0,400);
    if ((x - 200)*(x-200) + (y-200)*(y-200) > 200*200) {
        fill("red");
    }
    else {
        fill("green");
        inCount += 1;
    }
    circle(x, y, 2);
}

function playPause() {
    if (simRunning) noLoop();
    else loop();

    simRunning = !simRunning;
}