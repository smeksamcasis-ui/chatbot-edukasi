const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Maintain the conversation history to send to the backend API
let conversation = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add the user's message to the UI
  appendMessage('user', userMessage);
  input.value = '';

  // Store the user's message in the conversation history
  conversation.push({ role: 'user', text: userMessage });

  // Show a temporary "Thinking..." bot message
  const thinkingMessage = appendMessage('bot', 'Thinking...');

  // Disable form input and submit button to prevent double sending
  input.disabled = true;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    // Send request to backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.result) {
      // Replace the "Thinking..." text with the model response
      thinkingMessage.textContent = data.result;
      // Store the model's message in the conversation history
      conversation.push({ role: 'model', text: data.result });
    } else {
      // Handle empty result
      thinkingMessage.textContent = 'Sorry, no response received.';
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    // Handle error during fetch or server-side failure
    thinkingMessage.textContent = 'Failed to get response from server.';
  } finally {
    // Re-enable elements
    input.disabled = false;
    if (submitButton) submitButton.disabled = false;
    input.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  
  // Ensure floated messages clear previous floats to start on a new line
  msg.style.clear = 'both';
  
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

