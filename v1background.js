chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "uploadImage") {
        const formData = new FormData();
        formData.append('file', request.file);
        formData.append('name', request.fileName);

        fetch('https://api.perceptpixel.com/v1/media', {
            method: 'POST',
            headers: {
                'Authorization': 'Api-Key pxl_LiZg.wCSpV02pjfpX14kH0UKCHw2sn7bXeLs8'
            },
            body: formData
        })
            .then(response => response.json())
            .then(data => sendResponse({status: data.status}))
            .catch(error => console.error('Error uploading image:', error));
    }
    return true; // Keep the messaging channel open for the response
});