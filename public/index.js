var activeTab = 'text';

function setActiveTab(tab) {
    activeTab = tab;
}

function displayPreview() {
    var userInput;
    if (activeTab === 'text') {
        userInput = document.getElementById('tbody').value;
    } else if (activeTab === 'html') {
        userInput = document.getElementById('htmlB').value;
    } else if (activeTab === 'markdown') {
        userInput = document.getElementById('mdB').value;
    }

    var previewArea = document.getElementById('previewWork');
    previewArea.classList.toggle('hide');
    previewArea.innerHTML = userInput;
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

document.getElementById("tbody").addEventListener("input", function() {
  adjustTextareaHeight("tbody");
});

document.getElementById("htmlB").addEventListener("input", function() {
  adjustTextareaHeight("htmlB");
});

document.getElementById("mdB").addEventListener("input", function() {
  adjustTextareaHeight("mdB");
});


document.getElementById("CC_Bcc").addEventListener("change", toggleCcBcc);
document.getElementById("ReplyTo").addEventListener("change", toggleReplyTo);

function populateLineNumbers(textareaId, lineNumbersClass) {
    var textarea = document.getElementById(textareaId);
    var lineNumbers = "";
    var lines = textarea.value.split("\n").length;
    for (var i = 1; i <= lines; i++) {
        lineNumbers += i + "\n";
    }
    document.querySelector("." + lineNumbersClass).innerText = lineNumbers;
}

function populateAllLineNumbers() {
    populateLineNumbers("tbody", "line-numbers");
    populateLineNumbers("htmlB", "html-line-numbers");
    populateLineNumbers("mdB", "markdown-line-numbers");
}

populateAllLineNumbers();

document.getElementById("tbody").addEventListener("input", populateAllLineNumbers);
document.getElementById("htmlB").addEventListener("input", populateAllLineNumbers);
document.getElementById("mdB").addEventListener("input", populateAllLineNumbers);

document.addEventListener("DOMContentLoaded", function() {
    var toField = document.getElementById('to');
    var subjectField = document.getElementById('subject');
    var sendButton = document.getElementById('sendButton');

    toField.addEventListener('input', toggleSendButton);
    subjectField.addEventListener('input', toggleSendButton);

    function toggleSendButton() {
        if (toField.value.trim() !== '' && subjectField.value.trim() !== '') {
            sendButton.disabled = false;
            sendButton.classList.remove('btn-light');
            sendButton.classList.add('btn-primary');
        } else {
            sendButton.disabled = true;
            sendButton.classList.remove('btn-primary');
            sendButton.classList.add('btn-light');
        }
    }

    // Format and spell check buttons
    const formatTextBtn = document.getElementById('formatText');
    if (formatTextBtn) {
        formatTextBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent form submission
            const textArea = document.getElementById('tbody');
            if (textArea.value.trim() !== '') {
                // Add proper spacing and format
                const formattedText = textArea.value
                    .replace(/([.!?])\s*(?=[A-Z])/g, "$1\n\n")
                    .replace(/^(Dear|Hello|Hi)(.+)$/m, "$1$2,\n\n")
                    .replace(/^(Sincerely|Best|Regards|Thanks)(.*)$/m, "\n$1$2");

                textArea.value = formattedText;
                adjustTextareaHeight("tbody");

                // Show toast notification
                toast("Text formatted!", "info");
            }
        });
    }
    
    const spellCheckButton = document.getElementById('spellCheck');
    if (spellCheckButton) {
        spellCheckButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent form submission
            spellCheck();
        });
    }
});

function submitForm(event) {
    event.preventDefault();
    document.getElementById("loader-overlay").style.display = "flex";

    const formData = new FormData(document.getElementById("emailForm"));

    fetch('/send-email', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                console.log('Email sent successfully!');
                document.getElementById("loader-overlay").style.display = "none";
                document.getElementById("emailForm").reset();

            } else {
                throw new Error('Failed to send email: ' + response.statusText);
            }
        })
        .catch(error => {
            console.error('Error sending email:', error);
            document.getElementById("loader-overlay").style.display = "none";
        });
}

function spellCheck() {
    const textArea = document.getElementById('tbody');
    if (!textArea || textArea.value.trim() === '') return;
    
    // Prevent form submission
    event.preventDefault();
    
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
