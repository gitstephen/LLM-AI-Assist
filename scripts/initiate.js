import { ChatClient } from './ollama/chatclient.js';
import { tools, func_list } from './tools.js';

const tt_s = 1000 * 1000 * 1000; 

let options = { host: "http://localhost:11434", alive: "1h", context: 8192, random: 0.7 };

const requestAppend = async (str) => {
	client.chars.append(str); //innerText += str;

	if (lb_dialog.offsetHeight + 300 > window.innerHeight) {
		lb_dialog.scrollTop += 20;
	}	 
};

const client = new ChatClient(options);  

client.Tools = tools;

// chat start 
client.onBegin = async () => { 	 
	client.chars = lb_dialog.lastChild.querySelector('pre');
	client.changeState(); 
}

// chat result 
client.onResult = async () => {
	client.chars.innerHTML = ""; 
}

//char message receive
client.onReceive = requestAppend;

//char output end
client.onEnd = async (res) => { 
	//console.log(client.result);
	
	if (res.message.tool_calls) { 	
        // Process tool calls from the response
        const tool = res.message.tool_calls[0];
        let func = tool.function;
			
		const dispatched = func_list[func.name];	 
        
		if (dispatched) {
			let res = dispatched(func.arguments); 
			client.chars.innerHTML += res;
		} else {
			client.chars.innerHTML += 'Function ' + func.name + ' not found';
		}        
	}	
    
	//show tokens per second
	let dt = res.eval_duration / tt_s;
	let token = res.eval_count / res.eval_duration * tt_s;
	
	client.chars.innerHTML += "<span>" + token.toFixed(1) + " t/s, " +  dt.toFixed(2) + 's </span>';  
	client.changeState();
}

//chat clear
client.onClear = () => { 
	console.log("clear");  
	
	lb_dialog.innerHTML = '';   
	img_preview.src = "";
}

//download model
client.onDownload = async () => { 
	lb_stats.innerText = "start download";
}

client.onFileStream = async (status, percent) => {	 
	lb_stats.innerText = `${status} ${percent}%...`;
}

window.client = client;
