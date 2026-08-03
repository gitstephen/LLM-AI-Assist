const btnSend = document.getElementById("chat-send");
const btnPause = document.getElementById("chat-pause");
const btnImg = document.getElementById("chat-img");
const btnCode = document.getElementById("chat-code");
const btnHistory = document.getElementById("chat-history");

const fileImg = document.getElementById("llm-file"); 

const img_preview = document.getElementById("llm-pic");
const img_load = document.getElementById("llm-loading");
const img_ollama = document.getElementById("llm-ollama");

const lb_host = document.getElementById("llm-host");
const lb_search = document.getElementById("llm-search");

const lb_dialog = document.getElementById("conversation");
const lb_stats = document.getElementById("llm-stats");
const lb_history = document.getElementById("sess-history"); 

const enquire = document.getElementById("enquire"); 
const chatllm = document.getElementById("chat-model"); 

App = function() { 
	this.state = false; 
	this.stream = null;
 
	this.hello = async () => {		
		let child = document.createElement("div");
		
		child.setAttribute('class', 'llm-cover');	 
		child.innerHTML = `<image src="images/ollama.png" alt="ollama" /><p style="font-size: 24px;">Hey, how can I help you?</p>`; 
		
		lb_dialog.appendChild(child);
	};
	
	this.connect = async () => { 
		 
		if (this.stream.isOpen()) {
			this.stream.Dispose(); 
		}
		 
		try
		{			
			await this.models();   
			
			this.hello();		
		}	
		catch (err) { 
			this.addText('Ollama connection error.', "llm-received text-err");	 
		} 	
	};
	
	this.addText = async (str, css) => {
		let child = document.createElement("div");
		
		child.setAttribute('class', 'llm-message ' + css);	 
		child.innerHTML = `<div><pre>${str}</pre></div>`; 
		
		lb_dialog.appendChild(child);
	};

	this.chat = async () => {
		if (this.state) return;  
		
		const selLLM = chatllm.options[chatllm.selectedIndex]?.text; 
		
		if (!selLLM || !enquire.value.trim()) { 
			return;
		} 
		
		if (this.stream.History.length == 0) {
			lb_dialog.innerHTML = "";
		}
		
		this.state = true;
		let picData = null;
 
		let picMode = this.getSelector('#optPic:checked') ? true : false;
		
		if (picMode && img_preview?.src.startsWith('data:image/')) {			
			picData = [img_preview.src.substring(23)]; 
		}
		 
		//start chat 
		this.addText(enquire.value, "llm-send");	
		this.addText('<img src="images/loading.svg" alt="thinking" />', "llm-received"); 
		 
		const config = this.stream.Setting;
		
		try { 
			//console.log(`stream: ${config.loop}, thinking: ${config.think}`);
			//send message
			await this.stream.Send(selLLM, { message: enquire.value, img: picData }); 
		}
		catch(err) { 
			responseChars.innerHTML = `<div class="llm-received text-err">${err.message}</div>`; 	 
			
			changeState(); 
		}		
		
		this.state = false; 
	}; 	

	this.models = async () => {  
		chatllm.innerHTML = "";
		
		let data = await this.stream.Health();  
		
		for (var i = 0; i < data.length; i++ ) { 
			chatllm.add(new Option(data[i], i + 1)); 
		}
		
		this.getDom('ai-model').innerHTML = chatllm.innerHTML;
	}; 
	
	this.remove = async (name) => {
		try {
			await this.stream.Remove(name);  
				
			this.models(); 
		}
		catch(err) {
			this.addText(err.message, "llm-received text-err");	
		} 
	};
	
	this.clear = async () => {
		localStorage.clear(); 
		
		lb_history.innerHTML = "";
	};
	
	this.stop = () => {
		this.stream.Stop();
	};
	
	this.checkout = () => {
		if (this.state) return; 
		if (this.stream.History.length == 0) return;
		 
		const n = localStorage.length + 1;
		
		let str = this.stream.History[0].content;
		
		localStorage.setItem('sess_' + n, str); 
		
		//add session history
		let child = document.createElement("div");
		
		child.setAttribute('class', 'llm-sess');	 
		child.innerHTML = `<div>${str}</div>`; 
	
		lb_history.appendChild(child);			
		
		this.stream.Reset();
		
		this.models();
	}; 
	
	this.update = async (config) => { 		
		this.stream.Setting = config;
		
		this.getDom("host").value = config.host;
		this.getDom("alive").value = config.alive;
		this.getDom("ctxnum").value = config.context;
		this.getDom("random").value = config.random;
		
		this.getDom("stream").checked = config.loop;
		this.getDom("think").checked = config.think; 
		this.getDom("tools").checked = config.tools; 		
		
		for (let i = 0; i < localStorage.length; i++) {
			let key = localStorage.key(i);
			let str = localStorage.getItem(key);
 
			let child = document.createElement("div");
		
			child.setAttribute('class', 'llm-sess');	 
			child.innerHTML = `<div>${str}</div>`; 
		
			lb_history.appendChild(child);
		}	 
	}; 
	 
	this.download = async (model) => { 
		try {
			let result = await this.stream.Find(model);

			if (result) {
				lb_stats.innerText = "done";  
				this.getDom("llm-pull").value = "";
				
				this.models(); 
			} 
		} catch(err) { 
			lb_stats.innerHTML = '<span class="text-err">' + err.message + '</span>';  
		}
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
	
	this.run = async () => {
		/* button event */	
		btnSend.onclick = () => { 
			this.chat();
		}; 
		
		btnCode.onclick = () => { 
		    enquire.value = "請優化以下代碼";		
			
			this.chat();
		};
		
		btnPause.onclick = () => {  
			this.stop(); 
		};
 
		btnImg.onclick = () => {
			let mode = this.getSelector('#optPic:checked') ? true : false;
		
			if (!mode) {
				return;
			}
			
			fileImg.click();
		}; 
 
		fileImg.onchange = () => {	 
			let file = fileImg.files[0];
			
			let reader = new FileReader();

			reader.readAsDataURL(file);

			reader.onload = function() {
				img_preview.src = reader.result;
			};

			reader.onerror = function() {
				console.log(reader.error);
			}; 
		};		
		/* end */ 
		
		this.getDom("chat-checkout").onclick = () => {
			this.checkout();
		};
			   		
		this.getDom("chat-history").onclick = () => {
			this.getDom("slide-sess").style.right = 0; 
		}; 
		
		this.getDom('sess-close').onclick = () => {
			this.getDom("slide-sess").style.right = "-350px"; 
		};
		
		this.getDom('sess-clear').onclick = () => {
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
 
				this.remove(name); 	 
			} 
		}; 
 
		this.getDom("setting-save").onclick = async () => {  
			const config = { 
				host: this.getDom("host").value, 
				alive: this.getDom("alive").value, 
				context: Number(this.getDom("ctxnum").value), 
				random: Number(this.getDom("random").value),
				loop: this.getSelector('#stream:checked') ? true : false,
				think: this.getSelector('#think:checked') ? true : false,
				tools: this.getSelector('#tools:checked') ? true : false 
			};
			
			await chrome.storage?.local?.set({ options: config });
			
			this.stream.Setting = config; 
		 
			this.getDom("slide-menu").style.right = "-350px";  
		};	   
	
		const data = await chrome.storage?.local?.get("options");
	
		let setting = data.options || this.stream.Setting; 

		this.update(setting);

		this.connect(); 
	};
}; 

const changeState = () => { 
	btnSend.style.display = btnSend.checkVisibility() ? "none" : "block";
	btnPause.style.display = btnPause.checkVisibility() ? "none" : "block";
};
 
const tt_s = 1000 * 1000 * 1000; 
const app = new App();

var responseChars = null;

addEventListener("DOMContentLoaded", () => {   
	// chat start 
	client.onBegin = async () => {		
		responseChars = lb_dialog.lastChild.querySelector('pre');		
		enquire.value = ""; 
		
		changeState();		
	}

	// chat result 
	client.onResult = async () => {
		//clear loading svg
		responseChars.innerHTML = ""; 
	}

	//char message receive
	client.onReceive = async (str) => {
		responseChars.append(str); //innerText += str;

		if (lb_dialog.offsetHeight + 300 > window.innerHeight) {
			lb_dialog.scrollTop += 20;
		}	 
	}; 

	//char output end
	client.onEnd = async (res) => { 
		//console.log(client.result);
		
		if (res.message.tool_calls) { 
			// Process tool calls from the response
			const tool = res.message.tool_calls[0];
			let func = tool.function;
				
			const dispatched = func_list[func.name];
			
			if (dispatched) {
				let res = dispatched(func.arguments); 
				responseChars.innerHTML += res;
			} else {
				responseChars.innerHTML += 'Function ' + func.name + ' not found';
			}  
		}	
		
		//show tokens per second
		let dt = res.eval_duration / tt_s;
		let token = res.eval_count / res.eval_duration * tt_s;
		
		responseChars.innerHTML += "<span>" + token.toFixed(1) + " t/s, " +  dt.toFixed(2) + 's </span>';  
		
		changeState();
	}

	//chat clear
	client.onClear = () => { 
		lb_dialog.innerHTML = '';   
		img_preview.src = "";
	}

	//download model
	client.onDownload = async () => { 
		lb_stats.innerText = "start download";
	}

	client.onFileStream = async (status, percent) => {	 
		lb_stats.innerText = `${status} ${percent}%...`;
	}  
	
	app.stream = client;   
	 
	app.run(); 
});
