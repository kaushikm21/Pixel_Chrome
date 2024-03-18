// popup.js

// Function to initialize the popup with the saved authentication code
function initializePopup() {
    chrome.storage.sync.get('authCode', (result) => {
        const savedAuthCode = result.authCode;

        if (savedAuthCode) {
            // If an authentication code is saved, set it in the input field
            document.getElementById('authCodeInput').value = savedAuthCode;
            // Disable the input and save button since auth code is already available
            document.getElementById('authCodeInput').disabled = true;
            document.getElementById('saveAuthCodeButton').disabled = true;
        }
    });
}

// Function to show/hide the settings screen
function toggleSettingsScreen() {
    console.log('Toggling settings screen');  // Add this line
    const settingsScreen = document.getElementById('settingsScreen');
    settingsScreen.style.display = settingsScreen.style.display === 'none' ? 'block' : 'none';
}

// Event listener for the "Settings" link
document.getElementById('settingsLink').addEventListener('click', toggleSettingsScreen);

// Function to remove the Auth Code from chrome.storage.sync
function removeAuthCode() {
    chrome.storage.sync.remove('authCode', () => {
        console.log('Authentication code removed.');
        alert('Authentication code removed successfully.');
        initializePopup(); // Initialize the popup after removing the auth code
    });
}

// Event listener to remove the Auth Code
document.getElementById('removeAuthCodeButton').addEventListener('click', () => {
    removeAuthCode();
});

// Function to display CDN URL and copy button
function showCdnUrl(imageUrl) {
    const cdnUrlContainer = document.getElementById('cdnUrlContainer');
    const cdnUrlDisplay = document.getElementById('cdnUrlDisplay');
    const copyCdnUrlButton = document.getElementById('copyCdnUrlButton');

    cdnUrlDisplay.value = imageUrl;
    cdnUrlContainer.style.display = 'block';

    // Display the "Copy" button
    copyCdnUrlButton.style.display = 'inline-block';

    // Event listener for the "Copy" button
    copyCdnUrlButton.addEventListener('click', () => {
        cdnUrlDisplay.select();
        document.execCommand('copy');
        alert('CDN URL copied to clipboard!');
    });
}

// Event listener for the "Preview" button
document.getElementById('previewButton').addEventListener('click', function previewButtonClick() {
    const imageUrl = document.getElementById('uploadedImage').src;
    showCdnUrl(imageUrl);

    // Remove the existing event listener before adding a new one
    document.getElementById('previewButton').removeEventListener('click', previewButtonClick);
});

// Event listener for the "Upload" button
document.getElementById('uploadButton').addEventListener('click', () => {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    const authCodeInput = document.getElementById('authCodeInput');

    if (file && (authCodeInput.value.trim() !== '' || !authCodeInput.disabled)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        fetch('https://api.perceptpixel.com/media/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Api-Key ${authCodeInput.value.trim()}`
            },
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                console.log('Upload response:', data);
                if (data.cdn_url || data.thumbnail_url) {
                    const imageThumbnailUrl = data.thumbnail_url;
                    const imageUrl = data.cdn_url;
                    const previewButton = document.getElementById('previewButton');
                    previewButton.style.display = 'inline-block';

                    previewButton.onclick = () => {
                        document.getElementById('uploadedImage').src = imageThumbnailUrl;
                        document.getElementById('uploadedImage').style.display = 'block';
                        showCdnUrl(imageUrl); // Show CDN URL on preview click
                    };
                } else {
                    alert('Upload failed.');
                }
            })
            .catch(error => {
                console.error('Error uploading image:', error);
                alert('Upload failed!');
            });
    } else {
        alert('Please select an image and enter a valid authentication code.');
    }
});


// Event listener to save the authentication code to chrome.storage.sync
document.getElementById('saveAuthCodeButton').addEventListener('click', () => {
    const authCodeInput = document.getElementById('authCodeInput');
    const authCode = authCodeInput.value.trim();

    if (authCode !== '') {
        chrome.storage.sync.set({ 'authCode': authCode }, () => {
            console.log('Authentication code saved:', authCode);
            alert('Authentication code saved successfully.');
            // Disable the input and save button since auth code is now available
            authCodeInput.disabled = true;
            document.getElementById('saveAuthCodeButton').disabled = true;
        });
    } else {
        alert('Please enter a valid authentication code.');
    }
});

// Event listener to retrieve the authentication code from chrome.storage.sync
document.getElementById('retrieveAuthCodeButton').addEventListener('click', () => {
    chrome.storage.sync.get('authCode', (result) => {
        const savedAuthCode = result.authCode;

        if (savedAuthCode) {
            alert(`Saved Authentication Code: ${savedAuthCode}`);
        } else {
            alert('No authentication code found. Please save one.');
        }
    });
});

// Initialize the popup
initializePopup();