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

var textbox;

const host = 'http://localhost:11434';  
const tt_s = 1000 * 1000 * 1000;
 
const client = new ChatClient(host);

// chat start 
client.onBegin = async () => {
	app.enquire = ""; 
}

// chat response result 
client.onResult = async (str) => {
	let dialog = document.getElementById("llm-dialog").lastChild;
	
	textbox = dialog.querySelector('p');  
	textbox.innerHTML = "";	  
}

//char message receive
client.onReceive = async (str) => {
	textbox.textContent += str;	 
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
			    textbox.innerHTML += 'The result is: ' + callFunc(func.arguments); 
            } else {
                textbox.innerHTML += 'Function ' + func.name + ' not found';
            }
        }
	}

	//show tokens per second
	let dt = response.eval_duration / tt_s;
	let token = response.eval_count / response.eval_duration * tt_s;
	
	textbox.innerHTML += "<span>" + token.toFixed(2) + " t/s, " +  dt.toFixed(2) + 's </span>'; 
}

//chat clear
client.onDispose = async () => {
	let d = document.getElementById("llm-dialog");		
	d.innerHTML = "";
} 

window.initialize = function () {
	return new Vue({
		el: '#vue-app',
		data: { options: [],  llm: "", enquire: "", state: false, looping: false },
		methods: {		
			send: async function () {
				if (this.state) return;
				if (this.llm == "" || this.enquire == "") {  
					return; 
				}
					
				this.state = true;	 
				
				//start chat
				let message = this.enquire;	 
				
				this.addText('', message, "llm-send");	
				this.addText(this.llm, '<img src="images/loading.svg" alt="thinking" />', "llm-received"); 
				  
				try { 
					//send message
					await client.Send(this.llm, message, !this.looping, availableFunc); 
				}
				catch(err) { 
					alert(err.message);	
				}
				
				this.state = false;	 
			},
			list: async function() {
				try {
					let list = await client.GetModels(); 
						
					list.forEach( item => {
						this.options.push(item); 
					});	 
				}
				catch(err) {
					alert(err.message);
				}							
			},
			addText: function(name, str, css) {
				var child = document.createElement("div");
				child.setAttribute('class', 'llm-message ' + css); 
				
				child.innerHTML = `<div>
									<b>${name}</b>
									<p>${str}</p> 
								</div>`; 
				
				let parent = document.getElementById("llm-dialog");	
				
				parent.appendChild(child);
			},
			pause: function() {
				client.Stop();
			},
			reset: function() {
				client.Reset();
			}
		}
	});
};
 
