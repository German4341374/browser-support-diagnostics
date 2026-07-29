import { loadThreshold, saveThreshold } from '../lib/settings.js';

const form = document.querySelector('#settings-form');
const input = document.querySelector('#slow-threshold');
const statusMessage = document.querySelector('#status-message');

document.addEventListener('DOMContentLoaded', async () => {
  input.value = String(await loadThreshold());
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusMessage.textContent = '';

  try {
    const savedValue = await saveThreshold(input.value);
    input.value = String(savedValue);
    showStatus('Settings saved.', 'success');
  } catch (error) {
    showStatus(
      error instanceof Error ? error.message : 'Unable to save settings.',
      'error',
    );
  }
});

function showStatus(message, state) {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
}
