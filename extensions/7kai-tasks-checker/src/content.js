chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        var customEvent = document.createEvent('Event');
        customEvent.initEvent('extentionsEvent', true, true);
        var eventDiv = document.getElementById('extentionsEventDiv');
        eventDiv.innerText = request.list_id;
        eventDiv.dispatchEvent(customEvent);
    }
);