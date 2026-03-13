import { ChatClient } from './scripts/ollama/chatclient.js';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import * as child_process from 'node:child_process';

const options = { host: "http://localhost:11434", alive: "1h", context: 32000, random: 0.7, loop: true, think: false, tools: false };
const llm = "qwen3.5:9b";

const tt_s = 1000 * 1000 * 1000;  
const myclaw = new ChatClient(options);  
 
myclaw.Tools = [
{
	type: 'function',
	function: {
		name: 'exceCmd',
		description: 'open software on PC',
		parameters: {
			type: 'object', 
			properties: {
				name: { type: 'string', description: 'software name' } 
			},
			required: ['name']
		}
	}
},
{
	type: 'function',
	function: {
		name: 'openWebsite',
		description: 'use ms edge open website',
		parameters: {
			type: 'object', 
			properties: {
				name: { type: 'string', description: 'website name' } 
			},
			required: ['name']
		}		
	}
},
{
	type: 'function',
	function: {
		name: 'send_message',
		description: 'user message send to whatsapp',
		parameters: {
			type: 'object', 
			properties: {
				name: { type: 'string', description: 'the message text' } 
			},
			required: ['text']
		}		
	} 
}];

myclaw.FuncArray = { 
	exceCmd: (args) => {
		let app = args.name + '.exe'; 
		child_process.exec("start " + app, (err, stdout, stderr) => {
			if (err) {
				console.error(`exec error: ${err}`);
			}
		}); 
		return "[Toolscall] ok, open " + app + " now.";
	},
	openWebsite: (args) => {
		let domain = args.name;
		if (!domain.startsWith('www')) 
			domain = "www." + args.name;
			
		let url = "https://" + domain; 
		child_process.exec("start msedge " + url, (err, stdout, stderr) => {
			if (err) {
				console.error(`exec error: ${err}`);
			}
		}); 
		return "[Toolscall] ok, open " + url + " now.";	
	},
	send_message: (args) => {
		console.log('[Toolscall] ' +  args.text); 
	}
}; 

myclaw.state = false;

// chat start 
myclaw.onBegin = async () => { 	 
	console.log("thinking ... ");
}

//char output end
myclaw.onEnd = async (res) => { 	

	console.log(myclaw.result);
	console.log('\r\n');
	
	if (res.message.tool_calls) { 	
        // Process tool calls from the response
        const tools = res.message.tool_calls[0];
        let func = tools.function;
			
		const callback = myclaw.FuncArray[func.name];	 
        
		if (toCall) {
			let toolsMsg = callback(func.arguments); 
			myclaw.Add('tool', toolsMsg, null); 
			
			console.log(toolsMsg);
		} else {
			console.log('Function ' + func.name + ' not found');
		}     
	}
	
	//show tokens per second
	let dt = res.eval_duration / tt_s;
	let token = res.eval_count / res.eval_duration * tt_s;
	
	let sp = token.toFixed(1) + " t/s, " +  dt.toFixed(2) + 's  ';  
	
    console.log(sp);
}

const chat = async function(txt) {
	if (txt =="" || llm == "" || myclaw.state) return; 
	
	myclaw.state = true; 
	
	//send message
	let content = { message: txt, img: null }; 
	
	try { 
		//console.log(`stream: ${config.loop}, thinking: ${config.think}`);			
		await myclaw.Send(llm, content); 
	}
	catch(err) { 
		console.log(err);  
	}

	myclaw.state = false;	
}

const cli = createInterface({ input: stdin, output: stdout, prompt: '> ', });

cli.prompt();

cli.on('line', (line) => {
	cli.prompt();	
	
	switch (line) {
		case "exit": 
			if (!myclaw.state) { 
				myclaw.Dispose();
				cli.close();
			}
			break;
		case "stop":
			myclaw.Stop();
			break;
		case "new":
			myclaw.Reset();		
			break;
		default:
			chat(line);
	}
    
}).on('close', () => {
	console.log('Have a nice day!');
	process.exit(0);
});

console.log("MicroClaw agent is running ...");
 