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
		
		let parent = document.getElementById("llm-dialog");	
		
		parent.appendChild(child); 
	};	

	this.get = async () => {
		if (this.state) return;
		
		let llm = $("#chat-model option:selected").text();
		let enquire = $("#enquire").val();
		
		if (llm == "" || enquire == "") return;
				 
		this.state = true;
		
		//start chat
		let message = enquire;
			
		this.addText(message, "llm-send");	
		this.addText('<img src="images/loading.svg" alt="thinking" />', "llm-received"); 
		
		$("#enquire").val(""); 	
		
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

			$('.llm-model').empty();
			
			for(var i = 0; i < data.length; i++ ) { 
				$('.llm-model').append(
					$('<option>', {	value: i, text: data[i] })
				);  
			} 
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
		
		$("#host").val(options.host);
		$("#alive").val(options.alive);
		$("#random").val(options.random);
		$("#ctxnum").val(options.context);	 
	};
	
	this.download = async (model) => { 	 
		try {
			let status = await this.stream.Find(model);

			if (status == "success") {
				document.getElementById("llm-precent").innerText = "done";  
				$("#llm-pull").val("");
				
				this.list(); 
			}			
		} catch(err) { 
			document.getElementById("llm-precent").innerHTML = '<span class="uk-text-warning">' + err.message + '</span>';  
		}
	};
};

var chatApp;

addEventListener("DOMContentLoaded", () => {
    chatApp = new App(client); 
		
	chrome.storage.local.get("options").then((obj) => {
		if (Object.keys(obj).length > 0) {
			chatApp.update(obj.options);
			console.log(obj);
		} else {
			chatApp.update(client.Setting);
		}
	});	 

	$('#chat-send').click(function() {   
		chatApp.get();	 
	});
	
	$('#chat-pause').click(function() {
		chatApp.stop(); 
	});
	
	$('#chat-clear').click(function() {
		chatApp.clear();
	});
   
	$('#chat-setting').click(function() {
		$(".slide-panel").animate({ 
			right: 0 
		}); 
	});
	
	$("#chat-pull").click(function() {
		let model = $("#llm-pull").val();
		
		if (model != null && model != "") {
			chatApp.download(model);
		} else {
			document.getElementById("llm-precent").innerHTML = '<span class="uk-text-warning">Please input model name</span>';  
		}
	});
	
	$('#setting-close').click(function() {
		$(".slide-panel").animate({ right: -350 }); 
	});
	
	$("#setting-del").click(function() {
		if (confirm("Are you sure to delete ai model?")) {
			let llm = $("#ai-model option:selected").text();
		
			chatApp.remove(llm); 	 
		} 
	}); 
	
    $("#setting-save").click(function() {  
		let options = { host: $("#host").val(), alive: $("#alive").val(), context: Number($("#ctxnum").val()), random: Number($("#random").val()) };  
		
		chrome.storage.local.set({ options: options }).then(() => {
			console.log("Value is set");
			
			chatApp.update(options); 
			
			$(".slide-panel").animate({ right: -350	}); 
		}); 
	});	

	chatApp.list();
});
