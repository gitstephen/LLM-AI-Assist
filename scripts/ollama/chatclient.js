import { Ollama } from './browser.mjs';
 
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
		
		if (this.onClear != null) {
			this.onClear();
		} 
	}
		
	this.Find = async function(model) {
		this.checkOllama();
	
		if (this.onDownload != null) {
			this.onDownload();
		}
		
		const response = await this.ollama.pull({ model: model, stream: true })
		
		let percent = 0;
		 
		for await (const part of response) {
			if (part.digest) {
				if (part.completed && part.total) {
					percent = Math.round((part.completed / part.total) * 100);
				}  
			}
			
			if (this.onFileStream != null) {
				this.onFileStream(part.status, percent);
			}
		}
		
		return "success";
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
