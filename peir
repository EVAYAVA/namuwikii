
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KITKATPIC PAIR LINE</title>
<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>

<style>
    :root {
        --color-a: #c23b46;     
        --color-b: #3b5998;    
        --color-common: #222222;
        --bg-color: #f8f9fa;
    }

    body {
        font-family: 'Pretendard', sans-serif;
        background-color: #e2e8f0; display: flex; justify-content: flex-start;
        padding: 40px 20px; margin: 0; color: #111;
        overflow-x: auto; 
    }
    
    .maker-container {
        display: flex; gap: 30px; flex-wrap: nowrap; min-width: max-content; 
        margin: 0 auto; align-items: flex-start;
    }

    .input-section {
        background: white; padding: 30px; border-radius: 24px; width: 440px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05); box-sizing: border-box; flex-shrink: 0;
        z-index: 10; 
    }
    .input-section h2 { margin-top: 0; font-size: 22px; color: #111; text-align: center; margin-bottom: 25px; font-weight: 900; }
    
    .zoom-control-box {
        background: #f1f3f5; padding: 15px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e2e8f0;
    }
    .zoom-control-box label { font-size: 13px; font-weight: 900; color: #111; display: block; margin-bottom: 10px; }
    
    .layout-selector { display: flex; gap: 10px; margin-bottom: 25px; }
    .layout-btn {
        flex: 1; padding: 12px; text-align: center; border: 2px solid #ddd; 
        border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 13px; color: #666; transition: 0.2s;
    }
    .layout-btn input { display: none; }
    .layout-btn.active { border-color: #111; background: #111; color: white; }

    .section-title { font-size: 14px; font-weight: 900; padding-bottom: 5px; border-bottom: 2px solid #eee; margin: 25px 0 12px 0; display: flex; justify-content: space-between; align-items: flex-end;}
    .input-group { margin-bottom: 12px; width: 100%; box-sizing: border-box; }
    .input-group label { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; font-weight: bold; color: #555;}
    
    .input-group input[type="text"], .input-group input[type="file"], .input-group textarea, .input-group select { 
        width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-family: inherit; font-size: 13px; outline: none;
    }
    .input-group input:focus, .input-group textarea:focus, .input-group select:focus { border-color: #111; }
    
    .input-color-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .input-color-wrap span { font-size: 12px; font-weight: bold; color: #555; }
    .input-color-wrap input[type="color"] { padding: 0; height: 32px; width: 50px; cursor: pointer; border: none; border-radius: 6px; }
    
    .input-group input[type="range"] { width: 100%; cursor: pointer; box-sizing: border-box; accent-color: #111; }
    .input-group textarea { height: 70px; resize: none; }

    .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; width: 100%; box-sizing: border-box; }
    .slider-group { background: #f8f9fa; padding: 10px; border-radius: 8px; border: 1px solid #eee; margin-top: 5px;}
    .slider-item { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
    .slider-item span { font-size: 11px; font-weight: bold; color: #666; width: 40px; flex-shrink: 0;}

    .person-box { background: #f9f9fa; border: 1px solid #eaeaea; padding: 15px; border-radius: 12px; margin-bottom: 20px; }
    .person-box-a h3 { margin: 0 0 15px 0; font-size: 14px; color: var(--color-a); font-weight: 900; }
    .person-box-b h3 { margin: 0 0 15px 0; font-size: 14px; color: var(--color-b); font-weight: 900; }

    .btn-add { background: #eee; color: #111; border: none; border-radius: 6px; font-size: 11px; padding: 5px 12px; cursor: pointer; font-weight: bold; }
    .btn-action { width: 100%; padding: 12px; background: #f1f3f5; color: #111; border: 1px dashed #ccc; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 13px; transition: 0.2s;}
    .btn-action:hover { background: #e2e8f0; border-color: #111; }
    .btn-download { width: 100%; padding: 16px; background: #111; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; margin-top: 20px; font-size: 15px; }
    .save-load-group {
        display: flex; gap: 10px; margin-bottom: 25px;
    }
    .btn-save, .btn-load {
        flex: 1; padding: 12px; border-radius: 12px; font-weight: 900; font-size: 13px; cursor: pointer; transition: 0.2s;
    }
    .btn-save { background: #e2e8f0; color: #111; border: 1px solid #cbd5e1; }
    .btn-save:hover { background: #cbd5e1; }
    .btn-load { background: #333; color: white; border: none; }
    .btn-load:hover { background: #111; }
    .owner-select { display: flex; gap: 15px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #ddd; font-size: 12px; font-weight: bold;}
    .owner-select label { cursor: pointer; display: flex; align-items: center; gap: 4px; justify-content: flex-start;}

    .tm-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px;}
    .drag-handle { cursor: grab; color: #aaa; font-size: 18px; display: flex; align-items: center;}
    .drag-handle:active { cursor: grabbing; }
    
    .tm-sub-container { margin-left: 20px; padding-left: 10px; border-left: 2px solid #ddd; margin-bottom: 8px; }
    .tm-sub-item-input { display: flex; align-items: stretch; gap: 5px; margin-bottom: 10px; background: #fff; padding: 8px; border-radius: 6px; border: 1px solid #ddd; }
    .tm-sub-inputs-col { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .tm-sub-inputs-col input, .tm-sub-inputs-col textarea { width: 100%; padding: 6px; border: 1px solid #eee; border-radius: 4px; font-family: inherit; font-size: 12px; outline: none; box-sizing: border-box; }
    .tm-sub-inputs-col textarea { height: 46px; resize: none; }
    .btn-sub-add { font-size: 11px; background: none; border: 1px dashed #ccc; padding: 4px 8px; border-radius: 4px; cursor: pointer; width: 100%; color: #666;}
    .btn-sub-remove { background: #ff4d4f; color: white; border: none; border-radius: 4px; width: 24px; cursor: pointer; font-size: 10px; }

    .capture-outer {
       
    }
    
    .capture-wrapper {
        transform-origin: top left;
        transform: scale(0.6); 
        transition: transform 0.2s ease;
    }

    .preview-board {
        background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); 
        overflow: hidden; padding: 60px; box-sizing: border-box; border: 3px solid #ccc; position: relative;
        display: flex; flex-direction: column; min-height: 700px;
    }

    .preview-board.layout-type-A { width: 1450px; min-width: 1450px; }
    .preview-board.layout-type-B { width: 1600px; min-width: 1600px; }

    .board-header { display: flex; flex-direction: column; gap: 20px; margin-bottom: 50px; width: 100%; }
    .pair-name { font-size: 66px; font-weight: 900; color: var(--color-common); text-align: center; letter-spacing: -1.5px; word-break: keep-all; line-height: 1.1; }
    
    .pair-banner-container { width: 100%; }
    .pair-banner { 
        width: 100%; height: 280px; background-color: var(--bg-color); 
        border-radius: 12px; border: 3px solid #c9c9c9; 
        background-size: 100%; background-position: 50% 50%; background-repeat: no-repeat; 
        cursor: grab; margin-bottom: 8px;
    }
    .pair-banner:active { cursor: grabbing; }

    .individual-copyright { font-size: 11px; color: #bbb; font-weight: 600; text-align: right; margin-bottom: 12px;}

    .board-content { display: grid; gap: 60px; width: 100%; }
    .preview-board.layout-type-A .board-content { grid-template-columns: 320px 320px 1fr; }
    .preview-board.layout-type-A .profile-col-a { order: 1; }
    .preview-board.layout-type-A .profile-col-b { order: 2; }
    .preview-board.layout-type-A .timeline-col { order: 3; }

    .preview-board.layout-type-B .board-content { grid-template-columns: 360px 1fr 360px; }
    .preview-board.layout-type-B .profile-col-a { order: 1; }
    .preview-board.layout-type-B .timeline-col { order: 2; }
    .preview-board.layout-type-B .profile-col-b { order: 3; }

    .profile-col { display: flex; flex-direction: column; z-index: 2; }
    
    .main-photo { 
        width: 100%; aspect-ratio: 4 / 5; background-color: var(--bg-color); 
        border-radius: 12px; border: 3px solid #c9c9c9; 
        background-size: 100%; background-position: 50% 50%; background-repeat: no-repeat; 
        margin-bottom: 8px; cursor: grab; 
    }
    .main-photo:active { cursor: grabbing; }

    .name-area { margin-bottom: 12px; }
    .display-name { font-size: 42px; font-weight: 900; color: #000; line-height: 1.1; letter-spacing: -1.5px; word-break: keep-all; }
    .keyword-list { display: flex; flex-direction: row; gap: 6px; margin-bottom: 20px; flex-wrap: wrap;}
    .k-bar { color: #fff; font-size: 11px; height: 26px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; padding: 0 12px; box-sizing: border-box; }
    .profile-desc { font-size: 15px; color: #333; line-height: 1.65; text-align: justify; word-break: break-all; margin-bottom: auto; }

    .profile-col-a .catchphrase { font-size: 15px; font-weight: 800; color: var(--color-a); margin-bottom: 4px; letter-spacing: -0.5px;}
    .profile-col-a .k-bar { background-color: var(--color-a); }

    .profile-col-b .catchphrase { font-size: 15px; font-weight: 800; color: var(--color-b); margin-bottom: 4px; letter-spacing: -0.5px;}
    .profile-col-b .k-bar { background-color: var(--color-b); }

    .timeline-col { display: flex; flex-direction: column; z-index: 2; padding-bottom: 20px; }
    .timeline-title-area { margin-bottom: 35px; border-bottom: 3px solid var(--color-common); padding-bottom: 15px; }
    .timeline-title { font-size: 32px; font-weight: 900; color: var(--color-common); letter-spacing: -1.5px; line-height: 1;}
    
    .timeline-list { display: block; }
    .tl-item { display: flex; align-items: stretch; margin-bottom: 35px; }
    .tl-marker-col { display: flex; flex-direction: column; align-items: center; width: 28px; margin-right: 20px; margin-top: 4px; }
    
    .tl-dot-wrap { width: 26px; height: 26px; background: #c9c9c9; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 2; }
    .tl-dot-white { width: 22px; height: 22px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .tl-dot { width: 16px; height: 16px; border-radius: 50%; }
    
    .tl-line { width: 3px; background: #c9c9c9; flex-grow: 1; margin-top: 4px; margin-bottom: -40px; z-index: 1; }
    .tl-item:last-child .tl-line { display: none; }

    .tl-content { flex: 1; padding-bottom: 10px; }
    .tl-date { font-size: 13.5px; font-weight: 800; margin-bottom: 4px; opacity: 0.9; display: flex; align-items: center; gap: 6px;}
    .tl-title { font-size: 21px; font-weight: 900; margin-bottom: 10px; color: #111; }
    .tl-desc { font-size: 15.5px; line-height: 1.65; color: #444; text-align: justify; word-break: break-all; }
    
    .tl-sub-list { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
    .tl-sub-item { display: flex; align-items: flex-start; gap: 10px; }
    .tl-sub-dot { width: 6px; height: 6px; opacity: 0.7; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
    .tl-sub-content { display: flex; flex-direction: column; gap: 2px; }
    .tl-sub-date { font-size: 12.5px; font-weight: 800; opacity: 0.8; }
    .tl-sub-text { font-size: 14.5px; color: #555; line-height: 1.6; }

    .btn-remove-tm { position: absolute; top: 10px; right: 10px; color: #ff4d4f; cursor: pointer; border: none; background: none; font-size: 14px;}

    .sticker-item { 
        position: absolute; 
        background-size: contain; background-repeat: no-repeat; background-position: center; 
        z-index: 50; cursor: grab; 
    }
    .sticker-item:active { cursor: grabbing; }

    .global-copyright { 
        position: absolute; bottom: 15px; left: 0; width: 100%; 
        text-align: center; color: #e0e0e0; font-size: 11px; font-weight: 700; 
        pointer-events: none; user-select: none; z-index: 1; letter-spacing: 1px;
    }

    @media (max-width: 1000px) {
        body { padding: 20px 10px; overflow-x: auto; display: block; }
        .maker-container { flex-direction: column; align-items: center; gap: 20px; width: fit-content; margin: 0 auto; }
        .input-section { max-width: 500px; padding: 25px 20px; width: 100%; margin: 0 auto;}
    }

    .welcome-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 99999; padding: 15px; box-sizing: border-box; }
    .welcome-modal { background: white; padding: 25px; border-radius: 16px; width: 480px; max-width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.15); animation: modalFadeIn 0.3s ease; display: flex; flex-direction: column; max-height: 85vh; }
    .welcome-title { font-size: 20px; font-weight: 900; color: #5b5b5b; text-align: center; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 6px; flex-shrink: 0; }
    .welcome-content { font-size: 13px; line-height: 1.6; color: #444; margin-bottom: 15px; text-align: justify; overflow-y: auto; padding-right: 5px; }    
    .welcome-content ul { padding-left: 20px; margin: 8px 0; }
    .welcome-content li { margin-bottom: 6px; }
    .btn-modal-close { background: #5b5b5b; color: white; border: none; padding: 12px; width: 100%; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex-shrink: 0; }
    .btn-modal-close:hover { background: #919191; }
    @keyframes modalFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

    @media screen and (max-width: 600px) {
        .welcome-title { font-size: 17px !important; }
        .welcome-content { font-size: 11.5px !important; line-height: 1.5 !important; }
        .welcome-modal { padding: 18px !important; }
    }
</style>
</head>
<body>

<div class="welcome-modal-overlay" id="welcomeModal">
    <div class="welcome-modal">
        <div class="welcome-title">KITKATPIC PAIR LINE 에디터 가이드</div>
        <div class="welcome-content">
            PSD나 CLIP 사용이 어려워 개인적으로 가볍게 수정이 가능한 에디터를 제작해보았습니다! ⁃ ⩊ ⁃  최하단 카피라이트 삭제, 에디터 자작 발언 등의 행위는 당연히 금지하고 있습니다 ㅜ.ㅜ 이를 제외한 원본을 훼손하지 않는 선에서 일부 수정은 허용하고 있으며 (문의 없이 수정 사용 가능) 이외 문의는 언제나 <a href="http://spin-spin.com/pockyandcancho" target="_blank" style="color: #5b5b5b; text-decoration: none;">http://spin-spin.com/pockyandcancho </a>를 통해 주시면 빠른 회신 및 업데이트 하도록 하겠습니다!
<br><br>
            <span style="color: #888;">에디터 사용 금지 드림) 사카모토 데이즈 ㅡ 나구모 요이치 </span><br><br>
               만들고 인용으로 자랑해주시면 정말... 좋아합니다<br>
               매번 인용으로 자랑해주시는 분들께 감사하고 있어요  (⸝⸝๑  ̫ ๑⸝⸝⸝) <br>
               
            
            <hr style="border:0; border-top:1px solid #eee; margin:12px 0;">
               <span style="color: #5b5b5b;">1차 수정</span> 저장/불러오기 기능 추가<br>
               <span style="color: #5b5b5b;">2차 수정</span> 스티커 (SD) 삽입 크기 조절 기능 수정<br>
        </div>
        <button class="btn-modal-close" onclick="closeWelcomeModal()">에디터 시작하기</button>
    </div>
</div>



<div class="maker-container">
    <div class="input-section">
        <h2>KITKATPIC PAIR LINE</h2>
<div class="save-load-group">
            <button class="btn-save" onclick="saveDraft()">임시저장</button>
            <button class="btn-load" onclick="loadDraft()">불러오기</button>
        </div>
        <div class="zoom-control-box">
            <label>미리보기 화면 축소/확대 (작업용)</label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="range" id="in-preview-scale" min="30" max="100" value="60" oninput="updatePreviewScale()" style="flex:1;">
                <span id="view-scale-text" style="font-weight: bold; font-size: 12px; width: 35px; text-align: right;">60%</span>
            </div>
            <div style="font-size: 11px; color: #777; margin-top: 6px;">* 화면 맞춤용입니다. 다운로드 화질/크기에는 영향을 주지 않습니다.</div>
        </div>

        <div class="layout-selector">
            <label class="layout-btn active" id="btn-layout-a">
                <input type="radio" name="layout" value="A" checked onchange="changeLayout(this)"> A타입 (트윈)
            </label>
            <label class="layout-btn" id="btn-layout-b">
                <input type="radio" name="layout" value="B" onchange="changeLayout(this)"> B타입 (대칭)
            </label>
        </div>

        <div class="section-title">PAIR INFO (상단 배너 영역)</div>
        <div class="input-color-wrap">
            <span>공통 Theme Color</span>
            <input type="color" id="in-color-common" value="#222222" oninput="updateUI()">
        </div>
        <div class="input-group">
            <label>페어명</label>
            <input type="text" id="in-pair-name" placeholder="페어명" oninput="updateUI()">
        </div>
        
        <div class="input-group" style="margin-top: 15px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:#111;">
                <input type="checkbox" id="in-use-banner" checked onchange="updateUI()" style="width:auto; margin:0;"> 배너 사용
            </label>
        </div>
        
        <div id="banner-input-area">
            <div class="input-group">
                <input type="file" accept="image/*" onchange="readImg(this, 'banner')">
                <div class="slider-group">
                    <div class="slider-item"><span>확대</span><input type="range" id="in-photo-zoom-banner" min="50" max="400" value="100" oninput="updatePhotoSettings('banner')"></div>
                    <div class="slider-item"><span>가로</span><input type="range" id="in-photo-x-banner" min="0" max="100" value="50" oninput="updatePhotoSettings('banner')"></div>
                    <div class="slider-item"><span>세로</span><input type="range" id="in-photo-y-banner" min="0" max="100" value="50" oninput="updatePhotoSettings('banner')"></div>
                </div>
            </div>
            <div class="input-group">
                <input type="text" id="in-copyright-banner" placeholder="ⓒ 출처" oninput="updateUI()">
            </div>
        </div>

        <div class="person-box person-box-a" style="margin-top: 30px;">
            <h3>Person A (왼쪽 프로필)</h3>
            <div class="input-color-wrap">
                <span>Theme Color</span>
                <input type="color" id="in-color-a" value="#c23b46" oninput="updateUI()">
            </div>
            <div class="input-group">
                <input type="file" accept="image/*" onchange="readImg(this, 'a')">
                <div class="slider-group">
                    <div class="slider-item"><span>확대</span><input type="range" id="in-photo-zoom-a" min="50" max="400" value="100" oninput="updatePhotoSettings('a')"></div>
                    <div class="slider-item"><span>가로</span><input type="range" id="in-photo-x-a" min="0" max="100" value="50" oninput="updatePhotoSettings('a')"></div>
                    <div class="slider-item"><span>세로</span><input type="range" id="in-photo-y-a" min="0" max="100" value="50" oninput="updatePhotoSettings('a')"></div>
                </div>
            </div>
            <div class="input-group">
                <input type="text" id="in-copyright-a" placeholder="ⓒ 출처" oninput="updateUI()">
            </div>
            <div class="input-group"><input type="text" id="in-catch-a" placeholder="캐치프레이즈" oninput="updateUI()"></div>
            <div class="input-group"><input type="text" id="in-name-a" placeholder="이름" oninput="updateUI()"></div>
            <div class="grid-3" style="margin-bottom: 12px;">
                <input type="text" id="in-key1-a" placeholder="키워드 1" oninput="updateUI()">
                <input type="text" id="in-key2-a" placeholder="키워드 2" oninput="updateUI()">
                <input type="text" id="in-key3-a" placeholder="키워드 3" oninput="updateUI()">
            </div>
            <div class="input-group"><textarea id="in-desc-a" placeholder="상세 설명" oninput="updateUI()"></textarea></div>
        </div>

        <div class="person-box person-box-b">
            <h3>Person B (우측 프로필)</h3>
            <div class="input-color-wrap">
                <span>Theme Color</span>
                <input type="color" id="in-color-b" value="#3b5998" oninput="updateUI()">
            </div>
            <div class="input-group">
                <input type="file" accept="image/*" onchange="readImg(this, 'b')">
                <div class="slider-group">
                    <div class="slider-item"><span>확대</span><input type="range" id="in-photo-zoom-b" min="50" max="400" value="100" oninput="updatePhotoSettings('b')"></div>
                    <div class="slider-item"><span>가로</span><input type="range" id="in-photo-x-b" min="0" max="100" value="50" oninput="updatePhotoSettings('b')"></div>
                    <div class="slider-item"><span>세로</span><input type="range" id="in-photo-y-b" min="0" max="100" value="50" oninput="updatePhotoSettings('b')"></div>
                </div>
            </div>
            <div class="input-group">
                <input type="text" id="in-copyright-b" placeholder="ⓒ 출처" oninput="updateUI()">
            </div>
            <div class="input-group"><input type="text" id="in-catch-b" placeholder="캐치프레이즈" oninput="updateUI()"></div>
            <div class="input-group"><input type="text" id="in-name-b" placeholder="이름" oninput="updateUI()"></div>
            <div class="grid-3" style="margin-bottom: 12px;">
                <input type="text" id="in-key1-b" placeholder="키워드 1" oninput="updateUI()">
                <input type="text" id="in-key2-b" placeholder="키워드 2" oninput="updateUI()">
                <input type="text" id="in-key3-b" placeholder="키워드 3" oninput="updateUI()">
            </div>
            <div class="input-group"><textarea id="in-desc-b" placeholder="상세 설명" oninput="updateUI()"></textarea></div>
        </div>

        <div class="section-title" style="margin-top: 25px;">
            <span>TIMELINE (☰ 드래그로 순서 변경)</span>
            <button class="btn-add" onclick="addTimeline()">+ 타임라인 추가</button>
        </div>
        
        <div class="input-group">
            <label>타임라인 큰 제목</label>
            <input type="text" id="in-timeline-title" placeholder="OUR HISTORY" value="서사 제목 또는 캐치프레이즈" oninput="updateUI()">
        </div>
        
        <div id="tm-input-container">
            <div class="tm-input-wrapper" data-id="1" id="tm-input-1" style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 10px; position: relative; border: 1px solid #eee;">
                
                <div class="owner-select">
                    <label><input type="radio" name="tm_owner_1" value="A" onchange="updateUI()"> A측</label>
                    <label><input type="radio" name="tm_owner_1" value="BOTH" checked onchange="updateUI()"> 공통</label>
                    <label><input type="radio" name="tm_owner_1" value="B" onchange="updateUI()"> B측</label>
                </div>

                <div class="tm-header">
                    <span class="drag-handle">☰</span>
                    <input type="text" id="in-tm1-date" placeholder="연도 또는 날짜" oninput="updateUI()">
                </div>
                <input type="text" id="in-tm1-title" placeholder="사건 제목" style="margin-bottom: 6px;" oninput="updateUI()">
                <textarea id="in-tm1-desc" placeholder="상세 내용 (선택 사항)" oninput="updateUI()"></textarea>
                
                <div class="tm-sub-container" id="tm1-sub-container"></div>
                <button class="btn-sub-add" onclick="addSubTimeline(1)">+ 하위 항목 추가</button>
            </div>
        </div>

        <div class="section-title">스티커 삽입 (여러 개 추가 및 드래그 가능)</div>
        <div class="input-group">
            <input type="file" accept="image/*" id="in-sticker-file">
            <div class="slider-group">
                <div class="slider-item"><span>크기</span><input type="range" id="in-sticker-size" min="30" max="500" value="150"></div>
            </div>
            <button class="btn-action" style="margin-top: 10px;" onclick="addSticker()">+ 화면에 스티커 추가하기</button>
            <div style="font-size: 11px; color: #888; margin-top: 8px; text-align: center;">* 추가된 스티커 위에서 <b>마우스 휠</b>을 굴리면 크기가 조절됩니다.<br>
    * 스티커를 <b>더블 클릭</b>하면 삭제됩니다. </div>
        </div>

        <button class="btn-download" onclick="captureBoard()">이미지 파일 저장</button>
    </div>

    <div class="capture-outer">
        <div class="capture-wrapper" id="capture-wrapper">
            <div class="preview-board layout-type-A" id="preview-board">
                
                <div class="global-copyright">ⓒ 2026 kxxcho. All rights reserved.
</div>

                <div class="board-header">
                    <div class="pair-name" id="view-pair-name">페어명을 입력하세요</div>
                    
                    <div class="pair-banner-container" id="view-pair-banner-container">
                        <div class="pair-banner" id="view-photo-banner"></div>
                        <div class="individual-copyright" id="view-copyright-banner">ⓒ 출처</div>
                    </div>
                </div>

                <div class="board-content">
                    <div class="profile-col profile-col-a">
                        <div class="main-photo" id="view-photo-a"></div>
                        <div class="individual-copyright" id="view-copyright-a">ⓒ 출처</div>
                        <div class="catchphrase" id="view-catch-a">캐치프레이즈 입력</div>
                        <div class="name-area"><div class="display-name" id="view-name-a">이름을 입력하세요</div></div>
                        <div class="keyword-list">
                            <div class="k-bar" id="view-key1-a">Keyword1</div>
                            <div class="k-bar" id="view-key2-a">Keyword2</div>
                            <div class="k-bar" id="view-key3-a">Keyword3</div>
                        </div>
                        <div class="profile-desc" id="view-desc-a">성격이나 간단한 설명을 적어도 좋습니다 개인적으로 얼마나 적어야 칸이 예쁠까 싶어서 적어보는데 개인적으로는 3줄에서 5줄 사이가 가장 예쁘지 않을까 싶습니다 사실 저도 미감이 그렇게 좋지는 못해서 장담할 수는 없을 것 같습니다만 4-5줄 정도 적으니 괜찮은 것 같다는 생각이 드네요 </div>
                    </div>

                    <div class="profile-col profile-col-b">
                        <div class="main-photo" id="view-photo-b"></div>
                        <div class="individual-copyright" id="view-copyright-b">ⓒ 출처</div>
                        <div class="catchphrase" id="view-catch-b">캐치프레이즈 입력</div>
                        <div class="name-area"><div class="display-name" id="view-name-b">이름을 입력하세요</div></div>
                        <div class="keyword-list">
                            <div class="k-bar" id="view-key1-b">Keyword1</div>
                            <div class="k-bar" id="view-key2-b">Keyword2</div>
                            <div class="k-bar" id="view-key3-b">Keyword3</div>
                        </div>
                        <div class="profile-desc" id="view-desc-b">성격이나 간단한 설명을 적어도 좋습니다 개인적으로 얼마나 적어야 칸이 예쁠까 싶어서 적어보는데 개인적으로는 3줄에서 5줄 사이가 가장 예쁘지 않을까 싶습니다 사실 저도 미감이 그렇게 좋지는 못해서 장담할 수는 없을 것 같습니다만 4-5줄 정도 적으니 괜찮은 것 같다는 생각이 드네요 </div>
                    </div>

                    <div class="timeline-col">
                        <div class="timeline-title-area">
                            <div class="timeline-title" id="view-timeline-title">OUR HISTORY</div>
                        </div>
                        
                        <div class="timeline-list" id="timeline-view-list">
                            </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</div>

<script>

    function closeWelcomeModal() {
        document.getElementById('welcomeModal').style.display = 'none';
    }

    let tmCount = 1;
    let previewScale = 0.6;

    function updatePreviewScale() {
        const val = document.getElementById('in-preview-scale').value;
        previewScale = val / 100;
        document.getElementById('view-scale-text').innerText = val + '%';
        document.getElementById('capture-wrapper').style.transform = `scale(${previewScale})`;
    }

    function changeLayout(radio) {
        document.querySelectorAll('.layout-btn').forEach(btn => btn.classList.remove('active'));
        radio.parentElement.classList.add('active');
        
        const board = document.getElementById('preview-board');
        if (radio.value === 'A') {
            board.classList.remove('layout-type-B');
            board.classList.add('layout-type-A');
        } else {
            board.classList.remove('layout-type-A');
            board.classList.add('layout-type-B');
        }
    }

    function setupPhotoEvents(prefix, viewId, zoomId, xId, yId, updateFunc) {
        const el = document.getElementById(viewId);
        let dragging = false, startX, startY;
        
        el.addEventListener('mousedown', (e) => { dragging = true; startX = e.clientX; startY = e.clientY; });
        window.addEventListener('mouseup', () => dragging = false);
        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const dx = (e.clientX - startX) / previewScale; 
            const dy = (e.clientY - startY) / previewScale;
            let xVal = parseFloat(document.getElementById(xId).value);
            let yVal = parseFloat(document.getElementById(yId).value);
            xVal -= dx * 0.2; yVal -= dy * 0.2;
            xVal = Math.max(0, Math.min(100, xVal)); yVal = Math.max(0, Math.min(100, yVal));
            document.getElementById(xId).value = xVal;
            document.getElementById(yId).value = yVal;
            startX = e.clientX; startY = e.clientY;
            updateFunc(prefix);
        });
        el.addEventListener('wheel', (e) => {
            e.preventDefault(); 
            let zVal = parseInt(document.getElementById(zoomId).value);
            zVal += (e.deltaY < 0 ? 10 : -10);
            zVal = Math.max(50, Math.min(400, zVal));
            document.getElementById(zoomId).value = zVal;
            updateFunc(prefix);
        });
    }

    setupPhotoEvents('a', 'view-photo-a', 'in-photo-zoom-a', 'in-photo-x-a', 'in-photo-y-a', updatePhotoSettings);
    setupPhotoEvents('b', 'view-photo-b', 'in-photo-zoom-b', 'in-photo-x-b', 'in-photo-y-b', updatePhotoSettings);
    setupPhotoEvents('banner', 'view-photo-banner', 'in-photo-zoom-banner', 'in-photo-x-banner', 'in-photo-y-banner', updatePhotoSettings);

   
    let currentSticker = null;
    let stStartX, stStartY, stStartLeft, stStartTop;

    document.addEventListener('mousedown', (e) => {
        if(e.target.classList.contains('sticker-item')) {
            currentSticker = e.target;
            stStartX = e.clientX;
            stStartY = e.clientY;
            stStartLeft = currentSticker.offsetLeft;
            stStartTop = currentSticker.offsetTop;
            currentSticker.style.cursor = 'grabbing';
        }
    });

    document.addEventListener('mouseup', () => {
        if(currentSticker) {
            currentSticker.style.cursor = 'grab';
            currentSticker = null;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if(!currentSticker) return;
        e.preventDefault();
        const dx = (e.clientX - stStartX) / previewScale;
        const dy = (e.clientY - stStartY) / previewScale;
        currentSticker.style.left = `${stStartLeft + dx}px`;
        currentSticker.style.top = `${stStartTop + dy}px`;
    });

    function addSticker() {
        const fileInput = document.getElementById('in-sticker-file');
        if (!fileInput.files || !fileInput.files[0]) {
            alert("스티커 이미지를 먼저 첨부해주세요.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const size = document.getElementById('in-sticker-size').value;
            const newSticker = document.createElement('div');
            newSticker.className = 'sticker-item';
            newSticker.style.backgroundImage = `url('${e.target.result}')`;
            newSticker.style.width = `${size}px`;
            newSticker.style.height = `${size}px`;
            
            newSticker.style.left = '45%';
            newSticker.style.top = '30%';

            newSticker.ondblclick = function() {
                this.remove();
            };

            newSticker.addEventListener('wheel', function(e) {
                e.preventDefault(); // 스티커 위에서 휠을 굴릴 때 페이지 전체가 스크롤되는 것 방지
                
                let currentSize = parseInt(this.style.width, 10);
                
                
                let delta = e.deltaY < 0 ? 15 : -15;
                let newSize = currentSize + delta;
                
                newSize = Math.max(20, Math.min(1000, newSize));
                
                this.style.width = `${newSize}px`;
                this.style.height = `${newSize}px`;
            });

            document.getElementById('preview-board').appendChild(newSticker);
        };
        reader.readAsDataURL(fileInput.files[0]);
    }

    document.addEventListener('DOMContentLoaded', () => {
        new Sortable(document.getElementById('tm-input-container'), {
            animation: 150, handle: '.drag-handle', onEnd: function () { updateUI(); }
        });
        updatePreviewScale(); // 초기 배율 적용
        updateUI(); 
    });

    function readImg(input, prefix) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById(`view-photo-${prefix}`).style.backgroundImage = `url('${e.target.result}')`;
                updatePhotoSettings(prefix);
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function updatePhotoSettings(prefix) {
        const zoom = document.getElementById(`in-photo-zoom-${prefix}`).value;
        const x = document.getElementById(`in-photo-x-${prefix}`).value;
        const y = document.getElementById(`in-photo-y-${prefix}`).value;
        const el = document.getElementById(`view-photo-${prefix}`);
        el.style.backgroundSize = `${zoom}%`;
        el.style.backgroundPosition = `${x}% ${y}%`;
    }

    function addTimeline() {
        tmCount++;
        const container = document.getElementById('tm-input-container');
        const div = document.createElement('div');
        div.className = 'tm-input-wrapper'; div.dataset.id = tmCount; div.id = `tm-input-${tmCount}`;
        div.style = "background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 10px; position: relative; border: 1px solid #eee;";
        div.innerHTML = `
            <div class="owner-select">
                <label><input type="radio" name="tm_owner_${tmCount}" value="A" onchange="updateUI()"> A측</label>
                <label><input type="radio" name="tm_owner_${tmCount}" value="BOTH" checked onchange="updateUI()"> 공통</label>
                <label><input type="radio" name="tm_owner_${tmCount}" value="B" onchange="updateUI()"> B측</label>
            </div>
            <div class="tm-header">
                <span class="drag-handle">☰</span>
                <input type="text" id="in-tm${tmCount}-date" placeholder="날짜" oninput="updateUI()">
            </div>
            <input type="text" id="in-tm${tmCount}-title" placeholder="사건 제목" style="margin-bottom: 6px;" oninput="updateUI()">
            <textarea id="in-tm${tmCount}-desc" placeholder="상세 내용 (선택 사항)" oninput="updateUI()"></textarea>
            <div class="tm-sub-container" id="tm${tmCount}-sub-container"></div>
            <button class="btn-sub-add" onclick="addSubTimeline(${tmCount})">+ 하위 항목 추가</button>
            <button class="btn-remove-tm" onclick="removeTimeline(${tmCount})">✖</button>
        `;
        container.appendChild(div);
        updateUI();
    }

    function removeTimeline(id) { document.getElementById(`tm-input-${id}`).remove(); updateUI(); }

    function addSubTimeline(parentId) {
        const container = document.getElementById(`tm${parentId}-sub-container`);
        const div = document.createElement('div'); div.className = 'tm-sub-item-input';
        div.innerHTML = `
            <div class="tm-sub-inputs-col">
                <input type="text" class="sub-input-date" placeholder="연도/날짜 (선택)" oninput="updateUI()">
                <textarea class="sub-input-text" placeholder="내용 (엔터 줄바꿈 적용)" oninput="updateUI()"></textarea>
            </div>
            <button class="btn-sub-remove" onclick="this.parentElement.remove(); updateUI();">X</button>
        `;
        container.appendChild(div);
        updateUI();
    }

    function updatePersonUI(prefix) {
        const copyVal = document.getElementById(`in-copyright-${prefix}`).value.trim();
        const copyEl = document.getElementById(`view-copyright-${prefix}`);
        
        if(copyVal) {
            copyEl.innerText = copyVal.startsWith('ⓒ') ? copyVal : `ⓒ ${copyVal}`;
            copyEl.style.color = '#888';
        } else {
            copyEl.innerText = 'ⓒ 출처';
            copyEl.style.color = '#ccc';
        }
        copyEl.style.display = 'block';

        document.getElementById(`view-catch-${prefix}`).innerText = document.getElementById(`in-catch-${prefix}`).value || `캐치프레이즈 ${prefix.toUpperCase()}`;
        document.getElementById(`view-name-${prefix}`).innerText = document.getElementById(`in-name-${prefix}`).value || `이름 ${prefix.toUpperCase()}`;
        const descText = document.getElementById(`in-desc-${prefix}`).value;
        document.getElementById(`view-desc-${prefix}`).innerHTML = descText ? descText.replace(/\n/g, '<br>') : `Person ${prefix.toUpperCase()}에 대한 자유로운 설명 추가`;
        for(let i=1; i<=3; i++) {
            const val = document.getElementById(`in-key${i}-${prefix}`).value;
            const keyEl = document.getElementById(`view-key${i}-${prefix}`);
            if(val) { keyEl.innerText = val; keyEl.style.display = 'inline-flex'; } 
            else { keyEl.style.display = 'none'; }
        }
    }

    function updateUI() {
        const colorA = document.getElementById('in-color-a').value;
        const colorB = document.getElementById('in-color-b').value;
        const colorCommon = document.getElementById('in-color-common').value;
        document.documentElement.style.setProperty('--color-a', colorA);
        document.documentElement.style.setProperty('--color-b', colorB);
        document.documentElement.style.setProperty('--color-common', colorCommon);

        const useBanner = document.getElementById('in-use-banner').checked;
        document.getElementById('banner-input-area').style.display = useBanner ? 'block' : 'none';
        document.getElementById('view-pair-banner-container').style.display = useBanner ? 'block' : 'none';

        const pairNameVal = document.getElementById('in-pair-name').value.trim();
        const pairNameEl = document.getElementById('view-pair-name');
        pairNameEl.innerText = pairNameVal || '페어명을 입력하세요';
        pairNameEl.style.color = pairNameVal ? 'var(--color-common)' : '#ddd';

        const bannerCopyVal = document.getElementById('in-copyright-banner').value.trim();
        const bannerCopyEl = document.getElementById('view-copyright-banner');
        if(bannerCopyVal) {
            bannerCopyEl.innerText = bannerCopyVal.startsWith('ⓒ') ? bannerCopyVal : `ⓒ ${bannerCopyVal}`;
            bannerCopyEl.style.color = '#888';
        } else {
            bannerCopyEl.innerText = 'ⓒ 출처';
            bannerCopyEl.style.color = '#ccc';
        }

        document.getElementById('view-timeline-title').innerText = document.getElementById('in-timeline-title').value || 'OUR HISTORY';
        
        updatePersonUI('a');
        updatePersonUI('b');

        const vContainer = document.getElementById('timeline-view-list');
        vContainer.innerHTML = ''; 

        const wrappers = document.querySelectorAll('.tm-input-wrapper');
        wrappers.forEach((wrapper) => {
            const id = wrapper.dataset.id;
            const date = document.getElementById(`in-tm${id}-date`).value || '연도/날짜';
            const title = document.getElementById(`in-tm${id}-title`).value || '사건 제목';
            const desc = document.getElementById(`in-tm${id}-desc`).value;
            
            const ownerRadio = wrapper.querySelector(`input[name="tm_owner_${id}"]:checked`);
            const ownerVal = ownerRadio ? ownerRadio.value : 'BOTH';
            
            let applyColor = 'var(--color-common)';
            if (ownerVal === 'A') applyColor = 'var(--color-a)';
            else if (ownerVal === 'B') applyColor = 'var(--color-b)';

            const subItems = wrapper.querySelectorAll('.tm-sub-item-input');
            let subListHTML = '';
            if (subItems.length > 0) {
                subListHTML = `<div class="tl-sub-list">`;
                subItems.forEach(item => {
                    const dateVal = item.querySelector('.sub-input-date').value;
                    const textVal = item.querySelector('.sub-input-text').value;
                    if(textVal.trim() !== '' || dateVal.trim() !== '') {
                        const dateHTML = dateVal.trim() !== '' ? `<div class="tl-sub-date" style="color: ${applyColor};">${dateVal}</div>` : '';
                        const textHTML = textVal.trim() !== '' ? `<div class="tl-sub-text">${textVal.replace(/\n/g, '<br>')}</div>` : '';
                        subListHTML += `<div class="tl-sub-item"><div class="tl-sub-dot" style="background: ${applyColor};"></div><div class="tl-sub-content">${dateHTML}${textHTML}</div></div>`;
                    }
                });
                subListHTML += `</div>`;
            }

            const descHTML = desc ? `<div class="tl-desc">${desc.replace(/\n/g, '<br>')}</div>` : '';
            
            const itemHTML = `
                <div class="tl-item">
                    <div class="tl-marker-col">
                        <div class="tl-dot-wrap">
                            <div class="tl-dot-white">
                                <div class="tl-dot" style="background: ${applyColor};"></div>
                            </div>
                        </div>
                        <div class="tl-line"></div>
                    </div>
                    <div class="tl-content">
                        <div class="tl-date" style="color: ${applyColor};">${date}</div>
                        <div class="tl-title">${title}</div>
                        ${descHTML}
                        ${subListHTML}
                    </div>
                </div>`;
            vContainer.insertAdjacentHTML('beforeend', itemHTML);
        });
    }

    function captureBoard() {
    const wrapper = document.getElementById('capture-wrapper');
    const target = document.getElementById('preview-board');

    const originalTransform = wrapper.style.transform;
    const originalTransition = wrapper.style.transition;

    
    wrapper.style.transition = 'none';
    wrapper.style.transform = 'scale(1)';

    
    setTimeout(() => {
        html2canvas(target, { 
            backgroundColor: null, 
            scale: 3,
            useCORS: true, 
            allowTaint: true, 
            logging: false 
        })
        .then(canvas => {
            let link = document.createElement('a'); 
            link.download = `KITKATPIC_DUO_${Date.now()}.png`; 
            link.href = canvas.toDataURL('image/png', 1.0); 
            link.click();

           
            wrapper.style.transform = originalTransform;
            wrapper.style.transition = originalTransition;
        });
    }, 100);
}

// 

    function saveDraft() {
        const draft = {
            layout: document.querySelector('input[name="layout"]:checked').value,
            previewScale: document.getElementById('in-preview-scale').value,
            colorCommon: document.getElementById('in-color-common').value,
            pairName: document.getElementById('in-pair-name').value,
            useBanner: document.getElementById('in-use-banner').checked,
            bannerCopy: document.getElementById('in-copyright-banner').value,
            
            bannerPhoto: getPhotoData('banner'),
            personA: getPersonData('a'),
            personB: getPersonData('b'),
            
            timelineTitle: document.getElementById('in-timeline-title').value,
            timelines: []
        };

        document.querySelectorAll('.tm-input-wrapper').forEach((wrapper) => {
            const id = wrapper.dataset.id;
            const ownerRadio = wrapper.querySelector(`input[name="tm_owner_${id}"]:checked`);
            
            const tmData = {
                owner: ownerRadio ? ownerRadio.value : 'BOTH',
                date: document.getElementById(`in-tm${id}-date`).value,
                title: document.getElementById(`in-tm${id}-title`).value,
                desc: document.getElementById(`in-tm${id}-desc`).value,
                subItems: []
            };

            wrapper.querySelectorAll('.tm-sub-item-input').forEach(item => {
                tmData.subItems.push({
                    date: item.querySelector('.sub-input-date').value,
                    text: item.querySelector('.sub-input-text').value
                });
            });
            draft.timelines.push(tmData);
        });

        try {
            localStorage.setItem('kitkatpic_draft', JSON.stringify(draft));
            alert("작성 중인 내용이 브라우저에 임시 저장되었습니다.\n(주의: 기기나 브라우저를 변경하거나 캐시를 지우면 사라집니다.)");
        } catch (e) {
            
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                draft.bannerPhoto.img = "";
                draft.personA.photo.img = "";
                draft.personB.photo.img = "";
                try {
                    localStorage.setItem('kitkatpic_draft', JSON.stringify(draft));
                    alert("첨부된 이미지 용량이 너무 커서 텍스트와 설정만 임시 저장되었습니다.\n(불러오기 후 이미지는 다시 첨부해 주세요!)");
                } catch (e2) {
                    alert("알 수 없는 오류로 저장에 실패했습니다.");
                }
            } else {
                alert("저장에 실패했습니다.");
            }
        }
    }

    function loadDraft() {
        const saved = localStorage.getItem('kitkatpic_draft');
        if (!saved) {
            alert("저장된 임시 데이터가 없습니다.");
            return;
        }

        if (!confirm("저장된 임시 데이터를 불러오시겠습니까?\n(현재 작성 중인 내용은 덮어씌워집니다.)")) return;

        const draft = JSON.parse(saved);

        const layoutBtn = document.querySelector(`input[name="layout"][value="${draft.layout}"]`);
        if(layoutBtn) { layoutBtn.checked = true; changeLayout(layoutBtn); }
        
        document.getElementById('in-preview-scale').value = draft.previewScale || 60;
        updatePreviewScale();

        document.getElementById('in-color-common').value = draft.colorCommon || '#222222';
        document.getElementById('in-pair-name').value = draft.pairName || '';
        document.getElementById('in-use-banner').checked = draft.useBanner !== false;
        document.getElementById('in-copyright-banner').value = draft.bannerCopy || '';
        document.getElementById('in-timeline-title').value = draft.timelineTitle || '';
        
        setPhotoData('banner', draft.bannerPhoto);
        setPersonData('a', draft.personA);
        setPersonData('b', draft.personB);

        const container = document.getElementById('tm-input-container');
        container.innerHTML = ''; 
        tmCount = 0; 

        draft.timelines.forEach(tm => {
            tmCount++;
            const id = tmCount;
            const div = document.createElement('div');
            div.className = 'tm-input-wrapper'; div.dataset.id = id; div.id = `tm-input-${id}`;
            div.style = "background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 10px; position: relative; border: 1px solid #eee;";
            
            div.innerHTML = `
                <div class="owner-select">
                    <label><input type="radio" name="tm_owner_${id}" value="A" ${tm.owner === 'A' ? 'checked' : ''} onchange="updateUI()"> A측</label>
                    <label><input type="radio" name="tm_owner_${id}" value="BOTH" ${tm.owner === 'BOTH' ? 'checked' : ''} onchange="updateUI()"> 공통</label>
                    <label><input type="radio" name="tm_owner_${id}" value="B" ${tm.owner === 'B' ? 'checked' : ''} onchange="updateUI()"> B측</label>
                </div>
                <div class="tm-header">
                    <span class="drag-handle">☰</span>
                    <input type="text" id="in-tm${id}-date" placeholder="연도 또는 날짜" value="${tm.date || ''}" oninput="updateUI()">
                </div>
                <input type="text" id="in-tm${id}-title" placeholder="사건 제목" style="margin-bottom: 6px;" value="${tm.title || ''}" oninput="updateUI()">
                <textarea id="in-tm${id}-desc" placeholder="상세 내용 (선택 사항)" oninput="updateUI()">${tm.desc || ''}</textarea>
                <div class="tm-sub-container" id="tm${id}-sub-container"></div>
                <button class="btn-sub-add" onclick="addSubTimeline(${id})">+ 하위 항목 추가</button>
                <button class="btn-remove-tm" onclick="removeTimeline(${id})">✖</button>
            `;
            container.appendChild(div);

            if (tm.subItems && tm.subItems.length > 0) {
                const subContainer = document.getElementById(`tm${id}-sub-container`);
                tm.subItems.forEach(sub => {
                    const subDiv = document.createElement('div'); subDiv.className = 'tm-sub-item-input';
                    subDiv.innerHTML = `
                        <div class="tm-sub-inputs-col">
                            <input type="text" class="sub-input-date" placeholder="연도/날짜 (선택)" value="${sub.date || ''}" oninput="updateUI()">
                            <textarea class="sub-input-text" placeholder="내용 (엔터 줄바꿈 적용)" oninput="updateUI()">${sub.text || ''}</textarea>
                        </div>
                        <button class="btn-sub-remove" onclick="this.parentElement.remove(); updateUI();">X</button>
                    `;
                    subContainer.appendChild(subDiv);
                });
            }
        });

        if(draft.timelines.length === 0) addTimeline();

        updateUI(); 
    }

    function getPhotoData(prefix) {
        return {
            zoom: document.getElementById(`in-photo-zoom-${prefix}`).value,
            x: document.getElementById(`in-photo-x-${prefix}`).value,
            y: document.getElementById(`in-photo-y-${prefix}`).value,
            img: document.getElementById(`view-photo-${prefix}`).style.backgroundImage
        };
    }

    function getPersonData(prefix) {
        return {
            color: document.getElementById(`in-color-${prefix}`).value,
            copy: document.getElementById(`in-copyright-${prefix}`).value,
            catch: document.getElementById(`in-catch-${prefix}`).value,
            name: document.getElementById(`in-name-${prefix}`).value,
            key1: document.getElementById(`in-key1-${prefix}`).value,
            key2: document.getElementById(`in-key2-${prefix}`).value,
            key3: document.getElementById(`in-key3-${prefix}`).value,
            desc: document.getElementById(`in-desc-${prefix}`).value,
            photo: getPhotoData(prefix)
        };
    }

    function setPhotoData(prefix, data) {
        if(!data) return;
        document.getElementById(`in-photo-zoom-${prefix}`).value = data.zoom || 100;
        document.getElementById(`in-photo-x-${prefix}`).value = data.x || 50;
        document.getElementById(`in-photo-y-${prefix}`).value = data.y || 50;
        if(data.img) {
            document.getElementById(`view-photo-${prefix}`).style.backgroundImage = data.img;
        }
        updatePhotoSettings(prefix);
    }

    function setPersonData(prefix, data) {
        if(!data) return;
        document.getElementById(`in-color-${prefix}`).value = data.color || (prefix==='a'?'#c23b46':'#3b5998');
        document.getElementById(`in-copyright-${prefix}`).value = data.copy || '';
        document.getElementById(`in-catch-${prefix}`).value = data.catch || '';
        document.getElementById(`in-name-${prefix}`).value = data.name || '';
        document.getElementById(`in-key1-${prefix}`).value = data.key1 || '';
        document.getElementById(`in-key2-${prefix}`).value = data.key2 || '';
        document.getElementById(`in-key3-${prefix}`).value = data.key3 || '';
        document.getElementById(`in-desc-${prefix}`).value = data.desc || '';
        setPhotoData(prefix, data.photo);
    }
</script>
</body>
</html>
