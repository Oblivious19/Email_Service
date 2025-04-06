var activeTab = 'text';
var isSubmitting = false;  // Global submission state

// Initialize help modal
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap modal for help
    const helpModal = new bootstrap.Modal(document.getElementById('helpModal'), {
        keyboard: true,
        backdrop: true,
        focus: true
    });

    // Add click handler for help button
    const helpButton = document.querySelector('[data-bs-target="#helpModal"]');
    if (helpButton) {
        helpButton.addEventListener('click', function(e) {
            e.preventDefault();
            helpModal.show();
        });
    }
});

// Make submitForm globally accessible
window.submitForm = async function(form) {
    if (isSubmitting) {
        console.log('Form is already being submitted');
        return;
    }

    try {
        isSubmitting = true;
        const sendButton = document.getElementById('sendButton');
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';

        const formData = new FormData(form);
        
        // Get the active tab content
        const activeContent = activeTab === 'text' ? document.getElementById('tbody').value :
                            activeTab === 'html' ? document.getElementById('htmlB').value :
                            document.getElementById('mdB').value;
        
        // Update the form data with the active content
        formData.set('tbody', activeContent);
        
        console.log('Submitting form with data:', {
            to: formData.get('to'),
            subject: formData.get('subject'),
            hasContent: !!formData.get('tbody'),
            attachments: formData.getAll('attachments').length
        });

        const response = await fetch('/submit', {
            method: 'POST',
            body: formData
        });

        let result;
        try {
            const text = await response.text();
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse response as JSON:', text);
                result = { 
                    error: 'Server Error',
                    message: 'The server returned an invalid response. Please try again.'
                };
            }
        } catch (e) {
            console.error('Failed to read response:', e);
            result = { 
                error: 'Network Error',
                message: 'Failed to read server response. Please try again.'
            };
        }

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to send email');
        }

        // Clear the form on success
        form.reset();
        document.getElementById('attachmentList').innerHTML = '';
        
        // Show success message
        showAlert('success', 'Email sent successfully! 🎉');
        console.log('Email sent:', result);
    } catch (error) {
        console.error('Form submission error:', error);
        showAlert('danger', `Failed to send email: ${error.message}`);
    } finally {
        isSubmitting = false;
        const sendButton = document.getElementById('sendButton');
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Send';
        console.log('Submission complete');
    }
};

function setActiveTab(tab) {
    activeTab = tab;
    
    document.querySelectorAll('#myTab .nav-link').forEach(navLink => {
        if (navLink.id === tab + '-tab') {
            navLink.classList.add('active');
            navLink.setAttribute('aria-selected', 'true');
        } else {
            navLink.classList.remove('active');
            navLink.setAttribute('aria-selected', 'false');
        }
    });
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.id === tab) {
            pane.classList.add('show', 'active');
        } else {
            pane.classList.remove('show', 'active');
        }
    });
    
    setTimeout(() => {
        const activeTextarea = document.getElementById(
            tab === 'text' ? 'tbody' : 
            tab === 'html' ? 'htmlB' : 'mdB'
        );
        if (activeTextarea) {
            activeTextarea.focus();
        }
    }, 100);
}

function displayPreview() {
    var userInput;
    if (activeTab === 'text') {
        userInput = document.getElementById('tbody').value;
    } else if (activeTab === 'html') {
        userInput = document.getElementById('htmlB').value;
    } else if (activeTab === 'markdown') {
        userInput = document.getElementById('mdB').value;
        if (userInput) {
            userInput = convertMarkdownToHtml(userInput);
        }
    }

    const modalContent = document.getElementById('modalContent');
    if (modalContent) {
        modalContent.innerHTML = userInput || '<p class="text-muted">No content to preview</p>';
        
        const modalElement = document.getElementById('contentModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    } else {
        toast('Preview not available', 'error');
    }
}

function convertMarkdownToHtml(markdown) {
    if (!markdown) return '';
    
    markdown = markdown.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    markdown = markdown.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    markdown = markdown.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    markdown = markdown.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    markdown = markdown.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    markdown = markdown.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');
    
    markdown = markdown.replace(/^\s*\* (.*$)/gim, '<ul><li>$1</li></ul>');
    markdown = markdown.replace(/^\s*\d+\. (.*$)/gim, '<ol><li>$1</li></ol>');
    
    markdown = markdown.replace(/^(?!<[a-z])/gim, '<p>').replace(/^(?!<[a-z]|<\/[a-z])(.*)$/gim, '$1</p>');
    
    markdown = markdown.replace(/<\/ul>\s*<ul>/gim, '');
    markdown = markdown.replace(/<\/ol>\s*<ol>/gim, '');
    
    return markdown;
}

function toggleCcBcc() {
    var ccBccCheckbox = document.getElementById("CC_Bcc");
    var ccBccSection = document.getElementById("ccBccSection");
    
    if (ccBccCheckbox && ccBccSection) {
        if (ccBccCheckbox.checked) {
            ccBccSection.style.display = "block";
        } else {
            ccBccSection.style.display = "none";
        }
    }
}

function toggleReplyTo() {
    var replyToCheckbox = document.getElementById("ReplyTo");
    var replyToSection = document.getElementById("replyToSection");
    
    if (replyToCheckbox && replyToSection) {
        if (replyToCheckbox.checked) {
            replyToSection.style.display = "block";
        } else {
            replyToSection.style.display = "none";
        }
    }
}

function adjustTextareaHeight(textareaId) {
    var textarea = document.getElementById(textareaId);
    if (!textarea) return;
    
    textarea.style.height = "";
    textarea.style.height = Math.min(300, textarea.scrollHeight) + "px";
}

function syncContent() {
    const textContent = document.getElementById('tbody').value;
    const htmlContent = document.getElementById('htmlB').value;
    const mdContent = document.getElementById('mdB').value;
    
    if (activeTab === 'text' && textContent && !htmlContent) {
        document.getElementById('htmlB').value = `<p>${textContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }
    
    if (activeTab === 'html' && htmlContent && !textContent) {
        let text = htmlContent.replace(/<\/p><p>/g, '\n\n');
        text = text.replace(/<br\s*\/?>/g, '\n');
        text = text.replace(/<[^>]*>/g, '');
        document.getElementById('tbody').value = text;
    }
}

function addRecipientTag(email) {
    if (!email || email.trim() === '') return;
    
    const recipientTags = document.getElementById('recipientTags');
    if (!recipientTags) return;
    
    const existingTags = Array.from(recipientTags.querySelectorAll('.tag')).map(tag => 
        tag.textContent.trim().replace(/\s*×$/, '')
    );
    
    if (existingTags.includes(email)) {
        toast(`${email} is already added`, 'info');
        return;
    }
    
    const tag = document.createElement('span');
    tag.className = 'tag tag-primary';
    tag.innerHTML = `${email} <i class="fas fa-times close"></i>`;
    
    tag.querySelector('.close').addEventListener('click', function() {
        tag.remove();
        toggleSendButton(); // Call the global toggleSendButton function
    });
    
    recipientTags.appendChild(tag);
    document.getElementById('to').value = '';
    
    // Update send button state
    toggleSendButton();
}

function addAttachment(file) {
    if (!file) return;
    
    const attachmentList = document.getElementById('attachmentList');
    if (!attachmentList) return;
    
    const item = document.createElement('div');
    item.className = 'p-2 mb-2 rounded attachment-item d-flex align-items-center';
    item.style.backgroundColor = 'var(--gray-100)';
    
    let iconClass = 'fas fa-file text-secondary';
    if (file.name.endsWith('.pdf')) {
        iconClass = 'fas fa-file-pdf text-danger';
    } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        iconClass = 'fas fa-file-word text-primary';
    } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        iconClass = 'fas fa-file-excel text-success';
    } else if (file.name.match(/\.(jpg|jpeg|png|gif)$/i)) {
        iconClass = 'fas fa-file-image text-warning';
    }
    
    const size = (file.size / (1024 * 1024)).toFixed(2);
    
    item.innerHTML = `
        <i class="${iconClass} me-2"></i>
        <span>${file.name}</span>
        <small class="text-muted ms-2">(${size} MB)</small>
        <button class="btn btn-sm ms-auto"><i class="fas fa-times"></i></button>
    `;
    
    item.querySelector('button').addEventListener('click', function() {
        item.remove();
    });
    
    attachmentList.appendChild(item);
}

function spellCheck() {
    const textArea = document.getElementById('tbody');
    if (!textArea || textArea.value.trim() === '') return;
    
    const commonTypos = {
        'recieve': 'receive',
        'seperate': 'separate',
        'definately': 'definitely',
        'accomodate': 'accommodate',
        'occured': 'occurred',
        'refered': 'referred',
        'beleive': 'believe'
    };
    
    let text = textArea.value;
    let corrected = false;
    
    for (const [typo, correction] of Object.entries(commonTypos)) {
        const regex = new RegExp(`\\b${typo}\\b`, 'gi');
        if (regex.test(text)) {
            text = text.replace(regex, correction);
            corrected = true;
        }
    }
    
    if (corrected) {
        textArea.value = text;
        toast('Spelling corrected!', 'success');
    } else {
        toast('No spelling errors found', 'info');
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const textareas = ['tbody', 'htmlB', 'mdB'];
    textareas.forEach(id => {
        const textarea = document.getElementById(id);
        if (textarea) {
            textarea.addEventListener("input", function() {
                adjustTextareaHeight(id);
                
                // Sync content when a tab is edited
                if (id === 'tbody' || id === 'htmlB' || id === 'mdB') {
                    syncContent();
                }
            });
            adjustTextareaHeight(id);
        }
    });

    // Add tab click handlers for extra reliability
    document.querySelectorAll('#myTab .nav-link').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('id').replace('-tab', '');
            setActiveTab(tabId);
        });
    });
    
    // Enhanced preview button click handling
    document.querySelectorAll('.btn-preview').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            displayPreview();
        });
    });

    const ccBccCheckbox = document.getElementById("CC_Bcc");
    const replyToCheckbox = document.getElementById("ReplyTo");
    
    if (ccBccCheckbox) {
        ccBccCheckbox.addEventListener("change", toggleCcBcc);
    }
    
    if (replyToCheckbox) {
        replyToCheckbox.addEventListener("change", toggleReplyTo);
    }

    // SMTP provider selection
    const providerButtons = document.querySelectorAll('.provider-select');
    if (providerButtons.length > 0) {
        providerButtons.forEach(button => {
            button.addEventListener('click', function() {
                const card = this.closest('.smtp-option');
                const provider = card.getAttribute('data-provider');
                
                // Remove active class from all cards
                document.querySelectorAll('.smtp-option').forEach(c => {
                    c.classList.remove('border-primary');
                    c.querySelector('button').classList.remove('btn-primary');
                    c.querySelector('button').classList.add('btn-outline-primary');
                });
                
                // Add active class to selected card
                card.classList.add('border-primary');
                this.classList.remove('btn-outline-primary');
                this.classList.add('btn-primary');
                
                // Update hidden field for provider
                let providerField = document.getElementById('smtpProvider');
                if (!providerField) {
                    providerField = document.createElement('input');
                    providerField.type = 'hidden';
                    providerField.id = 'smtpProvider';
                    providerField.name = 'smtpProvider';
                    document.getElementById('emailForm').appendChild(providerField);
                }
                providerField.value = provider;
                
                toast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} selected as email provider`, 'success');
            });
        });
    }

    const emailForm = document.getElementById('emailForm');
    const toField = document.getElementById('to');
    const subjectField = document.getElementById('subject');
    const sendButton = document.getElementById('sendButton');

    if (emailForm && toField && subjectField && sendButton) {
        window.toggleSendButton = function() {
            const hasRecipient = toField.value.trim() !== '' || document.querySelectorAll('#recipientTags .tag').length > 0;
            const hasSubject = subjectField.value.trim() !== '';
            
            if (hasRecipient && hasSubject && !isSubmitting) {
                sendButton.disabled = false;
                sendButton.classList.remove('btn-light');
                sendButton.classList.add('btn-primary');
            } else {
                sendButton.disabled = true;
                sendButton.classList.remove('btn-primary');
                sendButton.classList.add('btn-light');
            }
        }

        // Add input event listeners
        toField.addEventListener('input', toggleSendButton);
        subjectField.addEventListener('input', toggleSendButton);

        // Add recipient button handling
        const addRecipientButton = document.getElementById('addRecipient');
        if (addRecipientButton) {
            addRecipientButton.addEventListener('click', function() {
                const email = toField.value.trim();
                if (email) {
                    addRecipientTag(email);
                }
            });
        }
        
        // Enter key handling for recipient field
        toField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && toField.value.trim()) {
                e.preventDefault();
                addRecipientTag(toField.value.trim());
            }
        });
        
        const spellCheckButton = document.getElementById('spellCheck');
        if (spellCheckButton) {
            spellCheckButton.addEventListener('click', function() {
                spellCheck();
            });
        }

        // Prevent any form submissions
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // Single click handler for send button
        function handleSubmit(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (isSubmitting) {
                console.log('Preventing duplicate submission');
                return false;
            }

            const form = document.getElementById('emailForm');
            const formData = new FormData(form);

            console.log('Handling submit', {
                to: formData.get('to'),
                subject: formData.get('subject'),
                hasContent: !!formData.get('tbody'),
                attachments: formData.getAll('attachments').length
            });

            window.submitForm(form)
                .catch(error => console.error('Form submission error:', error));

            return false;
        }

        // Remove all existing click listeners from send button
        const newSendButton = sendButton.cloneNode(true);
        sendButton.parentNode.replaceChild(newSendButton, sendButton);
        
        // Add single click listener to the new button
        newSendButton.addEventListener('click', handleSubmit);

        // Initial button state
        toggleSendButton();
        
        // Prevent form submission on attachments upload
        const attachmentsInput = document.getElementById('attachments');
        if (attachmentsInput) {
            attachmentsInput.addEventListener('change', function(event) {
                event.preventDefault(); // Prevent form submission
                if (this.files.length) {
                    Array.from(this.files).forEach(file => {
                        addAttachment(file);
                    });
                }
            });
        }
        
        const dropboxBtn = document.getElementById('dropboxButton');
        const driveBtn = document.getElementById('googleDriveButton');
        
        if (dropboxBtn) {
            dropboxBtn.addEventListener('click', function() {
                toast('Dropbox integration coming soon!', 'info');
            });
        }
        
        if (driveBtn) {
            driveBtn.addEventListener('click', function() {
                toast('Google Drive integration coming soon!', 'info');
            });
        }
    }

    // Initialize first text input when page loads
    setTimeout(() => {
        const textBody = document.getElementById('tbody');
        if (textBody) {
            textBody.focus();
        }
    }, 500);
});

function toast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        max-width: 350px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        transform: translateY(-20px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .toast-notification.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .toast-success {
        background-color: #06d6a0;
    }
    
    .toast-error {
        background-color: #ef476f;
    }
    
    .toast-info {
        background-color: #4361ee;
    }
`;
document.head.appendChild(style);

function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Remove any existing alerts
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alert && alert.parentNode === alertContainer) {
            alert.classList.remove('show');
            setTimeout(() => alertContainer.removeChild(alert), 150);
        }
    }, 5000);
}
