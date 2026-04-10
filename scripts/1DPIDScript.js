let winWidth = 250;
let winHeight = 250;
let canvas;
let outputGraph;


const k_Power = 100;
const k_loss = 0.02;
const min_tick = 0.05;

let PID;
let dialDisplay;
let target;
let currentVal;
let lastTimeStamp;
let time_since_update;
let T_ambient;
let init_time;

function setup() {
    T_ambient = 12;
    time_since_update = 0;
    
    lastTimeStamp = Date.now();
    init_time = Date.now();
    currentVal = 10;
    PID = new PIDController();
    updateSliderValues();

    setupChartArea();

    let simWindow = select("#PIDSimWindow");
    let nudgeButton = select("#PIDNudge");
    let resetButton = select("#PIDReset");

    canvas = createCanvas(winWidth, winHeight);
    simWindow.child(canvas);
    canvas.textAlign(CENTER, CENTER);
    canvas.textSize(40);
    dialDisplay = new Dial(canvas);


    resetButton.html("Reset Sim");
    resetButton.mousePressed(resetSim);
    nudgeButton.html("Nudge Sim");
    nudgeButton.mousePressed(nudgeSim);
}

function draw() {
    let currTimeStamp = Date.now();
    let dt = currTimeStamp - lastTimeStamp;
    time_since_update += dt / 1000;

    let response = PID.Update(currentVal);
    dialDisplay.Update(response);

    
    
    let dT = (- k_loss * (currentVal - T_ambient) + k_Power * response) * dt/1000;

    currentVal += dT;
    lastTimeStamp = currTimeStamp;

    //Only plot once per tick.
    if (time_since_update >= min_tick) {
        addToPlot();
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
                    data: [{x:0, y:PID.target}],
                    fill: false,
                    pointRadius:0,
                    lineDashType: "dash",
                    borderColor: '#C65315'
                },
                {
                    name: "Current Value",
                    type: "line",
                    showInLegend:false,
                    data: [{x:0, y:currentVal}],
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
                        text: 'Temperature (°C)'
                    },
                    suggestedMax: 45,
                    min: 0
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
    let new_time = lastTimeStamp - init_time;

    outputGraph.data.labels.push(new_time);

    outputGraph.data.datasets[0].data.push({x:new_time/1000, y:PID.target});

    outputGraph.data.datasets[1].data.push({x:new_time/1000, y:currentVal});

    while (new_time - outputGraph.data.labels[0] > 5000) {
        outputGraph.data.labels.shift();
        outputGraph.data.datasets[0].data.shift();
        outputGraph.data.datasets[1].data.shift();
    }

    outputGraph.update();
}


function updateSliderValues() {
    PID.coeffs["P"] = document.getElementById("K_p").value;
    PID.coeffs["I"] = document.getElementById("K_i").value;
    PID.coeffs["D"] = document.getElementById("K_d").value;
    PID.target = document.getElementById("Target").value;
    target = PID.target;
}

function nudgeSim() {
    currentVal = random(10,40);
}

function resetSim() {
    time_since_update = 0;
    lastTimeStamp = Date.now();
    init_time = lastTimeStamp;
    currentVal = 10;
    PID = new PIDController();
    updateSliderValues();

    outputGraph.data.labels = [0];
    outputGraph.data.datasets[0].data = [{x:0, y:PID.target}];
    outputGraph.data.datasets[1].data = [{x:0, y:currentVal}];
    outputGraph.update();
}

class PIDController {
    
    constructor() {
        this.coeffs = {"P":0, "I": 0, "D": 0};
        this.integralError = 0;
        this.previousError = 0;
        this.target = 0;
        this.output = 0;
        this.currTime = Date.now();
    }

    Update(currentVal){
        let now = Date.now();
        let dt = (now - this.currTime) / 1000; // In seconds

        // P
        let newError =  this.target - currentVal;
        this.output = this.coeffs["P"] * newError;

        //I
        this.integralError += newError * dt;
        this.output += this.coeffs["I"] * this.integralError;
        
        //D
        let diffError = (this.previousError - newError) / dt;
        this.output += this.coeffs["D"] * diffError;

        //Update internal values
        this.previousError = newError;
        this.currTime = now;
        
        // console.log("PID Values: \n"
        //     +"Curr: "+currentVal+"\n"
        //     +"Err: "+this.previousError+"\n"
        //     +"PID: [P: "+this.coeffs["P"]+", I:"+this.coeffs["I"]+", D:"+this.coeffs["D"]+"]\n"
        //     +"TDiff: "+dt+", Response: "+this.#Sigmoid(this.output));

        return this.#Sigmoid(this.output);

        
    }

    //Maps to +/- 1
    #Sigmoid(val) {
        return Math.atan(val*2) * 2 / Math.PI;
    }
}
function degToRad(degrees) {return degrees * (Math.PI / 180);}

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

        this.angle = 90 * (1 - position);

        this.canvas.line(
            this.x,
            this.y,
            this.x + this.radius * Math.sin(degToRad(this.angle)),
            this.y + this.radius * Math.cos(degToRad(this.angle))
        );
        
        let powerPercentage = Math.round(position * 10)/10;
        fill(0);
        noStroke();
        text(powerPercentage + "%", this.x, this.y + 30);
    }

}