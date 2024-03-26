
function initializePopup() {
    chrome.storage.sync.get('authCode', (result) => {
        const savedAuthCode = result.authCode;
        const spinnerContainer = document.getElementById('spinner-container');
        spinnerContainer.style.display='none';

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
    <p>
        <img src="images/pixel_logo.png" alt="percept pixel" width="200" height="30">
        <br>
        <br>
        <b>Authentication key required.</b> 
        <br>
        <h4 style="color: #616161">Get it from https://perceptpixel.com >  Settings > Key</h4> 
    </p>
    <input type="text" id="blockingAuthCodeInput" placeholder="Enter Authentication Code" > <br><br>
    <image id="blockingSaveAuthCodeButton" src="images/save_auth.png" width="324px" height="50px"/>
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


function toggleSettingsScreen() {
    const settingsScreen = document.getElementById('settingsScreen');
    settingsScreen.style.display = settingsScreen.style.display === 'none' ? 'block' : 'none';
}

// Event listener for the "Settings" link
document.getElementById('settingsLink').addEventListener('click', toggleSettingsScreen);


document.addEventListener('DOMContentLoaded', function() {
    var openPerceptLink = document.getElementById('openPerceptLink');
    if (openPerceptLink) {
        openPerceptLink.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent the default link behavior
            console.log("coming here");
            chrome.tabs.create({ url: "https://perceptpixel.com/" });
        });
    }
});


function removeAuthCode() {
    chrome.storage.sync.remove('authCode', () => {
        console.log('Authentication code removed.');
        alert('Authentication code removed successfully.');
        initializePopup(); // Initialize the popup after removing the auth code
    });
}


document.getElementById('removeAuthCodeButton').addEventListener('click', () => {
    removeAuthCode();
});


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


let thumbnailUrl;





document.getElementById('uploadButton').addEventListener('click', () => {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    const authCodeInput = document.getElementById('authCodeInput');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');
    const spinnerContainer = document.getElementById('spinner-container');

    if (file && authCodeInput.value.trim() !== '') {
        // Show the spinner while the upload is in progress
        spinnerContainer.style.display = 'block';

        // Show the progress bar container
        progressBarContainer.style.display = 'block';
        progressBar.style.width = '0%'; // Reset progress bar width

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.perceptpixel.com/media/upload', true);

        xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
                uploadButton.style.display='none';
                const progressPercent = (event.loaded / event.total) * 100;
                progressBar.style.width = progressPercent + '%';
                progressBar.textContent = Math.round(progressPercent) + '%'; // If you want text inside the progress bar
            }
        };

        xhr.onload = function() {
            // Hide the spinner and the progress bar once the upload is complete
            spinnerContainer.style.display = 'none';
            progressBarContainer.style.display = 'none';

            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                // Display the uploaded image and CDN URL
                displayUploadedImage(response.thumbnail_url);
                showCdnUrl(response.cdn_url);
                uploadButton.style.display='block';

            } else {
                // Handle non-200 responses
                alert('Upload failed with status: ' + xhr.status);
                uploadButton.style.display='block';

            }
        };

        xhr.onerror = function() {
            alert('Upload failed. Please check your connection and try again.');
            // Hide the spinner and the progress bar if there is an error
            spinnerContainer.style.display = 'none';
            progressBarContainer.style.display = 'none';
        };

        xhr.setRequestHeader('Authorization', `Api-Key ${authCodeInput.value.trim()}`);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        xhr.send(formData);
    } else {
        alert('Please select a file and enter your authentication code.');
    }
});

function displayUploadedImage(thumbnailUrl) {
    const uploadedImage = document.getElementById('uploadedImage');
    const uploadButtonImg = document.getElementById('uploadButton');
    uploadedImage.src = thumbnailUrl;
    uploadedImage.style.display = 'block';
    uploadedImage.style.borderRadius='10%';

    uploadedImage.parentNode.insertBefore(uploadButtonImg, uploadedImage.nextSibling);
    uploadButtonImg.src = 'images/upload_another.png';
}

function showCdnUrl(cdnUrl) {
    const cdnUrlContainer = document.getElementById('cdnUrlContainer');
    const cdnUrlDisplay = document.getElementById('cdnUrlDisplay');
    const copyCdnUrlButton = document.getElementById('copyCdnUrlButton');

    cdnUrlDisplay.value = cdnUrl;
    cdnUrlContainer.style.display = 'block';

    copyCdnUrlButton.onclick = function() {
        cdnUrlDisplay.select();
        document.execCommand('copy');
        alert('CDN URL copied to clipboard!');
    };
}




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
document.getElementById('back_arrow').addEventListener('click', backClicked);

function backClicked() {
    clearImageList();
    const imageSelect = document.getElementById('imageSelect');
    const imageBack = document.getElementById('back_arrow');
    const imageBlank = document.getElementById('blank');
    const searchBar = document.getElementById('searchBar');
    const settingsScreen = document.getElementById('settingsScreen')
    imageBlank.style.visibility='visible';
    imageBack.style.visibility='hidden';
    imageBack.style.alignSelf='left';
    imageSelect.style.display='block';
    uploadButton.style.display='block';
    searchBar.style.display='none';
    settingsScreen.style.display='none';


}

let offset = 10;
let listImagesClicked = false;
let scrollCounter = 0;

// Event listener for the "Search Images"
document.getElementById('searchButton').addEventListener('click', showSearchBox);

function showSearchBox(){
    const imageSelect = document.getElementById('imageSelect');
    const imageBack = document.getElementById('back_arrow');
    const imageBlank = document.getElementById('blank');
    var fileNameDisplay = document.getElementById('fileName');
    const searchBar = document.getElementById('searchBar');
    const settingsScreen = document.getElementById('settingsScreen')

    imageBlank.style.visibility='hidden';
    imageBack.style.visibility='visible';
    imageBack.style.alignSelf='left';
    imageSelect.style.display='none';
    uploadButton.style.display='none';
    uploadedImage.style.display='none';
    cdnUrlContainer.style.display = 'none';
    cdnUrlContainer.style.display='none';
    fileNameDisplay.textContent='';
    searchBar.style.display='block';
    settingsScreen.style.display='none';

}
//Event listener for search enter
document.getElementById('searchBar').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const settingsScreen = document.getElementById('settingsScreen');
        settingsScreen.style.display='none';
        const authCodeInput = document.getElementById('authCodeInput');
        // Prevent default action to avoid any form submission or other unwanted behavior
        event.preventDefault();
        console.log('Enter key was pressed in the input field');
        clearImageList();
        const spinnerContainer = document.getElementById('spinner-container');
        spinnerContainer.style.display = 'block';


        const query = encodeURIComponent(this.value);
        const url = `https://api.perceptpixel.com/v1/media?query=${query}`;

        // Perform the API call
        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Api-Key ${authCodeInput.value.trim()}`,
                'Content-Type': 'application/json'
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {

                displayImageList(data);
                spinnerContainer.style.display = 'none';

            })
            .catch(error => {
                console.error('Error fetching search results:', error);
                spinnerContainer.style.display = 'none';

            });
    }
});

//Event listener for list images
document.getElementById('listImagesButton').addEventListener('click', listImages);
listImagesClicked = true;


function listImages() {
    const authCodeInput = document.getElementById('authCodeInput');
    const imageSelect = document.getElementById('imageSelect');
    const imageBack = document.getElementById('back_arrow');
    const imageBlank = document.getElementById('blank');
    var fileNameDisplay = document.getElementById('fileName');
    const spinnerContainer = document.getElementById('spinner-container');
    const settingsScreen = document.getElementById('settingsScreen')
    const searchBar = document.getElementById('searchBar');
    spinnerContainer.style.display = 'block';
    imageBlank.style.visibility='hidden';
    imageBack.style.visibility='visible';
    imageBack.style.alignSelf='left';
    imageSelect.style.display='none';
    uploadButton.style.display='none';
    uploadedImage.style.display='none';
    cdnUrlContainer.style.display = 'none';
    cdnUrlContainer.style.display='none';
    settingsScreen.style.display='none';
    fileNameDisplay.textContent='';
    spinnerContainer.style.display='block';
    searchBar.style.display='block';
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
                spinnerContainer.style.display='none';

            })
            .catch(error => {
                console.error('Error fetching image list:', error);
                alert('Failed to fetch image list.');
                spinnerContainer.style.display='none';

            });
    } else {
        alert('Please enter a valid authentication code.');
        spinnerContainer.style.display='none';

    }
}

// Function to display the list of images
const initialImagesUrl = 'https://api.perceptpixel.com/v1/media';
const loadMoreImagesUrl = 'https://api.perceptpixel.com/v1/media?limit=10&offset=';

function displayImageList(response) {
    const imageListContainer = document.getElementById('imageListContainer');
    const imageList = document.getElementById('imageList');
var iNumResults = 0;
    // Log the entire API response
    if (response.results && Array.isArray(response.results)) {
        response.results.forEach(image => {
            iNumResults++;
            const listItem = document.createElement('li');
            listItem.style.display = 'flex';
            listItem.style.alignItems = 'center';
            listItem.style.gap = '10px';
            listItem.style.paddingBottom = '15px';
            listItem.style.paddingRight = '20px';

            const imgID = document.createElement("input");
            imgID.value = image.uid;
            const imageUid = image.uid; // Adjust according to your actual data structure
            // Add thumbnail URL
            if (image.thumbnail_url) {
                const thumbnailImage = document.createElement('img');
                thumbnailImage.src = image.thumbnail_url;
                thumbnailImage.alt = 'Thumbnail';
                thumbnailImage.style.borderRadius = '10%';
                thumbnailImage.style.maxWidth = '80px';
                listItem.appendChild(thumbnailImage);
            }

            // Add CDN URL
            if (image.cdn_url) {
                const cdnUrlDisplay = document.createElement('input');
                cdnUrlDisplay.type = 'text';
                cdnUrlDisplay.id='cdnListUrlDisplay';
                cdnUrlDisplay.value = image.cdn_url;
                cdnUrlDisplay.readOnly = true;
                cdnUrlDisplay.style.flexGrow = '1'; // Allow input to take up space
                listItem.appendChild(cdnUrlDisplay);

                // Add Copy button
                const copyCdnUrlButton = document.createElement('img');
                copyCdnUrlButton.src='images/copy.png'
                copyCdnUrlButton.style.width='24px';
                copyCdnUrlButton.style.height='24px';
                copyCdnUrlButton.style.margin='0 5px';
                copyCdnUrlButton.alt = 'Copy';
                copyCdnUrlButton.onclick = () => {
                    cdnUrlDisplay.select();
                    document.execCommand('copy');
                    alert('CDN URL copied to clipboard!');
                };
                listItem.appendChild(copyCdnUrlButton);

                // Add Embed button
                const embedButton = document.createElement('img');
                embedButton.src='images/embed.png'
                embedButton.style.width='24px';
                embedButton.style.height='24px';
                embedButton.style.margin='0 5px';
                embedButton.alt = 'Embed';
                embedButton.onclick = () => {
                    const embedCode = `<img src="${image.cdn_url}" alt="Embedded Image">`;
                    navigator.clipboard.writeText(embedCode).then(() => {
                        alert('Embed code copied to clipboard:\n\n' + embedCode);
                    }, err => {
                        console.error('Could not copy text: ', err);
                    });
                };
                listItem.appendChild(embedButton);
                //delete button
                const deleteButton = document.createElement('img');
                deleteButton.src='images/delete.png'
                deleteButton.style.width='24px';
                deleteButton.style.height='24px';
                deleteButton.alt = 'Delete';

                deleteButton.onclick = () => deleteImage(imageUid);
                listItem.appendChild(deleteButton);
            }
            imageList.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.textContent = 'Unexpected response format. Unable to display image list.';
        imageList.appendChild(listItem);
    }
    if (iNumResults===0){
        const listItem = document.createElement('td');
        listItem.textContent = 'No items found';
        imageList.appendChild(listItem);
    }

    imageListContainer.style.display = 'block';
}
function deleteImage(imageUid) {
    const url = `https://api.perceptpixel.com/v1/media/${imageUid}`;
    const spinnerContainer = document.getElementById('spinner-container');
    spinnerContainer.style.display="block";
    fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Api-Key ${authCodeInput.value.trim()}`
        }
    }).then(response => {
        if (response.ok) {
            alert('Image deleted successfully');
            spinnerContainer.style.display="none";
            listImages();
        } else {
            alert('Failed to delete the image');
            spinnerContainer.style.display="none";
        }
    }).catch(error => console.error('Error deleting image:', error));
}


// Event listener for scroll
window.addEventListener('scroll', () => {
    // Check if the user has scrolled to the bottom of the page
    const authCodeInput = document.getElementById('authCodeInput');
    console.log("listImagesClicked=" + listImagesClicked);
    if (listImagesClicked && window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        // Increment the scroll counter
        scrollCounter++;

        // Load more images only after the user has scrolled twice
        console.log("scrollCounter=" + scrollCounter);
        if (scrollCounter >= 1) {
            // Prepare the headers with the Authorization

            const headers = new Headers({
                'Authorization': `Api-Key ${authCodeInput.value.trim()}`,
                // Additional headers if needed
            });

            // Load more images
            fetch(loadMoreImagesUrl + offset, {headers: headers})
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => displayImageList(data))
                .catch(error => console.error('Error fetching more images:', error));

            offset += 10; // Increment the offset for the next set of images
        }
    }
});




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
document.addEventListener('DOMContentLoaded', function() {
    var imageInput = document.getElementById('imageInput');
    var fileNameDisplay = document.getElementById('fileName');

    imageInput.addEventListener('change', function() {
        var files = imageInput.files;
        const settingsScreen = document.getElementById('settingsScreen');
        settingsScreen.style.display='none';
        if (files.length > 0) {

            fileNameDisplay.textContent = files[0].name;
            uploadButton.src = 'images/upload_ready.png'; // Path to your 'ready to upload' image
            uploadButton.title = "Ready to Upload"; // Change the title to reflect the new action

        } else {
            fileNameDisplay.textContent = ''; // Clear the file name if no file is selected
        }
    });


});

// Initialize the popup
setTimeout(() => {
    initializePopup();
}, 1000);