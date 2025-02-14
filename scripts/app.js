Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
        sendToOffice("AI assistant");
    }
});

function sendToOffice(str) {	
	Word.run(async (context) => {
       // Create a proxy object for the document body.
	   var body = context.document.body;
       // Queue a commmand to clear the contents of the body.
       //body.clear();
       // Queue a command to insert text into the end of the Word document body.
       body.insertText(str, Word.InsertLocation.end);

       // Synchronize the document state by executing the queued commands, and return a promise to indicate task completion.
       context.sync();
    })
    .catch(errorHandler);
}