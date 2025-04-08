// Simple email form handler without dependencies
document.addEventListener('DOMContentLoaded', function() {
  // Get form elements
  const emailForm = document.getElementById('emailForm');
  const statusDiv = document.getElementById('status');
  const sendButton = document.getElementById('sendButton');
  
  // Handle form submission
  if (emailForm) {
    emailForm.addEventListener('submit', handleSubmit);
  }
  
  // Show status message
  function showStatus(message, isError = false) {
    if (!statusDiv) return;
    
    statusDiv.textContent = message;
    statusDiv.className = isError ? 'error' : 'success';
    statusDiv.classList.remove('hidden');
    
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 8000);
  }
  
  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();
    
    console.log('Handling submit');
    
    // Get form data
    const formData = new FormData(emailForm);
    const to = formData.get('to');
    const subject = formData.get('subject');
    const message = formData.get('tbody');
    const attachments = document.getElementById('attachments').files;
    
    // Validate form
    if (!to || !subject || !message) {
      showStatus('Please fill out all required fields', true);
      return;
    }
    
    // Show sending status
    if (sendButton) {
      sendButton.disabled = true;
      sendButton.textContent = 'Sending...';
    }
    
    // Display submit details for debugging
    console.log({
      to,
      subject,
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
      
      const responseText = await response.text();
      console.log('Raw server response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed server response:', data);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        showStatus('Invalid server response', true);
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Server error');
      }
      
      showStatus('Email sent successfully!');
      emailForm.reset();
    } catch (error) {
      console.error('Form submission error:', error);
      showStatus(`Error: ${error.message || 'Unknown error'}`, true);
    } finally {
      if (sendButton) {
        sendButton.disabled = false;
        sendButton.textContent = 'Send Email';
      }
      console.log('Submission complete');
    }
  }
}); 