let winWidth = 300;
let winHeight = 150;
let simRunning = true;
let canvas;
let outputGraph;


const heat_rate = 5;
const k_loss = 0.2;
const min_tick = 0.05;
let T_ambient;
let T_current;
let T_min;
let T_max;
let isHeating;
let last_time;
let init_time;
let time_since_update;

function setup() {
    T_ambient = 12;
    T_current = 12;
    isHeating = true;
    last_time = Date.now()/1000;
    init_time = Date.now()/1000;
    time_since_update = 0;
    getSliderValues();

    setupChartArea();

    let simWindow = select("#bangBangSimWindow");
    let playPauseButton = select("#bangBangPlayPause");
    let resetButton = select("#bangBangReset");

    canvas = createCanvas(winWidth, winHeight);
    simWindow.child(canvas);
    canvas.textAlign(CENTER, CENTER);
    canvas.textSize(40);

    drawOnOffButton();
    
    playPauseButton.html("Pause Sim");
    resetButton.html("Reset Sim");
    playPauseButton.mousePressed(playPause);
    resetButton.mousePressed(resetSim);
}

function draw() {
    updateHeating();

    let new_time = Date.now()/1000;
    let delta_t = new_time - last_time;
    time_since_update += delta_t;
    let heat_add = isHeating ? heat_rate : 0;
    
    let delta_T = (- k_loss * (T_current - T_ambient) + heat_add) * delta_t;

    T_current += delta_T;
    last_time = new_time;

    //Only plot once per tick.
    if (time_since_update >= min_tick) {
        addToPlot();
        time_since_update -= min_tick;
    }
    
}

function drawOnOffButton() {
    canvas.clear();
    canvas.background(200);
    
    canvas.stroke(0);
    canvas.strokeWeight(1);
    canvas.fill(240);
    canvas.quad(10,10,290,10,290,140,10,140);
    
    if (isHeating) {
        canvas.quad(12,12,150,12,150,138,12,138);
        canvas.fill(200);
        canvas.quad(150,12,290,5,290,131,150,138);
        canvas.fill(150);
        canvas.quad(150,138,290,131,290,138);
        canvas.text("ON",81,75);
    } else {
        canvas.quad(150,12,290,12,290,138,150,138);
        canvas.fill(200);
        canvas.quad(150,12,12,5,12,131,150,138);
        canvas.fill(150);
        canvas.quad(150,138,12,131,12,138);
        canvas.text("OFF",220,75);
    }

}

function setupChartArea() {    
    let ctx = document.getElementById('bangBangGraph').getContext('2d');

    outputGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [0],
            datasets: [
                {
                    name: "Ambient",
                    type: "line",
                    showInLegend:false,
                    data: [{x:0, y:T_ambient}],
                    fill: false,
                    pointRadius:0,
                    lineDashType: "dash",
                    borderColor: '#5353B2'
                },
                {
                    name: "T_min",
                    type: "line",
                    showInLegend:false,
                    data: [{x:0, y:T_min}],
                    fill: false,
                    pointRadius:0,
                    lineDashType: "dash",
                    borderColor: '#C65315'
                },
                {
                    name: "T_max",
                    type: "line",
                    showInLegend:false,
                    data: [{x:0, y:T_max}],
                    fill: false,
                    pointRadius:0,
                    lineDashType: "dash",
                    borderColor: '#C65315'
                },
                {
                    name: "Current",
                    data: [{x:0, y: T_ambient}],
                    fill: false,
                    tension: 0.4,
                    cubicInterpolationMode: 'monotone',
                    pointRadius:0,
                    borderColor: '#228B22',
                }
            ]
        },
        options: {
            animation: {
                duration: 0
            },
            plugins:{
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    },
                    max: 35,
                    min: 10
                },
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time (s)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 60,
                    ticks: {
                        callback: function(value, index, ticks) {
                            if (Math.floor(value) == value && Math.floor(value)%10 == 0) return value;
                        }
                    }
                }
            },
        }
    });

    outputGraph.render();
}

function addToPlot() {
    let new_time = last_time - init_time;

    outputGraph.data.labels.push(new_time);

    outputGraph.data.datasets[0].data.push({x:new_time, y:T_ambient});
    outputGraph.data.datasets[1].data.push({x:new_time, y:T_min});
    outputGraph.data.datasets[2].data.push({x:new_time, y:T_max});

    outputGraph.data.datasets[3].data.push({x:new_time, y:T_current});

    while (new_time - outputGraph.data.labels[0] > 500) {
        outputGraph.data.labels.shift();
        outputGraph.data.datasets[0].data.shift();
        outputGraph.data.datasets[1].data.shift();
        outputGraph.data.datasets[2].data.shift();
        outputGraph.data.datasets[3].data.shift();
    }

    outputGraph.update();
}

function updateHeating() {
    getSliderValues();
    if (isHeating && T_current > T_max) {
        isHeating = false;

    }
    if (!isHeating && T_current < T_min) {
        isHeating = true;
    }
    drawOnOffButton();
}

function getSliderValues() {
    T_min = document.getElementById("T_min").value;
    T_max = document.getElementById("T_max").value;
}


function playPause() {
    let playPauseButton = select("#bangBangPlayPause");

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

function resetSim() {
    T_ambient = 12;
    T_current = 12;
    isHeating = true;
    last_time = Date.now()/1000;
    init_time = Date.now()/1000;
    getSliderValues();

    outputGraph.clear();
    outputGraph.data.labels = [0];
    outputGraph.data.datasets[0].data = [{x:0, y:T_ambient}];
    outputGraph.data.datasets[1].data = [{x:0, y:T_min}];
    outputGraph.data.datasets[2].data = [{x:0, y:T_max}];
    outputGraph.data.datasets[3].data = [{x:0, y:T_current}];
    outputGraph.update();

    drawOnOffButton();
}