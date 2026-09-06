/*!
 * nw-editor : contenteditable 기반 서식 편집 도구
 * 선택 영역 관리, 서식 명령, 블록 삽입, 붙여넣기 살균을 담당한다.
 */
(function (root) {
  'use strict';

  var E = {};
  var active = null;      /* 마지막으로 포커스된 편집 영역 */
  var saved  = null;      /* 저장된 Range */
  var onChange = function () {};

  /* ---------------- 선택 영역 ---------------- */
  function isEditable(n) {
    while (n && n !== document.body) {
      if (n.nodeType === 1 && n.getAttribute && n.getAttribute('contenteditable') === 'true') return n;
      n = n.parentNode;
    }
    return null;
  }
  E.saveSelection = function () {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    var r = sel.getRangeAt(0);
    var host = isEditable(r.commonAncestorContainer);
    if (!host) return;
    active = host;
    saved = r.cloneRange();
  };
  E.restoreSelection = function () {
    if (!saved) return false;
    /* 문서를 다시 그린 뒤에는 저장해 둔 범위가 떨어져 나간 노드를 가리킬 수 있다 */
    var n = saved.commonAncestorContainer;
    if (!n || !document.contains(n)) { saved = null; active = null; return false; }
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(saved);
    return true;
  };
  E.activeHost = function () { return (active && document.contains(active)) ? active : null; };
  E.clearSelection = function () { saved = null; active = null; };
  /* 다이얼로그 안에도 편집 칸이 있으면 선택 위치가 그쪽으로 옮겨간다.
     창을 열기 전 위치를 담아 두었다가 확인을 누를 때 되돌린다. */
  E.snapshot = function () { return { host: active, range: saved }; };
  E.restore = function (snap) {
    if (!snap) return;
    active = snap.host;
    saved = snap.range;
  };
  E.hasSelection = function () { return !!saved; };
  E.selectedText = function () { return saved ? saved.toString() : ''; };

  /* 캐럿이 들어 있는 특정 블록 찾기 */
  E.closest = function (selector) {
    if (!saved) return null;
    var n = saved.commonAncestorContainer;
    if (!n || !document.contains(n)) return null;
    if (n.nodeType === 3) n = n.parentNode;
    while (n && n !== document.body) {
      if (n.nodeType === 1 && n.matches && n.matches(selector)) return n;
      n = n.parentNode;
    }
    return null;
  };

  /* ---------------- 서식 명령 ---------------- */
  function run(cmd, val) {
    if (!E.restoreSelection()) return false;
    try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
    document.execCommand(cmd, false, val === undefined ? null : val);
    E.saveSelection();
    onChange();
    return true;
  }
  E.exec = run;

  E.format = function (what) {
    switch (what) {
      case 'bold':      return run('bold');
      case 'italic':    return run('italic');
      case 'underline': return run('underline');
      case 'strike':    return run('strikeThrough');
      case 'sup':       return run('superscript');
      case 'sub':       return run('subscript');
      case 'ul':        return run('insertUnorderedList');
      case 'ol':        return run('insertOrderedList');
      case 'left':      return run('justifyLeft');
      case 'center':    return run('justifyCenter');
      case 'right':     return run('justifyRight');
      case 'clear':     return E.clearFormat();
    }
  };

  E.clearFormat = function () {
    if (!E.restoreSelection()) return false;
    document.execCommand('removeFormat');
    /* removeFormat 이 지우지 못하는 span style 을 직접 정리 */
    var host = active;
    if (host) {
      Array.prototype.slice.call(host.querySelectorAll('span[style]')).forEach(function (sp) {
        if (sp.getAttribute('data-nw')) return;
        var sel = window.getSelection();
        if (sel.rangeCount && sel.getRangeAt(0).intersectsNode(sp)) {
          while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp);
          sp.remove();
        }
      });
    }
    E.saveSelection();
    onChange();
    return true;
  };

  E.color = function (hex) { return run('foreColor', hex); };
  E.background = function (hex) {
    if (!E.restoreSelection()) return false;
    try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
    if (!document.execCommand('hiliteColor', false, hex)) document.execCommand('backColor', false, hex);
    E.saveSelection();
    onChange();
    return true;
  };

  /* execCommand 의 fontSize(1~7) 로 표시한 뒤 span[style] 으로 바꾼다 */
  E.fontSize = function (cssSize) {
    if (!E.restoreSelection()) return false;
    var host = active;
    if (!host) return false;
    try { document.execCommand('styleWithCSS', false, false); } catch (e) {}
    document.execCommand('fontSize', false, '7');
    Array.prototype.slice.call(host.querySelectorAll('font[size="7"]')).forEach(function (f) {
      var sp = document.createElement('span');
      sp.style.fontSize = cssSize;
      while (f.firstChild) sp.appendChild(f.firstChild);
      f.parentNode.replaceChild(sp, f);
    });
    /* 중첩된 크기 지정 정리 */
    Array.prototype.slice.call(host.querySelectorAll('span[style*="font-size"] span[style*="font-size"]')).forEach(function (sp) {
      sp.style.fontSize = '';
      if (!sp.getAttribute('style')) {
        while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp);
        sp.remove();
      }
    });
    E.saveSelection();
    onChange();
    return true;
  };

  /* ---------------- 삽입 ---------------- */
  E.insertHtml = function (html) {
    if (!E.restoreSelection()) return false;
    document.execCommand('insertHTML', false, html);
    if (active) normalizeBlocks(active);
    E.saveSelection();
    onChange();
    return true;
  };

  /* 블록 요소는 execCommand 대신 DOM 에 직접 넣는다.
     insertHTML 은 <p> 안에서 <div> 를 만나면 구조를 망가뜨릴 수 있다. */
  E.insertBlock = function (html) {
    if (!E.restoreSelection()) return null;
    var host = active;
    if (!host) return null;
    var sel = window.getSelection();
    if (!sel.rangeCount) return null;

    var node = sel.getRangeAt(0).startContainer;
    if (node.nodeType === 3) node = node.parentNode;
    while (node && node.parentNode && node.parentNode !== host) node = node.parentNode;
    if (node && !host.contains(node)) node = null;

    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var el = tmp.firstElementChild;
    if (!el) return null;

    if (node && node.parentNode === host) host.insertBefore(el, node.nextSibling);
    else host.appendChild(el);

    var p = document.createElement('p');
    p.innerHTML = '<br>';
    host.insertBefore(p, el.nextSibling);

    var nr = document.createRange();
    nr.selectNodeContents(p);
    nr.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nr);
    E.saveSelection();
    onChange();
    return el;
  };

  /* 이미 있는 블록을 새 HTML 로 바꾼다 */
  E.replaceBlock = function (oldEl, html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var el = tmp.firstElementChild;
    if (!el || !oldEl || !oldEl.parentNode) return null;
    oldEl.parentNode.replaceChild(el, oldEl);
    onChange();
    return el;
  };

  /* <p> 안에 들어간 블록 요소를 밖으로 끌어낸다 */
  function normalizeBlocks(host) {
    var moved = true, guard = 0;
    while (moved && guard++ < 20) {
      moved = false;
      Array.prototype.slice.call(host.querySelectorAll('p [data-nw], p table, p hr')).forEach(function (el) {
        var p = el.closest('p');
        if (!p || !host.contains(p)) return;
        var kind = el.getAttribute && el.getAttribute('data-nw');
        if (kind && kind !== 'quote' && kind !== 'notice' && kind !== 'figure' && kind !== 'embed' && el.tagName !== 'TABLE' && el.tagName !== 'HR') return;
        p.parentNode.insertBefore(el, p.nextSibling);
        moved = true;
      });
      Array.prototype.slice.call(host.querySelectorAll('p')).forEach(function (p) {
        if (!p.innerHTML.trim()) p.remove();
      });
    }
    if (!host.innerHTML.trim()) host.innerHTML = '<p><br></p>';
    /* 마지막이 블록이면 뒤에 빈 문단을 둬서 계속 쓸 수 있게 한다 */
    var last = host.lastElementChild;
    if (last && (last.getAttribute && last.getAttribute('data-nw') || last.tagName === 'TABLE' || last.tagName === 'HR')) {
      var p2 = document.createElement('p');
      p2.innerHTML = '<br>';
      host.appendChild(p2);
    }
  }
  E.normalizeBlocks = normalizeBlocks;

  E.wrapSelection = function (tag, attrs) {
    if (!E.restoreSelection()) return false;
    var sel = window.getSelection();
    if (!sel.rangeCount) return false;
    var r = sel.getRangeAt(0);
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    try {
      var frag = r.extractContents();
      if (!frag.textContent && !frag.querySelector('img')) el.textContent = '내용';
      else el.appendChild(frag);
      r.insertNode(el);
      r.selectNodeContents(el);
      sel.removeAllRanges(); sel.addRange(r);
      E.saveSelection();
      onChange();
      return el;
    } catch (e) { return false; }
  };

  /* ---------------- 붙여넣기 살균 ---------------- */
  function onPaste(ev) {
    var host = isEditable(ev.target);
    if (!host) return;
    ev.preventDefault();
    var dt = ev.clipboardData;
    var html = dt && dt.getData('text/html');
    var text = dt && dt.getData('text/plain');
    var out;
    if (html) {
      out = root.NWR.sanitize(html);
      var d = document.createElement('div');
      d.innerHTML = out;
      /* 붙여넣은 내용의 인라인 스타일 중 배경·크기 등은 유지하되 폭/여백류는 제거 */
      Array.prototype.slice.call(d.querySelectorAll('[style]')).forEach(function (el) {
        ['width', 'height', 'margin', 'padding', 'position', 'float', 'display'].forEach(function (k) {
          el.style.removeProperty(k);
        });
      });
      out = d.innerHTML;
    } else {
      out = (text || '').split(/\n{2,}/).map(function (para) {
        return '<p>' + root.NWR.esc(para).replace(/\n/g, '<br>') + '</p>';
      }).join('');
    }
    document.execCommand('insertHTML', false, out);
    normalizeBlocks(host);
    E.saveSelection();
    onChange();
  }

  /* ---------------- 초기화 ---------------- */
  E.attach = function (rootEl, changeCb) {
    onChange = changeCb || function () {};
    rootEl.addEventListener('paste', onPaste);
    rootEl.addEventListener('keyup', E.saveSelection);
    rootEl.addEventListener('mouseup', E.saveSelection);
    rootEl.addEventListener('focusin', function (ev) {
      var h = isEditable(ev.target);
      if (h) { active = h; setTimeout(E.saveSelection, 0); }
    });
    /* summary 안에서 제목을 편집할 때 접힘 토글이 일어나지 않게 한다 */
    rootEl.addEventListener('click', function (ev) {
      var s = ev.target.closest && ev.target.closest('summary');
      if (s && ev.target.getAttribute && ev.target.getAttribute('contenteditable') === 'true') ev.preventDefault();
    });
    rootEl.addEventListener('keydown', function (ev) {
      var host = isEditable(ev.target);
      if (!host) return;
      var mod = ev.ctrlKey || ev.metaKey;
      if (mod && !ev.shiftKey && !ev.altKey) {
        var k = ev.key.toLowerCase();
        if (k === 'b') { ev.preventDefault(); E.saveSelection(); E.format('bold'); }
        else if (k === 'i') { ev.preventDefault(); E.saveSelection(); E.format('italic'); }
        else if (k === 'u') { ev.preventDefault(); E.saveSelection(); E.format('underline'); }
      }
      /* 한 줄짜리 편집 영역(제목 등)에서 Enter 막기 */
      if (ev.key === 'Enter' && host.hasAttribute('data-single')) ev.preventDefault();
    });
  };

  root.NWE = E;
})(typeof self !== 'undefined' ? self : this);
