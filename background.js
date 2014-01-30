function takePicture() {
    var beep = new Audio();
    beep.src = chrome.runtime.getURL('beep.mp3');
    // Wait for when the browser can play full audio
    beep.addEventListener('canplaythrough', function() {

        var videoConstraints = { mandatory: { minWidth: "1280", minHeight: "720" } };
        // Request access to video camera
        navigator.webkitGetUserMedia({ video: videoConstraints }, function(stream) {

            beep.play();
            var video = document.createElement('video');
            video.autoplay = true;
            video.src = URL.createObjectURL(stream);

            // Wait for when the browser can start playing video
            video.addEventListener('canplay', function() {

                var canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);

                stream.stop();

                // Save picture on user's local file system
                window.webkitRequestFileSystem(window.TEMPORARY, 1024 * 1024, function(localFS) {
                    localFS.root.getFile(getPictureName(), { create: true }, function(fileEntry) {

                        var dataURL = canvas.toDataURL('image/webp');
                        write(fileEntry, dataURLtoBlob(dataURL), function() {

                            var webcamOptions = {
                                type: 'image',
                                title: 'Let me know what you think of it',
                                message: 'Is it not wonderful?',
                                iconUrl: chrome.runtime.getURL('128.png'),
                                imageUrl: dataURL,
                                buttons: [
                                    { title: 'I love it!', iconUrl: chrome.runtime.getURL('heart_16.png') },
                                    { title: 'Please take another one' }
                                ]
                            };
                            // Show notification with user's picture
                            chrome.notifications.create('webcam', webcamOptions, function() {});
                        });
                    });
                });
            });
        });
    });
}

chrome.notifications.onButtonClicked.addListener(function(id, index) {
    // Clear current notification
    chrome.notifications.clear(id, function() {
        // Open Google Drive search if it's the last step
        if (id === 'uploaded') {
            window.open('https://drive.google.com/#search/' + chrome.runtime.id); 
        } 
        // Take a picture if user wants to
        else if ((id === 'webcam' && index === 1) || (id === 'prompt' && index === 0)) {
            takePicture();
        } 
        // Save picture on user's sync file system
        else if (id === 'webcam' && index === 0) {

            window.webkitRequestFileSystem(window.TEMPORARY, 1024 * 1024, function(localFS) {
                localFS.root.getFile(getPictureName(), { create: false }, function(localFileEntry) {
                    localFileEntry.file(function(localFile) {

                        chrome.syncFileSystem.requestFileSystem(function(syncFS) {
                            syncFS.root.getFile(getPictureName(), { create: true }, function(syncFileEntry) {
                                write(syncFileEntry, localFile, function() {
                                    
                                    var uploadedOptions = {
                                        type: 'basic',
                                        title: 'Your picture has been saved',
                                        message: 'It is now safely stored in your Google Drive.',
                                        iconUrl: chrome.runtime.getURL('128.png'),
                                        buttons: [
                                            { title: 'See all my pictures' }
                                        ]
                                    };
                                    // Show notification that picture has been uploaded
                                    chrome.notifications.create('uploaded', uploadedOptions, function() {});
                                });
                            });
                        });

                    });
                });
            });
        }
    });
});


function promptUser() {
    var promptOptions = {
        type: 'basic',
        title: 'Are you ready to take a picture?',
        message: 'It takes only one second.',
        iconUrl: chrome.runtime.getURL('128.png'),
        buttons: [
            { title: 'Ouistiti!' },
            { title: 'Remind me later' }
        ]
    };
    chrome.notifications.clear('prompt', function() {
        chrome.notifications.create('prompt', promptOptions, function() {});
    });
}


/* Alarms */

function onAlarm() {
    chrome.syncFileSystem.requestFileSystem(function(syncFS) {
        // prompt user only if the picture of the day doesn't exist
        syncFS.root.getFile(getPictureName(), { create: false }, null, promptUser);
    });
}

chrome.alarms.onAlarm.addListener(onAlarm);
chrome.alarms.create('', { periodInMinutes: 60 * 3 }); // 3 hours


// On Launch , prompt user
chrome.app.runtime.onLaunched.addListener(promptUser);

// On Installation, simulate triggered alarm
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install')
        onAlarm();
});
