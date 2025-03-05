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
		
		this.getDom("llm-dialog").appendChild(child);
	};	

	this.get = async () => {
		if (this.state) return;  
		
		let llm = this.getListItem("chat-model");
 		let enquire = this.getDom("enquire").value;
		
		if (llm == "" || enquire == "") { 
			console.log("input empty");			
			return;
		}
		
		if (this.stream.Dialogue.length == 0) {
			this.getDom("llm-dialog").innerHTML = "";
		}
		
		this.state = true; 
		
		//start chat
		let message = enquire;
			
		this.addText(message, "llm-send");	
		this.addText('<img src="images/loading.svg" alt="thinking" />', "llm-received"); 
		
		this.getDom("enquire").value = ""; 	
		
		try { 
			//send message
			await this.stream.Send(llm, message, this.looping, this.tools); 
		}
		catch(err) { 
			this.addText(err.message, "llm-received llm-error");
			this.stream.changeState();
		}

		this.state = false; 
	};
		
	this.list = async () => {
		try {
			let data = await this.stream.GetModels();  
			
			let list = this.getDom('chat-model');
			
			list.innerHTML = "";
			
			for(var i = 0; i < data.length; i++ ) { 
				list.add(new Option(data[i], i + 1)); 
			} 
			
			this.getDom('ai-model').innerHTML = list.innerHTML;
		}
		catch(err) {
			this.addText("Not found AI model", "llm-received llm-error");	
		} 
	}; 
	
	this.remove = async (name) => {
		try {
			let response = await this.stream.Remove(name);  
				
			this.list(); 
		}
		catch(err) {
			this.addText(err.message, "llm-received llm-error");	
		} 
	};
	
	this.stop = () => {
		this.stream.Stop();
	};
	
	this.clear = () => {
		if (!this.state) {
			this.stream.Reset();
		} 
	};		 
	
	this.update = (options) => {
		this.stream.Setting = options;	
		this.stream.Dispose();
		
		this.getDom("host").value = options.host;
		this.getDom("alive").value = options.alive;
		this.getDom("ctxnum").value = options.context;
		this.getDom("random").value = options.random;	 
	};
	
	this.download = async (model) => { 
		try {
			let status = await this.stream.Find(model);

			if (status == "success") {
				this.getDom("llm-precent").innerText = "done";  
				this.getDom("llm-pull").value = "";
				
				this.list(); 
			} 
		} catch(err) { 
			this.getDom("llm-precent").innerHTML = '<span class="text-err">' + err.message + '</span>';  
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
	
	this.getDom = (id) => {
		return document.getElementById(id);
	};
	
	this.getListItem = (id) => {
		let list = this.getDom(id);
		
		return list.options[list.selectedIndex].text; 
	}; 
};

var chatApp;

const btnSend = document.getElementById("chat-send");
const btnPause = document.getElementById("chat-pause");

addEventListener("DOMContentLoaded", () => {
    chatApp = new App(client); 
	
	/* event */
	chatApp.getDom("chat-send").onclick = function() { 
		chatApp.get();
	}; 
	
	chatApp.getDom("chat-pause").onclick = function() {  
		chatApp.stop(); 
	};
	
	chatApp.getDom("chat-clear").onclick = function() {
		chatApp.clear();
	};
   
	chatApp.getDom('chat-setting').onclick = function() {
		chatApp.getDom("slide-menu").style.right = 0;
	};	
	
	chatApp.getDom('setting-close').onclick = function() {
		chatApp.getDom("slide-menu").style.right = "-350px"; 
	};
		
	chatApp.getDom("chat-pull").onclick = function() {
		let model = chatApp.getDom("llm-pull").value;
		
		if (model != null && model != "") {
			chatApp.download(model);
		} else {
			chatApp.getDom("llm-precent").innerHTML = '<span class="text-err">Please input model name</span>';  
		}
	};
	
	chatApp.getDom("setting-del").onclick = function() {
		if (confirm("Are you sure to delete ai model?")) {  
			let name = chatApp.getListItem("ai-model");	 
			chatApp.remove(name); 	 
		} 
	}; 
	
    chatApp.getDom("setting-save").onclick = function() {  
		let options = chatApp.loadSetting();
		
		chrome.storage?.local?.set({ options: options }).then(() => {
			console.log("Value is set");
			
			chatApp.update(options); 
			chatApp.getDom("slide-menu").style.right = "-350px"; 
		}); 
	};	
	
	chatApp.stream.changeState = async () => {	 
		btnSend.style.display = btnSend.checkVisibility() ? "none" : "block";
		btnPause.style.display = btnPause.checkVisibility() ? "none" : "block";
	} 

	/* end event */
	
	chatApp.update(client.Setting);	
	
	chrome.storage?.local?.get("options").then((data) => {
		if (Object.keys(data).length > 0) {
			chatApp.update(data.options);
			console.log(data);
		}		  
	});
	
	chatApp.list();
});
