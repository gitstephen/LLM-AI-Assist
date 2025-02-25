var App = function(client) {
	
	this.stream = client;
		
	this.state = false;
	this.looping = false;
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
		this.changeState();
		
		//start chat
		let message = enquire;
		
		this.addText(message, "llm-send");	
		this.addText('<img src="images/loading.svg" alt="thinking" />', "llm-received"); 
		  
		try { 
			//send message
			await this.stream.Send(llm, message, !this.looping, this.tools); 
		}
		catch(err) { 
			this.addText(err.message, "llm-received llm-error");  
		}
		
		this.state = false;	 
	};		  
		
	this.list = async () => {
		try {
			let data = await this.stream.GetModels();  
				
			for(var i = 0; i < data.length; i++ ) { 
				$('#chat-model').append(
					$('<option>', {	value: i, text: data[i] })
				); 
			} 
		}
		catch(err) {
			this.addText("Not found AI model", "llm-received llm-error");	
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
	
	this.changeState = () => {	 
		$("#chat-send").toggle();
		$("#chat-pause").toggle();	 
	} 
};

var chatApp;

addEventListener("DOMContentLoaded", () => {  
	chatApp = new App(client); 

	$('#chat-send').click(function() { 
		chatApp.get();	 
	});
	
	$('#chat-pause').click(function() {
		chatApp.stop(); 
	});
	
	$('#chat-clear').click(function() {
		chatApp.clear();
	});
 
	$('#chat-switch').change(function() {
		chatApp.looping = this.checked; 
	});
	
    chatApp.tools = availableFunc;
	
	chatApp.list();
});
