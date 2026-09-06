/*!
 * nw-renderer : 문서 모델(JSON) -> HTML
 * ---------------------------------------------------------------
 * 편집 화면과 내보내기 결과가 같은 함수에서 나오므로 항상 일치한다.
 *   render(model, {editable:true})  -> 편집용 (contenteditable 등 훅 포함)
 *   render(model, {editable:false}) -> 내보내기용
 *
 * 설계 원칙 (티스토리 등 외부 HTML 블록 대응)
 *  1) 모든 시각적 스타일은 style="" 인라인 속성으로 출력한다.
 *  2) 접기/펼치기는 <details>/<summary> 로만 구현한다. (JS 불필요)
 *  3) 클래스(nw-*)는 있으면 좋은 향상 효과에만 쓴다. <style> 이 제거돼도 깨지지 않는다.
 * ---------------------------------------------------------------
 */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') module.exports = factory();
  else root.NWR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ==================================================================
   * 0. 기본값
   * ================================================================ */
  /* style="..." 안에 들어가므로 글꼴 이름은 반드시 홑따옴표로 감싼다.
     큰따옴표를 쓰면 속성이 그 자리에서 끊겨 스타일 전체가 무시된다. */
  var FONT = "'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif";
  var MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'D2Coding','Nanum Gothic Coding',monospace";

  var BASE = {
    fg:    '#17191c',
    sub:   '#6a7178',
    line:  '#e4e7ea',
    line2: '#d3d8dd',
    soft:  '#f2f4f6',
    white: '#ffffff'
  };

  /* ------------------------------------------------------------------
   * 머티리얼 심볼 아이콘 (인라인 SVG)
   * 웹폰트를 불러오면 티스토리에서 <link> 가 잘릴 수 있으므로 경로를 직접 넣는다.
   * ---------------------------------------------------------------- */
  var MI = {
    warning:   { label: '경고',      d: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z' },
    error:     { label: '오류',      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
    info:      { label: '정보',      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
    help:      { label: '도움말',    d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' },
    priority:  { label: '느낌표',    d: 'M10.01 21.01c0 1.1.89 1.99 1.99 1.99s1.99-.89 1.99-1.99-.89-1.99-1.99-1.99-1.99.89-1.99 1.99zM10 2h4v12h-4z' },
    block:     { label: '금지',      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z' },
    computer:  { label: '컴퓨터',    d: 'M20 18c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 5h16v11H4V5z' },
    phone:     { label: '휴대폰',    d: 'M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z' },
    hide:      { label: '가리기',    d: 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z' },
    lock:      { label: '잠금',      d: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z' },
    campaign:  { label: '공지',      d: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z' },
    bell:      { label: '알림',      d: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
    clock:     { label: '시간',      d: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z' },
    star:      { label: '별',        d: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z' },
    heart:     { label: '하트',      d: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
    bookmark:  { label: '북마크',    d: 'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z' },
    verified:  { label: '인증',      d: 'M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z' },
    fire:      { label: '화제',      d: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z' },
    book:      { label: '책',        d: 'M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z' },
    groups:    { label: '사람들',    d: 'M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z' },
    science:   { label: '실험',      d: 'M15.96 4H8.04c-.42 0-.65.48-.39.81L9 6.5v4.17L3.2 18.4c-.49.66-.02 1.6.8 1.6h16c.82 0 1.29-.94.8-1.6L15 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81z' },
    movie:     { label: '영상',      d: 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z' }
  };

  function iconHtml(icon, size) {
    icon = String(icon == null ? '' : icon);
    var m = icon.match(/^mi:([a-z]+)$/);
    if (!m || !MI[m[1]]) return icon ? esc(icon) : '';
    return '<svg viewBox="0 0 24 24" width="' + (size || '1.15em') + '" height="' + (size || '1.15em') + '" fill="currentColor" ' +
           'role="img" aria-label="' + attr(MI[m[1]].label) + '" ' +
           'style="display:inline-block;vertical-align:-.2em;flex:0 0 auto;"><path d="' + MI[m[1]].d + '"></path></svg>';
  }

  /* 각주 미리보기 팝업. <style> 가 없으면 숨겨진 채로 남고 title 툴팁이 대신한다. */
  function fnPopStyle() {
    /* display:none 으로 숨긴다. visibility 로 숨기면 숨은 상태에서도 자리를 차지해
       좁은 화면에서 가로 스크롤이 생긴다.
       가로 위치는 <style> 쪽에서 문단 기준으로 잡아 본문 밖으로 나가지 않게 한다. */
    return 'display:none;position:absolute;left:0;right:0;top:100%;z-index:60;' +
           'margin:7px auto 0;width:max-content;max-width:min(340px,100%);' +
           'padding:10px 13px;border:1px solid ' + BASE.line2 + ';border-radius:5px;background:' + BASE.white + ';' +
           'color:' + BASE.fg + ';font-size:13.5px;font-weight:400;line-height:1.62;text-align:left;letter-spacing:normal;' +
           'white-space:normal;vertical-align:baseline;box-shadow:0 6px 20px rgba(16,20,24,.14);';
  }
  function fnPopup(noteHtml, jumpId) {
    var jump = jumpId
      ? '<a class="nw-fnjump" href="#' + attr(jumpId) + '" style="display:block;margin:9px -3px -3px;padding:7px 10px;' +
        'border-top:1px solid ' + BASE.line + ';font-size:.86em;font-weight:600;color:' + BASE.sub +
        ';text-decoration:none;text-align:center;line-height:1.5;">하단 각주로 이동 &#8595;</a>'
      : '';
    return '<span class="nw-fnpop" style="' + fnPopStyle() + '">' +
             '<span style="display:block;line-height:1.62;">' + noteHtml + '</span>' + jump +
           '</span>';
  }

  /* 폰트에 기대지 않는 얇은 꺾쇠. 바깥 span 이 열림/닫힘에 따라 회전하고,
     안쪽 span 은 45도 고정이라 <style> 이 없어도 모양이 유지된다. */
  function chev(color, size) {
    return '<span class="nw-chev" aria-hidden="true" style="flex:0 0 auto;align-self:center;display:inline-block;' +
             'width:' + size + ';height:' + size + ';line-height:0;">' +
             '<span style="display:block;line-height:0;width:58%;height:58%;margin:0 auto;position:relative;top:-14%;' +
               'border-right:1.7px solid ' + color + ';border-bottom:1.7px solid ' + color + ';transform:rotate(45deg);"></span>' +
           '</span>';
  }
  var CHEVRON = chev('currentColor', '.62em');

  var NOTICE_PRESETS = {
    pc:      { icon: 'mi:computer', text: '이 문서는 PC 환경에서 열람하는 것을 권장합니다.', color: '#3f7fbf' },
    spoiler: { icon: 'mi:warning', text: '이 문서에는 작품의 핵심 내용을 포함한 스포일러가 있습니다.', color: '#e8590c' },
    trigger: { icon: 'mi:priority', text: '이 문서에는 일부 독자에게 불쾌감을 줄 수 있는 내용이 포함되어 있습니다.', color: '#c92a2a' },
    info:    { icon: 'mi:info', text: '안내 문구를 입력하세요.', color: '#5c6570' }
  };

  /* ==================================================================
   * 1. 유틸
   * ================================================================ */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var attr = esc;

  function hex6(c) {
    var h = String(c || '').trim().replace('#', '');
    if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    return /^[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : null;
  }
  function col(v, fallback) {
    if (v == null || v === '') return fallback || '';
    v = String(v).trim();
    if (hex6(v)) return '#' + hex6(v);
    if (/^#[0-9a-fA-F]{8}$/.test(v)) return v;
    if (/^[a-zA-Z]{3,20}$/.test(v)) return v;
    if (/^(rgb|rgba|hsl|hsla)\([0-9a-zA-Z.,%\s\/]+\)$/.test(v)) return v;
    return fallback || '';
  }
  /* 흰색과 섞어 옅은 색을 만든다 (ratio 0=원색, 1=흰색) */
  function tint(c, ratio) {
    var h = hex6(c);
    if (!h) return c;
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    function mix(x) { return Math.round(x + (255 - x) * ratio); }
    function hx(x) { return ('0' + x.toString(16)).slice(-2); }
    return '#' + hx(mix(r)) + hx(mix(g)) + hx(mix(b));
  }
  function shade(c, ratio) {
    var h = hex6(c);
    if (!h) return c;
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    function mix(x) { return Math.round(x * (1 - ratio)); }
    function hx(x) { return ('0' + x.toString(16)).slice(-2); }
    return '#' + hx(mix(r)) + hx(mix(g)) + hx(mix(b));
  }
  function isDark(c) {
    var h = hex6(c);
    if (!h) return false;
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 158;
  }
  function onColor(bg) { return isDark(bg) ? '#ffffff' : BASE.fg; }
  function px(v, dflt) {
    var n = parseFloat(v);
    return (isFinite(n) && n > 0) ? n : dflt;
  }
  function hash32(s) {
    var h = 5381, i;
    for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:|#|\/|\.\/|data:image\/)/i.test(u)) return u;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return 'https://' + u;
    return '';
  }

  /* ==================================================================
   * 2. 테마 -> 실제 색 계산
   * ================================================================ */
  function resolveTheme(model) {
    var t = (model && model.theme) || {};
    var accent = col(t.accent, '#3f7fbf');
    var p = t.profile || {}, q = t.quote || {}, o = t.toc || {}, hd = t.heading || {};

    var profHeadBg = col(p.headBg, accent);
    var profLabelBg = col(p.labelBg, tint(accent, 0.86));
    var quoteAccent = col(q.accent, accent);

    return {
      accent: accent,
      heading: {
        num:    col(hd.num, accent),
        text:   col(hd.text, BASE.fg),
        line:   col(hd.line, BASE.line)
      },
      profile: {
        headBg:  profHeadBg,
        headFg:  col(p.headFg, onColor(profHeadBg)),
        labelBg: profLabelBg,
        labelFg: col(p.labelFg, onColor(profLabelBg)),
        valueBg: col(p.valueBg, BASE.white),
        valueFg: col(p.valueFg, BASE.fg),
        border:  col(p.border, BASE.line),
        width:      px(p.width, 400),
        labelWidth: px(p.labelWidth, 31),
        align:      (p.align === 'left' || p.align === 'full') ? p.align : 'right'
      },
      quote: {
        accent: quoteAccent,
        bg:     col(q.bg, BASE.white),
        fg:     col(q.fg, BASE.fg),
        border: col(q.border, BASE.line)
      },
      toc: {
        headBg: col(o.headBg, BASE.soft),
        headFg: col(o.headFg, onColor(col(o.headBg, BASE.soft))),
        border: col(o.border, BASE.line),
        width:  px(o.width, 0)          /* 0 = 남는 폭을 모두 사용 */
      }
    };
  }

  /* ==================================================================
   * 3. 스타일 사전 (테마에 따라 생성)
   * ================================================================ */
  /* 본문 줄 간격. 블록마다 인라인으로 박아 넣어 블로그 스킨 CSS 를 이긴다. */
  var LH = '1.78';

  function styles(T) {
    return {
      doc:   'font-family:' + FONT + ';font-size:15.5px;line-height:' + LH + ';color:' + BASE.fg +
             ';background:' + BASE.white + ';word-break:keep-all;overflow-wrap:break-word;text-align:left;letter-spacing:-.003em;',
      title: 'margin:0 0 12px;padding:0;font-size:2em;font-weight:800;letter-spacing:-.03em;line-height:1.3;color:' + BASE.fg + ';',
      cats:  'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 16px;padding:0 0 16px;border-bottom:1px solid ' + BASE.line + ';font-size:.86em;line-height:1.6;color:' + BASE.sub + ';',
      cat:   'display:inline-block;padding:3px 10px;border:1px solid ' + BASE.line2 + ';border-radius:4px;color:' + BASE.sub + ';text-decoration:none;line-height:1.5;',
      top:   'display:flex;flex-wrap:wrap;gap:18px;justify-content:space-between;align-items:flex-start;margin:0 0 26px;line-height:' + LH + ';',
      p:     'margin:0 0 .9em;line-height:' + LH + ';',
      hr:    'border:0;border-top:1px solid ' + BASE.line + ';margin:1.6em 0;',
      ul:    'margin:.4em 0 1em;padding-left:1.5em;line-height:' + LH + ';',
      ol:    'margin:.4em 0 1em;padding-left:1.7em;line-height:' + LH + ';',
      li:    'margin:.2em 0;line-height:' + LH + ';',
      link:  'color:' + T.accent + ';text-decoration:none;border-bottom:1px solid ' + tint(T.accent, 0.62) + ';',
      code:  'font-family:' + MONO + ';font-size:.87em;background:' + BASE.soft + ';border:1px solid ' + BASE.line + ';border-radius:3px;padding:.12em .4em;',
      spoil: 'background:#15171a;color:#15171a;border-radius:2px;padding:0 .2em;',
      ref:     'color:' + T.accent + ';text-decoration:none;font-size:.78em;vertical-align:super;line-height:0;font-weight:600;',
      /* position 은 <style> 쪽에서 정한다. 팝업이 문단 밖으로 나가지 않도록
         가장 가까운 블록(문단·목록·표 칸)을 기준으로 삼기 때문. */
      refWrap: 'display:inline-block;font-size:.78em;line-height:1;vertical-align:super;font-weight:600;color:' + T.accent + ';',
      refLink: 'color:inherit;text-decoration:none;font:inherit;line-height:1;',
      imgCap:'margin-top:8px;font-size:.85em;color:' + BASE.sub + ';line-height:1.6;'
    };
  }

  /* ==================================================================
   * 4. 살균 (편집기에서 읽어들인 HTML 을 안전하게)
   * ================================================================ */
  var ALLOW_TAG = {
    P:1, BR:1, SPAN:1, B:1, STRONG:1, I:1, EM:1, U:1, S:1, STRIKE:1, DEL:1, SUP:1, SUB:1,
    A:1, UL:1, OL:1, LI:1, BLOCKQUOTE:1, DIV:1, IMG:1, IFRAME:1, HR:1, CODE:1, PRE:1,
    TABLE:1, THEAD:1, TBODY:1, TR:1, TD:1, TH:1, SMALL:1, MARK:1, FONT:1, DETAILS:1, SUMMARY:1,
    SVG:1, PATH:1, svg:1, path:1
  };
  var ALLOW_ATTR = {
    href:1, src:1, alt:1, title:1, colspan:1, rowspan:1, style:1, class:1, target:1, rel:1,
    allow:1, allowfullscreen:1, frameborder:1, loading:1, open:1, scope:1,
    'data-note':1, 'data-nw':1, 'data-name':1, 'data-src':1, 'data-w':1, 'data-align':1, 'data-cap':1,
    'data-accent':1, 'data-bg':1, 'data-fg':1, 'data-border':1, 'data-icon':1, 'data-cite':1, 'data-fit':1,
    viewBox:1, viewbox:1, d:1, fill:1, role:1, 'aria-label':1, tabindex:1, xmlns:1
  };
  var ALLOW_CSS = /^(color|background|background-color|font-size|font-weight|font-style|font-family|text-decoration|text-decoration-line|text-align|vertical-align|line-height|letter-spacing|margin|margin-(top|bottom|left|right)|padding|padding-(top|bottom|left|right)|border|border-(top|bottom|left|right|color|width|style|radius)|width|max-width|min-width|height|max-height|display|flex|flex-wrap|flex-basis|gap|align-items|justify-content|overflow|overflow-x|white-space|border-collapse|table-layout|position|top|left|right|bottom|z-index|opacity|list-style|list-style-position|clear|float|word-break|overflow-wrap|text-underline-offset|caption-side|padding-inline|aspect-ratio|object-fit)$/;

  function cleanStyle(v) {
    return String(v || '').split(';').map(function (d) {
      var i = d.indexOf(':');
      if (i < 0) return '';
      var k = d.slice(0, i).trim().toLowerCase(), val = d.slice(i + 1).trim();
      if (!ALLOW_CSS.test(k)) return '';
      if (/(expression|javascript:|url\s*\(\s*['"]?\s*(?!data:image)[a-z]+:)/i.test(val)) return '';
      return k + ':' + val;
    }).filter(Boolean).join(';');
  }

  function sanitize(html) {
    if (typeof document === 'undefined' || !document.createElement) return String(html || '');
    var box = document.createElement('div');
    box.innerHTML = String(html || '');
    (function walk(node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (n) {
        if (n.nodeType === 3 || n.nodeType === 8) { if (n.nodeType === 8) n.remove(); return; }
        if (n.nodeType !== 1) { n.remove(); return; }
        if (!ALLOW_TAG[n.tagName]) {
          while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n);
          n.remove();
          return;
        }
        Array.prototype.slice.call(n.attributes).forEach(function (a) {
          var name = a.name.toLowerCase();
          if (!ALLOW_ATTR[name]) { n.removeAttribute(a.name); return; }
          if (name === 'style') {
            var s = cleanStyle(a.value);
            if (s) n.setAttribute('style', s); else n.removeAttribute('style');
            return;
          }
          if (name === 'href' || name === 'src') {
            var u = safeUrl(a.value);
            if (u) n.setAttribute(name, u); else n.removeAttribute(name);
          }
        });
        if (n.tagName === 'IFRAME') {
          var s2 = n.getAttribute('src') || '';
          if (!/^https:\/\/(www\.)?(youtube(-nocookie)?\.com|player\.vimeo\.com)\//i.test(s2)) { n.remove(); return; }
        }
        walk(n);
      });
    })(box);
    return box.innerHTML;
  }

  /* ==================================================================
   * 5. 본문 HTML 에 문서 스타일 입히기
   *    편집기가 만든 구조 태그에 인라인 스타일을 주입한다.
   * ================================================================ */
  function decorate(html, ctx) {
    if (typeof document === 'undefined' || !document.createElement) return String(html || '');
    var T = ctx.T, S = ctx.S;
    var box = document.createElement('div');
    box.innerHTML = String(html || '');

    /* 우리가 넣는 속성만 덮어쓰고 사용자가 준 속성(text-align 등)은 남긴다.
       편집 -> 저장 -> 다시 그리기를 반복해도 style 이 누적되지 않도록 하는 핵심. */
    function set(el, css) {
      var ours = {};
      css.split(';').forEach(function (d) {
        var i = d.indexOf(':');
        if (i > 0) ours[d.slice(0, i).trim().toLowerCase()] = 1;
      });
      var keep = (el.getAttribute('style') || '').split(';').filter(function (d) {
        var i = d.indexOf(':');
        return i > 0 && !ours[d.slice(0, i).trim().toLowerCase()];
      }).join(';');
      el.setAttribute('style', css + (keep ? ';' + keep : ''));
    }

    Array.prototype.slice.call(box.querySelectorAll('*')).forEach(function (el) {
      var tag = el.tagName, kind = el.getAttribute('data-nw');

      if (kind === 'quote')   { renderQuoteEl(el, ctx); return; }
      if (kind === 'notice')  { renderNoticeEl(el, ctx); return; }
      if (kind === 'figure')  { renderFigureEl(el, ctx); return; }
      if (kind === 'embed')   { renderEmbedEl(el, ctx); return; }
      if (kind === 'spoiler') { set(el, S.spoil); el.className = 'nw-spoiler'; el.setAttribute('title', '스포일러 (마우스를 올리거나 드래그하면 보입니다)'); return; }
      if (kind === 'fn')      { return; }   /* 각주는 뒤에서 따로 번호를 매긴다 */

      switch (tag) {
        case 'P':          set(el, S.p); break;
        case 'UL':         set(el, S.ul); break;
        case 'OL':         set(el, S.ol); break;
        case 'LI':         set(el, S.li); break;
        case 'HR':         set(el, S.hr); break;
        case 'CODE':       set(el, S.code); break;
        case 'BLOCKQUOTE': set(el, 'margin:.8em 0 1.1em;padding:.5em 0 .5em 16px;border-left:3px solid ' + BASE.line2 + ';color:' + BASE.sub + ';line-height:' + LH + ';'); break;
        case 'A': {
          set(el, S.link);
          var href = el.getAttribute('href') || '';
          if (/^https?:/i.test(href)) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
          break;
        }
        case 'IMG':
          /* 사진 블록 안의 이미지는 renderFigureEl 이 정렬까지 맡으므로 건드리지 않는다 */
          if (!el.closest || !el.closest('[data-nw=figure]')) set(el, 'display:block;max-width:100%;height:auto;border-radius:4px;');
          break;
        case 'TABLE': break;                       /* 표는 아래에서 통째로 처리 */
        default: break;
      }
    });

    /* 표: 둥근 테두리 래퍼 + 칸 선 */
    Array.prototype.slice.call(box.querySelectorAll('table')).forEach(function (tb) {
      tb.setAttribute('style', 'width:100%;border-collapse:collapse;background:' + BASE.white + ';font-size:.97em;line-height:1.6;margin:0;');
      Array.prototype.slice.call(tb.querySelectorAll('th')).forEach(function (c) {
        var bg = (c.style && c.style.background) || tint(T.accent, 0.9);
        c.setAttribute('style', 'border:1px solid ' + BASE.line + ';padding:9px 12px;background:' + bg + ';font-weight:700;text-align:center;vertical-align:middle;line-height:1.6;');
      });
      Array.prototype.slice.call(tb.querySelectorAll('td')).forEach(function (c) {
        var bg = (c.style && c.style.background) || '';
        c.setAttribute('style', 'border:1px solid ' + BASE.line + ';padding:9px 12px;vertical-align:middle;line-height:1.6;' + (bg ? 'background:' + bg + ';' : ''));
      });
      if (!tb.parentNode || tb.parentNode.getAttribute('data-nw') !== 'tablewrap') {
        var w = document.createElement('div');
        w.setAttribute('data-nw', 'tablewrap');
        tb.parentNode.insertBefore(w, tb);
        w.appendChild(tb);
      }
      tb.parentNode.setAttribute('style', 'margin:1em 0 1.3em;border:1px solid ' + BASE.line2 + ';border-radius:6px;overflow:hidden;overflow-x:auto;');
    });

    return box.innerHTML;
  }

  function renderQuoteEl(el, ctx) {
    var T = ctx.T;
    var accent = col(el.getAttribute('data-accent'), T.quote.accent);
    var bg     = col(el.getAttribute('data-bg'), T.quote.bg);
    var fg     = col(el.getAttribute('data-fg'), T.quote.fg);
    var bd     = col(el.getAttribute('data-border'), T.quote.border);
    var fit = el.getAttribute('data-fit') === 'content' ? 'width:fit-content;max-width:100%;' : '';
    el.setAttribute('style',
      'display:flex;align-items:stretch;margin:1.1em 0 1.3em;border:1px solid ' + bd +
      ';border-radius:5px;overflow:hidden;background:' + bg + ';color:' + fg + ';' + fit);
    var bar = el.querySelector('[data-nw=qbar]'), body = el.querySelector('[data-nw=qbody]');
    if (bar) bar.setAttribute('style', 'flex:0 0 6px;background:' + accent + ';');
    if (body) body.setAttribute('style', 'flex:1 1 auto;min-width:0;padding:14px 18px;line-height:' + LH + ';');
    var cite = el.querySelector('[data-nw=qcite]');
    if (cite) cite.setAttribute('style', 'display:block;margin-top:8px;text-align:right;font-size:.88em;color:' + BASE.sub + ';');
  }

  function renderNoticeEl(el, ctx) {
    var T = ctx.T;
    var accent = col(el.getAttribute('data-accent'), T.accent);
    var bg     = col(el.getAttribute('data-bg'), tint(accent, 0.93));
    var fg     = col(el.getAttribute('data-fg'), shade(accent, 0.35));
    var bd     = col(el.getAttribute('data-border'), tint(accent, 0.72));
    el.setAttribute('style',
      'display:flex;gap:10px;align-items:flex-start;margin:0 0 10px;padding:12px 16px;' +
      'border:1px solid ' + bd + ';border-left:4px solid ' + accent + ';border-radius:5px;' +
      'background:' + bg + ';color:' + fg + ';font-size:.93em;line-height:1.6;');
    var ic = el.querySelector('[data-nw=nicon]'), tx = el.querySelector('[data-nw=ntext]');
    if (ic) {
      ic.setAttribute('style', 'flex:0 0 auto;display:inline-flex;align-items:center;line-height:1;');
      var key = el.getAttribute('data-icon') || '';
      if (/^mi:/.test(key)) ic.innerHTML = iconHtml(key);
    }
    if (tx) tx.setAttribute('style', 'flex:1 1 auto;min-width:0;line-height:1.6;');
  }

  function renderFigureEl(el, ctx) {
    var S = ctx.S;
    var align = el.getAttribute('data-align') || 'center';
    var w = el.getAttribute('data-w') || '';
    el.setAttribute('style', 'display:block;margin:1.2em 0 1.4em;line-height:1.5;text-align:' +
      (align === 'left' ? 'left' : align === 'right' ? 'right' : 'center') + ';');
    var img = el.querySelector('img');
    if (img) {
      var wCss = '';
      if (w) {
        var ws = String(w).trim();
        if (/^[0-9.]+%$/.test(ws)) wCss = 'width:' + ws + ';';
        else wCss = 'width:' + px(ws, 400) + 'px;';
      }
      img.setAttribute('style', 'display:inline-block;max-width:100%;height:auto;border-radius:4px;border:1px solid ' + BASE.line + ';' + wCss);
      img.setAttribute('loading', 'lazy');
    }
    var cap = el.querySelector('[data-nw=fcap]');
    if (cap) cap.setAttribute('style', 'display:block;' + S.imgCap);
  }

  function renderEmbedEl(el, ctx) {
    var w = px(el.getAttribute('data-w'), 640);
    el.setAttribute('style', 'display:block;margin:1.2em auto 1.4em;line-height:1.5;max-width:100%;width:' + w + 'px;');
    var pad = el.querySelector('[data-nw=epad]');
    if (pad) pad.setAttribute('style', 'display:block;position:relative;width:100%;padding-top:56.25%;height:0;border-radius:5px;overflow:hidden;border:1px solid ' + BASE.line2 + ';background:#000;');
    var f = el.querySelector('iframe');
    if (f) f.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;display:block;');
    var cap = el.querySelector('[data-nw=ecap]');
    if (cap) cap.setAttribute('style', 'display:block;' + ctx.S.imgCap + 'text-align:center;');
  }

  /* ==================================================================
   * 6. 각주 : data-note 를 걷어 번호를 매기고 목록을 만든다
   * ================================================================ */
  /* 각주 내용도 본문과 똑같이 꾸밈·링크를 쓸 수 있다.
     data-note 에 HTML 이 들어오므로 반드시 살균한 뒤 문서 스타일을 입힌다.
     각주 안의 각주는 지원하지 않으므로 걷어낸다. */
  function cleanNote(html, ctx) {
    var out = sanitize(html);
    if (typeof document !== 'undefined' && document.createElement) {
      var d = document.createElement('div');
      d.innerHTML = out;
      Array.prototype.slice.call(d.querySelectorAll('[data-nw=fn]')).forEach(function (n) {
        while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n);
        n.remove();
      });
      out = d.innerHTML;
    }
    return decorate(out, ctx);
  }

  function collectFootnotes(html, ctx) {
    if (typeof document === 'undefined' || !document.createElement) return String(html || '');
    var box = document.createElement('div');
    box.innerHTML = String(html || '');
    Array.prototype.slice.call(box.querySelectorAll('[data-nw=fn]')).forEach(function (el) {
      var note = cleanNote(el.getAttribute('data-note') || '', ctx);
      var name = (el.getAttribute('data-name') || '').trim();
      var item, key = name || null;
      if (key && ctx.fnByName[key]) item = ctx.fnByName[key];
      else {
        item = { idx: ctx.fn.length + 1, name: name, html: note, backs: [] };
        ctx.fn.push(item);
        if (key) ctx.fnByName[key] = item;
      }
      var label = item.name || String(item.idx);
      var bid = ctx.docId + '-r' + item.idx + '-' + (item.backs.length + 1);
      item.backs.push(bid);

      /* title 속성은 쓰지 않는다. 브라우저 기본 툴팁과 팝업이 함께 떠서 두 개로 보이기 때문. */

      /* 편집 중에는 클릭해서 고칠 수 있도록 원래 요소를 그대로 둔다 */
      if (ctx.editable) {
        el.className = 'nw-fnwrap';
        el.setAttribute('contenteditable', 'false');
        el.removeAttribute('title');
        el.setAttribute('style', ctx.S.refWrap + 'cursor:pointer;');
        el.innerHTML = '<span class="nw-fnlabel" style="line-height:1;">[' + esc(label) + ']</span>' + fnPopup(note);
        return;
      }

      /* tabindex 로 포커스를 받게 해 두면 모바일에서 눌러 열고,
         바깥을 누르면(포커스가 빠지면) 저절로 닫힌다. */
      var wrap = document.createElement('span');
      wrap.className = 'nw-fnwrap';
      wrap.id = bid;
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('aria-label', '각주 ' + label);
      wrap.setAttribute('style', ctx.S.refWrap + 'cursor:pointer;-webkit-tap-highlight-color:transparent;');
      wrap.innerHTML =
        '<a class="nw-ref" href="#' + attr(ctx.docId + '-f' + item.idx) + '" style="' + ctx.S.refLink + '">[' + esc(label) + ']</a>' +
        fnPopup(note, ctx.docId + '-f' + item.idx);
      el.parentNode.replaceChild(wrap, el);
    });
    return box.innerHTML;
  }

  function plainText(html) {
    if (typeof document === 'undefined' || !document.createElement) return String(html || '').replace(/<[^>]*>/g, '');
    var d = document.createElement('div');
    d.innerHTML = String(html || '');
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function renderFootnoteList(ctx) {
    if (!ctx.fn.length) return '';
    var items = ctx.fn.map(function (f) {
      var label = f.name || String(f.idx);
      var backs = f.backs.map(function (b, n) {
        return '<a href="#' + attr(b) + '" style="color:' + ctx.T.accent + ';text-decoration:none;font-weight:700;margin-right:.4em;">[' +
               esc(label) + (f.backs.length > 1 ? String.fromCharCode(97 + n) : '') + ']</a>';
      }).join('');
      return '<li id="' + attr(ctx.docId + '-f' + f.idx) + '" style="margin:.25em 0;line-height:1.75;">' + backs + f.html + '</li>';
    }).join('');
    var open = ctx.fnCollapsed ? '' : ' open';
    return '<details class="nw-fnbox"' + open + ' style="margin:2.6em 0 0;padding:18px 0 0;border-top:1px solid ' + BASE.line + ';line-height:1.75;">' +
             '<summary class="nw-h" style="display:flex;align-items:center;gap:9px;cursor:pointer;margin:0 0 .7em;' +
               'font-size:1.05em;font-weight:800;letter-spacing:-.02em;line-height:1.5;list-style:none;">' +
               '<span style="flex:1 1 auto;">각주</span>' +
               '<span style="flex:0 0 auto;font-size:.74em;font-weight:600;color:' + BASE.sub + ';">' + ctx.fn.length + '개</span>' +
               CHEVRON +
             '</summary>' +
             '<ol style="margin:0;padding:0;list-style:none;font-size:.91em;line-height:1.75;color:#3d4349;">' + items + '</ol>' +
           '</details>';
  }

  /* ==================================================================
   * 7. 챕터 / 목차
   * ================================================================ */
  function headStyle(d, T, editable) {
    var size = d === 1 ? '1.42em' : d === 2 ? '1.2em' : d === 3 ? '1.08em' : '1em';
    var pad  = d === 1 ? '.1em 0 .45em' : d === 2 ? '.1em 0 .38em' : '.08em 0 .32em';
    return 'display:flex;align-items:baseline;gap:.45em;margin:0;padding:' + pad +
           ';font-size:' + size + ';font-weight:800;line-height:1.45;letter-spacing:-.025em;color:' + T.heading.text +
           ';border-bottom:1px solid ' + (d <= 2 ? T.heading.line : tint(T.heading.line, 0.45)) +
           ';list-style:none;' + (editable ? '' : 'cursor:pointer;');
  }
  function secBodyStyle(d) {
    return (d === 1 ? 'margin:.9em 0 2.2em;' : 'margin:.75em 0 1.6em;') + 'line-height:' + LH + ';';
  }

  function renderChapters(nodes, prefix, depth, ctx) {
    return nodes.map(function (ch, i) {
      var num = prefix ? prefix + '.' + (i + 1) : String(i + 1);
      var id = ctx.docId + '-s' + num.replace(/\./g, '_');
      var d = Math.min(depth, 4);
      ctx.toc.push({ num: num, depth: depth, id: id, text: String(ch.title || '') });

      var body = ctx.pipe(ch.body || '');
      var kids = (ch.children && ch.children.length) ? renderChapters(ch.children, num, depth + 1, ctx) : '';

      var open = ctx.editable ? true : !ch.collapsed;
      var chevron = chev('#98a1a9', d === 1 ? '.5em' : '.55em');
      var edit = ctx.editable
        ? '<button type="button" class="nw-edit-fold" data-ch="' + attr(ch.id) + '" title="이 챕터 접기/펼치기" style="margin-left:auto;flex:0 0 auto;">' + (ch.collapsed ? '접힘' : '펼침') + '</button>'
        : '';

      var titleHtml = ctx.editable
        ? '<span class="nw-ch-title" contenteditable="true" data-ch="' + attr(ch.id) + '" style="flex:1 1 auto;min-width:0;outline:0;">' + esc(ch.title || '') + '</span>'
        : '<span style="flex:1 1 auto;min-width:0;">' + esc(ch.title || '') + '</span>';

      return '<div style="margin:' + (depth === 1 ? '2.1em' : '1.5em') + ' 0 0;line-height:' + LH + ';"' + (ctx.editable ? ' data-chapter="' + attr(ch.id) + '"' : '') + '>' +
               '<details class="nw-sec"' + (open ? ' open' : '') + ' id="' + attr(id) + '" style="margin:0;">' +
                 '<summary class="nw-h" style="' + headStyle(d, ctx.T, ctx.editable) + '">' +
                   chevron +
                   '<span style="flex:0 0 auto;color:' + ctx.T.heading.num + ';font-weight:800;">' + num + '.</span>' +
                   titleHtml + edit +
                 '</summary>' +
                 '<div style="' + secBodyStyle(d) + '">' +
                   (ctx.editable
                     ? '<div class="nw-body" contenteditable="true" data-ch="' + attr(ch.id) + '" style="outline:0;min-height:1.9em;">' + body + '</div>'
                     : body) +
                   kids +
                 '</div>' +
               '</details>' +
             '</div>';
    }).join('');
  }

  /* 챕터 제목만 바뀌었을 때 목차만 다시 그리기 위한 독립 함수 */
  function buildTocList(nodes, prefix, depth, docId, out) {
    (nodes || []).forEach(function (ch, i) {
      var num = prefix ? prefix + '.' + (i + 1) : String(i + 1);
      out.push({ num: num, depth: depth, id: docId + '-s' + num.replace(/\./g, '_'), text: String(ch.title || '') });
      if (ch.children && ch.children.length) buildTocList(ch.children, num, depth + 1, docId, out);
    });
    return out;
  }
  function tocHtml(model, docId) {
    return renderToc({ toc: buildTocList(model.chapters || [], '', 1, docId, []), T: resolveTheme(model) });
  }

  function renderToc(ctx) {
    if (!ctx.toc.length) return '';
    var T = ctx.T, html = '', open = 0, prev = 0;
    ctx.toc.forEach(function (t) {
      if (prev === 0) { html += '<ul style="margin:0;padding:0;list-style:none;line-height:1.6;">'; open = 1; prev = t.depth; }
      else if (t.depth > prev) { html += '<ul style="margin:0;padding:0 0 0 16px;list-style:none;line-height:1.6;">'; open++; prev = t.depth; }
      else { while (t.depth < prev && open > 1) { html += '</ul>'; open--; prev--; } prev = t.depth; }
      html += '<li style="margin:.15em 0;font-size:.93em;line-height:1.6;">' +
                '<a href="#' + attr(t.id) + '" style="color:' + BASE.fg + ';text-decoration:none;">' +
                  '<span style="color:' + T.accent + ';font-weight:700;">' + t.num + '.</span> ' + esc(t.text) +
                '</a></li>';
    });
    while (open-- > 0) html += '</ul>';

    var tw = T.toc.width;
    var tocFlex = tw ? 'flex:0 1 ' + tw + 'px;width:min(100%,' + tw + 'px);min-width:min(100%,200px);'
                     : 'flex:1 1 260px;min-width:min(100%,240px);';
    return '<div class="nw-toc" style="' + tocFlex + 'line-height:' + LH + ';border:1px solid ' + T.toc.border +
             ';border-radius:6px;overflow:hidden;background:' + BASE.white + ';">' +
             '<details class="nw-fold" open>' +
               '<summary class="nw-h" style="display:flex;align-items:center;cursor:pointer;padding:11px 16px;font-weight:800;font-size:.95em;' +
                 'background:' + T.toc.headBg + ';color:' + T.toc.headFg + ';border-bottom:1px solid ' + T.toc.border + ';line-height:1.5;list-style:none;">' +
                 '<span style="flex:1 1 auto;">목차</span>' + CHEVRON + '</summary>' +
               '<div style="padding:13px 17px 15px;">' + html + '</div>' +
             '</details>' +
           '</div>';
  }

  /* ==================================================================
   * 8. 프로필 표
   * ================================================================ */
  function renderProfile(model, ctx) {
    var pf = model.profile || {};
    if (model.type !== 'profile' || pf.enabled === false) return '';
    var T = ctx.T, P = T.profile, ed = ctx.editable;

    var thS = 'border-bottom:1px solid ' + P.border + ';border-right:1px solid ' + P.border +
              ';padding:9px 10px;width:' + px(P.labelWidth, 31) + '%;background:' + P.labelBg + ';color:' + P.labelFg +
              ';font-weight:700;text-align:center;vertical-align:middle;font-size:.95em;line-height:1.6;';
    var tdS = 'border-bottom:1px solid ' + P.border + ';padding:9px 12px;background:' + P.valueBg +
              ';color:' + P.valueFg + ';vertical-align:middle;line-height:1.6;';
    var fullS = 'border-bottom:1px solid ' + P.border + ';padding:9px 12px;text-align:center;line-height:1.6;background:' + P.valueBg + ';color:' + P.valueFg + ';';
    var grpS  = 'border-bottom:1px solid ' + P.border + ';padding:9px 12px;background:' + P.labelBg + ';color:' + P.labelFg +
                ';font-weight:800;text-align:center;font-size:.95em;line-height:1.6;';

    function cell(html, editKey, rowId) {
      if (!ed) return ctx.pipe(html);
      return '<div class="nw-pf-cell" contenteditable="true" data-pf="' + attr(editKey) + '" data-row="' + attr(rowId) + '" style="outline:0;min-height:1.4em;">' +
             ctx.pipe(html) + '</div>';
    }
    function rowsHtml(rows, gid) {
      return (rows || []).map(function (r) {
        var ctl = ed ? '<td class="nw-pf-ctl" data-row="' + attr(r.id) + '" data-group="' + attr(gid) + '" style="border:0;padding:0;width:0;"></td>' : '';
        if (r.full) return '<tr data-row="' + attr(r.id) + '"><td colspan="2" style="' + fullS + '">' + cell(r.value, 'value', r.id) + '</td>' + ctl + '</tr>';
        return '<tr data-row="' + attr(r.id) + '">' +
                 '<th scope="row" style="' + thS + '">' + cell(r.label, 'label', r.id) + '</th>' +
                 '<td style="' + tdS + '">' + cell(r.value, 'value', r.id) + '</td>' + ctl +
               '</tr>';
      }).join('');
    }

    var inner = '';
    if (pf.title || pf.subtitle || ed) {
      inner += '<div style="background:' + P.headBg + ';color:' + P.headFg + ';padding:13px 14px;text-align:center;line-height:1.4;">' +
                 '<div style="font-size:1.2em;font-weight:800;letter-spacing:-.02em;line-height:1.35;">' +
                   (ed ? '<span class="nw-pf-head" contenteditable="true" data-pf="title" style="outline:0;">' + ctx.pipe(pf.title || '') + '</span>' : ctx.pipe(pf.title || '')) +
                 '</div>' +
                 '<div style="font-size:.86em;opacity:.88;margin-top:3px;line-height:1.5;">' +
                   (ed ? '<span class="nw-pf-head" contenteditable="true" data-pf="subtitle" style="outline:0;">' + ctx.pipe(pf.subtitle || '') + '</span>' : ctx.pipe(pf.subtitle || '')) +
                 '</div>' +
               '</div>';
    }
    if (pf.image) {
      inner += '<div style="border-top:1px solid ' + P.border + ';background:' + BASE.white + ';text-align:center;line-height:0;">' +
                 '<img src="' + attr(safeUrl(pf.image)) + '" alt="' + attr(plainText(pf.title) || '프로필 이미지') + '" loading="lazy" style="display:block;width:100%;height:auto;margin:0;">' +
                 (pf.imageCaption ? '<div style="padding:7px 10px;font-size:.84em;color:' + BASE.sub + ';border-top:1px solid ' + P.border + ';">' + ctx.pipe(pf.imageCaption) + '</div>' : '') +
               '</div>';
    }

    var body = '';
    (pf.groups || []).forEach(function (g) {
      if (g.kind === 'head' && g.title) {
        body += '<tr data-group="' + attr(g.id) + '"><td colspan="2" style="' + grpS + '">' +
                (ed ? '<div class="nw-pf-cell" contenteditable="true" data-pf="gtitle" data-group="' + attr(g.id) + '" style="outline:0;">' + ctx.pipe(g.title) + '</div>' : ctx.pipe(g.title)) +
                '</td></tr>' + rowsHtml(g.rows, g.id);
        return;
      }
      if (g.kind === 'fold') {
        body += '<tr data-group="' + attr(g.id) + '"><td colspan="2" style="padding:0;line-height:1.6;border-bottom:1px solid ' + P.border + ';">' +
                  '<details class="nw-fold"' + (g.open ? ' open' : '') + '>' +
                    '<summary class="nw-h" style="display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;padding:9px 12px;background:' + P.labelBg + ';color:' + P.labelFg +
                      ';font-weight:800;text-align:center;font-size:.95em;line-height:1.6;list-style:none;">' +
                      (ed ? '<span class="nw-pf-cell" contenteditable="true" data-pf="gtitle" data-group="' + attr(g.id) + '" style="outline:0;">' + ctx.pipe(g.title || '') + '</span>' : '<span>' + ctx.pipe(g.title || '') + '</span>') +
                      CHEVRON +
                    '</summary>' +
                    '<table style="width:100%;border-collapse:collapse;table-layout:fixed;margin:0;"><tbody>' + rowsHtml(g.rows, g.id) + '</tbody></table>' +
                  '</details>' +
                '</td></tr>';
        return;
      }
      body += rowsHtml(g.rows, g.id);
    });
    inner += '<table style="width:100%;border-collapse:collapse;table-layout:fixed;margin:0;"><tbody>' + body + '</tbody></table>';

    var w = P.width;
    var flex = P.align === 'full'
      ? 'flex:1 1 100%;width:100%;'
      : 'flex:0 1 ' + w + 'px;width:min(100%,' + w + 'px);';
    var order = P.align === 'left' ? 'order:-1;' : '';

    return '<div class="nw-profile" data-pf-box="1" style="' + flex + order +
             'border:1px solid ' + P.border + ';border-radius:6px;overflow:hidden;background:' + BASE.white +
             ';font-size:.94em;line-height:1.6;">' + inner + '</div>';
  }

  /* ==================================================================
   * 9. 분류 / 알림
   * ================================================================ */
  function renderCategories(model, ctx) {
    var cats = (model.categories || []).filter(function (c) { return String(c || '').trim(); });
    if (!cats.length && !ctx.editable) return '';
    var S = ctx.S;
    var items = cats.map(function (c) {
      return '<span style="' + S.cat + '">' + esc(c) + '</span>';
    }).join('');
    return '<div class="nw-cats" style="' + S.cats + '">' +
             '<span style="font-weight:700;color:' + BASE.fg + ';">분류</span>' + items +
             (!cats.length ? '<span style="color:' + BASE.sub + ';">(왼쪽 설정에서 분류를 추가하세요)</span>' : '') +
           '</div>';
  }

  function renderNotices(model, ctx) {
    var list = model.notices || [];
    if (!list.length) return '';
    return '<div class="nw-notices" style="margin:0 0 20px;line-height:' + LH + ';">' + list.map(function (n) {
      var accent = col(n.accent, ctx.T.accent);
      var bg = col(n.bg, tint(accent, 0.93));
      var fg = col(n.fg, shade(accent, 0.35));
      var bd = col(n.border, tint(accent, 0.72));
      return '<div class="nw-notice" data-notice="' + attr(n.id) + '" style="display:flex;gap:10px;align-items:flex-start;margin:0 0 10px;' +
               'padding:12px 16px;border:1px solid ' + bd + ';border-left:4px solid ' + accent + ';border-radius:5px;' +
               'background:' + bg + ';color:' + fg + ';font-size:.93em;line-height:1.6;">' +
               (n.icon ? '<span style="flex:0 0 auto;display:inline-flex;align-items:center;line-height:1;">' + iconHtml(n.icon) + '</span>' : '') +
               '<span style="flex:1 1 auto;min-width:0;outline:0;"' +
                 (ctx.editable ? ' class="nw-notice-text" contenteditable="true" data-notice="' + attr(n.id) + '"' : '') + '>' +
                 ctx.pipe(n.text || '') +
               '</span>' +
             '</div>';
    }).join('') + '</div>';
  }

  /* ==================================================================
   * 10. 문서 조립
   * ================================================================ */
  function render(model, opts) {
    opts = opts || {};
    model = model || {};
    var T = resolveTheme(model);
    var S = styles(T);
    var docId = 'nw' + (opts.docId ? String(opts.docId).replace(/[^\w-]/g, '') : hash32(JSON.stringify(model).slice(0, 600)));

    var ctx = {
      T: T, S: S, docId: docId, editable: !!opts.editable,
      fnCollapsed: !!(model.theme && model.theme.footnote && model.theme.footnote.collapsed),
      fn: [], fnByName: {}, toc: []
    };
    /* 본문 HTML 한 조각을 처리하는 공통 경로: 살균 -> 스타일 주입 -> 각주 수집 */
    ctx.pipe = function (html) {
      return collectFootnotes(decorate(sanitize(html), ctx), ctx);
    };

    var cats     = renderCategories(model, ctx);
    var notices  = renderNotices(model, ctx);
    var profile  = renderProfile(model, ctx);
    var chapters = renderChapters(model.chapters || [], '', 1, ctx);
    var toc      = renderToc(ctx);
    var fnList   = renderFootnoteList(ctx);

    var titleHtml = '<h1 style="' + S.title + '"' +
      (ctx.editable ? ' class="nw-doc-title" contenteditable="true"' : '') + '>' + esc(model.title || '') + '</h1>';

    var top = (toc || profile)
      ? '<div class="nw-top" style="' + S.top + '">' + toc + profile + '</div>'
      : '';

    var html = titleHtml + cats + notices + top +
               '<div class="nw-chapters" style="line-height:' + LH + ';">' + chapters + '</div>' + fnList;

    return { html: html, docId: docId, toc: ctx.toc, footnotes: ctx.fn.length, theme: T };
  }

  /* ==================================================================
   * 각주 팝업 위치 보정 (선택적 향상)
   * CSS 만으로는 "각주 번호 아래에 두되 본문 밖으로 나가면 안쪽으로 밀기" 를
   * 만들 수 없다. (앵커 포지셔닝의 폴백은 뷰포트 기준으로만 동작한다)
   * 그래서 아주 작은 스크립트를 덧붙인다. 이 스크립트가 없거나 제거되면
   * 팝업은 CSS 기본값대로 문단 가운데에 놓이므로 문서는 그대로 동작한다.
   * ================================================================ */
  function nwPlacePopups(root) {
    if (!root || root.__nwfnp) return;
    root.__nwfnp = 1;
    function place(wrap) {
      var pop = wrap.querySelector('.nw-fnpop');
      if (!pop) return;
      var prev = pop.style.display;
      pop.style.display = 'block';
      if ((window.getComputedStyle(pop).position || '') !== 'absolute') { pop.style.display = prev; return; }
      var op = pop.offsetParent || root;
      var oR = op.getBoundingClientRect();
      var dR = root.getBoundingClientRect();
      var wR = wrap.getBoundingClientRect();
      var w = pop.offsetWidth, pad = 6;
      var x = wR.left + wR.width / 2 - w / 2;      /* 기본: 각주 번호 아래 가운데 */
      var lo = dR.left + pad, hi = dR.right - w - pad;
      if (hi < lo) hi = lo;
      if (x < lo) x = lo;
      if (x > hi) x = hi;                          /* 본문을 넘으면 안쪽으로 민다 */
      pop.style.left = (x - oR.left) + 'px';
      pop.style.right = 'auto';
      pop.style.margin = '7px 0 0';
      pop.style.display = prev;
    }
    function on(ev) {
      var t = ev.target, w = t && t.closest ? t.closest('.nw-fnwrap') : null;
      if (w && root.contains(w)) place(w);
    }
    root.addEventListener('mouseover', on, true);
    root.addEventListener('focusin', on, true);
    root.addEventListener('touchstart', on, true);

    /* 접혀 있는 각주 모음·챕터 안으로 이동할 때 저절로 펼쳐지게 한다 */
    function openTo() {
      var id = (window.location.hash || '').slice(1);
      if (!id || !/^[\w-]+$/.test(id)) return;
      var t = root.querySelector('#' + id);
      if (!t) return;
      var n = t.parentNode, opened = false;
      while (n && n !== root && n.nodeType === 1) {
        if (n.tagName === 'DETAILS' && !n.open) { n.open = true; opened = true; }
        n = n.parentNode;
      }
      if (opened) {
        try { t.scrollIntoView({ block: 'center' }); } catch (e) { t.scrollIntoView(); }
      }
    }
    window.addEventListener('hashchange', openTo);
    setTimeout(openTo, 0);
  }

  function popupScriptTag() {
    return '<scr' + 'ipt>(function(){var f=' + nwPlacePopups.toString() +
           ';var s=document.currentScript;var r=s&&s.closest?s.closest(".nw-doc"):null;' +
           'f(r||document.body);})();</scr' + 'ipt>';
  }

  /* <style> 가 살아남는 환경에서만 적용되는 향상 규칙.
     제거돼도 브라우저 기본 마커와 드래그 스포일러로 정상 동작한다. */
  function enhanceCss(scope) {
    var s = scope || '.nw-doc';
    return [
      s + ' details > summary::-webkit-details-marker{display:none}',
      s + ' details > summary{list-style:none}',
      s + ' .nw-chev{transition:transform .2s ease;display:inline-block;transform:rotate(0deg)}',
      s + ' details:not([open]) > summary .nw-chev{transform:rotate(-90deg)}',
      s + ' details.nw-sec > summary:hover,' + s + ' details.nw-fold > summary:hover{background-color:rgba(0,0,0,.028)}',
      /* --- 각주 팝업 --------------------------------------------------
         팝업의 기준을 각주가 아니라 그 각주가 들어 있는 블록(문단·목록·표 칸)으로
         삼는다. left:0/right:0 + margin:auto 이므로 어떤 화면 폭에서도
         본문 영역 밖으로 나가지 않는다. */
      s + '{position:relative}',
      s + ' p,' + s + ' li,' + s + ' td,' + s + ' th,' + s + ' .nw-body,' +
        s + ' [data-nw=qbody],' + s + ' [data-nw=ntext]{position:relative}',
      s + ' .nw-fnwrap{position:static}',
      s + ' .nw-fnwrap:hover .nw-fnpop,' + s + ' .nw-fnwrap:focus .nw-fnpop,' + s + ' .nw-fnwrap:focus-within .nw-fnpop{display:block!important}',
      s + ' .nw-fnwrap:focus{outline:none}',
      s + ' .nw-fnjump:hover{background-color:rgba(0,0,0,.045)}',
      /* 손가락으로 쓰는 기기에서는 번호를 눌러도 하단으로 튀지 않고 팝업만 열리게 한다.
         팝업 안의 버튼으로 하단 각주까지 갈 수 있다. */
      '@media (hover:none){' + s + ' .nw-fnwrap > .nw-ref{pointer-events:none}}',
      /* 좁은 화면에서는 화면 아래에 붙는 시트로 띄운다 (잘릴 일이 없다) */
      '@media (max-width:640px){' +
        s + ' .nw-fnpop{position:fixed!important;left:12px!important;right:12px!important;' +
          'bottom:14px!important;top:auto!important;margin:0!important;' +
          'width:auto!important;max-width:none!important;z-index:999;' +
          'box-shadow:0 -2px 24px rgba(16,20,24,.22)}' +
        s + ' .nw-fnjump{padding:10px!important;font-size:.95em!important}' +
      '}',
      /* 프로필 표는 모서리를 다듬느라 넘침을 자르므로 팝업 대신 하단 각주 이동만 쓴다 */
      s + ' .nw-profile .nw-fnpop{display:none}',
      /* --- 이동했을 때 잠깐 강조 ------------------------------------- */
      '@keyframes nwFlash{0%{background-color:#ffe08a}30%{background-color:#fff3bf}100%{background-color:transparent}}',
      s + ' .nw-fnbox li:target{animation:nwFlash 2s ease-out 1;border-radius:3px}',
      s + ' .nw-fnwrap:target{animation:nwFlash 2s ease-out 1;border-radius:3px}',
      s + ' .nw-spoiler{transition:color .13s,background-color .13s}',
      s + ' .nw-spoiler:hover,' + s + ' .nw-spoiler:focus{background-color:transparent!important;color:inherit!important}',
      s + ' a:hover{text-decoration:underline}',
      s + ' img{max-width:100%;height:auto}',
      /* 블로그 스킨이 div/span 같은 요소에 직접 줄 간격을 걸어도, 우리가 지정하지 않은
         요소는 문서 컨테이너의 값을 물려받게 해 미리보기와 똑같이 보이도록 한다. */
      s + ' *:not([style*="line-height"]){line-height:inherit}',
      '@media (max-width:720px){' + s + ' .nw-top{gap:14px}' + s + ' .nw-profile{flex:1 1 100%!important;width:100%!important}}'
    ].join('\n');
  }

  function exportFragment(model, opts) {
    opts = opts || {};
    var r = render(model, { docId: opts.docId, editable: false });
    var cls = 'nw-doc nw-' + r.docId;
    var style = opts.styleTag === false ? '' : '<style>\n' + enhanceCss('.nw-' + r.docId) + '\n</style>\n';
    var script = opts.script === false ? '' : '\n' + popupScriptTag();
    return {
      html: '<div class="' + cls + '" style="' + styles(r.theme).doc + '">\n' + style + r.html + script + '\n</div>',
      meta: r
    };
  }

  function exportPage(model, opts) {
    opts = opts || {};
    var f = exportFragment(model, opts);
    var t = (model && model.title) || '위키 문서';
    return '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n' +
           '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
           '<title>' + esc(t) + '</title>\n' +
           '<style>body{margin:0;background:#fff}.nw-page{max-width:1000px;margin:0 auto;padding:36px 22px 90px}</style>\n' +
           '</head>\n<body>\n<div class="nw-page">\n' + f.html + '\n</div>\n</body>\n</html>\n';
  }

  /* ==================================================================
   * 11. 모델 도우미
   * ================================================================ */
  var seq = 0;
  function uid(p) { return (p || 'x') + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 5); }

  function newRow(label, value, full) {
    return { id: uid('r'), label: label || '', value: value || '', full: !!full };
  }
  function newGroup(kind, title) {
    return { id: uid('g'), kind: kind || 'plain', title: title || '', open: false, rows: [] };
  }
  function newChapter(title) {
    return { id: uid('c'), title: title || '새 챕터', collapsed: false, body: '<p><br></p>', children: [] };
  }
  function newNotice(preset) {
    var p = NOTICE_PRESETS[preset] || NOTICE_PRESETS.info;
    return { id: uid('n'), icon: p.icon, text: p.text, accent: p.color, bg: '', fg: '', border: '' };
  }

  function defaults(type) {
    var m = {
      v: 2,
      type: type === 'plain' ? 'plain' : 'profile',
      title: type === 'plain' ? '문서 제목' : '캐릭터 이름',
      categories: [],
      notices: [],
      theme: {
        accent: '#3f7fbf',
        heading: { num: '', text: '', line: '' },
        profile: { headBg: '', headFg: '', labelBg: '', labelFg: '', valueBg: '', valueFg: '', border: '', width: 400, labelWidth: 31, align: 'right' },
        quote:   { accent: '', bg: '', fg: '', border: '' },
        toc:     { headBg: '', headFg: '', border: '' },
        footnote:{ collapsed: false }
      },
      profile: { enabled: type !== 'plain', title: '', subtitle: '', image: '', imageCaption: '', groups: [] },
      chapters: []
    };
    if (m.type === 'profile') {
      m.profile.title = '캐릭터 이름';
      m.profile.subtitle = 'Character Name';
      var g = newGroup('plain');
      g.rows = [newRow('이명', ''), newRow('출생', ''), newRow('성별', ''), newRow('나이', ''), newRow('신체', ''), newRow('소속', '')];
      var f = newGroup('fold', '성우');
      f.rows = [newRow('한국', ''), newRow('일본', '')];
      m.profile.groups = [g, f];
      m.chapters = [newChapter('개요'), newChapter('특징'), newChapter('작중 행적'), newChapter('여담')];
      m.chapters[1].children = [newChapter('외모'), newChapter('성격')];
    } else {
      m.chapters = [newChapter('개요'), newChapter('상세'), newChapter('여담')];
    }
    return m;
  }

  return {
    render: render,
    exportFragment: exportFragment,
    exportPage: exportPage,
    enhanceCss: enhanceCss,
    sanitize: sanitize,
    plainText: plainText,
    docStyle: function (model) { return styles(resolveTheme(model || {})).doc; },
    resolveTheme: resolveTheme,
    tocHtml: tocHtml, buildTocList: buildTocList, footnotePopup: fnPopup,
    styleNote: function (html, model) {
      var T = resolveTheme(model || {});
      return cleanNote(html, { T: T, S: styles(T), docId: 'nw', editable: false, fn: [], fnByName: {}, toc: [] });
    },
    placePopups: nwPlacePopups,
    tint: tint, shade: shade, isDark: isDark, onColor: onColor, safeUrl: safeUrl, esc: esc,
    defaults: defaults, newRow: newRow, newGroup: newGroup, newChapter: newChapter, newNotice: newNotice,
    NOTICE_PRESETS: NOTICE_PRESETS,
    MI: MI, iconHtml: iconHtml,
    uid: uid,
    BASE: BASE
  };
});
