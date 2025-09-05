import { Ollama } from './browser.js';
 
export function ChatClient(options) {  
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
	this.onDownload = null;
	this.onFileStream = null;
	
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
	this.Send = async function(llm, content, looping, tools_call) { 	
		this.checkOllama();
		
		this.Dialogue.push({ role: 'user', content: content.message, images: content.img });	
		this.recevStr = "";		
		
		if (this.onBegin != null) {
			this.onBegin();
		}
		
		if (looping) {
			tools_call = [];
		} 
		
		console.log("think mode: " + this.Setting.think);
		
		//create chat
		const response = await this.ollama.chat({
			model: llm,
			messages: this.Dialogue,
			stream: looping, 
			think: this.Setting.think,
			keep_alive: this.Setting.alive, 
			options: { num_ctx: this.Setting.context, temperature: this.Setting.random },
			tools: tools_call
		});	 		
		
		//output message
		if (this.onResult != null) {
			this.onResult();
		}

		if (looping) {
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
		
		if (this.onClear != null) {
			this.onClear();
		} 
	}
		
	this.Find = async function(model) {
		this.checkOllama();
	
		if (this.onDownload != null) {
			this.onDownload();
		}
		
		let percent = 0;
		const file = await this.ollama.pull({ model: model, insecure: true, stream: true })
			 
		for await (const part of file) {
			if (part.digest) {
				if (part.completed && part.total) {
					percent = Math.round((part.completed / part.total) * 100);
				}  
			}
			
			if (this.onFileStream != null) {
				this.onFileStream(part.status, percent);
			}
		}
		
		return true;
	}
	
	this.Remove = async function(model) {
		this.checkOllama();
		
		return await this.ollama.delete({model: model});  
	}		
	
	this.Dispose = function() {
		this.ollama = null;		
		this.Reset();
	}
	
	this.checkOllama = function() {
		if (this.ollama == null) {
			this.ollama = new Ollama({ host: this.Setting.host });			
		}
	}
	
	this.isOpen = function() {
		return this.ollama != null;
	}	
	
	this.output = function(response) {  
		let msg = response.message; 
	 
		if (msg.content != "") {
			this.recevStr += msg.content; 
		} 
		 		 
		if (msg.thinking != null && msg.thinking != "") {
			this.transmit(msg.thinking);  
		}  else {
			this.transmit(msg.content); 
		}	 
		
		if (response.done) {
			if (this.onEnd != null) {
				this.onEnd(response);
			}
		}
	}
	
	this.transmit = function(str) {
		if (this.onReceive != null) {
			this.onReceive(str);  
		}
	}
};
