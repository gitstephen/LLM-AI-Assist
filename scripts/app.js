const VISIBLE = "block";
const HIDDEN = "none";

const btnSend = document.getElementById("chat-send");
const btnPause = document.getElementById("chat-pause");

const img_load = document.getElementById("llm-loading");
const img_ollama = document.getElementById("llm-ollama");

const lb_host = document.getElementById("llm-host");
const lb_search = document.getElementById("llm-search");

const lb_dialog = document.getElementById("conversation");

var App = function(client) {
	this.stream = client;
		
	this.state = false;
	this.looping = true;
	this.tools = null;
	
	this.addText = async (str, css) => {
		let child = document.createElement("div");
		
		child.setAttribute('class', 'llm-message ' + css);	 
		child.innerHTML = `<div> 
				<p>${str}</p> 
				</div>`; 
		
		lb_dialog.appendChild(child);
	};

	this.get = async () => {
		if (this.state) return;  
		
		let llm = this.getListItem("chat-model");
 		let enquire = this.getDom("enquire");
		
		if (llm == "" || enquire.value == "") { 
			return;
		}
		
		if (this.stream.Dialogue.length == 0) {
			img_ollama.style.display = HIDDEN;
		}
		
		this.state = true; 
		
		//start chat
		let message = enquire.value;
			
		this.addText(message, "llm-send");	
		this.addText('<img src="images/loading.svg" alt="thinking" />', "llm-received"); 
		
		enquire.value = ""; 	
		
		try { 
			//send message
			await this.stream.Send(llm, message, this.looping, this.tools); 
		}
		catch(err) { 
			this.addText(err.message, "llm-received text-err");
			this.stream.changeState();
		}

		this.state = false; 
	};

	this.connect = async () => {  
		this.refresh(true);
	
		try
		{			
			await this.list(); 
			
			this.getDom("host").value = this.stream.Setting.host; 
			
			setTimeout(() => {
				this.refresh(false);
			}, 500);			
		}	
		catch(err) { 
			img_load.style.display = HIDDEN;
			lb_search.style.display = VISIBLE;
			
			this.getDom("conn-llm").innerText = "Ollama connection refused.";			   
		} 	
	};
	
	this.search = async () => {
		lb_search.style.display = HIDDEN;  
		
		this.stream.Setting.host = lb_host.value;	
		
		this.connect(); 
	};

	this.list = async () => {
		let data = await this.stream.GetModels();  
		
		let list = this.getDom('chat-model');
		
		list.innerHTML = "";
		
		for(var i = 0; i < data.length; i++ ) { 
			list.add(new Option(data[i], i + 1)); 
		}
		
		this.getDom('ai-model').innerHTML = list.innerHTML;
	}; 
	
	this.remove = async (name) => {
		try {
			await this.stream.Remove(name);  
				
			this.list(); 
		}
		catch(err) {
			this.addText(err.message, "llm-received text-err");	
		} 
	};
	
	this.stop = () => {
		this.stream.Stop();
	};
	
	this.clear = () => {
		if (this.state) return; 
		if (this.stream.Dialogue.length == 0) return;
		
		this.refresh(true);
		
		this.stream.Reset();
		
		setTimeout(() => {
			this.refresh(false);
		}, 500);
	};
	
	this.update = async (options) => {
		this.stream.Setting = options;	
		this.stream.Dispose();
		
		this.getDom("host").value = options.host;
		this.getDom("alive").value = options.alive;
		this.getDom("ctxnum").value = options.context;
		this.getDom("random").value = options.random;
		
		this.getDom("llm-host").value = options.host;
		
		this.search();
	};

	this.download = async (model) => { 
		try {
			let result = await this.stream.Find(model);

			if (result) {
				this.stream.stats = "done";  
				this.getDom("llm-pull").value = "";
				
				this.list(); 
			} 
		} catch(err) { 
			this.stream.stats.innerHTML = '<span class="text-err">' + err.message + '</span>';  
		}
	};
	
	this.loadSetting = () => {
		return { 
			host: this.getDom("host").value, 
			alive: this.getDom("alive").value, 
			context: Number(this.getDom("ctxnum").value), 
			random: Number(this.getDom("random").value) 
		};  
	};
	
	this.refresh = (appear) => {
		img_load.style.display = appear ? VISIBLE : HIDDEN;
		img_ollama.style.display = appear ? HIDDEN : VISIBLE;
	};
	
	this.getDom = (id) => {
		return document.getElementById(id);
	};
	
	this.getListItem = (id) => {
		let items = this.getDom(id);
		
		return items.options[items.selectedIndex].text; 
	}; 
	
	this.init = () => {
		/* event */
		this.getDom("chat-url").onclick = () => { 
			this.search();	
		};
		
		this.getDom("chat-send").onclick = () => { 
			this.get();
		}; 
		
		this.getDom("chat-pause").onclick = () => {  
			this.stop(); 
		};
		
		this.getDom("chat-clear").onclick = () => {
			this.clear();
		};
	   
		this.getDom('chat-setting').onclick = () => {
			this.getDom("slide-menu").style.right = 0;
		};	
		
		this.getDom('setting-close').onclick = () => {
			this.getDom("slide-menu").style.right = "-350px"; 
		};
			
		this.getDom("chat-pull").onclick = () => {
			let model = this.getDom("llm-pull").value;
			
			if (model != null && model != "") {
				this.download(model);
			} else {
				this.getDom("llm-precent").innerHTML = '<span class="text-err">Please input model name</span>';  
			}
		};
		
		this.getDom("setting-del").onclick = () => {
			if (confirm("Are you sure to delete ai model?")) {  
				let name = this.getListItem("ai-model");	 
				
				console.log("delete");
				this.remove(name); 	 
			} 
		}; 
		
		this.getDom("setting-save").onclick = () => {  
			let options = this.loadSetting();
			
			chrome.storage?.local?.set({ options: options }).then(() => {
				console.log("save");
				
				this.update(options); 
				this.getDom("slide-menu").style.right = "-350px"; 
			}); 
		};	 
	};
}; 

addEventListener("DOMContentLoaded", () => {
	client.changeState = async () => {	 
		btnSend.style.display = btnSend.checkVisibility() ? "none" : "block";
		btnPause.style.display = btnPause.checkVisibility() ? "none" : "block";
	}
	
    const chatApp = new App(client); 
	
	chatApp.init();
	
	chrome.storage?.local?.get("options").then((data) => {
		if (Object.keys(data).length > 0) {		  			
			chatApp.update(data.options);	
			console.log(data);	
		} else {
			chatApp.update(client.Setting);	
		} 
	}); 	
});
