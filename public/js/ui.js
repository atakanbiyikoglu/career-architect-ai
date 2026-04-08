let chatMessages;
let userInput;
let submitBtn;
let typingIndicator;

export function initUI(elements) {
    chatMessages = elements.chatMessages;
    userInput = elements.userInput;
    submitBtn = elements.submitBtn;
    typingIndicator = elements.typingIndicator;
}

export function getChatMessages() {
    return chatMessages;
}

export function getTypingIndicator() {
    return typingIndicator;
}

export function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

export function setInputState(enabled, placeholder) {
    userInput.disabled = !enabled;
    submitBtn.disabled = !enabled;
    if (placeholder) userInput.placeholder = placeholder;
    if (enabled) userInput.focus();
}

export function showTyping() {
    typingIndicator.classList.remove('hidden');
    chatMessages.appendChild(typingIndicator);
    scrollToBottom();
}

export function hideTyping() {
    typingIndicator.classList.add('hidden');
}

function ensureTypingIndicatorInChat() {
    if (typingIndicator.parentNode !== chatMessages) {
        chatMessages.appendChild(typingIndicator);
    }
}

function createMessageRow(role, contentNode) {
    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    if (role === 'ai') {
        const avatar = document.createElement('img');
        avatar.src = 'assets/logo.png';
        avatar.alt = 'AI Logo';
        avatar.className = 'ai-avatar';
        row.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.appendChild(contentNode);
    row.appendChild(bubble);

    ensureTypingIndicatorInChat();
    chatMessages.insertBefore(row, typingIndicator);
    scrollToBottom();
}

export function addBotMessage(text, asHtml = false) {
    const content = document.createElement('div');
    if (asHtml) {
        content.className = 'markdown-block';
        content.innerHTML = text;
    } else {
        const p = document.createElement('p');
        p.textContent = text;
        content.appendChild(p);
    }
    createMessageRow('ai', content);
}

export function addUserMessage(text) {
    const content = document.createElement('div');
    const p = document.createElement('p');
    p.textContent = text;
    content.appendChild(p);
    createMessageRow('user', content);
}

export function addOptions(options, onClick, isRating = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-row';
    wrapper.dataset.optionGroup = 'true';

    options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `choice-btn${isRating ? ' rating-btn' : ''}`;
        btn.textContent = opt.label;
        btn.addEventListener('click', () => onClick(opt.value, opt.label));
        wrapper.appendChild(btn);
    });

    ensureTypingIndicatorInChat();
    chatMessages.insertBefore(wrapper, typingIndicator);
    setInputState(false, 'Lütfen seçeneklerden birini seç...');
    scrollToBottom();
}

export function addActionOptions(options, onChoose) {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-row';
    wrapper.dataset.optionGroup = 'true';

    options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', () => {
            wrapper.classList.add('hidden');
            addUserMessage(opt.label);
            onChoose(opt.value);
        });
        wrapper.appendChild(btn);
    });

    ensureTypingIndicatorInChat();
    chatMessages.insertBefore(wrapper, typingIndicator);
    setInputState(false, 'Lütfen seçeneklerden birini seç...');
    scrollToBottom();
}

export function hideLatestOptionGroup() {
    const groups = chatMessages.querySelectorAll('[data-option-group="true"]');
    if (!groups.length) return;
    const latest = groups[groups.length - 1];
    latest.classList.add('hidden');
}

export function clearChatPreserveTyping() {
    Array.from(chatMessages.children).forEach((child) => {
        if (child.id !== 'typing-indicator') {
            child.remove();
        }
    });
}
