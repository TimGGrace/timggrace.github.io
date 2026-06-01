let winWidth = 250;
let winHeight = 250;
let canvas;
let outputGraph;

const min_tick = 0.05;

let PID;
let dialDisplay;
let simMass;
let simTarget;
let lastTimeStamp;
let time_since_update;
let init_time;

function setup() {
    time_since_update = 0;
    lastTimeStamp = Date.now();
    init_time = lastTimeStamp;
    
    PID = new PIDController();
    updateSliderValues();
    simMass = new massSystem();
    simTarget = 0;

    setupChartArea();

    let simWindow = select("#PIDSimWindow");
    let nudgeButton = select("#PIDNudge");
    let resetButton = select("#PIDReset");

    canvas = createCanvas(winWidth, winHeight);
    simWindow.child(canvas);
    canvas.textAlign(CENTER, CENTER);
    canvas.textSize(40);
    dialDisplay = new Dial(canvas);

    resetButton.mousePressed(resetSim);
    nudgeButton.mousePressed(nudgeSim);
}

function draw() {
    // Update time
    let currTimeStamp = Date.now();
    let dt = currTimeStamp - lastTimeStamp; // time in ms for THIS frame
    let frameDt = dt / 1000;                // time in seconds for THIS frame
    time_since_update += frameDt;

    updateTarget(time_since_update);

    // Pass the actual frame delta time here:
    let response = PID.Update(simMass.y, simTarget, frameDt);
    dialDisplay.Update(response);

    // And here:
    simMass.Update(response, frameDt);

    lastTimeStamp = currTimeStamp;

    // Only plot once per tick.
    if (time_since_update >= min_tick) {
        addToPlot(dt);
        time_since_update -= min_tick;
    }
}

function setupChartArea() {    
    let ctx = document.getElementById('PIDGraph').getContext('2d');

    outputGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [0],
            datasets: [
                {
                    name: "Target",
                    type: "line",
                    showInLegend:false,
                    data: [{x:0, y:simTarget}],
                    fill: false,
                    pointRadius:0,
                    lineDashType: "dash",
                    borderColor: '#C65315'
                },
                {
                    name: "Current Value",
                    type: "line",
                    showInLegend:false,
                    data: [{x:0, y:simMass.y}],
                    fill: false,
                    pointRadius:0,
                    lineDashType: "dash",
                    borderColor: '#5353B2'
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
                        text: 'Height (m)'
                    },
                    suggestedMax: 1,
                    suggestedMin: -1
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

function addToPlot(delta_t) {
    let new_time = lastTimeStamp + delta_t;
    let time_in_seconds = new_time/1000;
    outputGraph.data.labels.push(time_in_seconds);

    outputGraph.data.datasets[0].data.push({x:time_in_seconds, y:simTarget});

    outputGraph.data.datasets[1].data.push({x:time_in_seconds, y:simMass.y});

    while (time_in_seconds - outputGraph.data.labels[0] > 10) {
        outputGraph.data.labels.shift();
        outputGraph.data.datasets[0].data.shift();
        outputGraph.data.datasets[1].data.shift();
    }

    outputGraph.update();
}


function updateSliderValues() {
    PID.coeffs["P"] = parseFloat(document.getElementById("K_p").value);
    PID.coeffs["I"] = parseFloat(document.getElementById("K_i").value);
    PID.coeffs["D"] = parseFloat(document.getElementById("K_d").value);
}

function updateTarget(time_since_update) {
    let new_time = lastTimeStamp + time_since_update;
    let time_bounded = (new_time - init_time) % 10000;

    if (time_bounded < 2000) {
        simTarget = time_bounded / 4000;
    } else if (time_bounded < 4000){
        simTarget = 0.5;
    } else if (time_bounded < 5000){
        simTarget = 0.5 - 0.001 * (time_bounded - 4000);
    } else if (time_bounded < 7000){
        simTarget = -0.5;
    } else if (time_bounded < 8200 && time_bounded > 8000) {
        simTarget = (3 / 2000) * (time_bounded - 8000);
    } else if (time_bounded < 8400 && time_bounded > 8200) {
        simTarget = -(3 / 2000) * (time_bounded - 8400);
    } else {
        simTarget = 0;
    }
    
}

function nudgeSim() {
    simMas.y += Math.sign(random() - 0.5) * 0.5;
}


function resetSim() {
    simMass = new massSystem();
    time_since_update = 0;
    lastTimeStamp = Date.now();
    init_time = lastTimeStamp;
    PID = new PIDController();
    updateSliderValues();
    simTarget = updateTarget(0);

    outputGraph.data.labels = [0];
    outputGraph.data.datasets[0].data = [{x:0, y:simTarget}];
    outputGraph.data.datasets[1].data = [{x:0, y:simMass.y}];
    outputGraph.update();
}

class PIDController {
    maxOutput = 200;
    coeffs = {"P":0, "I": 0, "D": 0};
    constructor() {
        this.integralError = 0;
        this.previousError = 0;
        this.previousPos = 0; // 1. Track the last position
        this.output = 0;
    }

    Update(currentVal, target, dt) {
        let newError =  currentVal - target;
        
        // P:
        this.output = this.coeffs["P"] * newError;

        // I:
        this.integralError += newError * dt;
        this.output += this.coeffs["I"] * this.integralError;
        
        // D:
        let diffCurrentVal = (currentVal - this.previousPos) / dt;
        this.output += this.coeffs["D"] * diffCurrentVal;

        this.previousError = newError;
        this.previousPos = currentVal;

        return this.output;
        //return this.#Sigmoid(this.output);
    }

    // Maps to +/- maxOutput, aligning with y=x at 0.
    #Sigmoid(val) {
        return Math.atan(val * Math.PI / (2 * this.maxOutput)) * 2 * this.maxOutput / Math.PI;
    }
}
function degToRad(degrees) {return degrees * (Math.PI / 180);}

class massSystem {
    m = 5;
    k_s = 250;
    y = 0;
    curr_v = 0;
    
    Update(Thrust, delta_t) {
        
        let F = - Thrust - this.k_s * this.y + this.m * 9.81;
        let a = F / this.m;

        this.curr_v += a * delta_t;

        this.y += this.curr_v * delta_t;
    }
}

class Dial {
    constructor(canvas) {
        this.x = 250/2;
        this.y = 250 * 2/3;
        this.angle = 90;
        this.diameter = 100;
        this.canvas = canvas;
    }

    Update(position) {
        this.canvas.clear();
        this.canvas.background(200,180,200);
        
        this.canvas.strokeWeight(8);
        this.canvas.stroke(0);
        this.canvas.fill(200);
        
        this.canvas.ellipse(this.x,this.y, this.diameter);

        this.angle = 90 * (1 - position/2);

        this.canvas.line(
            this.x,
            this.y,
            this.x + 0.5*this.diameter * Math.sin(degToRad(this.angle)),
            this.y + 0.5*this.diameter * Math.cos(degToRad(this.angle))
        );
        
        let powerPercentage = Math.round(position * 10)/10;
        fill(0);
        noStroke();
        text(powerPercentage + "%", this.x, this.y + 30);
    }

}