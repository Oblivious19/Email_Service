var activeTab = 'text';

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
        toggleSendButton();
    });
    
    recipientTags.appendChild(tag);
    
    document.getElementById('to').value = '';
}

function addAttachment(file) {
    if (!file) return;
    
    const attachmentList = document.getElementById('attachmentList');
    if (!attachmentList) return;
    
    const item = document.createElement('div');
    item.className = 'attachment-item d-flex align-items-center p-2 rounded mb-2';
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
        function toggleSendButton() {
            if (toField.value.trim() !== '' || document.querySelectorAll('#recipientTags .tag').length > 0) {
                if (subjectField.value.trim() !== '') {
                    sendButton.disabled = false;
                    sendButton.classList.remove('btn-light');
                    sendButton.classList.add('btn-primary');
                    return;
                }
            } 
            
            sendButton.disabled = true;
            sendButton.classList.remove('btn-primary');
            sendButton.classList.add('btn-light');
        }

        toggleSendButton();

        toField.addEventListener('input', toggleSendButton);
        subjectField.addEventListener('input', toggleSendButton);

        const addRecipientButton = document.getElementById('addRecipient');
        if (addRecipientButton) {
            addRecipientButton.addEventListener('click', function() {
                const email = toField.value.trim();
                if (email) {
                    addRecipientTag(email);
                    toggleSendButton();
                }
            });
        }
        
        toField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && toField.value.trim()) {
                e.preventDefault();
                addRecipientTag(toField.value.trim());
                toggleSendButton();
            }
        });
        
        const spellCheckButton = document.getElementById('spellCheck');
        if (spellCheckButton) {
            spellCheckButton.addEventListener('click', function() {
                spellCheck();
            });
        }
        
        // Get the send button and add a click event listener
        console.log("Send button found:", sendButton); // Debug log
        
        if (sendButton) {
            sendButton.addEventListener('click', function(event) {
                console.log("Send button clicked"); // Debug log
                event.preventDefault();
                window.submitForm(); // Call the global submitForm function
            });
        } else {
            console.error("Send button not found"); // Error if button not found
        }
        
        // Also handle form submission events correctly
        if (emailForm) {
            emailForm.addEventListener('submit', function(event) {
                console.log("Form submitted"); // Debug log
                event.preventDefault();
                window.submitForm(); // Call the global submitForm function
            });
        } else {
            console.error("Email form not found"); // Error if form not found
        }
        
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

// Define submitForm in the global scope for direct access
window.submitForm = function() {
    console.log("======= SUBMIT FORM FUNCTION CALLED ======="); // Explicit debug log
    alert("Email sending initiated - check console for details"); // Visible alert for debugging
    
    const emailForm = document.getElementById('emailForm');
    if (!emailForm) {
        console.error("Email form not found");
        alert("Error: Email form not found");
        return;
    }
    
    // Show loading overlay
    const loader = document.getElementById("loader-overlay");
    if (loader) {
        loader.style.display = "flex";
        console.log("Loading overlay displayed");
    }

    // Create form data
    const formData = new FormData(emailForm);
    
    // Log form data for debugging
    console.log("Form data being sent:");
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    // Get recipient tags if present
    const recipientTags = document.querySelectorAll('#recipientTags .tag');
    if (recipientTags.length > 0) {
        const recipients = Array.from(recipientTags).map(tag => {
            return tag.textContent.trim().replace(' ×', '').replace(/\s*close$/, '');
        }).join(',');
        
        formData.set('to', recipients);
        console.log("Recipients set from tags:", recipients);
    }

    // Get the to field directly
    const toField = document.getElementById('to');
    if (toField && toField.value && !formData.get('to')) {
        formData.set('to', toField.value);
        console.log("To field set directly:", toField.value);
    }

    // Check if custom SMTP is selected
    const smtpProvider = formData.get('smtpProvider');
    console.log("Selected SMTP provider:", smtpProvider || "default Gmail");
    
    if (smtpProvider === 'custom') {
        // Hide loader
        if (loader) {
            loader.style.display = "none";
        }
        
        // Show modal with notice
        const modalContent = document.getElementById('modalContent');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="alert alert-info">
                    <h5><i class="fas fa-info-circle me-2"></i>Custom SMTP Coming Soon</h5>
                    <p>The custom SMTP option is currently in development.</p>
                    <p>Your email will be sent using the default Gmail provider for now.</p>
                    <p>Please select SendGrid or Mailgun if you would like to use an alternative provider.</p>
                </div>
            `;
            const modal = new bootstrap.Modal(document.getElementById('contentModal'));
            modal.show();
        }
        
        // Fall back to default
        formData.set('smtpProvider', 'gmail');
    }

    console.log("Sending form data via AJAX to /submit endpoint");
    
    // Send the email via AJAX
    fetch('/submit', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log("Received response:", response.status, response.statusText);
        
        // Hide loading overlay
        if (loader) {
            loader.style.display = "none";
            console.log("Loading overlay hidden after response");
        }
        
        // Process the response
        return response.text().then(data => {
            console.log("Response data:", data);
            
            if (response.ok) {
                // Show success message
                let successMsg = 'Email sent successfully!';
                if (data && data.includes('via SendGrid')) {
                    successMsg = 'Email sent via SendGrid!';
                } else if (data && data.includes('via Mailgun')) {
                    successMsg = 'Email sent via Mailgun!';
                } else if (data && data.includes('via Gmail')) {
                    successMsg = 'Email sent via Gmail!';
                }
                
                console.log("Success message:", successMsg);
                
                // Call toast function 
                if (window.toast) {
                    window.toast(successMsg, 'success');
                } else {
                    alert(successMsg);
                }
                
                // Reset the form
                emailForm.reset();
                console.log("Form reset");
                
                // Clear recipient tags
                const recipientTagsContainer = document.getElementById('recipientTags');
                if (recipientTagsContainer) {
                    recipientTagsContainer.innerHTML = '';
                    console.log("Recipient tags cleared");
                }
                
                // Clear attachments
                const attachmentList = document.getElementById('attachmentList');
                if (attachmentList) {
                    attachmentList.innerHTML = '';
                    console.log("Attachment list cleared");
                }
                
                // Clear provider selection
                document.querySelectorAll('.smtp-option').forEach(c => {
                    c.classList.remove('border-primary');
                    const button = c.querySelector('button');
                    if (button) {
                        button.classList.remove('btn-primary');
                        button.classList.add('btn-outline-primary');
                    }
                });
                console.log("Provider selection cleared");
                
                // Remove provider field
                const providerField = document.getElementById('smtpProvider');
                if (providerField) {
                    providerField.remove();
                    console.log("Provider field removed");
                }
                
                // Adjust textarea heights
                const textareas = ['tbody', 'htmlB', 'mdB'];
                textareas.forEach(id => {
                    const textarea = document.getElementById(id);
                    if (textarea) {
                        textarea.style.height = "";
                        textarea.style.height = Math.min(300, textarea.scrollHeight) + "px";
                    }
                });
                console.log("Textarea heights adjusted");
            } else {
                // Show error message
                const errorMsg = data || 'Failed to send email';
                console.error("Error sending email:", errorMsg);
                
                if (window.toast) {
                    window.toast(errorMsg, 'error');
                } else {
                    alert("Error: " + errorMsg);
                }
                
                throw new Error(errorMsg);
            }
        });
    })
    .catch(error => {
        console.error('Error sending email:', error);
        
        // Hide loading overlay
        if (loader) {
            loader.style.display = "none";
            console.log("Loading overlay hidden after error");
        }
        
        // Show error message
        const errorMsg = 'Failed to send email: ' + error.message;
        console.error(errorMsg);
        
        if (window.toast) {
            window.toast(errorMsg, 'error');
        } else {
            alert(errorMsg);
        }
    });
};
