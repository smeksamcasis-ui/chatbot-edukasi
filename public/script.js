const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const clearBtn = document.getElementById('clear-btn');

// Maintain the conversation history to send to the backend API
let conversation = [];

// Escapes HTML and formats markdown-like elements (**bold**, `code`, bullet points)
function formatMessage(text) {
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Format bold (**text**)
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Format bullet points (* or - at start of line)
  escaped = escaped.replace(/^(?:\*|-)\s+(.+)$/gm, '• $1');

  // Format inline code (`code`)
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Format line breaks
  escaped = escaped.replace(/\n/g, '<br>');

  return escaped;
}

function appendMessage(sender, text, isThinking = false) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  
  if (isThinking) {
    msg.classList.add('thinking');
    msg.textContent = text;
  } else if (sender === 'bot') {
    msg.innerHTML = formatMessage(text);
  } else {
    msg.textContent = text;
  }
  
  chatBox.appendChild(msg);
  
  // Smooth scroll to the bottom of the chat box
  chatBox.scrollTo({
    top: chatBox.scrollHeight,
    behavior: 'smooth'
  });
  
  return msg;
}

// Show a friendly introduction from the bot at load
function appendWelcomeMessage() {
  appendMessage('bot', 'Halo! Saya adalah **EduBot TKJ**, asisten belajar Teknik Komputer dan Jaringan Anda. Silakan tanyakan materi TKJ yang tidak Anda mengerti, seperti alat jaringan, konfigurasi router, IP addressing, atau topologi.');
}

// Initial welcome message
appendWelcomeMessage();

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add the user's message to the UI
  appendMessage('user', userMessage);
  input.value = '';

  // Store the user's message in the conversation history
  conversation.push({ role: 'user', text: userMessage });

  // Show a temporary "Thinking..." bot message with class 'thinking'
  const thinkingMessage = appendMessage('bot', 'Sedang berpikir...', true);

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
      // Remove thinking state and update content with formatted HTML
      thinkingMessage.classList.remove('thinking');
      thinkingMessage.innerHTML = formatMessage(data.result);
      
      // Store the model's message in the conversation history
      conversation.push({ role: 'model', text: data.result });
    } else {
      thinkingMessage.classList.remove('thinking');
      thinkingMessage.textContent = 'Maaf, tidak ada respons yang diterima dari server.';
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    thinkingMessage.classList.remove('thinking');
    thinkingMessage.textContent = 'Gagal mendapatkan respon dari server. Pastikan koneksi server menyala.';
  } finally {
    // Re-enable elements
    input.disabled = false;
    if (submitButton) submitButton.disabled = false;
    input.focus();
    
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: 'smooth'
    });
  }
});

// Prompt Chips Event Listener
const chips = document.querySelectorAll('.chip');
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    const question = chip.getAttribute('data-question');
    if (question) {
      input.value = question;
      // Trigger form submit
      form.dispatchEvent(new Event('submit'));
    }
  });
});

// Clear Chat Action
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua pesan dalam percakapan ini?')) {
      conversation = [];
      chatBox.innerHTML = '';
      appendWelcomeMessage();
    }
  });
}
