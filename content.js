/**
 * Focus Guard - Content Script
 * Blocks distracting sites and asks for purpose.
 * After 5 minutes, the tab is DEAD - must open a new tab.
 */

(function () {
  'use strict';

  const TIMEOUT_MINUTES = 5;
  const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  let tabSession = null;
  let isTabDead = false;

  // Get site name for display
  function getSiteName() {
    const host = window.location.hostname;
    if (host.includes('reddit')) return 'Reddit';
    if (host.includes('twitter') || host.includes('x.com')) return 'X';
    if (host.includes('youtube')) return 'YouTube';
    return host;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Show the DEAD state - tab is permanently blocked
  function showDeadState() {
    isTabDead = true;

    const existing = document.getElementById('focus-guard-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'focus-guard-overlay';
    overlay.className = 'expired';

    overlay.innerHTML = `
      <div id="focus-guard-modal">
        <div id="focus-guard-dead-icon">⏱</div>
        <h1 id="focus-guard-title">Time's up</h1>
        <p id="focus-guard-subtitle">
          Your 5 minutes on ${getSiteName()} are done.
        </p>
        <p id="focus-guard-dead-message">
          Close this tab and take a break.<br>
          Open a new tab if you still need to be here.
        </p>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    // Prevent any interaction with the page
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';
  }

  // Show the purpose prompt
  function showBlocker() {
    if (isTabDead) {
      showDeadState();
      return;
    }

    const existing = document.getElementById('focus-guard-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'focus-guard-overlay';

    const siteName = getSiteName();

    overlay.innerHTML = `
      <div id="focus-guard-modal">
        <div id="focus-guard-site-badge">${siteName}</div>
        <h1 id="focus-guard-title">What's your purpose?</h1>
        <p id="focus-guard-subtitle">
          Be specific. You have 5 minutes, then this tab closes.
        </p>
        <input 
          type="text" 
          id="focus-guard-input" 
          placeholder="I'm here to..."
          autocomplete="off"
          autofocus
        />
        <button id="focus-guard-submit">Continue</button>
        <div id="focus-guard-timer">This tab expires in 5 minutes</div>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    setTimeout(() => {
      const input = document.getElementById('focus-guard-input');
      if (input) input.focus();
    }, 50);

    const submitBtn = document.getElementById('focus-guard-submit');
    const input = document.getElementById('focus-guard-input');

    function handleSubmit() {
      const purpose = input.value.trim();
      if (purpose.length < 3) {
        input.style.borderColor = '#e5484d';
        input.placeholder = 'Type a real purpose...';
        return;
      }

      // Start the session for THIS tab only
      tabSession = {
        purpose: purpose,
        startTime: Date.now()
      };

      // Remove overlay
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 200);

      // Start the death timer
      setTimeout(() => {
        showDeadState();
      }, TIMEOUT_MINUTES * 60 * 1000);
    }

    submitBtn.addEventListener('click', handleSubmit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });

    input.addEventListener('input', () => {
      input.style.borderColor = '#333';
    });
  }

  // Initialize
  function init() {
    // Always show blocker on fresh page load / new tab
    showBlocker();
  }

  // Run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // If user navigates within the site, keep the session
  // But if they come back to a dead tab, it stays dead
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isTabDead) {
      showDeadState();
    }
  });

})();
