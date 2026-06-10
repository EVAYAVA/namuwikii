*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

body{
    background:linear-gradient(
        135deg,
        #0f172a,
        #1e293b,
        #111827
    );

    min-height:100vh;

    display:flex;
    justify-content:center;
    align-items:center;

    color:white;
    padding:40px;

    font-family:sans-serif;
}

.container{
    width:100%;
    max-width:1000px;
}

.profile-card{
    background:rgba(255,255,255,.08);

    backdrop-filter:blur(20px);

    border-radius:30px;

    padding:40px;

    border:1px solid rgba(255,255,255,.15);

    box-shadow:
    0 10px 30px rgba(0,0,0,.3);
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
}

.name{
    font-size:42px;
    font-weight:bold;
    margin-bottom:10px;
}

.job{
    color:#60a5fa;
    margin-bottom:15px;
}

.bio{
    line-height:1.8;
}

.section{
    margin-top:40px;
}

.skills{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
}

.skill{
    background:rgba(255,255,255,.1);

    padding:12px 18px;

    border-radius:30px;

    transition:.3s;
}

.skill:hover{
    transform:translateY(-5px);
    background:#2563eb;
}

.actions{
    margin-top:25px;

    display:flex;
    gap:10px;
}

button{
    border:none;
    cursor:pointer;

    padding:14px 20px;

    border-radius:12px;

    color:white;
}

.save-html{
    background:#2563eb;
}

.save-screen{
    background:#10b981;
}
