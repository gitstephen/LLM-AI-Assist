const VISIBLE = "block";
const HIDDEN = "none";

const btnSend = document.getElementById("chat-send");
const btnPause = document.getElementById("chat-pause");

const img_load = document.getElementById("llm-loading");
const img_ollama = document.getElementById("llm-ollama");

const lb_host = document.getElementById("llm-host");
const lb_search = document.getElementById("llm-search");

const lb_dialog = document.getElementById("conversation");
const lb_stats = document.getElementById("llm-stats");

var App = function() { 
	this.state = false;
	this.looping = true;
	
	this.tools = null;
	this.stream = null;
	
	this.addText = async (str, css) => {
		let child = document.createElement("div");
		
		child.setAttribute('class', 'llm-message ' + css);	 
		child.innerHTML = `<div> 
				<pre>${str}</pre> 
				</div>`; 
		
		lb_dialog.appendChild(child);
	};

	this.chat = async () => {
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
	
	this.connect = async (url) => {
		lb_search.style.display = HIDDEN; 
		
		this.stream.Setting.host = url;
		
		if (this.stream.isOpen()) {
			this.stream.Dispose(); 
		}
		
		this.refresh(true);
	
		try
		{			
			await this.list(); 
			
			this.getDom("host").value = url; 
			
			setTimeout(() => {
				this.refresh(false);
			}, 500);			
		}	
		catch(err) { 
			img_load.style.display = HIDDEN;
			lb_search.style.display = VISIBLE;
			
			lb_host.value = url;
			
			this.getDom("conn-llm").innerText = "Ollama connection refused."; 
			
			console.log(url);
		} 	
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
	
	this.save = async (config) => {
		this.stream.Setting = config;
		
		console.log(config);
		
		this.connect(config.host);
	};
	
	this.update = async (config) => {
		this.getDom("host").value = config.host;
		this.getDom("alive").value = config.alive;
		this.getDom("ctxnum").value = config.context;
		this.getDom("random").value = config.random;  		
		this.getDom("think").checked = config.think; 
		
		this.save(config); 
	};

	this.download = async (model) => { 
		try {
			let result = await this.stream.Find(model);

			if (result) {
				lb_stats.innerText = "done";  
				this.getDom("llm-pull").value = "";
				
				this.list(); 
			} 
		} catch(err) { 
			lb_stats.innerHTML = '<span class="text-err">' + err.message + '</span>';  
		}
	}; 
	
	this.refresh = (appear) => {
		img_load.style.display = appear ? VISIBLE : HIDDEN;
		img_ollama.style.display = appear ? HIDDEN : VISIBLE;
	};
	
	this.getDom = (id) => {
		return document.getElementById(id);
	};
	
	this.getSelector = (name) => {
		return document.querySelector(name);
	};
	
	this.getListItem = (id) => {
		let items = this.getDom(id);
		
		if (items.selectedIndex >= 0) {		
			return items.options[items.selectedIndex].text; 
		}
		
		return "";
	}; 
	
	this.run = async (callback) => {
		/* event */
		this.getDom("url-refresh").onclick = () => {  
			this.connect(lb_host.value);	
		};
		
		this.getDom("chat-send").onclick = () => { 
			this.chat();
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
				lb_stats.innerHTML = '<span class="text-err">Please input model name</span>';  
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
			let config = { 
				host: this.getDom("host").value, 
				alive: this.getDom("alive").value, 
				context: Number(this.getDom("ctxnum").value), 
				random: Number(this.getDom("random").value),
				think: this.getSelector('#think:checked') ? true : false 
			};  
			
			chrome.storage?.local?.set({ options: config }).then(() => { 
				this.save(config); 
				this.getDom("slide-menu").style.right = "-350px"; 				
			}); 
		};	 
		
		callback();
	};
}; 

const app = new App();
 
addEventListener("DOMContentLoaded", () => {	
	client.changeState = async () => {	 
		btnSend.style.display = btnSend.checkVisibility() ? "none" : "block";
		btnPause.style.display = btnPause.checkVisibility() ? "none" : "block";
	}  
	
	let config = client.Setting;
	
	app.stream = client; 
	
	app.run(() => { 
		chrome.storage?.local?.get("options").then((data) => { 
			if (Object.keys(data).length > 0) {	 
				config = data.options; 
			}  
 
			app.update(config); 
		});
	}); 
});
