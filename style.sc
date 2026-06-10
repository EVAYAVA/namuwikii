<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Profile</title>

<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>


<style>
*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:'Pretendard',sans-serif;
}

body{
background:linear-gradient(135deg,#0f172a,#1e293b,#111827);
min-height:100vh;
display:flex;
justify-content:center;
align-items:center;
padding:40px;
color:white;
}

.container{
width:100%;
max-width:1000px;
}

.profile-card{
backdrop-filter:blur(20px);
background:rgba(255,255,255,0.08);
border:1px solid rgba(255,255,255,0.15);
border-radius:30px;
padding:40px;
box-shadow:0 10px 30px rgba(0,0,0,.3);
}

.top{
display:flex;
gap:30px;
flex-wrap:wrap;
align-items:center;
}

.profile-img{
width:180px;
height:180px;
border-radius:50%;
object-fit:cover;
border:4px solid rgba(255,255,255,0.2);
}

.info{
flex:1;
}

.editable{
outline:none;
}

.name{
font-size:42px;
font-weight:700;
margin-bottom:10px;
}

.job{
font-size:20px;
color:#60a5fa;
margin-bottom:15px;
}

.bio{
line-height:1.8;
color:#d1d5db;
}

.section{
margin-top:40px;
}

.section h2{
margin-bottom:20px;
}

.skills{
display:flex;
flex-wrap:wrap;
gap:12px;
}

.skill{
padding:12px 18px;
border-radius:50px;
background:rgba(255,255,255,.1);
transition:.3s;
}

.skill:hover{
transform:translateY(-5px);
background:#2563eb;
}

.links{
display:flex;
gap:15px;
flex-wrap:wrap;
}

.links a{
text-decoration:none;
color:white;
padding:12px 20px;
border-radius:12px;
background:rgba(255,255,255,.1);
transition:.3s;
}

.links a:hover{
background:#3b82f6;
}

.actions{
display:flex;
gap:15px;
margin-top:35px;
flex-wrap:wrap;
}

button{
border:none;
cursor:pointer;
padding:14px 22px;
border-radius:12px;
font-weight:600;
font-size:15px;
transition:.3s;
}

.save-html{
background:#2563eb;
color:white;
}

.save-html:hover{
background:#1d4ed8;
}

.save-screen{
background:#10b981;
color:white;
}

.save-screen:hover{
background:#059669;
}

@media(max-width:768px){
.top{
flex-direction:column;
text-align:center;
}

.name{
font-size:32px;
}
}
</style>
</head>
<body>

<div class="container">

<div class="profile-card" id="captureArea">

<div class="top">

<img
class="profile-img"
src="https://images.unsplash.com/photo-1500648767791-00dcc994a43"
alt="profile">

<div class="info">

<h1 class="name editable" contenteditable="true">
홍길동
</h1>

<div class="job editable" contenteditable="true">
Frontend Developer & Designer
</div>

<p class="bio editable" contenteditable="true">
안녕하세요.
감각적인 UI/UX와 웹 서비스를 만드는 개발자입니다.
이 영역은 자유롭게 수정할 수 있습니다.
</p>

</div>
</div>

<div class="section">
<h2>Skills</h2>

<div class="skills">
<div class="skill editable" contenteditable="true">HTML</div>
<div class="skill editable" contenteditable="true">CSS</div>
<div class="skill editable" contenteditable="true">JavaScript</div>
<div class="skill editable" contenteditable="true">React</div>
<div class="skill editable" contenteditable="true">Figma</div>
</div>
</div>

<div class="section">
<h2>Links</h2>

<div class="links">
<a href="#">GitHub</a>
<a href="#">Portfolio</a>
<a href="#">Instagram</a>
</div>
</div>

</div>

<div class="actions">
<button class="save-html" onclick="saveHTML()">
HTML 저장
</button>

<button class="save-screen" onclick="saveScreenshot()">
전체 화면 저장
</button>
</div>

</div>

<script>

function saveHTML(){

const htmlContent =
document.documentElement.outerHTML;

const blob =
new Blob([htmlContent],{
type:"text/html"
});

const a =
document.createElement("a");

a.href =
URL.createObjectURL(blob);

a.download =
"profile.html";

a.click();

URL.revokeObjectURL(a.href);
}

function saveScreenshot(){

const target =
document.getElementById("captureArea");

html2canvas(target,{
scale:2
})
.then(canvas=>{

const link =
document.createElement("a");

link.download =
"profile-screenshot.png";

link.href =
canvas.toDataURL();

link.click();

});
}

</script>

</body>
</html>
