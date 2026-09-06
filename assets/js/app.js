/*!
 * 나무위키 문서 메이커 — 앱 셸
 * 모델 관리 / 사이드바 / 다이얼로그 / 저장 / 내보내기
 */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return NWR.esc(s); };

  var LS_DOCS = 'nwdm.v2.docs';
  var LS_CUR  = 'nwdm.v2.current';

  var model = null;
  var docKey = null;      /* 저장 슬롯 id */
  var docName = '';
  var docId = 'doc';
  var saveTimer = null;

  var elDoc, elSide;

  /* ==================================================================
   * 유틸
   * ================================================================ */
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('on'); }, 1900);
  }
  function readJSON(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function fmtDate(ts) {
    var d = new Date(ts), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function getPath(o, path) {
    return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o);
  }
  function setPath(o, path, v) {
    var ks = path.split('.'), last = ks.pop();
    var t = ks.reduce(function (a, k) { if (!a[k]) a[k] = {}; return a[k]; }, o);
    t[last] = v;
  }

  /* ==================================================================
   * 문서 렌더링 + DOM 바인딩
   * ================================================================ */
  function rerender() {
    var scroll = $('#doc-scroll').scrollTop;
    var r = NWR.render(model, { editable: true, docId: docId });
    elDoc.setAttribute('style', NWR.docStyle(model));
    elDoc.innerHTML = '<style>' + NWR.enhanceCss('#nw-doc') + '</style>' + r.html;
    bindDoc();
    renumberFootnotes();
    $('#doc-scroll').scrollTop = scroll;
    renderSide();
    scheduleSave();
  }

  function refreshToc() {
    var box = $('.nw-toc', elDoc);
    var html = NWR.tocHtml(model, docId);
    if (!box) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var fresh = wrap.firstElementChild;
    if (fresh) box.parentNode.replaceChild(fresh, box);
  }

  /* 편집 영역 -> 모델 */
  function bindDoc() {
    $$('[contenteditable=true]', elDoc).forEach(function (el) {
      el.addEventListener('input', function () { pull(el); });
      el.addEventListener('blur', function () { pull(el); });
    });
    $$('.nw-edit-fold', elDoc).forEach(function (b) {
      b.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var ch = findChapter(b.getAttribute('data-ch'));
        if (!ch) return;
        ch.node.collapsed = !ch.node.collapsed;
        b.textContent = ch.node.collapsed ? '접힘' : '펼침';
        scheduleSave();
      });
    });
  }

  function onDocClick(ev) {
    if (!ev.target.closest) return;
    var fn = ev.target.closest('[data-nw=fn]');
    if (fn) { ev.preventDefault(); editFootnote(fn); return; }

    /* 사진과 영상은 안에 커서를 두기 어려우므로 눌렀을 때 바로 편집 창을 연다 */
    var fig = ev.target.closest('[data-nw=figure]');
    if (fig && elDoc.contains(fig)) { ev.preventDefault(); openFigureDialog(fig); return; }
    var emb = ev.target.closest('[data-nw=embed]');
    if (emb && elDoc.contains(emb)) { ev.preventDefault(); openEmbedDialog(emb); return; }
  }

  function pull(el) {
    var ch = el.getAttribute('data-ch');
    if (el.classList.contains('nw-doc-title')) { model.title = el.textContent.trim(); scheduleSave(); return; }
    if (el.classList.contains('nw-ch-title') && ch) {
      var c = findChapter(ch);
      if (c) { c.node.title = el.textContent.trim(); refreshToc(); renderSide(); scheduleSave(); }
      return;
    }
    if (el.classList.contains('nw-body') && ch) {
      var c2 = findChapter(ch);
      if (c2) { c2.node.body = el.innerHTML; renumberFootnotes(); scheduleSave(); }
      return;
    }
    var pf = el.getAttribute('data-pf');
    if (pf === 'title' || pf === 'subtitle') { model.profile[pf] = el.innerHTML; scheduleSave(); return; }
    if (pf === 'gtitle') {
      var g = findGroup(el.getAttribute('data-group'));
      if (g) { g.title = el.innerHTML; renderSide(); scheduleSave(); }
      return;
    }
    if (pf === 'label' || pf === 'value') {
      var row = findRow(el.getAttribute('data-row'));
      if (row) { row[pf] = el.innerHTML; renumberFootnotes(); scheduleSave(); }
      return;
    }
    var nid = el.getAttribute('data-notice');
    if (nid) {
      var n = (model.notices || []).filter(function (x) { return x.id === nid; })[0];
      if (n) { n.text = el.innerHTML; scheduleSave(); }
    }
  }

  /* 각주 번호를 문서 순서대로 다시 매기고 미리보기 팝업도 갱신한다 */
  function renumberFootnotes() {
    var n = 0, named = {};
    $$('[data-nw=fn]', elDoc).forEach(function (el) {
      var name = (el.getAttribute('data-name') || '').trim();
      var label;
      if (name) {
        if (!named[name]) named[name] = ++n;
        label = name;
      } else {
        label = String(++n);
      }
      var note = el.getAttribute('data-note') || '';
      el.className = 'nw-fnwrap';
      el.setAttribute('contenteditable', 'false');
      el.removeAttribute('title');   /* 기본 툴팁과 팝업이 겹쳐 두 개로 보이는 것을 막는다 */
      /* position 은 <style> 에서 문단 기준으로 잡으므로 여기서는 지정하지 않는다 */
      el.setAttribute('style', 'display:inline-block;font-size:.78em;line-height:1;vertical-align:super;' +
        'font-weight:600;color:' + NWR.resolveTheme(model).accent + ';cursor:pointer;');
      el.innerHTML = '<span class="nw-fnlabel" style="line-height:1;">[' + NWR.esc(label) + ']</span>' +
                     NWR.footnotePopup(NWR.styleNote(note, model));
    });
    var badge = $('#st-fns');
    if (badge) badge.textContent = n;
    var st = $('#st-secs');
    if (st) st.textContent = NWR.buildTocList(model.chapters || [], '', 1, docId, []).length;
  }

  /* ==================================================================
   * 챕터 트리 조작
   * ================================================================ */
  function walk(nodes, parent, fn) {
    (nodes || []).forEach(function (n, i) {
      fn(n, nodes, i, parent);
      walk(n.children, n, fn);
    });
  }
  function findChapter(id) {
    var found = null;
    walk(model.chapters, null, function (n, arr, i, parent) {
      if (n.id === id) found = { node: n, arr: arr, index: i, parent: parent };
    });
    return found;
  }
  function findGroup(id) {
    return ((model.profile && model.profile.groups) || []).filter(function (g) { return g.id === id; })[0];
  }
  function findRow(id) {
    var out = null;
    ((model.profile && model.profile.groups) || []).forEach(function (g) {
      (g.rows || []).forEach(function (r) { if (r.id === id) out = r; });
    });
    return out;
  }

  function chAdd(afterId) {
    var c = afterId && findChapter(afterId);
    var node = NWR.newChapter();
    if (c) c.arr.splice(c.index + 1, 0, node);
    else (model.chapters = model.chapters || []).push(node);
    rerender();
    focusChapter(node.id);
  }
  function chAddChild(id) {
    var c = findChapter(id);
    if (!c) return;
    var node = NWR.newChapter();
    (c.node.children = c.node.children || []).push(node);
    rerender();
    focusChapter(node.id);
  }
  function chMove(id, dir) {
    var c = findChapter(id);
    if (!c) return;
    var j = c.index + dir;
    if (j < 0 || j >= c.arr.length) return;
    c.arr.splice(c.index, 1);
    c.arr.splice(j, 0, c.node);
    rerender();
  }
  function chIndent(id) {
    var c = findChapter(id);
    if (!c || c.index === 0) return;
    var prev = c.arr[c.index - 1];
    c.arr.splice(c.index, 1);
    (prev.children = prev.children || []).push(c.node);
    rerender();
  }
  function chOutdent(id) {
    var c = findChapter(id);
    if (!c || !c.parent) return;
    var p = findChapter(c.parent.id);
    if (!p) return;
    c.arr.splice(c.index, 1);
    p.arr.splice(p.index + 1, 0, c.node);
    rerender();
  }
  function chRemove(id) {
    var c = findChapter(id);
    if (!c) return;
    var n = 1 + NWR.buildTocList(c.node.children || [], '', 1, 'x', []).length;
    if (!confirm('"' + (c.node.title || '제목 없음') + '" 챕터를 삭제할까요?' + (n > 1 ? '\n하위 챕터 ' + (n - 1) + '개도 함께 삭제됩니다.' : ''))) return;
    c.arr.splice(c.index, 1);
    rerender();
  }
  function focusChapter(id) {
    setTimeout(function () {
      var el = $('.nw-body[data-ch="' + id + '"]', elDoc);
      var t  = $('.nw-ch-title[data-ch="' + id + '"]', elDoc);
      if (t) { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.focus(); document.execCommand('selectAll'); }
      else if (el) el.focus();
    }, 30);
  }

  /* ==================================================================
   * 다이얼로그 (선언형)
   * ================================================================ */
  function dialog(spec) {
    var m = $('#modal-form');
    /* 다이얼로그 안 서식 칸으로 선택이 옮겨가도 본문 삽입 위치를 잃지 않도록 */
    var selSnap = NWE.snapshot();
    $('#form-title').textContent = spec.title || '';
    var body = $('#form-body');
    body.innerHTML = (spec.fields || []).map(function (f) {
      var id = 'f_' + f.key;
      var input;
      if (f.type === 'rich') {
        input =
          '<div class="richwrap">' +
            '<div class="richbar">' +
              '<button type="button" class="rb b" data-rf="bold" title="굵게 (Ctrl+B)">B</button>' +
              '<button type="button" class="rb i" data-rf="italic" title="기울임 (Ctrl+I)">I</button>' +
              '<button type="button" class="rb u" data-rf="underline" title="밑줄 (Ctrl+U)">U</button>' +
              '<button type="button" class="rb s" data-rf="strike" title="취소선">S</button>' +
              '<button type="button" class="rb" data-rf="sup" title="위 첨자">x&sup2;</button>' +
              '<label class="rb color" title="글자 색"><span class="sw" style="background:#c2255c"></span>' +
                '<input type="color" data-rf="color" value="#c2255c"></label>' +
              '<button type="button" class="rb" data-rf="link" title="링크 넣기">링크</button>' +
              '<button type="button" class="rb" data-rf="spoiler" title="스포일러로 가리기">스포일러</button>' +
              '<button type="button" class="rb" data-rf="clear" title="서식 지우기">서식 지우기</button>' +
            '</div>' +
            '<div class="richfield" id="' + id + '" contenteditable="true" role="textbox" aria-multiline="true">' +
              (f.value || '') +
            '</div>' +
          '</div>';
      } else if (f.type === 'textarea') {
        input = '<textarea id="' + id + '" rows="' + (f.rows || 3) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(f.value || '') + '</textarea>';
      } else if (f.type === 'select') {
        input = '<select id="' + id + '">' + (f.options || []).map(function (o) {
          return '<option value="' + esc(o[0]) + '"' + (String(f.value) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
        }).join('') + '</select>';
      } else if (f.type === 'color') {
        input = '<span class="colorfield"><input type="color" id="' + id + '" value="' + esc(f.value || '#3f7fbf') + '">' +
                '<input type="text" id="' + id + '_t" value="' + esc(f.value || '') + '" placeholder="비우면 기본값"></span>';
      } else if (f.type === 'checkbox') {
        input = '<label class="chk"><input type="checkbox" id="' + id + '"' + (f.value ? ' checked' : '') + '> ' + esc(f.hint || '') + '</label>';
      } else if (f.type === 'range') {
        input = '<span class="rangefield"><input type="range" id="' + id + '" min="' + f.min + '" max="' + f.max + '" step="' + (f.step || 1) + '" value="' + esc(f.value) + '">' +
                '<output id="' + id + '_o">' + esc(f.value) + '</output></span>';
      } else {
        input = '<input type="' + (f.type || 'text') + '" id="' + id + '" value="' + esc(f.value == null ? '' : f.value) + '" placeholder="' + esc(f.placeholder || '') + '">';
      }
      return '<div class="field"><label for="' + id + '">' + esc(f.label) + '</label>' + input +
             (f.hint && f.type !== 'checkbox' ? '<small>' + esc(f.hint) + '</small>' : '') + '</div>';
    }).join('');

    (spec.fields || []).forEach(function (f) {
      if (f.type === 'rich') bindRichField($('#f_' + f.key));
      if (f.type === 'color') {
        var c = $('#f_' + f.key), t = $('#f_' + f.key + '_t');
        c.addEventListener('input', function () { t.value = c.value; });
        t.addEventListener('input', function () { if (/^#[0-9a-fA-F]{6}$/.test(t.value)) c.value = t.value; });
      }
      if (f.type === 'range') {
        var r = $('#f_' + f.key), o = $('#f_' + f.key + '_o');
        r.addEventListener('input', function () { o.textContent = r.value; });
      }
    });

    $('#form-ok').textContent = spec.okText || '확인';
    m.classList.add('on');
    setTimeout(function () { var first = body.querySelector('input,textarea,select'); if (first) first.focus(); }, 30);

    function collect() {
      var v = {};
      (spec.fields || []).forEach(function (f) {
        var el = $('#f_' + f.key);
        if (!el) return;
        if (f.type === 'checkbox') v[f.key] = el.checked;
        else if (f.type === 'rich') v[f.key] = richValue(el);
        else if (f.type === 'color') v[f.key] = ($('#f_' + f.key + '_t').value || '').trim();
        else v[f.key] = el.value;
      });
      return v;
    }
    function close() {
      m.classList.remove('on');
      $('#form-ok').onclick = null;
      $('#form-cancel').onclick = null;
      m.onkeydown = null;
    }
    $('#form-ok').onclick = function () {
      var v = collect();
      close();
      NWE.restore(selSnap);
      if (spec.onOk) spec.onOk(v);
    };
    $('#form-cancel').onclick = close;
    m.onkeydown = function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); close(); }
      if (ev.key === 'Enter' && ev.target.tagName !== 'TEXTAREA' && (ev.ctrlKey || ev.metaKey || ev.target.tagName === 'INPUT')) {
        ev.preventDefault(); $('#form-ok').click();
      }
    };
  }

  /* ------------------------------------------------------------------
   * 다이얼로그 안의 작은 서식 입력 칸 (각주 내용 등)
   * 본문과 같은 편집 도구(NWE)를 그대로 쓰므로 꾸밈·링크가 동일하게 동작한다.
   * ---------------------------------------------------------------- */
  function richValue(el) {
    var html = NWR.sanitize(el.innerHTML || '');
    if (!NWR.plainText(html) && !/<img|<br/i.test(html)) return '';
    return html;
  }

  function bindRichField(field) {
    if (!field) return;
    var bar = field.parentNode.querySelector('.richbar');
    if (!bar) return;

    ['focus', 'keyup', 'mouseup'].forEach(function (t) {
      field.addEventListener(t, function () { NWE.saveSelection(); });
    });

    bar.addEventListener('mousedown', function (ev) {
      if (ev.target.closest('button,label,input')) ev.preventDefault();
    });

    bar.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-rf]');
      if (!b) return;
      var act = b.getAttribute('data-rf');
      if (NWE.activeHost() !== field) { field.focus(); NWE.saveSelection(); }

      if (act === 'link') {
        var sel = NWE.selectedText();
        var url = window.prompt('링크 주소를 입력하세요.', 'https://');
        if (!url) return;
        var safe = NWR.safeUrl(url);
        if (!safe) { toast('주소를 확인해 주세요'); return; }
        if (sel) {
          NWE.exec('createLink', safe);
          Array.prototype.slice.call(field.querySelectorAll('a[href]')).forEach(function (a) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
          });
        } else {
          NWE.insertHtml('<a href="' + esc(safe) + '" target="_blank" rel="noopener noreferrer">' + esc(safe) + '</a>&#8203;');
        }
        return;
      }
      if (act === 'spoiler') {
        NWE.wrapSelection('span', { 'data-nw': 'spoiler', style: 'background:#15171a;color:#15171a;border-radius:2px;padding:0 .2em;' });
        return;
      }
      NWE.format(act);
    });

    var picker = bar.querySelector('input[data-rf=color]');
    if (picker) {
      picker.addEventListener('input', function () {
        this.previousElementSibling.style.background = this.value;
        if (NWE.activeHost() !== field) { field.focus(); NWE.saveSelection(); }
        NWE.color(this.value);
      });
    }
  }

  /* ==================================================================
   * 서식 도구모음
   * ================================================================ */
  /* 알림 아이콘 선택 목록: 머티리얼 아이콘 + 직접 입력 */
  function iconOptions() {
    var out = [['', '아이콘 없음']];
    Object.keys(NWR.MI).forEach(function (k) { out.push(['mi:' + k, NWR.MI[k].label]); });
    out.push(['custom', '직접 입력 (이모지)']);
    return out;
  }
  function resolveIcon(sel, text) {
    if (sel === 'custom') return (text || '').trim();
    return sel || '';
  }
  function iconSelectValue(icon) {
    if (!icon) return '';
    return /^mi:/.test(icon) && NWR.MI[icon.slice(3)] ? icon : 'custom';
  }

  var SIZES = [['0.8em', '아주 작게'], ['0.9em', '작게'], ['1em', '보통'], ['1.15em', '조금 크게'], ['1.35em', '크게'], ['1.6em', '아주 크게'], ['2em', '제일 크게']];

  function initToolbar() {
    /* 버튼을 눌러도 편집 영역의 선택이 풀리지 않도록 */
    $('#formatbar').addEventListener('mousedown', function (ev) {
      if (ev.target.closest('button,select,input')) ev.preventDefault();
    });

    $$('#formatbar [data-fmt]').forEach(function (b) {
      b.addEventListener('click', function () { NWE.format(b.getAttribute('data-fmt')); });
    });

    $('#fmt-color').addEventListener('input', function () {
      this.previousElementSibling.style.background = this.value;
      NWE.color(this.value);
    });
    $('#fmt-bg').addEventListener('input', function () {
      this.previousElementSibling.style.background = this.value;
      NWE.background(this.value);
    });
    $('#fmt-size').innerHTML = '<option value="">크기</option>' + SIZES.map(function (s) {
      return '<option value="' + s[0] + '">' + s[1] + '</option>';
    }).join('');
    $('#fmt-size').addEventListener('change', function () {
      if (this.value) NWE.fontSize(this.value);
      this.value = '';
    });

    $('#ins-link').addEventListener('click', insertLink);
    $('#ins-image').addEventListener('click', insertImage);
    $('#ins-embed').addEventListener('click', insertEmbed);
    $('#ins-table').addEventListener('click', insertTable);
    $('#ins-quote').addEventListener('click', insertQuote);
    $('#ins-notice').addEventListener('click', insertNotice);
    $('#ins-fn').addEventListener('click', function () { insertFootnote(); });
    $('#ins-spoiler').addEventListener('click', function () {
      NWE.saveSelection();
      var el = NWE.wrapSelection('span', { 'data-nw': 'spoiler', style: 'background:#15171a;color:#15171a;border-radius:3px;padding:0 .2em;' });
      if (el) { syncActive(); }
    });
    $('#ins-hr').addEventListener('click', function () { NWE.insertBlock('<hr>'); syncBlocks(); });

    /* 표 안에서만 보이는 도구 */
    document.addEventListener('selectionchange', function () {
      var inTable = !!NWE.closest('table');
      $('#tablebar').hidden = !inTable;
    });
    $$('#tablebar [data-tbl]').forEach(function (b) {
      b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      b.addEventListener('click', function () { tableOp(b.getAttribute('data-tbl')); });
    });
  }

  function syncActive() {
    var host = NWE.activeHost();
    if (host) pull(host);
    renumberFootnotes();
  }

  /* 블록(사진·영상·인용구·경고문·표)을 넣거나 고친 뒤에는 문서를 다시 그려
     방금 넣은 블록에도 문서 스타일이 곧바로 입혀지게 한다. */
  function syncBlocks() {
    var host = NWE.activeHost();
    var chId = host && host.getAttribute ? host.getAttribute('data-ch') : null;
    syncActive();
    NWE.clearSelection();
    rerender();
    if (chId) {
      var el = $('.nw-body[data-ch="' + chId + '"]', elDoc);
      if (el) {
        el.focus();
        var r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        NWE.saveSelection();
      }
    }
  }

  /* ---- 링크 (나무위키 외 어떤 주소도 가능) ---- */
  function insertLink() {
    NWE.saveSelection();
    var cur = NWE.closest('a');
    var sel = NWE.selectedText();
    dialog({
      title: cur ? '링크 편집' : '링크 넣기',
      okText: cur ? '적용' : '넣기',
      fields: [
        { key: 'text', label: '표시할 글자', value: cur ? cur.textContent : sel, placeholder: '화면에 보이는 글자' },
        { key: 'url', label: '주소', value: cur ? cur.getAttribute('href') : '', placeholder: 'https://example.com', hint: '어떤 주소든 넣을 수 있습니다. 나무위키 문서는 아래 버튼으로 채우세요.' },
        { key: 'wiki', label: '나무위키 문서명', value: '', placeholder: '비워 두면 위 주소를 사용', hint: '문서명을 넣으면 나무위키 주소가 자동으로 만들어집니다.' },
        { key: 'blank', label: '새 창으로 열기', type: 'checkbox', value: true, hint: '새 탭에서 열기' }
      ],
      onOk: function (v) {
        var url = v.wiki.trim() ? 'https://namu.wiki/w/' + encodeURIComponent(v.wiki.trim()) : NWR.safeUrl(v.url);
        if (!url) { toast('주소를 확인해 주세요'); return; }
        var text = v.text.trim() || v.wiki.trim() || url;
        if (cur) {
          cur.setAttribute('href', url);
          cur.textContent = text;
          if (v.blank) { cur.setAttribute('target', '_blank'); cur.setAttribute('rel', 'noopener noreferrer'); }
          else { cur.removeAttribute('target'); cur.removeAttribute('rel'); }
          syncActive();
        } else {
          NWE.insertHtml('<a href="' + esc(url) + '"' + (v.blank ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(text) + '</a>&#8203;');
          syncActive();
        }
      }
    });
  }

  /* ---- 이미지 ---- */
  function insertImage() {
    NWE.saveSelection();
    openFigureDialog(NWE.closest('[data-nw=figure]'));
  }

  function openFigureDialog(cur) {
    var img = cur && cur.querySelector('img');
    var cap = cur && cur.querySelector('[data-nw=fcap]');
    dialog({
      title: cur ? '사진 편집' : '사진 넣기',
      okText: cur ? '적용' : '넣기',
      fields: [
        { key: 'src', label: '이미지 주소', value: img ? img.getAttribute('src') : '', placeholder: 'https://...' },
        { key: 'w', label: '가로 크기', value: cur ? (cur.getAttribute('data-w') || '') : '',
          placeholder: '비우면 원본 크기',
          hint: '사진마다 따로 지정합니다. 숫자만 쓰면 px(예: 420), % 도 됩니다(예: 60%). 본문 폭을 넘지 않게 자동으로 줄어듭니다.' },
        { key: 'align', label: '정렬', type: 'select', value: cur ? (cur.getAttribute('data-align') || 'center') : 'center',
          options: [['center', '가운데'], ['left', '왼쪽'], ['right', '오른쪽']] },
        { key: 'cap', label: '사진 설명', value: cap ? cap.textContent : '', placeholder: '비워도 됩니다' },
        { key: 'del', label: '이 사진 삭제', type: 'checkbox', value: false, hint: cur ? '체크하고 확인을 누르면 삭제됩니다' : '' }
      ],
      onOk: function (v) {
        if (cur && v.del) { cur.remove(); syncBlocks(); return; }
        var src = NWR.safeUrl(v.src);
        if (!src) { toast('이미지 주소를 확인해 주세요'); return; }
        var w = String(v.w || '').trim();
        if (w && !/^[0-9.]+%?$/.test(w)) { toast('가로 크기는 숫자(px) 또는 % 로 입력하세요'); return; }
        var html = figureHtml(src, w, v.align, v.cap);
        if (cur) { NWE.replaceBlock(cur, html); } else { NWE.insertBlock(html); }
        syncBlocks();
      }
    });
  }
  function figureHtml(src, w, align, cap) {
    return '<div data-nw="figure" data-w="' + esc(w || '') + '" data-align="' + esc(align || 'center') + '">' +
             '<img src="' + esc(src) + '" alt="' + esc(cap || '이미지') + '">' +
             (cap ? '<span data-nw="fcap">' + esc(cap) + '</span>' : '') +
           '</div>';
  }

  /* ---- 영상 ---- */
  function ytId(v) {
    v = String(v || '').trim();
    var m = v.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{6,})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{6,}$/.test(v) ? v : '';
  }
  function insertEmbed() {
    NWE.saveSelection();
    openEmbedDialog(NWE.closest('[data-nw=embed]'));
  }

  function openEmbedDialog(cur) {
    var f = cur && cur.querySelector('iframe');
    var cap = cur && cur.querySelector('[data-nw=ecap]');
    dialog({
      title: cur ? '영상 편집' : '유튜브 영상 넣기',
      okText: cur ? '적용' : '넣기',
      fields: [
        { key: 'url', label: '유튜브 주소 또는 영상 ID', value: f ? (f.getAttribute('src') || '') : '', placeholder: 'https://youtu.be/...' },
        { key: 'w', label: '가로 폭(px)', type: 'number', value: cur ? (cur.getAttribute('data-w') || 640) : 640 },
        { key: 'cap', label: '영상 설명', value: cap ? cap.textContent : '', placeholder: '비워도 됩니다' }
      ],
      onOk: function (v) {
        var id = ytId(v.url);
        if (!id) { toast('유튜브 주소나 영상 ID를 확인해 주세요'); return; }
        var html = '<div data-nw="embed" data-w="' + esc(v.w || 640) + '">' +
                     '<span data-nw="epad"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(id) +
                       '" title="YouTube video" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen loading="lazy" frameborder="0"></iframe></span>' +
                     (v.cap ? '<span data-nw="ecap">' + esc(v.cap) + '</span>' : '') +
                   '</div>';
        if (cur) { NWE.replaceBlock(cur, html); } else { NWE.insertBlock(html); }
        syncBlocks();
      }
    });
  }

  /* ---- 인용구 (색 커스텀) ---- */
  function insertQuote() {
    NWE.saveSelection();
    var cur = NWE.closest('[data-nw=quote]');
    var body = cur && cur.querySelector('[data-nw=qbody]');
    var cite = cur && cur.querySelector('[data-nw=qcite]');
    var T = NWR.resolveTheme(model);
    dialog({
      title: cur ? '인용구 편집' : '인용구 넣기',
      okText: cur ? '적용' : '넣기',
      fields: [
        { key: 'text', label: '인용할 내용', type: 'textarea', rows: 3,
          value: cur ? textOfQuote(body, cite) : NWE.selectedText(), placeholder: '줄바꿈하면 여러 줄이 됩니다', hint: '넣은 뒤에도 본문에서 바로 고칠 수 있습니다.' },
        { key: 'cite', label: '출처', value: cite ? cite.textContent.replace(/^—\s*/, '') : '', placeholder: '비워도 됩니다' },
        { key: 'fit', label: '상자 폭', type: 'select', value: (cur && cur.getAttribute('data-fit')) || 'full',
          options: [['full', '본문 전체 폭'], ['content', '내용에 맞춤']] },
        { key: 'accent', label: '강조 막대 색', type: 'color', value: (cur && cur.getAttribute('data-accent')) || T.quote.accent },
        { key: 'bg', label: '배경색', type: 'color', value: (cur && cur.getAttribute('data-bg')) || T.quote.bg },
        { key: 'fg', label: '글자색', type: 'color', value: (cur && cur.getAttribute('data-fg')) || T.quote.fg },
        { key: 'border', label: '테두리 색', type: 'color', value: (cur && cur.getAttribute('data-border')) || T.quote.border }
      ],
      onOk: function (v) {
        var lines = String(v.text || '').split('\n').filter(function (x) { return x.trim(); });
        var inner = lines.length ? lines.map(esc).join('<br>') : '인용할 내용';
        var html = '<div data-nw="quote" data-fit="' + esc(v.fit || 'full') + '" data-accent="' + esc(v.accent) + '" data-bg="' + esc(v.bg) + '" data-fg="' + esc(v.fg) + '" data-border="' + esc(v.border) + '">' +
                     '<span data-nw="qbar"></span>' +
                     '<div data-nw="qbody">' + inner +
                       (v.cite ? '<span data-nw="qcite">— ' + esc(v.cite) + '</span>' : '') +
                     '</div>' +
                   '</div>';
        if (cur) { NWE.replaceBlock(cur, html); } else { NWE.insertBlock(html); }
        syncBlocks();
      }
    });
  }
  function textOfQuote(body, cite) {
    if (!body) return '';
    var d = body.cloneNode(true);
    var c = d.querySelector('[data-nw=qcite]');
    if (c) c.remove();
    return d.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim();
  }

  /* ---- 본문 속 경고/안내 문구 ---- */
  function insertNotice() {
    NWE.saveSelection();
    var cur = NWE.closest('[data-nw=notice]');
    var tx = cur && cur.querySelector('[data-nw=ntext]');
    var P = NWR.NOTICE_PRESETS;
    dialog({
      title: cur ? '경고 문구 편집' : '경고 · 안내 문구 넣기',
      okText: cur ? '적용' : '넣기',
      fields: [
        { key: 'preset', label: '자주 쓰는 문구', type: 'select', value: '',
          options: [['', '직접 입력'], ['pc', 'PC 열람 권장'], ['spoiler', '스포일러 주의'], ['trigger', '트리거 워닝'], ['info', '일반 안내']],
          hint: '고르면 아래 내용과 색이 자동으로 채워집니다. (다시 확인을 누르면 적용)' },
        { key: 'iconsel', label: '아이콘', type: 'select', value: iconSelectValue(cur ? (cur.getAttribute('data-icon') || 'mi:warning') : 'mi:warning'),
          options: iconOptions(), hint: '구글 머티리얼 아이콘이 그림으로 들어갑니다. 이모지를 쓰려면 「직접 입력」을 고르세요.' },
        { key: 'icontext', label: '직접 입력할 이모지', value: (function () {
            var v = cur ? (cur.getAttribute('data-icon') || '') : '';
            return /^mi:/.test(v) ? '' : v;
          })(), placeholder: '예) ⚠️' },
        { key: 'text', label: '문구', type: 'textarea', rows: 2, value: tx ? tx.textContent : P.spoiler.text },
        { key: 'accent', label: '강조 막대 색', type: 'color', value: (cur && cur.getAttribute('data-accent')) || P.spoiler.color },
        { key: 'bg', label: '배경색', type: 'color', value: (cur && cur.getAttribute('data-bg')) || '' },
        { key: 'fg', label: '글자색', type: 'color', value: (cur && cur.getAttribute('data-fg')) || '' },
        { key: 'border', label: '테두리 색', type: 'color', value: (cur && cur.getAttribute('data-border')) || '' }
      ],
      onOk: function (v) {
        var icon = resolveIcon(v.iconsel, v.icontext);
        if (v.preset && P[v.preset]) {
          var pr = P[v.preset];
          if (!v.text || v.text === P.spoiler.text) v.text = pr.text;
          icon = pr.icon; v.accent = pr.color;
        }
        var html = '<div data-nw="notice" data-icon="' + esc(icon) + '" data-accent="' + esc(v.accent) + '" data-bg="' + esc(v.bg) +
                     '" data-fg="' + esc(v.fg) + '" data-border="' + esc(v.border) + '">' +
                     '<span data-nw="nicon">' + NWR.iconHtml(icon) + '</span>' +
                     '<span data-nw="ntext">' + esc(v.text).replace(/\n/g, '<br>') + '</span>' +
                   '</div>';
        if (cur) { NWE.replaceBlock(cur, html); } else { NWE.insertBlock(html); }
        syncBlocks();
      }
    });
  }

  /* ---- 각주 ---- */
  function insertFootnote() {
    NWE.saveSelection();
    dialog({
      title: '각주 넣기',
      fields: [
        { key: 'note', label: '각주 내용', type: 'rich', value: '',
          hint: '위 단추로 굵게 · 기울임 · 밑줄 · 취소선 · 색 · 링크 · 스포일러를 넣을 수 있습니다. 넣은 뒤 각주 번호를 클릭하면 다시 고칠 수 있습니다.' },
        { key: 'name', label: '각주 이름', value: '', placeholder: '비워도 됩니다', hint: '이름을 붙이면 번호 대신 이름이 표시되고, 같은 이름끼리 하나로 묶입니다.' }
      ],
      onOk: function (v) {
        if (!v.note) { toast('각주 내용을 입력해 주세요'); return; }
        NWE.insertHtml('<sup data-nw="fn" data-note="' + esc(v.note) + '"' + (v.name ? ' data-name="' + esc(v.name) + '"' : '') + '>[*]</sup>&#8203;');
        syncActive();
      }
    });
  }
  function editFootnote(el) {
    dialog({
      title: '각주 편집',
      okText: '적용',
      fields: [
        { key: 'note', label: '각주 내용', type: 'rich', value: el.getAttribute('data-note') || '',
          hint: '위 단추로 굵게 · 기울임 · 밑줄 · 취소선 · 색 · 링크 · 스포일러를 넣을 수 있습니다.' },
        { key: 'name', label: '각주 이름', value: el.getAttribute('data-name') || '' },
        { key: 'del', label: '이 각주 삭제', type: 'checkbox', value: false, hint: '체크하고 확인을 누르면 삭제됩니다' }
      ],
      onOk: function (v) {
        if (v.del) { el.remove(); }
        else {
          el.setAttribute('data-note', v.note || '');
          if (v.name) el.setAttribute('data-name', v.name); else el.removeAttribute('data-name');
        }
        var host = el.closest ? el.closest('[contenteditable=true]') : null;
        if (host) pull(host);
        renumberFootnotes();
      }
    });
  }

  /* ---- 표 ---- */
  function insertTable() {
    NWE.saveSelection();
    if (NWE.closest('table')) { toast('표 안에서는 아래 표 도구를 사용하세요'); return; }
    dialog({
      title: '표 넣기',
      fields: [
        { key: 'rows', label: '행 수', type: 'number', value: 3 },
        { key: 'cols', label: '열 수', type: 'number', value: 2 },
        { key: 'head', label: '첫 행을 제목 행으로', type: 'checkbox', value: true, hint: '첫 행을 제목 행으로' }
      ],
      onOk: function (v) {
        var rows = Math.max(1, Math.min(30, parseInt(v.rows, 10) || 3));
        var cols = Math.max(1, Math.min(12, parseInt(v.cols, 10) || 2));
        var h = '<table><tbody>';
        for (var r = 0; r < rows; r++) {
          h += '<tr>';
          for (var c = 0; c < cols; c++) {
            h += (v.head && r === 0) ? '<th>제목</th>' : '<td>내용</td>';
          }
          h += '</tr>';
        }
        h += '</tbody></table>';
        NWE.insertBlock(h);
        syncBlocks();
      }
    });
  }

  function tableOp(op) {
    var td = NWE.closest('td,th');
    var tb = NWE.closest('table');
    if (!tb || !td) { toast('표 안에 커서를 두세요'); return; }
    var tr = td.parentNode;
    var idx = Array.prototype.indexOf.call(tr.children, td);
    var rows = Array.prototype.slice.call(tb.rows);

    if (op === 'row+') {
      var nr = tr.cloneNode(true);
      Array.prototype.slice.call(nr.children).forEach(function (c) {
        if (c.tagName === 'TH') { var d = document.createElement('td'); d.textContent = '내용'; c.parentNode.replaceChild(d, c); }
        else c.textContent = '내용';
      });
      tr.parentNode.insertBefore(nr, tr.nextSibling);
    } else if (op === 'row-') {
      if (rows.length <= 1) { toast('행이 하나뿐입니다'); return; }
      tr.remove();
    } else if (op === 'col+') {
      rows.forEach(function (r) {
        var ref = r.children[idx];
        var cell = document.createElement(ref && ref.tagName === 'TH' ? 'th' : 'td');
        cell.textContent = ref && ref.tagName === 'TH' ? '제목' : '내용';
        r.insertBefore(cell, ref ? ref.nextSibling : null);
      });
    } else if (op === 'col-') {
      if (tr.children.length <= 1) { toast('열이 하나뿐입니다'); return; }
      rows.forEach(function (r) { if (r.children[idx]) r.children[idx].remove(); });
    } else if (op === 'head') {
      var isHead = td.tagName === 'TH';
      Array.prototype.slice.call(tr.children).forEach(function (c) {
        var n = document.createElement(isHead ? 'td' : 'th');
        n.innerHTML = c.innerHTML;
        if (c.getAttribute('style')) n.setAttribute('style', c.getAttribute('style'));
        c.parentNode.replaceChild(n, c);
      });
    } else if (op === 'bg') {
      dialog({
        title: '칸 배경색',
        fields: [{ key: 'c', label: '배경색', type: 'color', value: td.style.background || '#f2f4f6', hint: '비우면 기본색으로 돌아갑니다' }],
        onOk: function (v) {
          if (v.c) td.style.background = v.c; else td.style.removeProperty('background');
          syncActive();
        }
      });
      return;
    } else if (op === 'del') {
      if (!confirm('이 표를 삭제할까요?')) return;
      tb.closest('[data-nw=tablewrap]') ? tb.closest('[data-nw=tablewrap]').remove() : tb.remove();
    }
    syncActive();
  }

  /* ==================================================================
   * 사이드바
   * ================================================================ */
  var sideTab = 'struct';

  function renderSide() {
    $$('#side-tabs button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-tab') === sideTab));
    });
    var box = $('#side-body');
    if (sideTab === 'struct')  box.innerHTML = paneStructure();
    if (sideTab === 'profile') box.innerHTML = paneProfile();
    if (sideTab === 'design')  box.innerHTML = paneDesign();
    if (sideTab === 'doc')     box.innerHTML = paneDoc();
  }

  /* ---- 구조 ---- */
  function paneStructure() {
    function tree(nodes, depth) {
      return '<ul class="tree' + (depth ? ' sub' : '') + '">' + (nodes || []).map(function (n) {
        return '<li>' +
          '<div class="node">' +
            '<button type="button" class="nm" data-go="' + esc(n.id) + '" title="' + (esc(n.title) || '제목 없음') + ' — 클릭하면 이동">' +
              (esc(n.title) || '<i>제목 없음</i>') + '</button>' +
            '<span class="ops">' +
              '<button type="button" data-op="child" data-id="' + esc(n.id) + '" title="하위 챕터 추가">＋</button>' +
              '<button type="button" data-op="up" data-id="' + esc(n.id) + '" title="위로">↑</button>' +
              '<button type="button" data-op="down" data-id="' + esc(n.id) + '" title="아래로">↓</button>' +
              '<button type="button" data-op="outdent" data-id="' + esc(n.id) + '" title="상위로 올리기">⇤</button>' +
              '<button type="button" data-op="indent" data-id="' + esc(n.id) + '" title="하위로 내리기">⇥</button>' +
              '<button type="button" data-op="del" data-id="' + esc(n.id) + '" title="삭제" class="danger">✕</button>' +
            '</span>' +
          '</div>' +
          (n.children && n.children.length ? tree(n.children, depth + 1) : '') +
        '</li>';
      }).join('') + '</ul>';
    }
    return '<div class="pane-sec">' +
             '<div class="pane-h">챕터 구조<button type="button" class="mini" data-op="add">＋ 챕터 추가</button></div>' +
             (model.chapters && model.chapters.length ? tree(model.chapters, 0) : '<p class="muted">챕터가 없습니다. 위 버튼으로 추가하세요.</p>') +
             '<p class="muted small">＋ 는 하위 챕터를 만듭니다. ⇥ 로 바로 위 챕터의 하위로 넣고, ⇤ 로 다시 꺼냅니다. 단계 제한은 없습니다.</p>' +
           '</div>';
  }

  /* ---- 프로필 표 ---- */
  function paneProfile() {
    if (model.type !== 'profile') {
      return '<div class="pane-sec"><p class="muted">일반 문서에는 프로필 표가 없습니다.</p>' +
             '<button type="button" class="btn" data-op="to-profile">프로필 문서로 바꾸기</button></div>';
    }
    var pf = model.profile;
    var groups = (pf.groups || []).map(function (g, gi) {
      var rows = (g.rows || []).map(function (r) {
        return '<li><span class="rl">' + (r.full ? '<i>전체 폭 줄</i>' : (NWR.plainText(r.label) || '<i>빈 항목</i>')) + '</span>' +
               '<button type="button" data-op="row-up" data-id="' + esc(r.id) + '" title="위로">↑</button>' +
               '<button type="button" data-op="row-down" data-id="' + esc(r.id) + '" title="아래로">↓</button>' +
               '<button type="button" data-op="row-del" data-id="' + esc(r.id) + '" class="danger" title="삭제">✕</button></li>';
      }).join('');
      return '<div class="grp">' +
        '<div class="grp-h">' +
          '<select data-op="g-kind" data-id="' + esc(g.id) + '">' +
            '<option value="plain"' + (g.kind === 'plain' ? ' selected' : '') + '>일반 묶음</option>' +
            '<option value="head"' + (g.kind === 'head' ? ' selected' : '') + '>제목 줄 있는 묶음</option>' +
            '<option value="fold"' + (g.kind === 'fold' ? ' selected' : '') + '>접히는 묶음</option>' +
          '</select>' +
          '<button type="button" data-op="g-up" data-id="' + esc(g.id) + '" title="위로">↑</button>' +
          '<button type="button" data-op="g-down" data-id="' + esc(g.id) + '" title="아래로">↓</button>' +
          '<button type="button" data-op="g-del" data-id="' + esc(g.id) + '" class="danger" title="묶음 삭제">✕</button>' +
        '</div>' +
        (g.kind !== 'plain' ? '<input type="text" data-op="g-title" data-id="' + esc(g.id) + '" value="' + esc(NWR.plainText(g.title)) + '" placeholder="묶음 제목">' : '') +
        (g.kind === 'fold' ? '<label class="chk"><input type="checkbox" data-op="g-open" data-id="' + esc(g.id) + '"' + (g.open ? ' checked' : '') + '> 처음부터 펼쳐 두기</label>' : '') +
        '<ul class="rows">' + rows + '</ul>' +
        '<div class="grp-f">' +
          '<button type="button" class="mini" data-op="row-add" data-id="' + esc(g.id) + '">＋ 항목</button>' +
          '<button type="button" class="mini" data-op="row-add-full" data-id="' + esc(g.id) + '">＋ 전체 폭 줄</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="pane-sec">' +
        '<div class="pane-h">프로필 이미지</div>' +
        '<div class="field"><label>이미지 주소</label><input type="text" data-op="pf-image" value="' + esc(pf.image || '') + '" placeholder="https://..."></div>' +
        '<div class="field"><label>이미지 설명</label><input type="text" data-op="pf-imgcap" value="' + esc(pf.imageCaption || '') + '" placeholder="비워도 됩니다"></div>' +
      '</div>' +
      '<div class="pane-sec">' +
        '<div class="pane-h">표 크기와 위치</div>' +
        '<div class="field"><label>표 가로 폭 <b data-out="w">' + model.theme.profile.width + '</b>px</label>' +
          '<input type="range" min="280" max="760" step="10" data-op="pf-width" value="' + model.theme.profile.width + '"></div>' +
        '<div class="field"><label>항목칸 폭 <b data-out="lw">' + (model.theme.profile.labelWidth || 31) + '</b>%</label>' +
          '<input type="range" min="18" max="55" step="1" data-op="pf-lwidth" value="' + (model.theme.profile.labelWidth || 31) + '"></div>' +
        '<div class="field"><label>위치</label><select data-op="pf-align">' +
          ['right,목차 오른쪽', 'left,목차 왼쪽', 'full,한 줄 전체'].map(function (o) {
            var p = o.split(',');
            return '<option value="' + p[0] + '"' + (model.theme.profile.align === p[0] ? ' selected' : '') + '>' + p[1] + '</option>';
          }).join('') + '</select></div>' +
        '<label class="chk"><input type="checkbox" data-op="pf-enabled"' + (pf.enabled !== false ? ' checked' : '') + '> 프로필 표 사용</label>' +
      '</div>' +
      '<div class="pane-sec">' +
        '<div class="pane-h">표 항목<button type="button" class="mini" data-op="g-add">＋ 묶음 추가</button></div>' +
        groups +
        '<p class="muted small">항목 이름과 내용은 오른쪽 표에서 직접 고치세요. 글자 꾸미기·링크·각주도 그대로 쓸 수 있습니다.</p>' +
      '</div>';
  }

  /* ---- 디자인 ---- */
  function colorField(label, path, hint) {
    var v = getPath(model, path) || '';
    return '<div class="field"><label>' + esc(label) + '</label>' +
      '<span class="colorfield"><input type="color" data-color="' + path + '" value="' + esc(v || '#3f7fbf') + '">' +
      '<input type="text" data-colortext="' + path + '" value="' + esc(v) + '" placeholder="기본값"></span>' +
      (hint ? '<small>' + esc(hint) + '</small>' : '') + '</div>';
  }
  function paneDesign() {
    return '<div class="pane-sec">' +
        '<div class="pane-h">기준 색</div>' +
        colorField('문서 강조색', 'theme.accent', '비운 항목은 모두 이 색에서 자동으로 만들어집니다.') +
        '<div class="swatches">' + ['#3f7fbf', '#00a2e8', '#1f6f50', '#8a5cf6', '#c2255c', '#e8590c', '#2f3640', '#6b7280'].map(function (c) {
          return '<button type="button" class="sw" data-accent="' + c + '" style="background:' + c + '" title="' + c + '"></button>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="pane-sec"><div class="pane-h">제목</div>' +
        colorField('챕터 번호 색', 'theme.heading.num') +
        colorField('챕터 글자 색', 'theme.heading.text') +
        colorField('밑줄 색', 'theme.heading.line') +
      '</div>' +
      '<div class="pane-sec"><div class="pane-h">프로필 표</div>' +
        colorField('머리 배경', 'theme.profile.headBg') +
        colorField('머리 글자', 'theme.profile.headFg') +
        colorField('항목칸 배경', 'theme.profile.labelBg') +
        colorField('항목칸 글자', 'theme.profile.labelFg') +
        colorField('내용칸 배경', 'theme.profile.valueBg') +
        colorField('내용칸 글자', 'theme.profile.valueFg') +
        colorField('표 선 색', 'theme.profile.border') +
      '</div>' +
      '<div class="pane-sec"><div class="pane-h">인용구</div>' +
        colorField('강조 막대', 'theme.quote.accent') +
        colorField('배경', 'theme.quote.bg') +
        colorField('글자', 'theme.quote.fg') +
        colorField('테두리', 'theme.quote.border') +
        '<p class="muted small">개별 인용구는 본문에서 인용구를 클릭한 뒤 도구모음의 &lt;인용구&gt;로 따로 색을 줄 수 있습니다.</p>' +
      '</div>' +
      '<div class="pane-sec"><div class="pane-h">각주</div>' +
        '<label class="chk"><input type="checkbox" data-op="fn-collapsed"' +
          (getPath(model, 'theme.footnote.collapsed') ? ' checked' : '') + '> 문서 아래 각주 모음을 접은 채로 시작</label>' +
        '<p class="muted small">접어 두어도 본문의 각주 번호를 누르면 저절로 펼쳐지며 해당 각주로 이동합니다.</p>' +
      '</div>' +
      '<div class="pane-sec"><div class="pane-h">목차</div>' +
        '<label class="chk"><input type="checkbox" data-op="toc-auto"' + (model.theme.toc.width ? '' : ' checked') + '> 가로 폭 자동 (남는 공간 채우기)</label>' +
        (model.theme.toc.width
          ? '<div class="field"><label>목차 가로 폭 <b data-out="tw">' + model.theme.toc.width + '</b>px</label>' +
            '<input type="range" min="200" max="760" step="10" data-op="toc-width" value="' + model.theme.toc.width + '"></div>'
          : '') +
        colorField('머리 배경', 'theme.toc.headBg') +
        colorField('머리 글자', 'theme.toc.headFg') +
        colorField('테두리', 'theme.toc.border') +
      '</div>';
  }

  /* ---- 문서 (제목 / 분류 / 알림) ---- */
  function paneDoc() {
    var cats = (model.categories || []).map(function (c, i) {
      return '<li><span class="rl">' + esc(c) + '</span><button type="button" data-op="cat-del" data-i="' + i + '" class="danger">✕</button></li>';
    }).join('');
    var notices = (model.notices || []).map(function (n) {
      return '<div class="grp">' +
        '<div class="grp-h"><span class="ico">' + NWR.iconHtml(n.icon, '18px') + '</span>' +
          '<button type="button" data-op="nt-up" data-id="' + esc(n.id) + '" title="위로">↑</button>' +
          '<button type="button" data-op="nt-down" data-id="' + esc(n.id) + '" title="아래로">↓</button>' +
          '<button type="button" data-op="nt-del" data-id="' + esc(n.id) + '" class="danger" title="삭제">✕</button></div>' +
        '<select data-op="nt-iconsel" data-id="' + esc(n.id) + '">' +
          iconOptions().map(function (o) {
            return '<option value="' + esc(o[0]) + '"' + (iconSelectValue(n.icon) === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
          }).join('') + '</select>' +
        (iconSelectValue(n.icon) === 'custom'
          ? '<input type="text" data-op="nt-icon" data-id="' + esc(n.id) + '" value="' + esc(n.icon || '') + '" placeholder="이모지 직접 입력">'
          : '') +
        '<textarea rows="2" data-op="nt-text" data-id="' + esc(n.id) + '" placeholder="문구">' + esc(NWR.plainText(n.text)) + '</textarea>' +
        '<div class="colorrow">' +
          '<span><small>강조</small><input type="color" data-nt="accent" data-id="' + esc(n.id) + '" value="' + esc(n.accent || '#3f7fbf') + '"></span>' +
          '<span><small>배경</small><input type="color" data-nt="bg" data-id="' + esc(n.id) + '" value="' + esc(n.bg || '#eef4fb') + '"></span>' +
          '<span><small>글자</small><input type="color" data-nt="fg" data-id="' + esc(n.id) + '" value="' + esc(n.fg || '#2b3d52') + '"></span>' +
          '<span><small>테두리</small><input type="color" data-nt="border" data-id="' + esc(n.id) + '" value="' + esc(n.border || '#c3d8ee') + '"></span>' +
          '<button type="button" class="mini" data-op="nt-reset" data-id="' + esc(n.id) + '">색 초기화</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="pane-sec">' +
        '<div class="pane-h">문서</div>' +
        '<div class="field"><label>문서 제목</label><input type="text" data-op="doc-title" value="' + esc(model.title || '') + '"></div>' +
        '<div class="field"><label>문서 종류</label><select data-op="doc-type">' +
          '<option value="profile"' + (model.type === 'profile' ? ' selected' : '') + '>프로필 문서</option>' +
          '<option value="plain"' + (model.type === 'plain' ? ' selected' : '') + '>일반 문서</option>' +
        '</select></div>' +
      '</div>' +
      '<div class="pane-sec">' +
        '<div class="pane-h">분류 <small class="muted">문서 맨 위에 표시</small></div>' +
        '<ul class="rows">' + cats + '</ul>' +
        '<div class="addrow"><input type="text" id="cat-new" placeholder="분류 이름 입력 후 Enter"><button type="button" class="mini" data-op="cat-add">추가</button></div>' +
      '</div>' +
      '<div class="pane-sec">' +
        '<div class="pane-h">문서 상단 경고 · 안내</div>' +
        '<div class="addrow wrap">' +
          '<button type="button" class="mini" data-op="nt-add" data-preset="pc">＋ PC 열람 권장</button>' +
          '<button type="button" class="mini" data-op="nt-add" data-preset="spoiler">＋ 스포일러 주의</button>' +
          '<button type="button" class="mini" data-op="nt-add" data-preset="trigger">＋ 트리거 워닝</button>' +
          '<button type="button" class="mini" data-op="nt-add" data-preset="info">＋ 직접 입력</button>' +
        '</div>' + notices +
        '<p class="muted small">본문 중간에 넣고 싶으면 본문에 커서를 두고 위 도구모음의 &lt;경고문&gt;을 쓰세요.</p>' +
      '</div>';
  }

  /* ---- 사이드바 이벤트 (앱 시작 시 한 번만 위임 등록) ---- */
  function initSide() {
    var box = $('#side-body');

    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      var op = b.getAttribute('data-op'), id = b.getAttribute('data-id');

      if (b.hasAttribute('data-go')) { focusChapter(b.getAttribute('data-go')); return; }
      if (b.hasAttribute('data-accent')) { model.theme.accent = b.getAttribute('data-accent'); rerender(); return; }

      switch (op) {
        case 'add':     chAdd(null); return;
        case 'child':   chAddChild(id); return;
        case 'up':      chMove(id, -1); return;
        case 'down':    chMove(id, 1); return;
        case 'indent':  chIndent(id); return;
        case 'outdent': chOutdent(id); return;
        case 'del':     chRemove(id); return;

        case 'to-profile': model.type = 'profile'; if (!model.profile.groups.length) model.profile.groups = NWR.defaults('profile').profile.groups; rerender(); return;

        case 'g-add':   model.profile.groups.push(NWR.newGroup('plain')); rerender(); return;
        case 'g-up':    moveIn(model.profile.groups, id, -1); return;
        case 'g-down':  moveIn(model.profile.groups, id, 1); return;
        case 'g-del':
          if (!confirm('이 묶음과 안의 항목을 모두 삭제할까요?')) return;
          model.profile.groups = model.profile.groups.filter(function (g) { return g.id !== id; });
          rerender(); return;
        case 'row-add':      addRow(id, false); return;
        case 'row-add-full': addRow(id, true); return;
        case 'row-up':       moveRow(id, -1); return;
        case 'row-down':     moveRow(id, 1); return;
        case 'row-del':      delRow(id); return;

        case 'cat-add':  addCategory(); return;
        case 'cat-del':
          model.categories.splice(parseInt(b.getAttribute('data-i'), 10), 1);
          rerender(); return;

        case 'nt-add':
          (model.notices = model.notices || []).push(NWR.newNotice(b.getAttribute('data-preset')));
          rerender(); return;
        case 'nt-up':   moveIn(model.notices, id, -1); return;
        case 'nt-down': moveIn(model.notices, id, 1); return;
        case 'nt-del':
          model.notices = model.notices.filter(function (n) { return n.id !== id; });
          rerender(); return;
        case 'nt-reset': {
          var n = model.notices.filter(function (x) { return x.id === id; })[0];
          if (n) { n.bg = ''; n.fg = ''; n.border = ''; rerender(); }
          return;
        }
      }
    });

    box.addEventListener('input', function (ev) {
      var el = ev.target, op = el.getAttribute('data-op'), id = el.getAttribute('data-id');

      if (el.hasAttribute('data-color')) {
        var path = el.getAttribute('data-color');
        setPath(model, path, el.value);
        var tw = box.querySelector('[data-colortext="' + path + '"]');
        if (tw) tw.value = el.value;
        debouncedRerender(); return;
      }
      if (el.hasAttribute('data-colortext')) {
        var p2 = el.getAttribute('data-colortext');
        var v = el.value.trim();
        if (v === '' || /^#[0-9a-fA-F]{3,8}$/.test(v) || /^[a-zA-Z]{3,20}$/.test(v)) {
          setPath(model, p2, v);
          debouncedRerender();
        }
        return;
      }
      if (el.hasAttribute('data-nt')) {
        var nn = model.notices.filter(function (x) { return x.id === id; })[0];
        if (nn) { nn[el.getAttribute('data-nt')] = el.value; debouncedRerender(); }
        return;
      }

      switch (op) {
        case 'pf-image':   model.profile.image = el.value.trim(); debouncedRerender(); return;
        case 'pf-imgcap':  model.profile.imageCaption = el.value; debouncedRerender(); return;
        case 'pf-width':
          model.theme.profile.width = parseInt(el.value, 10);
          box.querySelector('[data-out=w]').textContent = el.value;
          applyProfileBox(); return;
        case 'pf-lwidth':
          model.theme.profile.labelWidth = parseInt(el.value, 10);
          box.querySelector('[data-out=lw]').textContent = el.value;
          debouncedRerender(); return;
        case 'pf-align':   model.theme.profile.align = el.value; rerender(); return;
        case 'fn-collapsed': setPath(model, 'theme.footnote.collapsed', el.checked); rerender(); return;
        case 'toc-auto':   model.theme.toc.width = el.checked ? 0 : 320; rerender(); return;
        case 'toc-width':
          model.theme.toc.width = parseInt(el.value, 10);
          var outEl = box.querySelector('[data-out=tw]');
          if (outEl) outEl.textContent = el.value;
          applyTocBox(); return;
        case 'pf-enabled': model.profile.enabled = el.checked; rerender(); return;

        case 'g-kind':  { var g = findGroup(id); if (g) { g.kind = el.value; rerender(); } return; }
        case 'g-title': { var g2 = findGroup(id); if (g2) { g2.title = esc(el.value); debouncedRerender(); } return; }
        case 'g-open':  { var g3 = findGroup(id); if (g3) { g3.open = el.checked; scheduleSave(); } return; }

        case 'doc-title': model.title = el.value; var h1 = $('.nw-doc-title', elDoc); if (h1) h1.textContent = el.value; scheduleSave(); return;
        case 'doc-type':  model.type = el.value; if (el.value === 'profile' && !(model.profile.groups || []).length) model.profile = NWR.defaults('profile').profile; rerender(); return;

        case 'nt-icon': { var n1 = model.notices.filter(function (x) { return x.id === id; })[0]; if (n1) { n1.icon = el.value; debouncedRerender(); } return; }
        case 'nt-iconsel': {
          var n3 = model.notices.filter(function (x) { return x.id === id; })[0];
          if (n3) { n3.icon = el.value === 'custom' ? (/^mi:/.test(n3.icon) || !n3.icon ? '⚠️' : n3.icon) : el.value; rerender(); }
          return;
        }
        case 'nt-text': { var n2 = model.notices.filter(function (x) { return x.id === id; })[0]; if (n2) { n2.text = esc(el.value).replace(/\n/g, '<br>'); debouncedRerender(); } return; }
      }
    });

    box.addEventListener('keydown', function (ev) {
      if (ev.target.id === 'cat-new' && ev.key === 'Enter') { ev.preventDefault(); addCategory(); }
    });
  }

  function applyTocBox() {
    var box = $('.nw-toc', elDoc);
    if (!box) return;
    var w = model.theme.toc.width;
    if (w) { box.style.flex = '0 1 ' + w + 'px'; box.style.width = 'min(100%,' + w + 'px)'; }
    scheduleSave();
  }

  /* 폭만 바뀔 때는 통째로 다시 그리지 않고 스타일만 고친다 (편집 중 끊김 방지) */
  function applyProfileBox() {
    var box = $('.nw-profile', elDoc);
    if (!box) return;
    var w = model.theme.profile.width;
    if (model.theme.profile.align === 'full') box.style.cssText = box.style.cssText.replace(/flex:[^;]+;/, 'flex:1 1 100%;');
    else {
      box.style.flex = '0 1 ' + w + 'px';
      box.style.width = 'min(100%,' + w + 'px)';
    }
    scheduleSave();
  }

  var rrTimer = null;
  function debouncedRerender() { clearTimeout(rrTimer); rrTimer = setTimeout(rerender, 220); }

  function moveIn(arr, id, dir) {
    var i = arr.findIndex(function (x) { return x.id === id; });
    if (i < 0) return;
    var j = i + dir;
    if (j < 0 || j >= arr.length) return;
    arr.splice(j, 0, arr.splice(i, 1)[0]);
    rerender();
  }
  function addRow(gid, full) {
    var g = findGroup(gid);
    if (!g) return;
    (g.rows = g.rows || []).push(NWR.newRow(full ? '' : '항목', '', full));
    rerender();
  }
  function moveRow(rid, dir) {
    (model.profile.groups || []).forEach(function (g) {
      var i = (g.rows || []).findIndex(function (r) { return r.id === rid; });
      if (i < 0) return;
      var j = i + dir;
      if (j < 0 || j >= g.rows.length) return;
      g.rows.splice(j, 0, g.rows.splice(i, 1)[0]);
    });
    rerender();
  }
  function delRow(rid) {
    (model.profile.groups || []).forEach(function (g) {
      g.rows = (g.rows || []).filter(function (r) { return r.id !== rid; });
    });
    rerender();
  }
  function addCategory() {
    var el = $('#cat-new');
    var v = (el.value || '').trim();
    if (!v) return;
    (model.categories = model.categories || []).push(v);
    rerender();
    setTimeout(function () { var n = $('#cat-new'); if (n) n.focus(); }, 20);
  }

  /* ==================================================================
   * 저장 / 불러오기 / 내보내기
   * ================================================================ */
  function scheduleSave() {
    clearTimeout(saveTimer);
    $('#st-save').textContent = '편집 중…';
    saveTimer = setTimeout(function () {
      var ok = writeJSON(LS_CUR, { key: docKey, name: docName, model: model, updated: Date.now() });
      $('#st-save').textContent = ok ? '자동 저장됨' : '자동 저장 실패 (저장 공간 부족)';
    }, 600);
  }

  function saveDoc() {
    var docs = readJSON(LS_DOCS, {});
    if (!docKey) docKey = NWR.uid('d');
    docName = ($('#docname').value || '').trim() || model.title || '이름 없는 문서';
    $('#docname').value = docName;
    docs[docKey] = { key: docKey, name: docName, type: model.type, model: model, updated: Date.now() };
    if (writeJSON(LS_DOCS, docs)) { scheduleSave(); toast('"' + docName + '" 저장 완료'); }
    else toast('저장 실패 — 브라우저 저장 공간이 부족합니다');
  }

  function loadModel(m, key, name) {
    model = m;
    docKey = key || null;
    docName = name || m.title || '';
    docId = 'doc';
    $('#docname').value = docName;
    rerender();
  }

  function refreshDocList() {
    var docs = readJSON(LS_DOCS, {});
    var arr = Object.keys(docs).map(function (k) { return docs[k]; }).sort(function (a, b) { return b.updated - a.updated; });
    $('#doclist').innerHTML = arr.length ? arr.map(function (d) {
      return '<li data-key="' + esc(d.key) + '">' +
               '<span class="tag">' + (d.type === 'profile' ? '프로필' : '일반') + '</span>' +
               '<span class="nm" data-act="load">' + esc(d.name) + '</span>' +
               '<span class="meta">' + fmtDate(d.updated) + '</span>' +
               '<button type="button" class="btn ghost" data-act="del">삭제</button>' +
             '</li>';
    }).join('') : '<li class="empty">저장한 문서가 없습니다.</li>';
  }

  function buildExport() {
    var mode = ($$('input[name=exmode]').filter(function (r) { return r.checked; })[0] || {}).value || 'fragment';
    var opts = { docId: (docKey || 'doc'), styleTag: $('#ex-style').checked, script: $('#ex-script').checked };
    return mode === 'page' ? NWR.exportPage(model, opts) : NWR.exportFragment(model, opts).html;
  }
  function updateExport() {
    var code = buildExport();
    $('#outcode').value = code;
    $('#ex-size').textContent = '약 ' + Math.round(code.length / 1024 * 10) / 10 + ' KB';
  }

  /* ==================================================================
   * 시작
   * ================================================================ */
  function initShell() {
    elDoc = $('#nw-doc');
    elSide = $('#side-body');

    NWE.attach(elDoc, function () { syncActive(); });
    NWE.attach($('#modal-form'), function () {});   /* 다이얼로그 안 서식 입력 칸 */
    elDoc.addEventListener('click', onDocClick);   /* 각주 칩 클릭 -> 편집 */
    NWR.placePopups(elDoc);                        /* 각주 팝업을 번호 아래로 보정 */
    initToolbar();
    initSide();

    $$('#side-tabs button').forEach(function (b) {
      b.addEventListener('click', function () { sideTab = b.getAttribute('data-tab'); renderSide(); });
    });

    $('#btn-new').addEventListener('click', function () {
      dialog({
        title: '새 문서',
        okText: '만들기',
        fields: [
          { key: 'type', label: '문서 종류', type: 'select', value: model ? model.type : 'profile',
            options: [['profile', '프로필 문서 (캐릭터 표 포함)'], ['plain', '일반 문서']] },
          { key: 'title', label: '문서 제목', value: '' }
        ],
        onOk: function (v) {
          var m = NWR.defaults(v.type);
          if (v.title.trim()) { m.title = v.title.trim(); if (m.profile) m.profile.title = v.title.trim(); }
          loadModel(m, null, m.title);
          toast('새 문서를 만들었습니다');
        }
      });
    });
    $('#btn-save').addEventListener('click', saveDoc);
    $('#btn-open').addEventListener('click', function () { refreshDocList(); openModal('#modal-open'); });
    $('#btn-export').addEventListener('click', function () { updateExport(); openModal('#modal-export'); });
    $('#btn-help').addEventListener('click', function () { openModal('#modal-help'); });
    $('#btn-preview').addEventListener('click', openPreviewWindow);

    $('#doclist').addEventListener('click', function (ev) {
      var li = ev.target.closest('li[data-key]');
      if (!li) return;
      var docs = readJSON(LS_DOCS, {});
      var d = docs[li.getAttribute('data-key')];
      if (!d) return;
      if (ev.target.getAttribute('data-act') === 'load') { loadModel(d.model, d.key, d.name); closeModal(); toast('"' + d.name + '" 불러옴'); }
      else if (ev.target.getAttribute('data-act') === 'del') {
        if (!confirm('"' + d.name + '" 문서를 삭제할까요?')) return;
        delete docs[d.key]; writeJSON(LS_DOCS, docs); refreshDocList();
      }
    });
    $('#btn-sample').addEventListener('click', function () {
      loadModel(JSON.parse(JSON.stringify(NW_SAMPLES.profile)), null, '예시 문서');
      closeModal(); toast('예시 문서를 불러왔습니다');
    });
    $('#btn-sample-plain').addEventListener('click', function () {
      loadModel(JSON.parse(JSON.stringify(NW_SAMPLES.plain)), null, '예시 문서 (일반)');
      closeModal(); toast('일반 문서 예시를 불러왔습니다');
    });

    $$('input[name=exmode]').forEach(function (r) { r.addEventListener('change', updateExport); });
    $('#ex-style').addEventListener('change', updateExport);
    $('#ex-script').addEventListener('change', updateExport);
    $('#ex-copy').addEventListener('click', function () {
      var txt = $('#outcode').value;
      function fallback() {
        var ta = $('#outcode');
        ta.removeAttribute('readonly'); ta.select();
        try { document.execCommand('copy'); toast('코드를 복사했습니다'); }
        catch (e) { toast('복사 실패 — 직접 선택해 복사하세요'); }
        ta.setAttribute('readonly', 'readonly');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast('코드를 복사했습니다'); }, fallback);
      else fallback();
    });
    $('#ex-download').addEventListener('click', function () {
      var name = (docName || model.title || 'document').replace(/[\\/:*?"<>|]/g, '_');
      var blob = new Blob([$('#outcode').value], { type: 'text/html;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name + '.html';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });

    $('#docname').addEventListener('input', function () { docName = this.value; scheduleSave(); });

    $$('.modal').forEach(function (m) {
      m.addEventListener('click', function (ev) {
        if (ev.target === m || (ev.target.hasAttribute && ev.target.hasAttribute('data-close'))) closeModal();
      });
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeModal();
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); saveDoc(); }
    });

    $('#doc-width').addEventListener('change', function () {
      /* className 을 통째로 갈아치우면 doc-frame 클래스까지 사라져 미리보기가 깨진다 */
      $('#doc-frame').className = 'doc-frame' + (this.value ? ' ' + this.value : '');
    });
  }

  /* ==================================================================
   * 미리보기 창 — 클릭 동작 · 모바일 · 반응형을 실제로 확인하는 별도 창
   * ================================================================ */
  var previewWin = null;

  var PREVIEW_WIDTHS = [
    ['390', '모바일 390'],
    ['540', '큰 폰 540'],
    ['768', '태블릿 768'],
    ['1280', '노트북 1280'],
    ['0',  '창 전체']
  ];

  var TOUCH_CSS = '<style id="nw-touch-emu">.nw-fnwrap > .nw-ref{pointer-events:none!important}</style>';

  function previewHtml(touchOn) {
    var html = NWR.exportPage(model, { docId: (docKey || 'doc'), styleTag: true, script: true });
    if (touchOn) html = html.replace('</head>', TOUCH_CSS + '\n</head>');
    return html;
  }

  /* srcdoc 은 기준 URL 이 부모(편집 화면) 페이지라 "#각주" 같은 링크가
     편집 화면으로 실제 이동해 버린다. blob URL 로 띄우면 문서가 자기 주소를
     갖게 되어 문서 안 이동으로 처리된다. */
  function loadPreviewDoc(win, html) {
    var fr = win.document.getElementById('nwfr');
    if (!fr) return;
    if (fr.__blob) { try { win.URL.revokeObjectURL(fr.__blob); } catch (e) {} }
    var url;
    try {
      url = win.URL.createObjectURL(new win.Blob([html], { type: 'text/html;charset=utf-8' }));
    } catch (e) {
      fr.srcdoc = html;   /* blob 을 못 쓰는 환경(파일로 직접 열기 등) 대비 */
      return;
    }
    fr.__blob = url;
    fr.removeAttribute('srcdoc');
    fr.src = url;
  }

  function openPreviewWindow() {
    var html = previewHtml();
    if (previewWin && !previewWin.closed && previewWin.document.getElementById('nwfr')) {
      loadPreviewDoc(previewWin, previewHtml(previewWin.__nwTouch));
      previewWin.focus();
      toast('미리보기 창을 새로 고쳤습니다');
      return;
    }
    previewWin = window.open('', 'nwpreview', 'width=1200,height=940');
    if (!previewWin) { toast('브라우저가 팝업을 막았습니다. 팝업 허용 후 다시 눌러 주세요'); return; }
    buildPreviewShell(previewWin, html);
  }

  function buildPreviewShell(win, html) {
    var d = win.document;
    d.open();
    d.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>미리보기</title></head><body></body></html>');
    d.close();
    d.title = '미리보기 — ' + (model.title || '문서');

    var st = d.createElement('style');
    st.textContent = [
      '*{box-sizing:border-box}',
      'html,body{height:100%;margin:0;background:#eef0f3;',
      "font-family:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;",
      'font-size:13px;color:#17191c;display:flex;flex-direction:column}',
      '#bar{flex:0 0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:9px 14px;',
      'background:#fff;border-bottom:1px solid #e4e7ea}',
      '#bar .t{font-weight:800;margin-right:6px}',
      '#bar .sp{flex:1}',
      '#bar button{height:30px;padding:0 12px;border:1px solid #d3d8dd;background:#fff;border-radius:7px;',
      'cursor:pointer;font:inherit;font-weight:600;color:#3a4046}',
      '#bar button:hover{background:#f4f6f8}',
      '#bar button[data-on="1"]{background:#17191c;border-color:#17191c;color:#fff}',
      '#bar .info{color:#6a7178;font-weight:500}',
      '#bar .hint{flex:1 1 100%;color:#6a7178;line-height:1.6;margin-top:2px}',
      '#stage{flex:1 1 auto;overflow:auto;display:flex;justify-content:center;padding:16px}',
      '#frame{background:#fff;border:1px solid #d3d8dd;border-radius:10px;overflow:hidden;',
      'box-shadow:0 6px 24px rgba(16,20,24,.10);height:100%;width:100%;max-width:100%;transition:max-width .15s}',
      '#nwfr{width:100%;height:100%;border:0;display:block;background:#fff}'
    ].join('');
    d.head.appendChild(st);

    var bar = d.createElement('div'); bar.id = 'bar';
    var lab = d.createElement('span'); lab.className = 't'; lab.textContent = '미리보기';
    bar.appendChild(lab);

    var wBtns = [];
    PREVIEW_WIDTHS.forEach(function (w) {
      var b = d.createElement('button');
      b.type = 'button';
      b.textContent = w[1];
      b.setAttribute('data-w', w[0]);
      b.onclick = function () { setWidth(w[0]); };
      bar.appendChild(b);
      wBtns.push(b);
    });

    var touch = d.createElement('button');
    touch.type = 'button';
    touch.textContent = '터치 기기처럼';
    touch.title = '각주 번호를 눌러도 하단으로 이동하지 않고 팝업만 열립니다 (모바일과 같은 동작)';
    touch.onclick = function () {
      var on = touch.getAttribute('data-on') === '1';
      touch.setAttribute('data-on', on ? '0' : '1');
      applyTouch(!on);
    };
    bar.appendChild(touch);

    bar.appendChild(d.createElement('span')).className = 'sp';

    var info = d.createElement('span'); info.className = 'info'; bar.appendChild(info);

    var reload = d.createElement('button');
    reload.type = 'button'; reload.textContent = '다시 불러오기';
    reload.onclick = function () { loadPreviewDoc(win, previewHtml(win.__nwTouch)); };
    bar.appendChild(reload);

    var hint = d.createElement('div'); hint.className = 'hint';
    hint.textContent = '폭이 640px 이하가 되면 각주 팝업이 화면 아래 시트로 바뀝니다. 각주 번호 · 챕터 제목 · 접기 · 스포일러를 실제로 눌러 보세요. 편집 내용을 바꾼 뒤에는 「다시 불러오기」를 누르세요.';
    bar.appendChild(hint);

    var stage = d.createElement('div'); stage.id = 'stage';
    var frame = d.createElement('div'); frame.id = 'frame';
    var fr = d.createElement('iframe'); fr.id = 'nwfr';
    frame.appendChild(fr); stage.appendChild(frame);

    d.body.appendChild(bar);
    d.body.appendChild(stage);

    var curW = '0', touchOn = false;
    win.__nwTouch = false;

    function setWidth(v) {
      curW = v;
      frame.style.maxWidth = (v === '0') ? '100%' : v + 'px';
      wBtns.forEach(function (b) { b.setAttribute('data-on', b.getAttribute('data-w') === v ? '1' : '0'); });
      updateInfo();
      win.setTimeout(updateInfo, 220);   /* 폭 전환 애니메이션이 끝난 뒤 값을 다시 읽는다 */
    }
    function updateInfo() {
      var w = fr.getBoundingClientRect().width;
      info.textContent = '문서 폭 ' + Math.round(w) + 'px' + (w <= 640 ? ' · 좁은 화면 모드' : '');
    }
    function applyTouch(on) {
      touchOn = on;
      win.__nwTouch = on;
      /* 같은 출처면 스타일만 끼워 넣고, 막히면(파일로 직접 열기 등) 문서를 다시 만든다 */
      if (!inject()) loadPreviewDoc(win, previewHtml(on));
    }
    function inject() {
      try {
        var idoc = fr.contentDocument;
        if (!idoc || !idoc.head) return false;
        var old = idoc.getElementById('nw-touch-emu');
        if (old) old.remove();
        if (touchOn) {
          var s2 = idoc.createElement('style');
          s2.id = 'nw-touch-emu';
          s2.textContent = '.nw-fnwrap > .nw-ref{pointer-events:none!important}';
          idoc.head.appendChild(s2);
        }
        return true;
      } catch (e) { return false; }
    }

    fr.addEventListener('load', function () {
      inject();
      updateInfo();
      /* 혹시 다른 곳으로 이동했다면 문서를 되돌린다 */
      try {
        var idoc = fr.contentDocument;
        if (idoc && idoc.body && idoc.body.innerHTML && !idoc.querySelector('.nw-doc')) {
          loadPreviewDoc(win, previewHtml(win.__nwTouch));
        }
      } catch (e) {}
    });
    win.addEventListener('resize', updateInfo);
    win.addEventListener('pagehide', function () {
      if (fr.__blob) { try { win.URL.revokeObjectURL(fr.__blob); } catch (e) {} }
    });
    loadPreviewDoc(win, html);
    setWidth('0');
  }

  function openModal(sel) { closeModal(); $(sel).classList.add('on'); }
  function closeModal() { $$('.modal.on').forEach(function (m) { if (m.id !== 'modal-form') m.classList.remove('on'); }); }

  document.addEventListener('DOMContentLoaded', function () {
    initShell();
    var cur = readJSON(LS_CUR, null);
    if (cur && cur.model && cur.model.v === 2) loadModel(cur.model, cur.key, cur.name);
    else loadModel(JSON.parse(JSON.stringify(NW_SAMPLES.profile)), null, '예시 문서');
  });
})();
