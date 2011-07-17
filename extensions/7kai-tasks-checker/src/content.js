chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        var customEvent = document.createEvent('Event');
        customEvent.initEvent('extentionsEvent', true, true);
        var eventDiv = document.getElementById('extentionsEventDiv');
        eventDiv.innerText = JSON.stringify(request);
        eventDiv.dispatchEvent(customEvent);
    }
);
if (document.getElementById('status')) {
    document.getElementById('status').innerHTML = '';
}