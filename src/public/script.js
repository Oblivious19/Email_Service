// Loader Control Functions
function showLoader(loaderId = 'mainLoader') {
    document.getElementById(loaderId).classList.add('show');
}

function hideLoader(loaderId = 'mainLoader') {
    document.getElementById(loaderId).classList.remove('show');
}

// Show main loader when page loads
document.addEventListener('DOMContentLoaded', () => {
    showLoader();
    // Simulate loading time (remove this in production)
    setTimeout(() => hideLoader(), 1000);
});

// Show upload loader when files are being uploaded
document.querySelector('input[type="file"]')?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        showLoader('uploadLoader');
        // Simulate upload time (replace with actual upload logic)
        setTimeout(() => hideLoader('uploadLoader'), 2000);
    }
});

// Show sending loader when email is being sent
document.addEventListener('DOMContentLoaded', function() {
    const emailForm = document.getElementById('emailForm');
    const toInput = document.getElementById('to');
    const subjectInput = document.getElementById('subject');
    const emailBodyInput = document.getElementById('emailBody');
    const sendButton = document.querySelector('.btn-primary');
    
    // Show status message
    function showStatus(message, isError = false) {
        let statusDiv = document.getElementById('status');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'status';
            emailForm.appendChild(statusDiv);
        }

        statusDiv.innerHTML = `<div class="alert alert-${isError ? 'danger' : 'success'}">${message}</div>`;
        
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    }

    // Validate email format
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    // Show loader
    function showLoader() {
        document.getElementById('sendingLoader').classList.add('show');
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }
    }

    // Hide loader
    function hideLoader() {
        document.getElementById('sendingLoader').classList.remove('show');
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Email';
        }
    }

    // Handle form submission
    async function handleSubmit(event) {
        event.preventDefault();
        
        // Get form values
        const to = toInput.value.trim();
        const subject = subjectInput.value.trim();
        const body = emailBodyInput.value.trim();

        // Validate form
        if (!to || !subject || !body) {
            showStatus('Please fill in all required fields', true);
            return;
        }

        if (!validateEmail(to)) {
            showStatus('Please enter a valid email address', true);
            return;
        }

        // Show loader
        showLoader();

        try {
            // Prepare the request data
            const formData = {
                to: to,
                subject: subject,
                tbody: body,
                provider: 'gmail' // Default to Gmail provider
            };

            // Send the request
            const response = await fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            let data;
            try {
                data = await response.json();
            } catch (error) {
                throw new Error('Invalid server response');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send email');
            }

            // Show success message
            showStatus('Email sent successfully!');
            
            // Clear form
            emailForm.reset();

        } catch (error) {
            console.error('Error sending email:', error);
            showStatus(error.message || 'Failed to send email', true);
        } finally {
            hideLoader();
        }
    }

    // Add form event listeners
    if (emailForm) {
        emailForm.addEventListener('submit', handleSubmit);
    }

    // Add input validation listeners
    if (sendButton) {
        function toggleSendButton() {
            const isValid = toInput.value.trim() && 
                          subjectInput.value.trim() && 
                          emailBodyInput.value.trim();
            sendButton.disabled = !isValid;
        }

        toInput.addEventListener('input', toggleSendButton);
        subjectInput.addEventListener('input', toggleSendButton);
        emailBodyInput.addEventListener('input', toggleSendButton);

        // Initial button state
        toggleSendButton();
    }
});

// Preview functionality
function previewEmail() {
    const to = document.getElementById('to').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const body = document.getElementById('emailBody').value.trim();
    
    const previewContent = document.getElementById('previewContent');
    const previewModal = document.getElementById('previewWork');
    
    // Create preview HTML
    let previewHTML = `
        <div class="preview-section">
            <strong>To:</strong> ${to || '<em>Not specified</em>'}
        </div>
        <div class="preview-section">
            <strong>Subject:</strong> ${subject || '<em>Not specified</em>'}
        </div>
        <div class="preview-section">
            <strong>Message:</strong><br>
            <div class="preview-body">
                ${body || '<em>No content</em>'}
            </div>
        </div>
    `;
    
    previewContent.innerHTML = previewHTML;
    previewModal.classList.add('show');
}

function closePreview() {
    const previewModal = document.getElementById('previewWork');
    previewModal.classList.remove('show');
} 