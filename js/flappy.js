const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

canvas.width=420;
canvas.height=600;

const gravity=0.45;
const jump=-8;

let score=0;
let gameOver=false;

const bird={

x:80,
y:250,
w:30,
h:30,
velocity:0

};

const pipes=[];
const gap=160;

function addPipe(){

const topHeight=Math.random()*250+50;

pipes.push({

x:canvas.width,
top:topHeight,
bottom:topHeight+gap,
passed:false

});

}

setInterval(()=>{

if(!gameOver)
addPipe();

},1800);

function drawBird(){

ctx.fillStyle="yellow";

ctx.beginPath();

ctx.arc(
bird.x,
bird.y,
15,
0,
Math.PI*2
);

ctx.fill();

ctx.fillStyle="black";

ctx.beginPath();

ctx.arc(
bird.x+6,
bird.y-5,
2,
0,
Math.PI*2
);

ctx.fill();

}

function drawPipes(){

ctx.fillStyle="#1ca300";

pipes.forEach(pipe=>{

ctx.fillRect(
pipe.x,
0,
60,
pipe.top
);

ctx.fillRect(
pipe.x,
pipe.bottom,
60,
canvas.height-pipe.bottom
);

});

}

function update(){

bird.velocity+=gravity;
bird.y+=bird.velocity;

pipes.forEach(pipe=>{

pipe.x-=3;

if(
bird.x+15>pipe.x &&
bird.x-15<pipe.x+60 &&
(
bird.y-15<pipe.top ||
bird.y+15>pipe.bottom
)
){

endGame();

}

if(!pipe.passed && pipe.x+60<bird.x){

pipe.passed=true;
score++;

document.getElementById("score").innerText=
"Score : "+score;

}

});

while(pipes.length && pipes[0].x<-70){

pipes.shift();

}

if(bird.y>canvas.height || bird.y<0){

endGame();

}

}

function draw(){

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

drawPipes();
drawBird();

}

function loop(){

if(gameOver)return;

update();
draw();

requestAnimationFrame(loop);

}

function flap(){

bird.velocity=jump;

}

document.addEventListener("keydown",(e)=>{

if(e.code==="Space"){

e.preventDefault();
flap();

}

});

canvas.addEventListener("touchstart",(e)=>{

e.preventDefault();
flap();

});

canvas.addEventListener("mousedown",flap);

function endGame(){

gameOver=true;

document.getElementById("gameOver")
.classList.remove("hide");

document.getElementById("finalScore")
.innerHTML="Your Score : "+score;

}

document.getElementById("restartBtn")
.addEventListener("click",()=>{

location.reload();

});

loop();
