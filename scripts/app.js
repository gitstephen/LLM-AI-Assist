/* Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
        sendToOffice("AI assistant");
    }
}); */

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

// Tools definition for add function
const addTwoNumbersTool = {
    type: 'function',
    function: {
        name: 'addTwoNumbers',
        description: 'Add two numbers together',
        parameters: {
            type: 'object',
            required: ['a', 'b'],
            properties: {
                a: { type: 'number', description: 'The first number' },
                b: { type: 'number', description: 'The second number' }
            }
        }
    }
};

// Tools definition for subtract function
const subtractTwoNumbersTool = {
    type: 'function',
    function: {
        name: 'subtractTwoNumbers',
        description: 'Subtract two numbers',
        parameters: {
            type: 'object',
            required: ['a', 'b'],
            properties: {
                a: { type: 'number', description: 'The first number' },
                b: { type: 'number', description: 'The second number' }
            }
        }
    }
};