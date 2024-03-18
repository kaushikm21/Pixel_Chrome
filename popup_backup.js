
function initializePopup() {
    chrome.storage.sync.get('authCode', (result) => {
        const savedAuthCode = result.authCode;

        if (savedAuthCode) {
            // If an authentication code is saved, set it in the input field
            document.getElementById('authCodeInput').value = savedAuthCode;
            // Disable the input and save button since auth code is already available
            document.getElementById('authCodeInput').disabled = true;
            document.getElementById('saveAuthCodeButton').disabled = true;
        } else {
            // If no authentication code is found, prompt the user to enter it
            showAuthCodePrompt();
        }
    });
}


// Function to show a blocking overlay and prompt the user to enter the authentication code
function showAuthCodePrompt() {
    const authCodeInput = document.getElementById('authCodeInput');
    const saveAuthCodeButton = document.getElementById('saveAuthCodeButton');
    const settingsLink = document.getElementById('settingsLink');

    // Disable all buttons and input fields
    authCodeInput.disabled = true;
    saveAuthCodeButton.disabled = true;
    settingsLink.style.pointerEvents = 'none';

    // Obtain the popup container
    const popupContainer = document.getElementById('popupContainer');

    if (!popupContainer) {
        console.error('Popup container not found.');
        return;
    }

    // Create a blocking overlay
    const blockingOverlay = document.createElement('div');
    blockingOverlay.id = 'blockingOverlay';

    // Style the overlay to cover the entire popup
    blockingOverlay.style.position = 'absolute';
    blockingOverlay.style.top = '0';
    blockingOverlay.style.left = '0';
    blockingOverlay.style.width = '100%';
    blockingOverlay.style.height = '100%';
    blockingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

    // Create a blocking window
    const blockingWindow = document.createElement('div');
    blockingWindow.id = 'blockingWindow';
    blockingWindow.innerHTML = `
        <p>Authentication code is required to use the extension.</p>
        <input type="text" id="blockingAuthCodeInput" placeholder="Enter Authentication Code">
        <button id="blockingSaveAuthCodeButton">Save Auth</button>
    `;

    // Position the blocking window in the center
    blockingWindow.style.position = 'absolute';
    blockingWindow.style.top = '50%';
    blockingWindow.style.left = '50%';
    blockingWindow.style.transform = 'translate(-50%, -50%)';
    blockingWindow.style.backgroundColor = '#fff';
    blockingWindow.style.padding = '20px';
    blockingWindow.style.borderRadius = '10px';

    // Append the blocking window to the overlay
    blockingOverlay.appendChild(blockingWindow);

    // Append the overlay to the popup container
    popupContainer.appendChild(blockingOverlay);

    // Focus on the input field in the blocking window
    const blockingAuthCodeInput = document.getElementById('blockingAuthCodeInput');
    blockingAuthCodeInput.focus();

    // Event listener for the "Save Auth" button in the blocking window
    const blockingSaveAuthCodeButton = document.getElementById('blockingSaveAuthCodeButton');
    blockingSaveAuthCodeButton.addEventListener('click', () => {
        const enteredAuthCode = blockingAuthCodeInput.value.trim();
        if (enteredAuthCode !== '') {
            // Save the entered authentication code
            chrome.storage.sync.set({ 'authCode': enteredAuthCode }, () => {
                console.log('Authentication code saved:', enteredAuthCode);
                alert('Authentication code saved successfully.');
                // Remove the blocking overlay and enable all buttons and input fields
                popupContainer.removeChild(blockingOverlay);
                authCodeInput.value = enteredAuthCode;
                authCodeInput.disabled = true;
                saveAuthCodeButton.disabled = true;
                settingsLink.style.pointerEvents = 'auto';
            });
        } else {
            alert('Please enter a valid authentication code.');
        }
    });
}


// Function to show/hide the settings screen
function toggleSettingsScreen() {
    console.log('Toggling settings screen');
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

// Declare a variable to store the thumbnail URL
let thumbnailUrl;

// Event listener for the "Preview" button
document.getElementById('previewButton').addEventListener('click', function previewButtonClick() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    const authCodeInput = document.getElementById('authCodeInput');
    if (file && (authCodeInput.value.trim() !== ''|| !authCodeInput.disabled)) {
        chrome.runtime.sendMessage({
            action: 'uploadImage',
            file: file,
            authCode: authCodeInput.value.trim()
        }, (response) => {
            if (response && response.data) {
                // Store the thumbnail URL
                thumbnailUrl = response.data.thumbnail_url;

                // Show CDN URL on successful upload
                showCdnUrl(response.data.cdn_url);

                const previewButton = document.getElementById('previewButton');
                //previewButton.style.display = 'inline-block';
            } else {
                alert('Upload failed.');
            }
        });
    } else {
        alert('Please select an image and enter a valid authentication code.');
    }
});

// Event listener for the "Preview" button click
document.getElementById('previewButton').addEventListener('click', function previewImageClick() {
    if (thumbnailUrl) {
        // Display the stored thumbnail URL when the preview button is clicked
        document.getElementById('uploadedImage').src = thumbnailUrl;
        document.getElementById('uploadedImage').style.display = 'block';
    } else {
        alert('Thumbnail URL not available. Please upload an image first.');
    }
});


// Event listener for the "Upload" button
document.getElementById('uploadButton').addEventListener('click', () => {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    const authCodeInput = document.getElementById('authCodeInput');
    const spinnerContainer = document.getElementById('spinner-container');
    const imageListContainer = document.getElementById('imageListContainer');

    console.log("authCodeInput" + authCodeInput.value);
    if (file && (authCodeInput.value.trim() !== '')) {
        // Clear existing image list
        clearImageList();

        // Show the spinner while the upload is in progress
        spinnerContainer.style.display = 'block';

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
                    // previewButton.style.display = 'inline-block';

                    document.getElementById('uploadedImage').src = imageThumbnailUrl;
                    document.getElementById('uploadedImage').style.display = 'block';
                    showCdnUrl(imageUrl); // Show CDN URL on upload success
                } else {
                    alert('Upload failed.');
                }
            })
            .catch(error => {
                console.error('Error uploading image:', error);
                alert('Upload failed!');
            })
            .finally(() => {
                // Hide the spinner once the upload is complete (either success or failure)
                spinnerContainer.style.display = 'none';
            });
    } else {
        alert('Please go to the settings and save a valid authentication code.');
    }
});

// Function to clear the existing image list
function clearImageList() {
    const imageListContainer = document.getElementById('imageListContainer');
    const imageList = document.getElementById('imageList');

    // Hide the image list container
    imageListContainer.style.display = 'none';

    // Remove all child elements from the image list
    while (imageList.firstChild) {
        imageList.removeChild(imageList.firstChild);
    }
}
let offset = 10; // Initial offset for pagination
let listImagesClicked = false; // Flag to track if "List Images" button has been clicked
let scrollCounter = 0; // Counter for scroll events

// Event listener for the "List Images" button
document.getElementById('listImagesButton').addEventListener('click', listImages);
listImagesClicked = true;

// Function to list images from the CDN
function listImages() {
    const authCodeInput = document.getElementById('authCodeInput');

    if (authCodeInput.value.trim() !== '' || !authCodeInput.disabled) {
        fetch('https://api.perceptpixel.com/v1/media', {
            method: 'GET',
            headers: {
                'Authorization': `Api-Key ${authCodeInput.value.trim()}`
            }
        })
            .then(response => response.json())
            .then(data => {
                // Clear existing image list before displaying the new list
                clearImageList();

                // Display the list of images
                displayImageList(data);
            })
            .catch(error => {
                console.error('Error fetching image list:', error);
                alert('Failed to fetch image list.');
            });
    } else {
        alert('Please enter a valid authentication code.');
    }
}

// Function to display the list of images
const initialImagesUrl = 'https://api.perceptpixel.com/v1/media';
const loadMoreImagesUrl = 'https://api.perceptpixel.com/v1/media?limit=10&offset=';

function displayImageList(response) {
    const imageListContainer = document.getElementById('imageListContainer');
    const imageList = document.getElementById('imageList');

    // Log the entire API response
    console.log('API Response:', response);

    // Check if results property exists and is an array
    if (response.results && Array.isArray(response.results)) {
        // Display each image in the list
        response.results.forEach(image => {
            const listItem = document.createElement('li');

            // Add thumbnail URL
            if (image.thumbnail_url) {
                const thumbnailImage = document.createElement('img');
                thumbnailImage.src = image.thumbnail_url;
                thumbnailImage.alt = 'Thumbnail';
                thumbnailImage.style.maxWidth = '100px'; // Set max width for the thumbnail
                listItem.appendChild(thumbnailImage);
            }

            // Add CDN URL
            if (image.cdn_url) {
                const cdnUrlDisplay = document.createElement('input');
                cdnUrlDisplay.type = 'text';
                cdnUrlDisplay.value = image.cdn_url;
                cdnUrlDisplay.readOnly = true;
                listItem.appendChild(cdnUrlDisplay);

                // Add Copy button
                const copyCdnUrlButton = document.createElement('button');
                copyCdnUrlButton.textContent = 'Copy CDN URL';
                copyCdnUrlButton.addEventListener('click', () => {
                    cdnUrlDisplay.select();
                    document.execCommand('copy');
                    alert('CDN URL copied to clipboard!');
                });
                listItem.appendChild(copyCdnUrlButton);

                // Add Embed button
                const embedButton = document.createElement('button');
                embedButton.textContent = 'Embed';
                embedButton.addEventListener('click', () => {
                    // You can customize the embed code generation based on your requirements
                    const embedCode = `<img src="${image.cdn_url}" alt="Embedded Image">`;
                    alert('Embed code copied to clipboard:\n\n' + embedCode);
                });
                listItem.appendChild(embedButton);
            }

            imageList.appendChild(listItem);
        });
    } else {
        // If results is not an array, display a message indicating an unexpected response
        const listItem = document.createElement('li');
        listItem.textContent = 'Unexpected response format. Unable to display image list.';
        imageList.appendChild(listItem);
    }

    // Show the image list container
    imageListContainer.style.display = 'block';
}

// Event listener for scroll
window.addEventListener('scroll', () => {
    // Check if the user has scrolled to the bottom of the page
    console.log("listImagesClicked="+listImagesClicked);
    if (listImagesClicked && window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        // Increment the scroll counter
        scrollCounter++;

        // Load more images only after the user has scrolled twice
        console.log("scrollCounter="+scrollCounter);
        if (scrollCounter >= 2) {
            // Load more images
            fetch(loadMoreImagesUrl + offset)
                .then(response => response.json())
                .then(data => displayImageList(data))
                .catch(error => console.error('Error fetching more images:', error));

            offset += 10; // Increment the offset for the next set of images
        }
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
setTimeout(() => {
    initializePopup();
}, 1000);