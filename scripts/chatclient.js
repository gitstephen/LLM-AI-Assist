import { Ollama } from './ollama/browser.mjs';
 
export function ChatClient(url) { 
	this.Host = url;
	this.Dialogue = []; 
		
	this.onBegin = null;	
	this.onEnd = null;
	this.onReceive = null;	
	this.onDispose = null;
	
	this.ollama = null; 
	
	this.GetModels = async function() {
		this.checkOllama();
			
		let list = [];				 
		let json = await this.ollama.list(); 
		
		json.models.forEach( item => {
			list.push(item.name); 
		}); 
		
		return list; 
	}
	
	this.Send = async function(llm, message) { 		
		this.checkOllama();
		
		this.Dialogue.push({ role: 'user', content: message });	
		let recvStr = "";		
		
		//create chat
		const response = await this.ollama.chat({
			model: llm,
			messages: this.Dialogue,
			stream: true
		});	 		
		
		if (this.onBegin != null) {
			this.onBegin();
		}
					
		// get message
		for await (const part of response) {
			recvStr += part.message.content;
			
			if (this.onReceive != null) {
				this.onReceive(part.message.content);
			}
		}
		
		//add message to loop
		this.Dialogue.push({ role: 'assistant', content: recvStr }); 
		
		if (this.onEnd != null) {
			this.onEnd();
		}
	}
	
	this.Stop = function() {
		if (this.ollama != null) {
			this.ollama.abort();
		}
	}
	
	this.checkOllama = function() {
		if (this.ollama == null) {
			this.ollama = new Ollama({ host: this.Host });
		}
	}	
	
	this.Reset = function() {
		this.Dialogue.length = 0;
		
		if (this.onDispose != null) {
			this.onDispose();
		}			
	}
};