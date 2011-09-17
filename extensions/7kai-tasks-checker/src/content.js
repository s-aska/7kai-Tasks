chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        var customEvent = document.createEvent('Event');
        customEvent.initEvent('extentionsEvent', true, true);
        var eventDiv = document.getElementById('receiver');
        eventDiv.innerText = JSON.stringify(request);
        eventDiv.dispatchEvent(customEvent);
    }
);
var getTheExtensions = document.getElementById('get-the-extensions');
if (getTheExtensions) {
    getTheExtensions.parentNode.removeChild(getTheExtensions);
}