// background.js

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "uploadImage") {
            const formData = new FormData();
            formData.append('file', request.file);
            formData.append('name', request.file.name);

            fetch('https://api.perceptpixel.com/media/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Api-Key ${request.authCode}`
                },
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    sendResponse({ data: data });
                })
                .catch(error => {
                    console.error('Error uploading image:', error);
                    sendResponse({ error: 'Upload failed!' });
                });

            return true; // Needed for sendResponse to work asynchronously
        }
    }
);
