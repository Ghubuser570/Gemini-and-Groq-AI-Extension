/**
 * Context-Aware Email Automation - Content Script
 * Core Engine, DOM Observation, and Toolbar Detection
 */

const EXTENSION_VERSION = '1.0.0';

class EmailAutomationEngine {
  constructor() {
    this.observer = null;
    this.draftHistory = [];
    this.currentHistoryIndex = -1;
    this.init();
  }

  async init() {
    console.log(`🚀 EmailAutomationEngine v${EXTENSION_VERSION} Initializing...`);
    this.setupObserver();
  }

  /**
   * Watches the Gmail DOM for dynamic UI changes (SPA routing).
   */
  setupObserver() {
    console.log('👀 Setting up MutationObserver for Gmail DOM...');
    
    // Initial scan on load
    this.checkForReplyBox();

    // Attach observer to body to catch SPA dynamic renders
    this.observer = new MutationObserver((mutations) => {
      this.checkForReplyBox();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Failsafe polling interval for missed DOM mutations
    setInterval(() => {
      this.checkForReplyBox();
    }, 2000);
  }

  /**
   * Detects visible reply/compose boxes using multiple Gmail UI selectors.
   */
  checkForReplyBox() {
    let foundAny = false;

    // Strategy 1: ARIA role detection (Most stable)
    const composeBoxes = document.querySelectorAll('div[role="textbox"][aria-label*="Message Body"]');
    
    composeBoxes.forEach((box) => {
      let toolbar = this.findToolbarFromTextbox(box);
      if (toolbar && !toolbar.querySelector('.mailbox-ai-btn')) {
        this.injectButton(toolbar);
        foundAny = true;
      }
    });

    // Strategy 2: Common CSS class fallbacks for Gmail UI variants
    const toolbarSelectors = [
      '.btC',
      'div[role="toolbar"]',
      '.gU.Up',
      '.aDh',
      '.dC'
    ];

    toolbarSelectors.forEach(selector => {
      const toolbars = document.querySelectorAll(selector);
      toolbars.forEach((toolbar) => {
        if (this.isReplyToolbar(toolbar) && !toolbar.querySelector('.mailbox-ai-btn')) {
          this.injectButton(toolbar);
          foundAny = true;
        }
      });
    });
  }

  /**
   * DOM Traversal: Walks up the tree to find the toolbar container.
   */
  findToolbarFromTextbox(textbox) {
    let current = textbox;
    for (let i = 0; i < 10; i++) {
      current = current.parentElement;
      if (!current) break;
      
      if (current.querySelector('div[role="button"][aria-label*="Send"]') ||
          current.querySelector('.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3')) {
        return current;
      }
    }
    return null;
  }

  /**
   * Validates if a found toolbar is genuinely a reply/compose toolbar.
   */
  isReplyToolbar(toolbar) {
    const hasSendButton = toolbar.querySelector('[aria-label*="Send"]') ||
                          toolbar.querySelector('.T-I-atl') ||
                          toolbar.textContent.includes('Send');

    const nearComposeBox = toolbar.closest('div[role="dialog"]') ||
                           toolbar.closest('.M9') ||
                           toolbar.querySelector('div[role="textbox"]');

    return hasSendButton || nearComposeBox;
  }

  // --- END OF BATCH 1 ---
  // AWAITING BATCH 2 FOR UI INJECTION METHODS...

  /**
   * Injects the AI execution button into the Gmail toolbar.
   */
  injectButton(toolbar) {
    const composeContainer = toolbar.closest('[role="dialog"]') || toolbar.closest('.M9') || toolbar;
    if (composeContainer.hasAttribute('data-mailboxai-injected')) return;
    
    composeContainer.setAttribute('data-mailboxai-injected', 'true');
    console.log('⚡ Injecting AI Draft Payload Button...');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mailbox-ai-btn';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M9,9.5L12,2L15,9.5L22.5,12L15,14.5L12,22L9,14.5L1.5,12L9,9.5ZM12,6.5L13.5,10.5L17.5,12L13.5,13.5L12,17.5L10.5,13.5L6.5,12L10.5,10.5L12,6.5Z"/></svg>
      <span>AI Draft</span>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleGenerate(btn, toolbar);
    });

    toolbar.prepend(btn);
  }

  /**
   * Deploys the interactive Command Palette UI overlay.
   */
  async handleGenerate(btn, toolbar) {
    if (document.querySelector('.mailbox-ai-dialog')) return;

    this.draftHistory = [];
    this.currentHistoryIndex = -1;

    const dialog = document.createElement('div');
    dialog.className = 'mailbox-ai-dialog';
    
    // Command Palette HTML Payload
    dialog.innerHTML = `
      <div class="mai-dialog-header">
        <div class="mai-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10,0,1,0,22,12,10.011,10.011,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8.009,8.009,0,0,1,12,20Zm4.28-10.72-5,5a.75.75,0,0,1-1.06,0l-2.5-2.5a.75.75,0,0,1,1.06-1.06l1.97,1.97,4.47-4.47a.75.75,0,0,1,1.06,1.06Z"/></svg>
          Email Execution Engine
        </div>
        <button class="mai-close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div id="mai-input-view">
        <textarea class="mailbox-ai-textarea" id="mai-input-text" rows="2" placeholder="Enter AI instructions... (e.g. 'Accept and ask for time')"></textarea>
        <div class="mai-chips">
          <div class="mai-chip">👍 Agree</div>
          <div class="mai-chip">👎 Decline</div>
          <div class="mai-chip">📅 Schedule</div>
          <div class="mai-chip">❓ Ask details</div>
        </div>
        <div class="mailbox-ai-actions">
          <div style="font-size: 11px; color: #999; font-weight: 500;">Powered by Gemini & Groq</div>
          <button class="mailbox-ai-btn-primary" id="mai-generate-btn">Generate Payload</button>
        </div>
      </div>

      <div id="mai-review-view" style="display: none;">
        <textarea class="mailbox-ai-textarea" id="mai-review-text" rows="8" style="min-height: 150px; font-size: 13px; line-height: 1.5; margin-bottom: 8px;"></textarea>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
           <input type="text" id="mai-refine-input" class="mailbox-ai-textarea" style="padding: 8px 12px; font-size: 13px;" placeholder="Refine output... (e.g. 'Make it shorter')">
           <button class="mai-secondary-btn" id="mai-update-btn" style="white-space: nowrap;">Update</button>
        </div>
        <div class="mailbox-ai-actions" style="justify-content: space-between;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="mai-icon-btn" id="mai-prev-draft" disabled>←</button>
            <span id="mai-draft-count" style="font-size: 11px; color: #999;">1/1</span>
            <button class="mai-icon-btn" id="mai-next-draft" disabled>→</button>
          </div>
          <button class="mailbox-ai-btn-primary" id="mai-insert-btn">Deploy to DOM</button>
        </div>
      </div>
    `;

    const parent = btn.closest('div') || btn.parentElement;
    parent.style.position = 'relative';
    parent.appendChild(dialog);

    // Hardwiring the UI Elements
    const views = { input: dialog.querySelector('#mai-input-view'), review: dialog.querySelector('#mai-review-view') };
    const inputs = { prompt: dialog.querySelector('#mai-input-text'), review: dialog.querySelector('#mai-review-text'), refine: dialog.querySelector('#mai-refine-input') };
    const btns = { 
      close: dialog.querySelector('.mai-close'), generate: dialog.querySelector('#mai-generate-btn'),
      insert: dialog.querySelector('#mai-insert-btn'), update: dialog.querySelector('#mai-update-btn'),
      prev: dialog.querySelector('#mai-prev-draft'), next: dialog.querySelector('#mai-next-draft')
    };
    const chips = dialog.querySelectorAll('.mai-chip');
    const countLabel = dialog.querySelector('#mai-draft-count');

    inputs.prompt.focus();

    const updateUI = () => {
      inputs.review.value = this.draftHistory[this.currentHistoryIndex] || "";
      countLabel.innerText = `${this.currentHistoryIndex + 1}/${this.draftHistory.length}`;
      btns.prev.disabled = this.currentHistoryIndex <= 0;
      btns.next.disabled = this.currentHistoryIndex >= this.draftHistory.length - 1;
      inputs.refine.value = ""; 
    };

    const closeDialog = () => {
      dialog.style.opacity = '0';
      dialog.style.transform = 'translateY(10px)';
      setTimeout(() => dialog.remove(), 200);
    };
    btns.close.onclick = closeDialog;

    chips.forEach(chip => {
      chip.onclick = () => {
        inputs.prompt.value = chip.innerText.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF] ?/g, '') + " ";
        inputs.prompt.focus();
      };
    });

    btns.generate.onclick = async () => {
      const instructions = inputs.prompt.value.trim() || "Write a professional reply.";
      await this.runGeneration(btn, toolbar, instructions, null, dialog, () => {
        views.input.style.display = 'none';
        views.review.style.display = 'block';
        updateUI();
      });
    };

    btns.update.onclick = async () => {
      const refinement = inputs.refine.value.trim();
      if (!refinement) return;
      await this.runGeneration(btn, toolbar, refinement, inputs.review.value, dialog, updateUI);
    };

    inputs.refine.onkeydown = (e) => { if (e.key === 'Enter') btns.update.click(); };

    btns.prev.onclick = () => { if (this.currentHistoryIndex > 0) { this.currentHistoryIndex--; updateUI(); } };
    btns.next.onclick = () => { if (this.currentHistoryIndex < this.draftHistory.length - 1) { this.currentHistoryIndex++; updateUI(); } };

    btns.insert.onclick = () => {
      this.insertReply(toolbar, inputs.review.value);
      closeDialog();
    };
  }

  // --- END OF BATCH 2 ---
  // AWAITING BATCH 3 FOR API ROUTING & INSERTION LOGIC...

  /**
   * Core Generation Engine: Manages state, UI overlays, and API orchestration.
   */
  async runGeneration(btn, toolbar, instructions, currentDraft, dialog, onSuccess) {
    console.log('⚙️️ Executing AI Generation Payload...');

    const overlay = document.createElement('div');
    overlay.className = 'mai-loading-overlay';
    overlay.innerHTML = `
        <div class="mai-spinner"></div>
        <div style="font-size: 13px; font-weight: 500; color: #666;">${currentDraft ? 'Refining Payload...' : 'Compiling Draft...'}</div>
      `;
    dialog.appendChild(overlay);

    try {
      const emailContext = this.extractEmailContent() || "No previous context detected.";
      let finalPrompt = "";

      if (currentDraft) {
        finalPrompt = `
          ORIGINAL EMAIL CONTEXT:
          "${emailContext}"

          CURRENT DRAFT (User requested edit):
          "${currentDraft}"

          REFINEMENT INSTRUCTION:
          "${instructions}"

          TASK: Rewrite the CURRENT DRAFT to strictly satisfy the REFINEMENT INSTRUCTION. 
          Output ONLY the raw email body text.
        `;
      } else {
        finalPrompt = `EMAIL CONTEXT:\n"${emailContext}"\n\nUSER INSTRUCTIONS:\n"${instructions}"`;
      }

      const generatedResponse = await this.callAI(finalPrompt);

      this.draftHistory.push(generatedResponse);
      this.currentHistoryIndex = this.draftHistory.length - 1;

      overlay.remove();
      onSuccess();
    } catch (error) {
      console.error("🚨 Execution Engine Error:", error);
      alert(`Execution Failed: ${error.message}`);
      overlay.remove();
    }
  }

  /**
   * DOM Scraping: Extracts thread context from Gmail's nested div structure.
   */
  extractEmailContent() {
    const emailBodies = document.querySelectorAll('.a3s.aiL');
    if (emailBodies.length === 0) return null;
    return emailBodies[emailBodies.length - 1].innerText;
  }

  /**
   * Secure Network Layer: Routes to Groq or Gemini based on local storage config.
   */
  async callAI(context) {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      throw new Error('Extension context invalidated. Hard refresh required.');
    }

    return new Promise((resolve) => {
      chrome.storage.local.get(['aiProvider'], async (result) => {
        const provider = result.aiProvider || 'gemini';
        console.log(`🌐 Routing request via: ${provider.toUpperCase()} Engine`);

        if (provider === 'groq') {
          resolve(await this.callGroqAPI(context));
        } else {
          resolve(await this.callGeminiAPI(context));
        }
      });
    });
  }

  /**
   * Groq Integration: Ultra-low latency inference via Llama 3.1.
   */
  async callGroqAPI(context) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['groqApiKey'], async (result) => {
        const apiKey = result.groqApiKey;
        if (!apiKey) {
          console.warn('⚠️ No Groq key found. Falling back to demo mode.');
          return resolve(this.demoGenerate(context));
        }

        try {
          const systemPrompt = `
            You are an elite, professional email assistant.
            STRICT RULES:
            1. Start with a proper greeting.
            2. Write exactly 2-3 concise paragraphs.
            3. End with "Best regards," followed by "Shashank Dandu" on the next line.
            4. NO subject lines, NO placeholders.
            
            CONTEXT: "${context}"
          `;

          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: systemPrompt }],
              model: 'llama-3.1-8b-instant'
            })
          });

          if (!response.ok) throw new Error(`Groq API Status: ${response.status}`);
          const data = await response.json();
          resolve(data.choices[0].message.content);
        } catch (error) {
          console.error('🚨 Groq Routing Failed:', error);
          resolve(this.demoGenerate(context));
        }
      });
    });
  }

  /**
   * Gemini Integration: Deep context execution via Google's API.
   */
  async callGeminiAPI(context) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['geminiApiKey'], async (result) => {
        const apiKey = result.geminiApiKey;
        if (!apiKey) {
          console.warn('⚠️ No Gemini key found. Falling back to demo mode.');
          return resolve(this.demoGenerate(context));
        }

        try {
          const systemPrompt = `
            You are an elite, professional email assistant.
            STRICT RULES:
            1. Start with a proper greeting.
            2. Write exactly 2-3 concise paragraphs.
            3. End with "Best regards," followed by "Shashank Dandu" on the next line.
            4. NO subject lines, NO placeholders.
            
            CONTEXT: "${context}"
          `;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
          });

          if (!response.ok) throw new Error(`Gemini API Status: ${response.status}`);
          const data = await response.json();
          resolve(data.candidates[0].content.parts[0].text);
        } catch (error) {
          console.error('🚨 Gemini Routing Failed:', error);
          resolve(this.demoGenerate(context));
        }
      });
    });
  }

  /**
   * Fallback Mock Engine: Ensures UI functionality if APIs fail or keys are missing.
   */
  demoGenerate(context) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`[SYSTEM: API Keys required for live generation]\n\nDear sender,\n\nThank you for reaching out. I have reviewed the details and am prepared to proceed. Let me know if you need to coordinate further.\n\nBest regards,\nShashank Dandu`);
      }, 1000);
    });
  }

  /**
   * DOM Injection: Dispatches synthetic events to bypass SPA input restrictions.
   */
  insertReply(toolbar, text) {
    const container = toolbar.closest('.M9');
    if (!container) return console.warn("🚨 Target DOM container not found.");

    const textArea = container.querySelector('div[role="textbox"]');
    if (textArea) {
      textArea.innerText = text;
      // Synthetic event to force Gmail's framework to acknowledge the state change
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Payload successfully injected into DOM.');
    }
  }
} // <--- CLASS CLOSED

// Initialize the extension engine
new EmailAutomationEngine();