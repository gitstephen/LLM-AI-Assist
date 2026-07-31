import { Ollama } from './browser.js';
 
export function ChatClient(options) { 
	this.Setting = options; 
	this.Tools = [];
	this.History = []; 
	this.result = "";

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
	this.Health = async function() {
		this.checkOllama();

		let list = [];				 
		let json = await this.ollama.list(); 
		
		json.models.forEach( item => {
			list.push(item.name); 
		}); 
		
		return list; 
	}	 
	
	this.Add = function(name, message, img) {
		this.History.push({ role: name, content: message, images: img });  
	}
	
	//chat
	this.Send = async function(llm, content) { 	
		this.checkOllama(); 
		this.result = "";	 
		
		if (this.onBegin != null) {
			this.onBegin();
		}
		
		//console.log("tools call: " + this.Setting.tools);
		let tools_func = this.Setting.tools ? this.Tools : [];
				
	    this.Add('user', content.message, content.img);		
		
		//create chat
		const response = await this.ollama.chat({
			model: llm,
			messages: this.History,
			stream: this.Setting.loop, 
			think: this.Setting.think,
			keep_alive: this.Setting.alive, 
			options: { num_ctx: this.Setting.context, temperature: this.Setting.random },
			tools: tools_func
		});
		 
		//output message
		if (this.onResult != null) {
			this.onResult();
		}

		if (this.Setting.loop) {
			for await (const part of response) {
				this.output(part);	
			}	 
		} else {
			this.output(response); 
		}	 
	}
	
	//abort
	this.Stop = function() {
		if (this.ollama != null) {
			this.ollama.abort();
		}
	}
	
	//delete chat
	this.Reset = function() {
		this.History.length = 0;
		
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
		let recvStr = msg.content;
		
		if (msg.content != "") {
			this.result += msg.content; 
		} 
				
		if (msg.thinking != null && msg.thinking != "") {
			recvStr = msg.thinking;	 
		}	 
		
		if (this.onReceive != null) {
			this.onReceive(recvStr);  
		}
		
		if (response.done) {		
			this.Add('assistant', this.result, null); 
			
			if (this.onEnd != null) {
				this.onEnd(response);
			}
		}
	} 
};
