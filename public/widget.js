(function () {
  'use strict';

  /* ── Config from script tag ─────────────────────────────────────────────── */
  var script = document.currentScript;
  if (!script) return;

  var BOT_ID = script.getAttribute('data-bot-id');
  var HOST   = (script.getAttribute('data-host') || '').replace(/\/$/, '');

  if (!BOT_ID) { console.warn('[Hiro] data-bot-id attribute is required.'); return; }
  if (!HOST)   { console.warn('[Hiro] data-host attribute is required.');   return; }

  var HIDE_BRANDING = script.getAttribute('data-hide-branding') === 'true';

  /* ── Session ────────────────────────────────────────────────────────────── */
  var SESSION_KEY = 'hiro_sid_' + BOT_ID;
  var sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  /* ── State ──────────────────────────────────────────────────────────────── */
  var config           = null;
  var isOpen           = false;
  var isLoading        = false;
  var messages         = [];
  var shadow           = null;
  var suggestionsUsed  = false;

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  function hex2rgb(hex) {
    var r = parseInt(hex.slice(1,3),16);
    var g = parseInt(hex.slice(3,5),16);
    var b = parseInt(hex.slice(5,7),16);
    return r + ',' + g + ',' + b;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function scrollToBottom() {
    var msgs = shadow && shadow.getElementById('hiro-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── CSS ────────────────────────────────────────────────────────────────── */
  function buildCSS(color) {
    var rgb = hex2rgb(color);
    return [
      '*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}',

      /* Bubble */
      '#hiro-bubble{',
        'position:fixed;bottom:20px;right:20px;z-index:2147483640;',
        'width:56px;height:56px;border-radius:50%;',
        'background:'+color+';',
        'box-shadow:0 8px 32px rgba('+rgb+',0.45);',
        'cursor:pointer;border:none;',
        'display:flex;align-items:center;justify-content:center;',
        'transition:transform 0.2s ease,box-shadow 0.2s ease;',
        'outline:none;',
      '}',
      '#hiro-bubble:hover{transform:scale(1.08);box-shadow:0 12px 40px rgba('+rgb+',0.55);}',
      '#hiro-bubble svg{transition:transform 0.25s ease;}',
      '#hiro-bubble.open svg.chat-icon{transform:scale(0) rotate(45deg);}',
      '#hiro-bubble.open svg.close-icon{transform:scale(1) rotate(0deg);}',
      '#hiro-bubble svg.close-icon{position:absolute;transform:scale(0);}',

      /* Window */
      '#hiro-window{',
        'position:fixed;bottom:88px;right:20px;z-index:2147483639;',
        'width:360px;height:520px;',
        'background:#0f172a;border-radius:20px;',
        'box-shadow:0 24px 80px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.06);',
        'display:flex;flex-direction:column;overflow:hidden;',
        'transform:translateY(16px) scale(0.96);opacity:0;pointer-events:none;',
        'transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s ease;',
        'transform-origin:bottom right;',
      '}',
      '#hiro-window.visible{transform:translateY(0) scale(1);opacity:1;pointer-events:all;}',

      /* Mobile full-screen */
      '@media(max-width:480px){',
        '#hiro-window{',
          'bottom:0;right:0;left:0;width:100%;height:100%;max-height:100%;',
          'border-radius:0;',
        '}',
        '#hiro-bubble{bottom:12px;right:12px;}',
      '}',

      /* Header */
      '#hiro-header{',
        'background:'+color+';',
        'padding:14px 16px;',
        'display:flex;align-items:center;gap:10px;flex-shrink:0;',
      '}',
      '#hiro-avatar{',
        'width:36px;height:36px;border-radius:50%;',
        'background:rgba(255,255,255,0.2);',
        'display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;',
      '}',
      '#hiro-avatar img{width:100%;height:100%;object-fit:cover;}',
      '#hiro-header-info{flex:1;min-width:0;}',
      '#hiro-bot-name{color:#fff;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '#hiro-status{display:flex;align-items:center;gap:5px;margin-top:2px;}',
      '#hiro-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;flex-shrink:0;}',
      '#hiro-status-text{color:rgba(255,255,255,0.7);font-size:11px;}',
      '#hiro-close-btn{',
        'background:rgba(255,255,255,0.15);border:none;cursor:pointer;',
        'width:28px;height:28px;border-radius:50%;',
        'display:flex;align-items:center;justify-content:center;flex-shrink:0;',
        'transition:background 0.15s;',
      '}',
      '#hiro-close-btn:hover{background:rgba(255,255,255,0.25);}',

      /* Messages */
      '#hiro-messages{',
        'flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;',
        'scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent;',
      '}',
      '#hiro-messages::-webkit-scrollbar{width:4px;}',
      '#hiro-messages::-webkit-scrollbar-track{background:transparent;}',
      '#hiro-messages::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px;}',

      /* Message rows */
      '.hiro-row{display:flex;align-items:flex-end;gap:8px;}',
      '.hiro-row.user{flex-direction:row-reverse;}',
      '.hiro-msg-avatar{',
        'width:26px;height:26px;border-radius:50%;background:'+color+';',
        'display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;',
      '}',
      '.hiro-msg-avatar img{width:100%;height:100%;object-fit:cover;}',

      /* Bubbles */
      '.hiro-bubble-msg{',
        'max-width:75%;padding:10px 14px;border-radius:18px;',
        'font-size:13px;line-height:1.55;word-break:break-word;',
      '}',
      '.bot .hiro-bubble-msg{background:#1e293b;color:#e2e8f0;border-bottom-left-radius:4px;}',
      '.user .hiro-bubble-msg{background:'+color+';color:#fff;border-bottom-right-radius:4px;}',

      /* Typing dots */
      '.hiro-typing{display:flex;gap:4px;align-items:center;padding:4px 2px;}',
      '.hiro-dot-anim{width:7px;height:7px;border-radius:50%;background:#64748b;animation:hiroBounce 1.2s infinite;}',
      '.hiro-dot-anim:nth-child(2){animation-delay:0.2s;}',
      '.hiro-dot-anim:nth-child(3){animation-delay:0.4s;}',
      '@keyframes hiroBounce{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-6px);}}',

      /* Cursor blink */
      '.hiro-cursor{display:inline-block;width:2px;height:14px;background:#94a3b8;margin-left:2px;vertical-align:middle;animation:hiroBlink 1s infinite;}',
      '@keyframes hiroBlink{0%,100%{opacity:1;}50%{opacity:0;}}',

      /* Suggestions */
      '#hiro-suggestions{',
        'display:flex;flex-wrap:wrap;gap:6px;',
        'padding:10px 12px;border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0;',
      '}',
      '#hiro-suggestions.hidden{display:none;}',
      '.hiro-chip{',
        'padding:6px 13px;border-radius:999px;',
        'font-size:12px;font-weight:500;cursor:pointer;border:none;',
        'background:rgba('+rgb+',0.12);color:'+color+';',
        'transition:background 0.15s,transform 0.1s;',
        'white-space:nowrap;',
      '}',
      '.hiro-chip:hover{background:rgba('+rgb+',0.22);transform:translateY(-1px);}',

      /* Branding */
      '#hiro-brand{',
        'text-align:center;padding:6px;',
        'font-size:10px;color:#334155;flex-shrink:0;',
      '}',
      '#hiro-brand a{color:#475569;text-decoration:none;}',
      '#hiro-brand a:hover{color:#94a3b8;}',

      /* Input bar */
      '#hiro-input-bar{',
        'display:flex;align-items:center;gap:8px;',
        'padding:12px 12px;border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0;',
      '}',
      '#hiro-input{',
        'flex:1;background:#1e293b;border:1px solid rgba(255,255,255,0.08);',
        'border-radius:24px;padding:9px 16px;',
        'font-size:13px;color:#e2e8f0;outline:none;',
        'transition:border-color 0.15s;',
      '}',
      '#hiro-input::placeholder{color:#475569;}',
      '#hiro-input:focus{border-color:rgba('+rgb+',0.5);}',
      '#hiro-send{',
        'width:36px;height:36px;border-radius:50%;border:none;cursor:pointer;',
        'background:'+color+';',
        'display:flex;align-items:center;justify-content:center;flex-shrink:0;',
        'transition:opacity 0.15s,transform 0.15s;',
      '}',
      '#hiro-send:hover:not(:disabled){transform:scale(1.08);}',
      '#hiro-send:disabled{opacity:0.45;cursor:not-allowed;}',
    ].join('');
  }

  /* ── SVGs ───────────────────────────────────────────────────────────────── */
  var SVG_CHAT  = '<svg class="chat-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var SVG_CLOSE = '<svg class="close-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var SVG_BOT   = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/><path d="M5 14v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/></svg>';
  var SVG_SEND  = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  var SVG_X_SM  = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  /* ── Render messages ────────────────────────────────────────────────────── */
  function renderMessages() {
    var container = shadow.getElementById('hiro-messages');
    if (!container) return;

    var html = '';
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      var isBot = m.role === 'assistant';
      var rowClass = isBot ? 'hiro-row bot' : 'hiro-row user';

      var avatarHtml = '';
      if (isBot) {
        avatarHtml = '<div class="hiro-msg-avatar">' +
          (config.avatarUrl
            ? '<img src="'+escapeHtml(config.avatarUrl)+'" alt="" />'
            : SVG_BOT) +
          '</div>';
      }

      var bubbleContent = '';
      if (m.typing) {
        bubbleContent = '<div class="hiro-typing"><span class="hiro-dot-anim"></span><span class="hiro-dot-anim"></span><span class="hiro-dot-anim"></span></div>';
      } else {
        var text = escapeHtml(m.content).replace(/\n/g, '<br>');
        bubbleContent = text;
        if (m.streaming) bubbleContent += '<span class="hiro-cursor"></span>';
      }

      html += '<div class="'+rowClass+'">' +
        avatarHtml +
        '<div class="hiro-bubble-msg">'+bubbleContent+'</div>' +
        '</div>';
    }

    container.innerHTML = html;
    scrollToBottom();
  }

  /* ── Send message ───────────────────────────────────────────────────────── */
  function sendMessage(text) {
    text = text.trim();
    if (!text || isLoading) return;

    // Hide suggestion chips on first user message
    if (!suggestionsUsed) {
      suggestionsUsed = true;
      var sugg = shadow.getElementById('hiro-suggestions');
      if (sugg) sugg.classList.add('hidden');
    }

    messages.push({ role: 'user', content: text });
    messages.push({ role: 'assistant', content: '', typing: true });
    isLoading = true;
    renderMessages();

    var input = shadow.getElementById('hiro-input');
    var sendBtn = shadow.getElementById('hiro-send');
    if (input)   { input.value = ''; input.disabled = true; }
    if (sendBtn) sendBtn.disabled = true;

    fetch(HOST + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId: BOT_ID, sessionId: sessionId, message: text, origin: window.location.origin }),
    })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (d) {
          throw new Error(d.error || 'HTTP ' + res.status);
        });
      }

      // Switch typing → streaming
      var last = messages[messages.length - 1];
      last.typing = false;
      last.streaming = true;
      renderMessages();

      var reader = res.body.getReader();
      var decoder = new TextDecoder();

      function pump() {
        return reader.read().then(function (result) {
          if (result.done) {
            last.streaming = false;
            isLoading = false;
            renderMessages();
            if (input)   { input.disabled = false; input.focus(); }
            if (sendBtn) sendBtn.disabled = false;
            return;
          }
          var chunk = decoder.decode(result.value, { stream: true });
          last.content += chunk;
          renderMessages();
          return pump();
        });
      }

      return pump();
    })
    .catch(function (err) {
      var last = messages[messages.length - 1];
      last.typing = false;
      last.streaming = false;
      last.content = 'Sorry, something went wrong. Please try again.';
      isLoading = false;
      renderMessages();
      if (input)   { input.disabled = false; }
      if (sendBtn) sendBtn.disabled = false;
    });
  }

  /* ── Toggle open/close ──────────────────────────────────────────────────── */
  function toggle() {
    isOpen = !isOpen;
    var bubble = shadow.getElementById('hiro-bubble');
    var win    = shadow.getElementById('hiro-window');
    if (!bubble || !win) return;

    if (isOpen) {
      bubble.classList.add('open');
      win.classList.add('visible');
      setTimeout(function () {
        var inp = shadow.getElementById('hiro-input');
        if (inp) inp.focus();
      }, 250);
    } else {
      bubble.classList.remove('open');
      win.classList.remove('visible');
    }
  }

  /* ── Build & mount widget ───────────────────────────────────────────────── */
  function mount(cfg) {
    config = cfg;
    messages = [{ role: 'assistant', content: cfg.greeting }];

    var avatarHtml = cfg.avatarUrl
      ? '<img src="'+escapeHtml(cfg.avatarUrl)+'" alt="'+escapeHtml(cfg.name)+'" />'
      : SVG_BOT;

    var brandHtml = HIDE_BRANDING ? '' :
      '<div id="hiro-brand">Powered by <a href="https://hirohq.com" target="_blank" rel="noopener">Hiro</a></div>';

    var suggestionsHtml = '';
    if (cfg.suggestions && cfg.suggestions.length > 0) {
      var chips = '';
      for (var si = 0; si < cfg.suggestions.length; si++) {
        chips += '<button class="hiro-chip" data-suggestion="'+escapeHtml(cfg.suggestions[si])+'">'+escapeHtml(cfg.suggestions[si])+'</button>';
      }
      suggestionsHtml = '<div id="hiro-suggestions">' + chips + '</div>';
    }

    var html =
      '<style>' + buildCSS(cfg.primaryColor) + '</style>' +

      // Floating bubble
      '<button id="hiro-bubble" aria-label="Open chat">' +
        SVG_CHAT + SVG_CLOSE +
      '</button>' +

      // Chat window
      '<div id="hiro-window" role="dialog" aria-label="Chat with '+escapeHtml(cfg.name)+'">' +
        // Header
        '<div id="hiro-header">' +
          '<div id="hiro-avatar">' + avatarHtml + '</div>' +
          '<div id="hiro-header-info">' +
            '<div id="hiro-bot-name">'+escapeHtml(cfg.name)+'</div>' +
            '<div id="hiro-status"><span id="hiro-dot"></span><span id="hiro-status-text">Online</span></div>' +
          '</div>' +
          '<button id="hiro-close-btn" aria-label="Close chat">'+SVG_X_SM+'</button>' +
        '</div>' +
        // Messages
        '<div id="hiro-messages"></div>' +
        suggestionsHtml +
        brandHtml +
        // Input
        '<div id="hiro-input-bar">' +
          '<input id="hiro-input" type="text" placeholder="Type a message…" autocomplete="off" maxlength="500" />' +
          '<button id="hiro-send" disabled aria-label="Send">'+SVG_SEND+'</button>' +
        '</div>' +
      '</div>';

    shadow.innerHTML = html;

    // Bind events
    shadow.getElementById('hiro-bubble').addEventListener('click', toggle);
    shadow.getElementById('hiro-close-btn').addEventListener('click', toggle);

    var input = shadow.getElementById('hiro-input');
    var sendBtn = shadow.getElementById('hiro-send');

    input.addEventListener('input', function () {
      sendBtn.disabled = !this.value.trim() || isLoading;
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(this.value);
      }
    });

    sendBtn.addEventListener('click', function () {
      sendMessage(input.value);
    });

    // Render initial greeting
    renderMessages();

    // Bind suggestion chip clicks
    var suggContainer = shadow.getElementById('hiro-suggestions');
    if (suggContainer) {
      suggContainer.addEventListener('click', function (e) {
        var chip = e.target.closest('.hiro-chip');
        if (chip && !isLoading) {
          sendMessage(chip.getAttribute('data-suggestion'));
        }
      });
    }
  }

  /* ── Bootstrap ──────────────────────────────────────────────────────────── */
  var container = document.createElement('div');
  container.id = '__hiro_root__';
  document.body.appendChild(container);
  shadow = container.attachShadow({ mode: 'open' });

  fetch(HOST + '/api/widget/' + BOT_ID)
    .then(function (r) {
      if (!r.ok) throw new Error('Bot not found');
      return r.json();
    })
    .then(mount)
    .catch(function (e) {
      console.error('[Hiro] Failed to initialize widget:', e.message);
    });

})();
