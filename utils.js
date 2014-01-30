// Convert dataURL to a blob
function dataURLtoBlob(dataURL) {
    var byteString = atob(dataURL.split(',')[1]),
        mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];

    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    var blob = new Blob([ia], {type: mimeString});
    return blob;
}

// Save content to a file Entry
function write(fileEntry, content, callback) {
    fileEntry.createWriter(function(fileWriter) {
        fileWriter.onwriteend = callback;
        fileWriter.write(content);
    });
}

// Return an unique picture's name based on today
function getPictureName() {
    var now = new Date();
    return now.toISOString().substr(0, 10) + '.webp';
}
