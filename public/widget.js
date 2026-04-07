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
  var config            = null;
  var isOpen            = false;
  var isLoading         = false;
  var messages          = [];
  var shadow            = null;
  var suggestionsUsed   = false;
  var conversationId    = null;  // captured from X-Conversation-Id header
  var userMessageCount  = 0;
  var leadSubmitted     = false;
  var leadFormShown     = false;
  var pendingBooking    = false;

  /* ── Typing animation state ─────────────────────────────────────────────── */
  var typingInterval   = null;
  var typingBuffer     = '';
  var typingStreamDone = false;
  var TYPING_MS        = 18;

  function stopTyping() {
    if (typingInterval !== null) {
      clearInterval(typingInterval);
      typingInterval = null;
    }
  }

  function flushAndStop(lastMsg) {
    stopTyping();
    if (!lastMsg) return;
    if (typingBuffer.length > 0) {
      lastMsg.content += typingBuffer;
      typingBuffer = '';
    }
    lastMsg.streaming = false;
    renderMessages();
  }

  function startTyping(lastMsg) {
    stopTyping();
    typingInterval = setInterval(function () {
      if (typingBuffer.length > 0) {
        lastMsg.content += typingBuffer[0];
        typingBuffer = typingBuffer.slice(1);
        renderMessages();
      } else if (typingStreamDone) {
        stopTyping();
        lastMsg.streaming = false;
        isLoading = false;

        // BOOK_MEETING signal detection
        var isBM = config.bookingEnabled && config.bookingUrl && lastMsg.content.trim() === 'BOOK_MEETING';
        var needLeadFirst = isBM && config.leadEnabled && !leadSubmitted && !leadFormShown
            && config.leadFields && config.leadFields.length > 0;

        if (needLeadFirst) {
          // Collect lead info first, show booking after submission
          pendingBooking = true;
          lastMsg.content = 'Before I pull up the booking calendar, let me grab a few details.';
          messages.push({ role: 'assistant', type: 'lead_form', content: '' });
          leadFormShown = true;
        } else if (isBM) {
          lastMsg.type = 'booking';
          lastMsg.content = '';
        } else if (config.leadEnabled && !leadSubmitted && !leadFormShown
            && config.leadTrigger === 'after_first_reply'
            && config.leadFields && config.leadFields.length > 0
            && userMessageCount === 1) {
          showLeadForm();
        }

        renderMessages();

        var inp = shadow && shadow.getElementById('hiro-input');
        var btn = shadow && shadow.getElementById('hiro-send');
        if (inp) { inp.disabled = false; inp.focus(); }
        if (btn) btn.disabled = !((inp && inp.value.trim()));
      }
    }, TYPING_MS);
  }

  /* ── Lead form helpers ───────────────────────────────────────────────────── */
  function showLeadForm() {
    if (leadFormShown || leadSubmitted) return;
    leadFormShown = true;
    messages.push({ role: 'assistant', type: 'lead_form', content: '' });
    renderMessages();
  }

  function buildLeadFormHtml(fields) {
    var html = '<form id="hiro-lead-form" style="display:flex;flex-direction:column;gap:10px;">';
    html += '<p style="font-size:13px;font-weight:600;color:#111;margin:0;">Mind sharing a few details?</p>';
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      html += '<div style="display:flex;flex-direction:column;gap:4px;">' +
        '<label style="font-size:11px;font-weight:600;color:#555;">' +
          escapeHtml(f.label) + (f.required ? ' <span style="color:#ef4444;">*</span>' : '') +
        '</label>' +
        '<input type="' + escapeHtml(f.type) + '" data-key="' + escapeHtml(f.key) + '"' +
          ' data-required="' + (f.required ? 'true' : 'false') + '"' +
          ' placeholder="' + escapeHtml(f.label) + '"' +
          ' style="height:36px;border-radius:10px;border:1px solid #e5e5e5;padding:0 12px;font-size:13px;color:#111;outline:none;background:#fff;width:100%;box-sizing:border-box;" />' +
        '<span class="hiro-field-err" data-for="' + escapeHtml(f.key) + '" style="font-size:11px;color:#ef4444;display:none;"></span>' +
        '</div>';
    }
    html += '<button type="submit" style="height:36px;border-radius:10px;background:' + escapeHtml(config.primaryColor) + ';color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer;width:100%;">Submit</button>';
    html += '</form>';
    return html;
  }

  function submitLeadForm(form) {
    var fields = config.leadFields || [];
    var data = {};
    var valid = true;
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var inp = form.querySelector('[data-key="' + f.key + '"]');
      var errEl = form.querySelector('[data-for="' + f.key + '"]');
      var val = inp ? inp.value.trim() : '';
      if (f.required && !val) {
        valid = false;
        if (errEl) { errEl.textContent = f.label + ' is required'; errEl.style.display = 'block'; }
      } else {
        if (errEl) errEl.style.display = 'none';
        data[f.key] = val;
      }
    }
    if (!valid) return;

    fetch(HOST + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId: BOT_ID, conversationId: conversationId || undefined, fieldsData: data }),
    }).catch(function () {/* best-effort */});

    leadSubmitted = true;
    // Replace lead_form message with thank-you
    for (var j = 0; j < messages.length; j++) {
      if (messages[j].type === 'lead_form') {
        messages[j].type = 'lead_submitted';
        messages[j].content = 'Thanks! We\'ll be in touch soon.';
        break;
      }
    }
    // If booking was pending behind the lead form, show it now
    if (pendingBooking) {
      pendingBooking = false;
      messages.push({ role: 'assistant', type: 'booking', content: '' });
    }
    renderMessages();
  }

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

      /* Card (booking + lead form) */
      '.hiro-card{',
        'background:#1e293b;border-radius:14px;overflow:hidden;',
        'max-width:calc(100% - 34px);width:100%;border:1px solid rgba(255,255,255,0.08);',
      '}',
      '.hiro-card-header{',
        'padding:10px 14px;font-size:13px;font-weight:600;color:#e2e8f0;',
        'border-bottom:1px solid rgba(255,255,255,0.08);',
      '}',
      '.hiro-cal-frame{display:block;width:100%;height:520px;border:none;background:#fff;}',
      '.hiro-card form{padding:14px;display:flex;flex-direction:column;gap:10px;}',
      '.hiro-card input{',
        'height:36px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);',
        'padding:0 12px;font-size:13px;color:#e2e8f0;background:#0f172a;',
        'outline:none;width:100%;',
      '}',
      '.hiro-card input::placeholder{color:#475569;}',
      '.hiro-card input:focus{border-color:rgba('+rgb+',0.5);}',
      '.hiro-card label{font-size:11px;font-weight:600;color:#94a3b8;display:block;margin-bottom:3px;}',
      '.hiro-card button[type=submit]{',
        'height:36px;border-radius:10px;background:'+color+';',
        'color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer;width:100%;',
        'transition:opacity 0.15s;',
      '}',
      '.hiro-card button[type=submit]:hover{opacity:0.88;}',
      '.hiro-field-err{font-size:11px;color:#f87171;display:none;}',
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
      var avatarHtml = '';
      if (isBot) {
        avatarHtml = '<div class="hiro-msg-avatar">' +
          (config.avatarUrl ? '<img src="'+escapeHtml(config.avatarUrl)+'" alt="" />' : SVG_BOT) +
          '</div>';
      }

      // Booking card
      if (m.type === 'booking') {
        html += '<div class="hiro-row bot">' + avatarHtml +
          '<div class="hiro-card">' +
            '<div class="hiro-card-header">📅 Book a meeting</div>' +
            '<iframe src="'+escapeHtml(config.bookingUrl)+'" class="hiro-cal-frame" loading="lazy" allow="payment" title="Book a meeting"></iframe>' +
            '<div style="padding:10px 14px;">' +
              '<button class="hiro-booking-done" data-idx="'+i+'" style="width:100%;height:36px;border-radius:10px;background:'+escapeHtml(config.primaryColor)+';color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:opacity 0.15s;">✓ Done — I\'ve booked my meeting</button>' +
            '</div>' +
          '</div>' +
        '</div>';
        continue;
      }

      // Lead form
      if (m.type === 'lead_form') {
        html += '<div class="hiro-row bot">' + avatarHtml +
          '<div class="hiro-card">' + buildLeadFormHtml(config.leadFields || []) + '</div>' +
        '</div>';
        continue;
      }

      // Lead submitted thank-you
      if (m.type === 'lead_submitted') {
        html += '<div class="hiro-row bot">' + avatarHtml +
          '<div class="hiro-bubble-msg" style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;">✓ ' + escapeHtml(m.content) + '</div>' +
        '</div>';
        continue;
      }

      // Standard message
      var rowClass = isBot ? 'hiro-row bot' : 'hiro-row user';
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

    // Flush any ongoing typing animation from the previous reply
    var prevLast = messages[messages.length - 1];
    if (prevLast && prevLast.streaming) {
      flushAndStop(prevLast);
    } else {
      stopTyping();
    }

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

    userMessageCount++;

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

      // Capture conversationId
      var cid = res.headers.get('X-Conversation-Id');
      if (cid && !conversationId) conversationId = cid;

      // Switch typing indicator → streaming state + start animation
      var last = messages[messages.length - 1];
      last.typing = false;
      last.streaming = true;
      typingBuffer = '';
      typingStreamDone = false;
      startTyping(last);
      renderMessages();

      var reader = res.body.getReader();
      var decoder = new TextDecoder();

      function pump() {
        return reader.read().then(function (result) {
          if (result.done) {
            // Signal the animation — no more chunks
            typingStreamDone = true;
            return;
          }
          // Push chunk into buffer; animation reveals it at typing speed
          typingBuffer += decoder.decode(result.value, { stream: true });
          return pump();
        });
      }

      return pump();
    })
    .catch(function (err) {
      stopTyping();
      typingBuffer = '';
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

    // Show lead form immediately if configured
    if (cfg.leadEnabled && cfg.leadTrigger === 'immediately'
        && cfg.leadFields && cfg.leadFields.length > 0) {
      showLeadForm();
    }

    // Render initial greeting (+ lead form if immediately)
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

    // Delegated submit handler for lead form (survives innerHTML re-renders)
    shadow.addEventListener('submit', function (e) {
      var form = e.target && e.target.id === 'hiro-lead-form' ? e.target : null;
      if (!form) return;
      e.preventDefault();
      submitLeadForm(form);
    });

    // Delegated click handler for booking "Done" button
    shadow.addEventListener('click', function (e) {
      var btn = e.target && e.target.classList && e.target.classList.contains('hiro-booking-done') ? e.target : null;
      if (!btn) return;
      var idx = parseInt(btn.getAttribute('data-idx'), 10);
      if (!isNaN(idx) && messages[idx]) {
        messages[idx] = { role: 'assistant', content: 'Your meeting has been booked! You\'ll receive a confirmation shortly. Is there anything else I can help you with?', type: 'text' };
        renderMessages();
      }
    });
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
