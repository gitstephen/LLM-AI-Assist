import { ChatClient } from './scripts/ollama/chatclient.js';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import * as child_process from 'node:child_process';
import * as iost from 'node:fs';

const options = { host: "http://localhost:11434", alive: "1h", context: 32000, random: 0.7, loop: false, think: false, tools: true };
const llm = "qwen3.5:9b";

const tt_s = 1000 * 1000 * 1000;   

const myclaw = new ChatClient(options);  

myclaw.metadata = "";
 
function run_cmd(name) {
	child_process.exec("start " + name, (err, stdout, stderr) => {
		if (err) {
			console.error(`exec error: ${err}`);
		}
	}); 
}	
 
myclaw.Tools = [
{
	type: 'function',
	function: {
		name: 'exceCmd',
		description: 'run software or app on PC',
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
		description: 'use microsoft edge open website',
		parameters: {
			type: 'object', 
			properties: {
				name: { type: 'string', description: 'website name' } 
			},
			required: ['name']
		}		
	}
}];

myclaw.FuncArray = { 
	exceCmd: (args) => { 
		run_cmd(args.name); 
		return "[Toolscall exceCmd] ok, run " + args.name + " now.";
	},
	openWebsite: (args) => {
		let url = ""; 
		if (!args.name.startsWith('https://'))
				url = "https://" + args.name;
	 
		run_cmd("start msedge " + url); 
		 
		return "[Toolscall Website] ok, open " + url + " now.";	
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
  	
	if (res.message.tool_calls) { 	
        // Process tool calls from the response
        const tools = res.message.tool_calls[0];
        let func = tools.function;
			
		const callback = myclaw.FuncArray[func.name];	 
        
		if (callback) {
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
	if (txt == "" || llm == "" || myclaw.state) return; 
	
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
			chat(myclaw.metadata);
			break;
		default:
			chat(line);
	}
    
}).on('close', () => {
	stdout.write('Have a nice day!');
	process.exit(0);
});

async function systemFile(name) {
	const streamReader = iost.createReadStream(name, { encoding: 'utf8' });
	try {
		let str = "";
		for await (const chunk of streamReader) {       
			str += chunk;     
		}		
		myclaw.metadata = str;
		chat(str);
	} catch (error) {
		console.error(`Error reading file: ${error.message}`);
	}
}

if (myclaw.metadata == "") {
	await systemFile('workspace/SOUL.md');	
} 

console.log("MicroClaw agent is running ..."); 

 