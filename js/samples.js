/* 예제용 더미 문서 (문서 모델 JSON)
   특정 작품이나 인물이 아니라, 기능을 한 번씩 보여 주기 위한 자리표시 데이터다. */
(function (root) {
  'use strict';

  var IMG = "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20300%20380%22%3E%3Cpath%20fill=%22%23eef1f4%22%20d=%22M0%200h300v380H0z%22/%3E%3Cg%20fill=%22none%22%20stroke=%22%23aab4bd%22%20stroke-width=%223%22%3E%3Ccircle%20cx=%22150%22%20cy=%22150%22%20r=%2258%22/%3E%3Cpath%20d=%22M64%20342c0-48%2038-88%2086-88s86%2040%2086%2088%22/%3E%3C/g%3E%3C/svg%3E";
  var WIDE = "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20640%20360%22%3E%3Cpath%20fill=%22%23e9eef3%22%20d=%22M0%200h640v360H0z%22/%3E%3Cg%20fill=%22none%22%20stroke=%22%23a9b6c2%22%20stroke-width=%223%22%3E%3Crect%20x=%22232%22%20y=%2298%22%20width=%22176%22%20height=%22132%22%20rx=%228%22/%3E%3Ccircle%20cx=%22284%22%20cy=%22142%22%20r=%2216%22/%3E%3Cpath%20d=%22M244%20218l52-52%2044%2044%2028-26%2040%2034%22/%3E%3C/g%3E%3Ctext%20x=%22320%22%20y=%22276%22%20text-anchor=%22middle%22%20font-family=%22sans-serif%22%20font-size=%2216%22%20fill=%22%238a949e%22%3EIMAGE%3C/text%3E%3C/svg%3E";

  function fn(note) { return '<sup data-nw="fn" data-note="' + note + '">[*]</sup>'; }

  /* ---------------- 프로필 문서 예제 ---------------- */
  var profile = {
    v: 2,
    type: 'profile',
    title: '예시 문서',
    categories: ['분류 1', '분류 2'],
    notices: [
      { id: 'n1', icon: 'mi:computer', text: '이 문서는 PC 환경에서 열람하는 것을 권장합니다.', accent: '#3f7fbf', bg: '', fg: '', border: '' },
      { id: 'n2', icon: 'mi:warning', text: '이 문서에는 <b>스포일러</b>가 포함되어 있습니다.', accent: '#e8590c', bg: '', fg: '', border: '' }
    ],
    theme: {
      accent: '#3f7fbf',
      heading: { num: '', text: '', line: '' },
      profile: { headBg: '', headFg: '', labelBg: '', labelFg: '', valueBg: '', valueFg: '', border: '', width: 400, labelWidth: 31, align: 'right' },
      quote:   { accent: '', bg: '', fg: '', border: '' },
      toc:     { headBg: '', headFg: '', border: '' }
    },
    profile: {
      enabled: true,
      title: '이름',
      subtitle: 'Subtitle | 부제',
      image: IMG,
      imageCaption: '이미지 설명' + fn('각주에 마우스를 올리면 이렇게 내용이 미리 보입니다.'),
      groups: [
        { id: 'g1', kind: 'plain', title: '', open: false, rows: [
          { id: 'r1', label: '항목 1', value: '<span style="color:#3f7fbf"><b>강조한 내용</b></span><br>둘째 줄', full: false },
          { id: 'r2', label: '항목 2', value: '내용을 입력하세요' + fn('표 안에서도 각주를 달 수 있습니다.'), full: false },
          { id: 'r3', label: '항목 3', value: '내용을 입력하세요', full: false },
          { id: 'r4', label: '항목 4', value: '내용을 입력하세요', full: false },
          { id: 'r5', label: '항목 5', value: '<span data-nw="spoiler">가려진 내용</span>', full: false }
        ] },
        { id: 'g2', kind: 'fold', title: '접히는 묶음', open: false, rows: [
          { id: 'r6', label: '항목 6', value: '눌러서 펼친 뒤에 보이는 내용', full: false },
          { id: 'r7', label: '항목 7', value: '내용을 입력하세요', full: false }
        ] },
        { id: 'g3', kind: 'head', title: '제목 줄이 있는 묶음', open: false, rows: [
          { id: 'r8', label: '항목 8', value: '<span style="color:#c2255c"><b>색을 바꾼 내용</b></span>', full: false },
          { id: 'r9', label: '항목 9', value: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">링크가 들어간 내용</a>', full: false },
          { id: 'r10', label: '', value: '항목칸 없이 가로로 꽉 찬 줄', full: true }
        ] }
      ]
    },
    chapters: [
      { id: 'c1', title: '개요', collapsed: false, children: [], body:
        '<p>이 문단은 예제용 더미 텍스트입니다. 문서 영역을 직접 클릭해 바로 고쳐 쓰면 됩니다. ' +
        '글자를 선택하고 위 도구모음을 누르면 <b>굵게</b>, <i>기울임</i>, <u>밑줄</u>, ' +
        '<span style="color:#c2255c">색</span>, <span style="font-size:1.15em">크기</span>를 바꿀 수 있습니다.' +
        fn('각주는 번호가 자동으로 매겨지고 문서 맨 아래에 모입니다.') + '</p>' +
        '<div data-nw="quote" data-fit="content" data-accent="#3f7fbf" data-bg="" data-fg="" data-border="">' +
          '<span data-nw="qbar"></span>' +
          '<div data-nw="qbody"><b>인용구는 이렇게 표시됩니다.</b><br>여러 줄로도 쓸 수 있습니다.' +
            '<span data-nw="qcite">— 출처</span></div>' +
        '</div>' +
        '<p>가려야 할 내용은 <span data-nw="spoiler">이렇게 스포일러로 감쌉니다.</span></p>' },

      { id: 'c2', title: '항목 A', collapsed: false, body: '<p>상위 챕터의 본문입니다. 아래에 하위 챕터가 붙습니다.</p>', children: [
        { id: 'c2a', title: '하위 항목 A-1', collapsed: false, children: [], body:
          '<div data-nw="figure" data-w="420" data-align="center"><img src="' + WIDE + '" alt="예시 이미지"><span data-nw="fcap">가운데 정렬한 이미지</span></div>' +
          '<p>이미지는 <b>왼쪽 · 가운데 · 오른쪽</b> 정렬을 모두 고를 수 있습니다.</p>' },
        { id: 'c2b', title: '하위 항목 A-2', collapsed: false, children: [
          { id: 'c2b1', title: '더 아래 단계 A-2-1', collapsed: false, children: [], body:
            '<p>하위의 하위 챕터입니다. 단계 제한 없이 계속 만들 수 있습니다.</p>' },
          { id: 'c2b2', title: '더 아래 단계 A-2-2', collapsed: false, children: [], body:
            '<p>상위 챕터를 접으면 이 챕터도 함께 접힙니다.</p>' }
        ], body: '<p>목록도 쓸 수 있습니다.</p><ul><li>목록 항목 1</li><li>목록 항목 2</li><li>목록 항목 3</li></ul>' }
      ] },

      { id: 'c3', title: '항목 B', collapsed: false, children: [], body:
        '<table><tbody>' +
          '<tr><th>항목</th><th>값</th><th>비고</th></tr>' +
          '<tr><td>가</td><td>100</td><td>설명을 입력하세요</td></tr>' +
          '<tr><td>나</td><td>80</td><td></td></tr>' +
          '<tr><td>다</td><td>60</td><td>설명을 입력하세요</td></tr>' +
        '</tbody></table>' +
        '<div data-nw="notice" data-icon="mi:priority" data-accent="#c92a2a" data-bg="" data-fg="" data-border="">' +
          '<span data-nw="nicon"></span><span data-nw="ntext">경고 문구는 본문 중간에도 넣을 수 있고 색도 따로 지정할 수 있습니다.</span></div>' +
        '<div data-nw="figure" data-w="45%" data-align="left"><img src="' + WIDE + '" alt="예시 이미지"><span data-nw="fcap">왼쪽 정렬</span></div>' +
        '<div data-nw="figure" data-w="260" data-align="right"><img src="' + WIDE + '" alt="예시 이미지"><span data-nw="fcap">오른쪽 정렬</span></div>' },

      { id: 'c4', title: '항목 C', collapsed: false, children: [], body:
        '<p>바깥 링크는 <a href="https://example.com" target="_blank" rel="noopener noreferrer">이렇게</a> 넣고, ' +
        '나무위키 문서는 문서명만 적으면 주소가 자동으로 만들어집니다.</p>' +
        '<ul><li>여담 1' + fn('같은 각주를 여러 번 참조할 수도 있습니다.') + '</li><li>여담 2</li></ul>' }
    ]
  };

  /* ---------------- 일반 문서 예제 ---------------- */
  var plain = {
    v: 2,
    type: 'plain',
    title: '예시 문서 (일반)',
    categories: ['분류 1'],
    notices: [{ id: 'n1', icon: 'mi:info', text: '프로필 표 없이 본문만 있는 문서 예제입니다.', accent: '#5c6570', bg: '', fg: '', border: '' }],
    theme: {
      accent: '#1f6f50',
      heading: { num: '', text: '', line: '' },
      profile: { width: 400, labelWidth: 31, align: 'right' },
      quote: {}, toc: {}
    },
    profile: { enabled: false, title: '', subtitle: '', image: '', imageCaption: '', groups: [] },
    chapters: [
      { id: 'p1', title: '개요', collapsed: false, children: [], body:
        '<p>이 문서는 프로필 표가 없는 <b>일반 문서</b> 예제입니다. 목차와 챕터 접기, 각주는 그대로 쓸 수 있습니다.' +
        fn('각주 내용 예시입니다.') + '</p>' },
      { id: 'p2', title: '항목 A', collapsed: false, body: '<p>상위 챕터 본문입니다.</p>', children: [
        { id: 'p2a', title: '하위 항목 A-1', collapsed: false, children: [], body: '<p>하위 챕터 본문입니다.</p>' },
        { id: 'p2b', title: '하위 항목 A-2', collapsed: false, children: [], body:
          '<table><tbody><tr><th>열 1</th><th>열 2</th><th>열 3</th></tr>' +
          '<tr><td>내용</td><td>내용</td><td>내용</td></tr>' +
          '<tr><td>내용</td><td>내용</td><td>내용</td></tr></tbody></table>' }
      ] },
      { id: 'p3', title: '항목 B', collapsed: false, children: [], body:
        '<div data-nw="quote" data-fit="full" data-accent="#1f6f50" data-bg="" data-fg="" data-border="">' +
        '<span data-nw="qbar"></span><div data-nw="qbody">인용구 예시입니다.<span data-nw="qcite">— 출처</span></div></div>' +
        '<p>본문을 이어서 씁니다.</p>' }
    ]
  };

  root.NW_SAMPLES = { profile: profile, plain: plain, placeholderImage: IMG };
})(typeof self !== 'undefined' ? self : this);
