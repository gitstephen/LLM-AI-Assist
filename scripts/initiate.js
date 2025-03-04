import { ChatClient } from './ollama/chatclient.js';
 
const tt_s = 1000 * 1000 * 1000; 

let options = { host: "http://localhost:11434", alive: "2h", context: 8192, random: 0.7 };
const client = new ChatClient(options); 
 
client.changeState = async () => {
	$("#chat-send").toggle();
	$("#chat-pause").toggle();	 
}	

// chat start 
client.onBegin = async () => { 	
	let dialog = document.getElementById("llm-dialog").lastChild;
	
	client.chars = dialog.querySelector('p');	
	client.changeState(); 
}

// chat response result 
client.onResult = async (str) => {
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
	client.changeState();
}

//chat clear
client.onClear = async () => {
	let d = document.getElementById("llm-dialog");		
	d.innerHTML = "";
} 

//download model
client.onDownload = async () => { 
	client.precent = document.getElementById("llm-precent");  
}

client.onFileStream = async (status, percent) => {	 
	client.precent.innerText = `${status} ${percent}%...`;
}

window.client = client;
