let winWidth = 400;
let winHeight = 400;
let inCount = 0;
let totalCount = 0;
let simRunning = true;
let canvas;
let outputGraph;

function setup() {
    let simWindow = select("#piSimWindow");
    let playPauseButton = select("#piPlayPause");
    let resetButton = select("#piReset");
    
    setupChartArea();

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

    outputGraph.data.labels.push(totalCount);
    outputGraph.data.datasets[0].data.push({x:totalCount, y:Math.PI});
    outputGraph.data.datasets[1].data.push({x:totalCount, y:piApprox});
    outputGraph.update();
}

function resetSim() {
    canvas.clear();
    drawBase();
    inCount = 0;
    totalCount = 0;
    setupDisplay();

    outputGraph.data.labels = [0];
    outputGraph.data.datasets[0].data = [{x:0, y:Math.PI}];
    outputGraph.data.datasets[1].data = [{x:0, y:0}];
    
    outputGraph.render();
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
    let playPauseButton = select("#piPlayPause");

    if (simRunning) {
        noLoop();
        playPauseButton.html("Resume Sim");
    }
    else {
        loop();
        playPauseButton.html("Pause Sim");
    }

    simRunning = !simRunning;
}

function setupChartArea() {    
    let ctx = document.getElementById('errorOutput').getContext('2d');

    outputGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [0],
            datasets: [
                {
                    type: "line",
                    showInLegend:false,
                    data: [{x:0, y:Math.PI}],
                    fill: false,
                    pointRadius:0,
                    lineDashType: "dash",
                },
                {
                    name: "Approximation",
                    data: [{x:0, y: 0}],
                    fill: false,
                    tension: 0.4,
                    cubicInterpolationMode: 'monotone',
                    pointRadius:0,
                }
            ]
        },
        options: {
            animation: {
                duration: 0
            },
            plugins:{legend: {
                display: false
            }},
            scales: {
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Estimated Value'
                    },
                    max: 4,
                    min: 0
                },
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Number of Points'
                    },
                    min: 0,
                    suggestedMax: 1000

                }
            },
        }
    });

    outputGraph.render();
}