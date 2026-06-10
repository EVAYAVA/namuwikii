const glow =
document.querySelector(".cursor-glow");

document.addEventListener(
"mousemove",
e=>{
glow.style.left=e.clientX+"px";
glow.style.top=e.clientY+"px";
}
);

function saveHTML(){

const html =
document.documentElement.outerHTML;

const blob =
new Blob(
[html],
{type:"text/html"}
);

const a =
document.createElement("a");

a.href =
URL.createObjectURL(blob);

a.download =
"portfolio.html";

a.click();
}

function saveScreen(){

html2canvas(
document.querySelector("#captureArea"),
{
scale:2
}
)
.then(canvas=>{

const link =
document.createElement("a");

link.download =
"portfolio.png";

link.href =
canvas.toDataURL();

link.click();

});
}
