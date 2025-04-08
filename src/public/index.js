var activeTab = 'text';
var isSubmitting = false;  // Global submission state

// Initialize help modal
document.addEventListener('DOMContentLoaded', function () {
    // Dark mode implementation 
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme');
    const themeToggle = document.querySelector('.theme-toggle');
    
    // Set default to dark mode
    if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark'); // Save default preference
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Add event listener to toggle theme
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update toggle icon
        themeToggle.innerHTML = `<i class="fas ${newTheme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
    });

    // Initialize all interactive components
    initCheckboxToggle();
    initFileUploadPreview();
    initSingleBodyWithTabs();

    // Get form elements
    const emailForm = document.getElementById('emailForm');
    const statusDiv = document.getElementById('status');
    const sendButton = document.getElementById('sendButton');
    const providerSelect = document.getElementById('provider');
    const providerHelp = document.getElementById('providerHelp');
    const loaderOverlay = document.getElementById('loader-overlay');
    
    // Initialize tabs if available
    const tabLinks = document.querySelectorAll('.nav-link');
    if (tabLinks.length > 0) {
        tabLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all tabs
                tabLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab panes
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                // Show the selected tab pane
                const target = this.getAttribute('href').substring(1);
                document.getElementById(target).classList.add('show', 'active');
            });
        });
    }

    // Show status message with improved UI
    function showStatus(message, isError = false, duration = 5000) {
        if (!statusDiv) return;

        // Add icon to status messages
        const icon = isError 
            ? '<i class="fas fa-exclamation-circle me-2"></i>' 
            : '<i class="fas fa-check-circle me-2"></i>';
        
        statusDiv.innerHTML = icon + message;
        statusDiv.className = isError ? 'error' : 'success';
        statusDiv.classList.remove('hidden');

        // Clear any existing timeout
        if (statusDiv.timeoutId) {
            clearTimeout(statusDiv.timeoutId);
        }

        // Auto-hide after duration
        statusDiv.timeoutId = setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, duration);
    }

    // Format error message based on response
    function formatErrorMessage(data) {
        if (!data) return 'Unknown error';
        
        if (data.message) {
            return data.message;
        }
        
        if (data.error === 'Authentication failed') {
            return 'Authentication failed. Please check your email service credentials.';
        }
        
        if (data.error === 'Connection error') {
            return 'Could not connect to email service. Please check your internet connection.';
        }
        
        return `${data.error || 'Error'}: ${data.message || 'Unknown error'}`;
    }

    // Show loader overlay with improved UI
    function showLoader() {
        if (loaderOverlay) {
            loaderOverlay.style.display = 'flex';
            
            // Add animated dots to the loading message
            const loadingText = loaderOverlay.querySelector('p');
            if (loadingText) {
                let dots = 0;
                loadingText._interval = setInterval(() => {
                    dots = (dots + 1) % 4;
                    loadingText.textContent = `Sending your email${'.'.repeat(dots)}`;
                }, 500);
            }
        }
        
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Sending...';
        }
    }

    // Hide loader overlay
    function hideLoader() {
        if (loaderOverlay) {
            const loadingText = loaderOverlay.querySelector('p');
            if (loadingText && loadingText._interval) {
                clearInterval(loadingText._interval);
            }
            
            loaderOverlay.style.display = 'none';
        }
        
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Send Email';
        }
    }

    // Improved email validation function
    function validateEmails(emails) {
        if (!emails) return false;
        
        const emailList = emails.split(',').map(e => e.trim());
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        const invalidEmails = emailList.filter(email => !emailRegex.test(email));
        if (invalidEmails.length > 0) {
            showStatus(`Invalid email format: ${invalidEmails.join(', ')}`, true);
            return false;
        }
        
        return true;
    }

    // Handle form submission with improved error handling
    async function handleSubmit(event) {
        event.preventDefault();
        
        console.log('Handling form submission');

        // Get form data
        const formData = new FormData(emailForm);
        const to = formData.get('to');
        const subject = formData.get('subject');
        const message = formData.get('tbody');
        const provider = formData.get('provider');
        const cc = formData.get('cc');
        const bcc = formData.get('bcc');
        const attachments = document.getElementById('attachments').files;

        // Validate form with improved error reporting
        const errors = [];
        
        if (!to) {
            errors.push('Recipient email is required');
        } else if (!validateEmails(to)) {
            errors.push('Invalid recipient email format');
        }
        
        if (!subject) {
            errors.push('Subject is required');
        }
        
        if (!message) {
            errors.push('Email body is required');
        }
        
        if (cc && !validateEmails(cc)) {
            errors.push('Invalid CC email format');
        }
        
        if (bcc && !validateEmails(bcc)) {
            errors.push('Invalid BCC email format');
        }
        
        if (errors.length > 0) {
            showStatus(`Please fix the following errors:<br>- ${errors.join('<br>- ')}`, true);
            return;
        }

        // Show sending status and loader
        showLoader();

        // Display submit details for debugging
        console.log({
            to,
            subject,
            provider,
            cc: cc || 'Not specified',
            bcc: bcc || 'Not specified',
            hasContent: !!message,
            attachments: attachments ? attachments.length : 0
        });

        try {
            // Submit the form
            const response = await fetch('/submit', {
                method: 'POST',
                body: formData
            });

            console.log('Server response status:', response.status);

            // Parse the JSON response
            let data;
            try {
                const responseText = await response.text();
                console.log('Raw server response:', responseText);
                data = JSON.parse(responseText);
                console.log('Parsed server response:', data);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                showStatus('<i class="fas fa-exclamation-triangle me-2"></i> Invalid server response', true);
                hideLoader();
                return;
            }

            if (!response.ok) {
                throw new Error(formatErrorMessage(data));
            }

            // Handle credentials unavailable case
            if (data.credentialsUnavailable) {
                showStatus(`${provider} provider needs setup: ${data.message || 'Credentials not available'}`, true);
                emailForm.reset();
                document.getElementById('attachmentPreview').innerHTML = '';
                hideLoader();
                return;
            }

            // Handle successful response
            let successMessage = `Email sent successfully via ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`;
            
            // Add preview link for Ethereal emails
            if (provider === 'ethereal' && data.previewUrl) {
                successMessage += ` <a href="${data.previewUrl}" target="_blank" class="alert-link">View it here</a>`;
                statusDiv.innerHTML = successMessage;
                statusDiv.className = 'success';
                statusDiv.classList.remove('hidden');
            } else {
                showStatus(successMessage);
            }
            
            // Clear form and attachment preview
            emailForm.reset();
            document.getElementById('attachmentPreview').innerHTML = '';
        } catch (error) {
            console.error('Form submission error:', error);
            showStatus(`<i class="fas fa-exclamation-triangle me-2"></i> ${error.message || 'Failed to send email'}`, true);
        } finally {
            hideLoader();
        }
    }
    
    // Add form event listeners
    if (emailForm) {
        emailForm.addEventListener('submit', handleSubmit);
    }
    
    // Handle provider change with better UI feedback
    if (providerSelect) {
        providerSelect.addEventListener('change', function() {
            const provider = this.value;
            console.log(`Email provider changed to: ${provider}`);
            
            // Update the provider help text based on selection
            if (providerHelp) {
                switch(provider) {
                    case 'gmail':
                        providerHelp.innerHTML = '<i class="fas fa-info-circle me-1"></i> Gmail is configured with your credentials and ready to send.';
                        break;
                    case 'sendgrid':
                        providerHelp.innerHTML = '<i class="fas fa-info-circle me-1"></i> SendGrid requires an API key. You\'ll see a notification if configuration is needed.';
                        break;
                    case 'mailgun':
                        providerHelp.innerHTML = '<i class="fas fa-info-circle me-1"></i> Mailgun requires API key and domain settings. You\'ll see a notification if configuration is needed.';
                        break;
                    case 'ethereal':
                        providerHelp.innerHTML = '<i class="fas fa-info-circle me-1"></i> Ethereal Mail is perfect for testing - emails won\'t be delivered but can be viewed online.';
                        break;
                    default:
                        providerHelp.innerHTML = '<i class="fas fa-info-circle me-1"></i> Select a provider to send your email.';
                }
            }
        });
        
        // Trigger change event to set initial help text
        providerSelect.dispatchEvent(new Event('change'));
    }
});

// Get base URL for API calls
const getBaseUrl = () => {
    const hostname = window.location.hostname;
    console.log('Current hostname:', hostname);

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '';
    }
    // Use the current origin for production
    return window.location.origin;
};

function setActiveTab(tab) {
    activeTab = tab;
    // Update the active textarea's content
    var content = '';
    if (activeTab === 'text') {
        content = document.getElementById('tbody').value;
    } else if (activeTab === 'html') {
        content = document.getElementById('htmlB').value;
    } else if (activeTab === 'markdown') {
        content = document.getElementById('mdB').value;
    }
    
    // Store the content type
    document.getElementById('bodyType').value = activeTab;

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
    var previewContent;
    
    if (activeTab === 'text') {
        userInput = document.getElementById('tbody').value;
        previewContent = userInput;
    } else if (activeTab === 'html') {
        userInput = document.getElementById('htmlB').value;
        previewContent = userInput;
    } else if (activeTab === 'markdown') {
        userInput = document.getElementById('mdB').value;
        try {
            previewContent = marked(userInput);
        } catch (e) {
            previewContent = 'Error parsing Markdown: ' + e.message;
        }
    }

    var previewArea = document.getElementById('previewWork');
    if (!previewArea) {
        previewArea = document.createElement('div');
        previewArea.id = 'previewWork';
        previewArea.className = 'preview-overlay';
        document.body.appendChild(previewArea);
    }

    var previewContent = `
        <div class="preview-header">
            <h4>Preview</h4>
            <button onclick="closePreview()" class="btn btn-link text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="preview-content">
            ${previewContent}
        </div>
    `;

    previewArea.innerHTML = previewContent;
    previewArea.classList.remove('hide');
}

function closePreview() {
    var previewArea = document.getElementById('previewWork');
    if (previewArea) {
        previewArea.classList.add('hide');
    }
}

function toggleCcBcc() {
    var ccBccCheckbox = document.getElementById("CC_Bcc");
    var ccBccSection = document.getElementById("ccBccSection");
    if (ccBccCheckbox.checked) {
        ccBccSection.style.display = "block";
    } else {
        ccBccSection.style.display = "none";
    }
}

function toggleReplyTo() {
    var replyToCheckbox = document.getElementById("ReplyTo");
    var replyToSection = document.getElementById("replyToSection");
    if (replyToCheckbox.checked) {
        replyToSection.style.display = "block";
    } else {
        replyToSection.style.display = "none";
    }
}

function adjustTextareaHeight(textareaId) {
    var textarea = document.getElementById(textareaId);
    textarea.style.height = "";
    textarea.style.height = textarea.scrollHeight + "px";
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

    tag.querySelector('.close').addEventListener('click', function () {
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

    item.querySelector('button').addEventListener('click', function () {
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
        'beleive': 'believe',
        'maintainance': 'maintenance',
        'independant': 'independent',
        'relevent': 'relevant'
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

document.addEventListener("DOMContentLoaded", function () {
    // Add styles for preview overlay
    addPreviewStyles();
    
    // Initialize format tabs and preview functionality
    initializeFormatTabs();
    
    // Set the initial active tab (plain text by default)
    const textTab = document.querySelector('#editorTabs button[data-type="text"]');
    if (textTab) {
        textTab.click();
    }

    const textareas = ['tbody', 'htmlB', 'mdB'];
    textareas.forEach(id => {
        const textarea = document.getElementById(id);
        if (textarea) {
            textarea.addEventListener("input", function () {
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
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('id').replace('-tab', '');
            setActiveTab(tabId);
        });
    });

    // Enhanced preview button click handling
    document.querySelectorAll('.btn-preview').forEach(button => {
        button.addEventListener('click', function (e) {
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
        replyToCheckbox.addEventListener('change', toggleReplyTo);
    }

    // SMTP provider selection
    const providerButtons = document.querySelectorAll('.provider-select');
    if (providerButtons.length > 0) {
        providerButtons.forEach(button => {
            button.addEventListener('click', function () {
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
        window.toggleSendButton = function () {
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
            addRecipientButton.addEventListener('click', function () {
                const email = toField.value.trim();
                if (email) {
                    addRecipientTag(email);
                }
            });
        }

        // Enter key handling for recipient field
        toField.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && toField.value.trim()) {
                e.preventDefault();
                addRecipientTag(toField.value.trim());
            }
        });

        const spellCheckButton = document.getElementById('spellCheck');
        if (spellCheckButton) {
            spellCheckButton.addEventListener('click', function () {
                spellCheck();
            });
        }

        // Prevent any form submissions
        emailForm.addEventListener('submit', function (e) {
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
            attachmentsInput.addEventListener('change', function (event) {
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
            dropboxBtn.addEventListener('click', function () {
                toast('Dropbox integration coming soon!', 'info');
            });
        }

        if (driveBtn) {
            driveBtn.addEventListener('click', function () {
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

    // Set up line numbers for all textareas
    const textArea = document.getElementById('emailText');
    const htmlArea = document.getElementById('emailHTML');
    const markdownArea = document.getElementById('emailMarkdown');
    
    const textLineNumbers = document.querySelector('.line-numbers');
    const htmlLineNumbers = document.querySelector('.html-line-numbers');
    const markdownLineNumbers = document.querySelector('.markdown-line-numbers');
    
    if (textArea && textLineNumbers) {
        textArea.addEventListener('input', function() {
            updateLineNumbers(textArea, textLineNumbers);
            autoResizeTextarea(textArea);
        });
        
        textArea.addEventListener('scroll', function() {
            textLineNumbers.scrollTop = textArea.scrollTop;
        });
        
        // Initialize
        updateLineNumbers(textArea, textLineNumbers);
    }
    
    if (htmlArea && htmlLineNumbers) {
        htmlArea.addEventListener('input', function() {
            updateLineNumbers(htmlArea, htmlLineNumbers);
            autoResizeTextarea(htmlArea);
        });
        
        htmlArea.addEventListener('scroll', function() {
            htmlLineNumbers.scrollTop = htmlArea.scrollTop;
        });
        
        // Initialize
        updateLineNumbers(htmlArea, htmlLineNumbers);
    }
    
    if (markdownArea && markdownLineNumbers) {
        markdownArea.addEventListener('input', function() {
            updateLineNumbers(markdownArea, markdownLineNumbers);
            autoResizeTextarea(markdownArea);
        });
        
        markdownArea.addEventListener('scroll', function() {
            markdownLineNumbers.scrollTop = markdownArea.scrollTop;
        });
        
        // Initialize
        updateLineNumbers(markdownArea, markdownLineNumbers);
    }
    
    // Add auto-resize to all textareas
    const allTextareas = document.querySelectorAll('textarea');
    allTextareas.forEach(textarea => {
        autoResizeTextarea(textarea);
        textarea.addEventListener('input', function() {
            autoResizeTextarea(textarea);
        });
    });
    
    // Setup preview buttons
    const previewButtons = document.querySelectorAll('.previewbtn');
    previewButtons.forEach(button => {
        button.addEventListener('click', displayPreview);
    });
});

// Function to automatically resize textareas based on content
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

function toast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
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

// Add functions to handle slide animations for checkboxes
function initCheckboxToggle() {
    // Reply-To section toggle
    const replyToCheckbox = document.getElementById('ReplyTo');
    const replyToSection = document.getElementById('replyToSection');
    
    if (replyToCheckbox && replyToSection) {
        replyToCheckbox.addEventListener('change', function() {
            if (this.checked) {
                replyToSection.style.display = 'block';
                setTimeout(() => {
                    replyToSection.classList.add('show');
                }, 10);
            } else {
                replyToSection.classList.remove('show');
                setTimeout(() => {
                    replyToSection.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // CC/BCC section toggle
    const ccBccCheckbox = document.getElementById('CC_Bcc');
    const ccBccSection = document.getElementById('ccBccSection');
    
    if (ccBccCheckbox && ccBccSection) {
        ccBccCheckbox.addEventListener('change', function() {
            if (this.checked) {
                ccBccSection.style.display = 'block';
                setTimeout(() => {
                    ccBccSection.classList.add('show');
                }, 10);
            } else {
                ccBccSection.classList.remove('show');
                setTimeout(() => {
                    ccBccSection.style.display = 'none';
                }, 300);
            }
        });
    }
}

// Handle file uploads with preview
function initFileUploadPreview() {
    const fileInput = document.getElementById('attachments');
    const previewContainer = document.getElementById('attachmentPreview');
    
    if (fileInput && previewContainer) {
        fileInput.addEventListener('change', function() {
            previewContainer.innerHTML = '';
            
            if (this.files.length > 3) {
                showStatus('Maximum 3 files allowed', true);
                this.value = '';
                return;
            }
            
            Array.from(this.files).forEach(file => {
                const fileSize = (file.size / (1024 * 1024)).toFixed(2);
                
                if (fileSize > 5) {
                    showStatus(`File "${file.name}" exceeds 5MB limit`, true);
                    return;
                }
                
                // Choose icon based on file type
                let fileIcon = 'fa-file';
                if (file.type.includes('image')) {
                    fileIcon = 'fa-file-image';
                } else if (file.type.includes('pdf')) {
                    fileIcon = 'fa-file-pdf';
                } else if (file.type.includes('word')) {
                    fileIcon = 'fa-file-word';
                } else if (file.type.includes('excel')) {
                    fileIcon = 'fa-file-excel';
                } else if (file.type.includes('zip') || file.type.includes('rar')) {
                    fileIcon = 'fa-file-archive';
                } else if (file.type.includes('video')) {
                    fileIcon = 'fa-file-video';
                } else if (file.type.includes('audio')) {
                    fileIcon = 'fa-file-audio';
                } else if (file.type.includes('text')) {
                    fileIcon = 'fa-file-alt';
                }
                
                const fileItem = document.createElement('div');
                fileItem.className = 'attachment-preview-item';
                fileItem.innerHTML = `
                    <i class="fas ${fileIcon}"></i>
                    <span>${file.name}</span>
                    <small class="text-muted ms-2">(${fileSize} MB)</small>
                    <i class="fas fa-times remove-btn"></i>
                `;
                
                fileItem.querySelector('.remove-btn').addEventListener('click', function() {
                    fileItem.remove();
                    // Can't directly modify FileList, so we can just clear the input
                    // if all files are removed
                    if (previewContainer.children.length === 0) {
                        fileInput.value = '';
                    }
                });
                
                previewContainer.appendChild(fileItem);
            });
        });
    }
}

// New function to handle the message body type switching with a single textarea
function initSingleBodyWithTabs() {
    const mainTextarea = document.getElementById('tbody');
    if (!mainTextarea) return;
    
    let currentBodyType = 'text';
    let savedContent = {
        'text': '',
        'html': '',
        'markdown': ''
    };
    
    // Get the tab buttons
    const textTabButton = document.getElementById('text-tab');
    const htmlTabButton = document.getElementById('html-tab');
    const markdownTabButton = document.getElementById('markdown-tab');
    
    // Hide the unused textareas
    const htmlTextarea = document.getElementById('htmlB');
    const markdownTextarea = document.getElementById('mdB');
    
    if (htmlTextarea) htmlTextarea.style.display = 'none';
    if (markdownTextarea) markdownTextarea.style.display = 'none';
    
    // Function to update the textarea based on the selected type
    function updateBodyTextarea(type) {
        // Save current content
        savedContent[currentBodyType] = mainTextarea.value;
        
        // Update type indicator and placeholder
        currentBodyType = type;
        
        // Load content for the selected type
        mainTextarea.value = savedContent[type];
        
        // Update placeholder based on type
        switch(type) {
            case 'text':
                mainTextarea.placeholder = 'Write your email content here...';
                break;
            case 'html':
                mainTextarea.placeholder = 'Write your email as HTML...';
                break;
            case 'markdown':
                mainTextarea.placeholder = 'Write your email as Markdown...';
                break;
        }
        
        // Update the format indicator
        const formatIndicator = document.getElementById('format-indicator');
        if (formatIndicator) {
            formatIndicator.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        }
    }
    
    // Add event listeners to the tab buttons
    if (textTabButton) {
        textTabButton.addEventListener('click', function(e) {
            e.preventDefault();
            updateBodyTextarea('text');
        });
    }
    
    if (htmlTabButton) {
        htmlTabButton.addEventListener('click', function(e) {
            e.preventDefault();
            updateBodyTextarea('html');
        });
    }
    
    if (markdownTabButton) {
        markdownTabButton.addEventListener('click', function(e) {
            e.preventDefault();
            updateBodyTextarea('markdown');
        });
    }
    
    // Add a preview button next to the textarea
    const editorContainer = mainTextarea.closest('.editor-container');
    if (editorContainer) {
        const previewButton = document.createElement('button');
        previewButton.className = 'btn btn-sm btn-primary preview-button';
        previewButton.innerHTML = '<i class="fas fa-eye me-1"></i> Preview';
        previewButton.style.position = 'absolute';
        previewButton.style.right = '10px';
        previewButton.style.top = '10px';
        previewButton.style.zIndex = '5';
        
        previewButton.addEventListener('click', function(e) {
            e.preventDefault();
            previewEmail();
        });
        
        editorContainer.style.position = 'relative';
        editorContainer.appendChild(previewButton);
    }
    
    // Add a new preview function
    window.previewEmail = function() {
        let content = mainTextarea.value;
        
        // If no content, show a message
        if (!content.trim()) {
            toast('Nothing to preview', 'info');
            return;
        }
        
        // Process content based on the current type
        if (currentBodyType === 'html') {
            // HTML content can be used as is
        } else if (currentBodyType === 'markdown') {
            // Convert markdown to HTML using a simple converter
            content = convertMarkdownToHtml(content);
        } else {
            // Convert plain text to HTML
            content = content.replace(/\n/g, '<br>').replace(/\s\s/g, '&nbsp;&nbsp;');
            content = `<p>${content}</p>`;
        }
        
        // Create or get preview container
        let previewContainer = document.getElementById('emailPreviewContainer');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'emailPreviewContainer';
            previewContainer.className = 'email-preview-container';
            
            // Create a backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'preview-backdrop';
            backdrop.addEventListener('click', closePreview);
            
            // Create the preview content
            const previewContent = document.createElement('div');
            previewContent.className = 'preview-content';
            
            // Create a close button
            const closeButton = document.createElement('button');
            closeButton.className = 'preview-close';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', closePreview);
            
            // Assemble the preview container
            previewContainer.appendChild(closeButton);
            previewContainer.appendChild(previewContent);
            
            document.body.appendChild(backdrop);
            document.body.appendChild(previewContainer);
        }
        
        // Get the preview content element
        const previewContentElement = previewContainer.querySelector('.preview-content');
        
        // Add email preview structure
        const subject = document.getElementById('subject').value || 'No Subject';
        
        previewContentElement.innerHTML = `
            <div class="email-preview">
                <div class="email-preview-header">
                    <h3>${subject}</h3>
                </div>
                <div class="email-preview-body">
                    ${content}
                </div>
            </div>
        `;
        
        // Show the preview
        document.body.classList.add('preview-open');
        
        function closePreview() {
            document.body.removeChild(previewContainer);
            const backdrop = document.querySelector('.preview-backdrop');
            if (backdrop) document.body.removeChild(backdrop);
            document.body.classList.remove('preview-open');
        }
    };
    
    // Initialize with text format
    updateBodyTextarea('text');
    
    // Add format indicator near the textarea
    const tabList = document.getElementById('editorTabs');
    if (tabList) {
        const formatIndicator = document.createElement('span');
        formatIndicator.id = 'format-indicator';
        formatIndicator.className = 'format-badge';
        formatIndicator.textContent = 'Text';
        
        // Insert after the tab list
        tabList.parentNode.insertBefore(formatIndicator, tabList.nextSibling);
    }
}

// Format tabs and preview functionality
function initializeFormatTabs() {
    const editorTabs = document.querySelectorAll('#editorTabs button');
    const messageBody = document.getElementById('messageBody');
    const bodyType = document.getElementById('bodyType');
    const formatIndicator = document.getElementById('formatIndicator');
    const previewButton = document.getElementById('previewButton');

    // Set up tab switching
    editorTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            editorTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Update the hidden input with the selected format
            const format = tab.getAttribute('data-type');
            bodyType.value = format;
            
            // Update format indicator
            formatIndicator.textContent = format.charAt(0).toUpperCase() + format.slice(1);
            
            // Change placeholder based on format
            switch(format) {
                case 'html':
                    messageBody.placeholder = 'Write your email as HTML...';
                    break;
                case 'markdown':
                    messageBody.placeholder = 'Write your email as Markdown...';
                    break;
                default:
                    messageBody.placeholder = 'Write your email content here...';
            }
        });
    });

    // Set up preview functionality
    if (previewButton) {
        previewButton.addEventListener('click', () => {
            const format = bodyType.value;
            const content = messageBody.value;
            
            if (!content.trim()) {
                showStatus('No content to preview', true);
                return;
            }
            
            // Create or get preview container
            let previewContainer = document.getElementById('previewContainer');
            
            if (!previewContainer) {
                previewContainer = document.createElement('div');
                previewContainer.id = 'previewContainer';
                previewContainer.className = 'preview-overlay';
                
                const previewContent = document.createElement('div');
                previewContent.className = 'preview-content';
                
                const closeButton = document.createElement('button');
                closeButton.innerHTML = '&times;';
                closeButton.className = 'preview-close';
                closeButton.addEventListener('click', () => {
                    previewContainer.style.display = 'none';
                });
                
                const previewHeader = document.createElement('div');
                previewHeader.className = 'preview-header';
                previewHeader.innerHTML = '<h4>Message Preview</h4>';
                previewHeader.appendChild(closeButton);
                
                const previewBody = document.createElement('div');
                previewBody.className = 'preview-body';
                previewBody.id = 'previewBody';
                
                previewContent.appendChild(previewHeader);
                previewContent.appendChild(previewBody);
                previewContainer.appendChild(previewContent);
                document.body.appendChild(previewContainer);
            }
            
            // Get preview body
            const previewBody = document.getElementById('previewBody');
            
            // Format content based on the selected format
            let formattedContent = content;
            
            if (format === 'html') {
                // HTML content is displayed as is
                formattedContent = content;
            } else if (format === 'markdown') {
                // Check if marked library is available
                if (typeof marked !== 'undefined') {
                    formattedContent = marked.parse(content);
                } else {
                    formattedContent = `<pre>${content}</pre>`;
                    showStatus('Markdown library not loaded. Showing raw content.', true);
                }
            } else {
                // Plain text - escape HTML and preserve line breaks
                formattedContent = content
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>');
            }
            
            // Set the content
            previewBody.innerHTML = formattedContent;
            
            // Show the preview
            previewContainer.style.display = 'flex';
        });
    }
}

// Add CSS for preview overlay
function addPreviewStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .format-badge {
            position: absolute;
            right: 100px;
            top: 8px;
            background: #6c757d;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8rem;
        }
        
        .preview-button {
            position: absolute;
            right: 10px;
            top: 5px;
            z-index: 10;
        }
        
        .preview-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1050;
            justify-content: center;
            align-items: center;
        }
        
        .preview-content {
            background: white;
            border-radius: 8px;
            width: 80%;
            max-width: 800px;
            max-height: 90vh;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .preview-header {
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .preview-header h4 {
            margin: 0;
        }
        
        .preview-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6c757d;
        }
        
        .preview-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }
    `;
    document.head.appendChild(style);
}

