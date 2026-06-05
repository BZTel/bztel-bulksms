// BZTel Scroll-Triggered Reveal Animations & Chat Widget Mockup
document.addEventListener('DOMContentLoaded', () => {
  // 1. Reveal Animations
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Apply staggered delays if defined via data-delay attribute
          const delay = element.getAttribute('data-delay');
          if (delay) {
            element.style.transitionDelay = `${delay}ms`;
          }
          
          element.classList.add('reveal-active');
          
          // Once animated, stop observing this element
          observer.unobserve(element);
        }
      });
    }, {
      root: null, // Viewport
      rootMargin: '0px 0px -80px 0px', // Trigger slightly before element enters view
      threshold: 0.1 // 10% of element is visible
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback for older browsers: show all elements immediately
    revealElements.forEach(el => el.classList.add('reveal-active'));
  }

  // 2. Dynamic Live Chat Widget Mockup
  initLiveChatWidget();
});

function initLiveChatWidget() {
  // Check if widget already exists to prevent duplicate injections
  if (document.querySelector('.chat-widget-container')) return;

  const widgetContainer = document.createElement('div');
  widgetContainer.className = 'chat-widget-container';
  widgetContainer.innerHTML = `
    <!-- Floating Bubble Button -->
    <button class="chat-bubble-btn" id="chat-bubble-btn" title="Chat with support">
      <div class="chat-online-badge"></div>
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </button>

    <!-- Chat Window -->
    <div class="chat-window" id="chat-window">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="chat-avatar">B</div>
          <div class="chat-title-container">
            <span class="chat-title">BzTel Live Support</span>
            <span class="chat-status">Online</span>
          </div>
        </div>
        <button class="chat-close-btn" id="chat-close-btn" title="Close chat">
          <svg style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Messages body -->
      <div class="chat-messages" id="chat-messages">
        <div class="chat-msg agent">
          Hello! Thanks for visiting BzTel. How can we help you today?
        </div>
      </div>

      <!-- Footer Input Area -->
      <div class="chat-input-container">
        <input type="text" class="chat-input" id="chat-input-field" placeholder="Type a message..." autocomplete="off">
        <button class="chat-send-btn" id="chat-send-btn" title="Send message">
          <svg style="width: 16px; height: 16px; transform: rotate(45deg); margin-left: 2px; margin-bottom: 2px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widgetContainer);

  const bubbleBtn = document.getElementById('chat-bubble-btn');
  const chatWindow = document.getElementById('chat-window');
  const closeBtn = document.getElementById('chat-close-btn');
  const inputField = document.getElementById('chat-input-field');
  const sendBtn = document.getElementById('chat-send-btn');
  const messagesContainer = document.getElementById('chat-messages');

  // Toggle open/close chat box
  bubbleBtn.addEventListener('click', () => {
    const isOpen = chatWindow.classList.contains('open');
    if (isOpen) {
      chatWindow.classList.remove('open');
      bubbleBtn.classList.remove('active');
    } else {
      chatWindow.classList.add('open');
      bubbleBtn.classList.add('active');
      inputField.focus();
    }
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chatWindow.classList.remove('open');
    bubbleBtn.classList.remove('active');
  });

  // Handle messages dispatching
  function handleSendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    // Append User message
    appendChatMessage(text, 'user');
    inputField.value = '';

    // Trigger Agent response simulation
    simulateAgentResponse(text);
  }

  function appendChatMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}`;
    // Support markdown style links: [Link Text](/path)
    msgDiv.innerHTML = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: inherit; text-decoration: underline; font-weight: bold;">$1</a>');
    messagesContainer.appendChild(msgDiv);
    
    // Smooth scroll to bottom
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  }

  function simulateAgentResponse(userText) {
    // Append Typing Indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg agent typing';
    typingDiv.id = 'chat-typing-indicator';
    typingDiv.innerHTML = `
      <div class="chat-typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });

    const cleanText = userText.toLowerCase();

    // Select suitable answer based on keywords
    let responseText = "Thanks for your message! BzTel is a premier global communications platform. You can sign up for a free account with starter credits, or let me know if you have any questions about SMS, Voice, Teams, or Pricing.";

    if (cleanText.includes('price') || cleanText.includes('pricing') || cleanText.includes('cost') || cleanText.includes('rates') || cleanText.includes('plan') || cleanText.includes('credit') || cleanText.includes('pay')) {
      responseText = "BzTel pricing is purely pay-as-you-go with no setup fees or subscriptions. SMS messages start at just $0.007 each. Feel free to view all global pricing tiers on our [Pricing Page](/pricing.html).";
    } else if (cleanText.includes('api') || cleanText.includes('dev') || cleanText.includes('sdk') || cleanText.includes('curl') || cleanText.includes('python') || cleanText.includes('node') || cleanText.includes('integration')) {
      responseText = "Our developer integration is simple and robust! You can test our REST API parameters using the live Interactive Sandbox directly on our [Homepage](/) hero section.";
    } else if (cleanText.includes('voice') || cleanText.includes('call') || cleanText.includes('broadcast') || cleanText.includes('broadcasting')) {
      responseText = "BzTel supports high-quality Voice Broadcasting. You can convert Text-to-Speech or upload MP3 files to send mass voice campaigns. Calls are billed at 2 credits per minute per user.";
    } else if (cleanText.includes('team') || cleanText.includes('teams') || cleanText.includes('coworker') || cleanText.includes('share') || cleanText.includes('wallet') || cleanText.includes('organization')) {
      responseText = "Yes, organization accounts support multi-member collaboration. Coworkers share a single wallet balance, contact directories, and message templates. Invites can be managed in the Teams tab on your dashboard.";
    } else if (cleanText.includes('sms') || cleanText.includes('bulk') || cleanText.includes('sender') || cleanText.includes('message')) {
      responseText = "BzTel enables bulk SMS campaigns with customizable sender IDs and contact lists. You can import contacts instantly via Excel/CSV sheets directly inside the contacts panel.";
    } else if (cleanText.includes('support') || cleanText.includes('help') || cleanText.includes('ticket') || cleanText.includes('human') || cleanText.includes('contact')) {
      responseText = "Need direct support? You can submit an official helpdesk ticket inside our dashboard, or reach out directly on our [Contact Page](/contact.html). Our engineering team responds within 15 minutes!";
    } else if (cleanText.includes('hello') || cleanText.includes('hi') || cleanText.includes('hey') || cleanText.includes('hola')) {
      responseText = "Hello there! How can I help you learn more about BzTel today? Ask me about SMS, Voice, APIs, or Teams!";
    }

    // Delay response to mimic typing duration
    setTimeout(() => {
      // Remove typing indicator
      const indicator = document.getElementById('chat-typing-indicator');
      if (indicator) indicator.remove();

      // Append response
      appendChatMessage(responseText, 'agent');
    }, 1500);
  }

  sendBtn.addEventListener('click', handleSendMessage);
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  });
}
