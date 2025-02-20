import { Ollama } from './ollama/browser.mjs';
 
export function ChatClient(url) { 
	this.Host = url;
	this.Dialogue = []; 
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
	this.Send = async function(llm, message, continuous, functions) { 		
		this.checkOllama();
		
		this.Dialogue.push({ role: 'user', content: message });	
		this.recevStr = "";		
		
		if (this.onBegin != null) {
			this.onBegin();
		}
		
		//create chat
		const response = await this.ollama.chat({
			model: llm,
			messages: this.Dialogue,
			stream: continuous, 
			keep_alive: '10m', 
			options: { num_ctx: 4096, temperature: 0 },
			tools: functions
		});	 		
		
		if (this.onResult != null) {
			this.onResult();
		}
					
		if (continuous) {
			// get message
			for await (const part of response) { 			
				this.recevStr += part.message.content;			
				 
				if (this.onReceive != null) {
					this.onReceive(part.message.content);
				}		 
				
				if (part.done) {
					if (this.onEnd != null) {
						this.onEnd(part);
					}
				}
			}	 
		}	
		else 
		{
			if (this.onReceive != null) {
				this.onReceive(response.message.content);
			}	

			if (response.done) {
				if (this.onEnd != null) {
					this.onEnd(response);
				}
			}
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
};