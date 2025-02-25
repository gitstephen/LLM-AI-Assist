import { Ollama } from './browser.mjs';
 
export function ChatClient(url, options) { 
	this.Host = url;
	this.Dialogue = []; 
	this.Setting = options; 
	
	this.recevStr = "";
	this.ollama = null; 

	//event	
	this.onBegin = null;	
	this.onEnd = null;
	this.onResult = null;
	this.onReceive = null;	
	this.onDispose = null; 
	
	//Get model list
	this.GetModels = async function() {
		this.checkOllama();

		let list = [];				 
		let json = await this.ollama.list(); 
		
		json.models.forEach( item => {
			list.push(item.name); 
		}); 
		
		return list; 
	}
	
	//chat
	this.Send = async function(llm, message, looping, tools_call) { 	
		this.checkOllama();
		
		this.Dialogue.push({ role: 'user', content: message });	
		this.recevStr = "";		
		
		if (this.onBegin != null) {
			this.onBegin();
		}
		
		if (looping) {
			tools_call = [];
		}
		
		//create chat
		const response = await this.ollama.chat({
			model: llm,
			messages: this.Dialogue,
			stream: looping, 
			keep_alive: this.Setting.alive, 
			options: { num_ctx: this.Setting.context, temperature: this.Setting.random },
			tools: tools_call
		});	 		
		
		if (this.onResult != null) {
			this.onResult();
		}

		if (looping) {
			// get message
			for await (const part of response) {   
				this.output(part);				
			}	 
		} else {
			this.output(response); 
		}	
		
		//add message to loop
		this.Dialogue.push({ role: 'assistant', content: this.recevStr });  
	}
	
	//abort
	this.Stop = function() {
		if (this.ollama != null) {
			this.ollama.abort();
		}
	}
	
	//delete chat
	this.Reset = function() {
		this.Dialogue.length = 0;
		
		if (this.onDispose != null) {
			this.onDispose();
		} 
	}
	
	this.checkOllama = function() {
		if (this.ollama == null) {
			this.ollama = new Ollama({ host: this.Host });
		}
	} 
	
	this.output = function(response) {
		this.recevStr += response.message.content; 
		
		if (this.onReceive != null) {
			this.onReceive(response.message.content);
		}		 
		
		if (response.done) {
			if (this.onEnd != null) {
				this.onEnd(response);
			}
		}
	}
};
