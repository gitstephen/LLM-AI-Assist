import { ChatClient } from './chatclient.js';

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

const availableFunc = [addTwoNumbersTool, subtractTwoNumbersTool]; 

const func_list = {
	addTwoNumbers: (args) => { return args.a + args.b; },
	subtractTwoNumbers: (args) => { return args.a - args.b; }
};  



const host = 'http://localhost:11434';  
const tt_s = 1000 * 1000 * 1000;
 
var client = new ChatClient(host);
 
// chat start 
client.onBegin = async () => {
	$("#enquire").val(""); 
}

// chat response result 
client.onResult = async (str) => {
	let dialog = document.getElementById("llm-dialog").lastChild;
	
	client.chars = dialog.querySelector('p');  
	client.chars.innerHTML = "";	  
}

//char message receive
client.onReceive = async function(str) {  
	client.chars.append(str); //innerText += str;
} 

//char end
client.onEnd = async (response) => { 
	console.log(response);
	
	if (response.message.tool_calls) { 	
        // Process tool calls from the response
        for (const tool of response.message.tool_calls) {
            let func = tool.function;
			
			const callFunc = func_list[func.name];	 
            if (callFunc) {
			    client.chars.innerHTML += 'The result is: ' + callFunc(func.arguments); 
            } else {
                client.chars.innerHTML += 'Function ' + func.name + ' not found';
            }
        }
	}

	//show tokens per second
	let dt = response.eval_duration / tt_s;
	let token = response.eval_count / response.eval_duration * tt_s;
	
	client.chars.innerHTML += "<span>" + token.toFixed(1) + " tok/s, " +  dt.toFixed(2) + 's </span>'; 
	
	$("#chat-send").show();
	$("#chat-pause").hide();	
}

//chat clear
client.onDispose = async () => {
	let d = document.getElementById("llm-dialog");		
	d.innerHTML = "";
} 

window.client = client;
window.availableFunc = availableFunc;
