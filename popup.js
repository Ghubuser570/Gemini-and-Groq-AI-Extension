document.addEventListener('DOMContentLoaded', () => {
  const geminiInput = document.getElementById('gemini-key');
  const groqInput = document.getElementById('groq-key');
  const modelSelect = document.getElementById('active-model');
  const saveBtn = document.getElementById('save-btn');
  const statusMsg = document.getElementById('status-msg');

  // Load existing configurations from Chrome's secure local storage
  chrome.storage.local.get(['geminiApiKey', 'groqApiKey', 'aiProvider'], (result) => {
    if (result.geminiApiKey) geminiInput.value = result.geminiApiKey;
    if (result.groqApiKey) groqInput.value = result.groqApiKey;
    if (result.aiProvider) modelSelect.value = result.aiProvider;
  });

  // Intercept save action and deploy to storage
  saveBtn.addEventListener('click', () => {
    const config = {
      geminiApiKey: geminiInput.value.trim(),
      groqApiKey: groqInput.value.trim(),
      aiProvider: modelSelect.value
    };

    chrome.storage.local.set(config, () => {
      // Flash success payload UI
      statusMsg.classList.remove('hidden');
      saveBtn.textContent = 'Configuration Locked! 🚀';
      
      setTimeout(() => {
        statusMsg.classList.add('hidden');
        saveBtn.textContent = 'Deploy Settings 🚀';
      }, 2000);
    });
  });
});