var App = function(client) {
	this.stream = client;
	
	this.state = false;
	this.looping = false;
	this.tools = null;
	
	this.addText = (name, str, css) => {
		let child = document.createElement("div");
		child.setAttribute('class', 'llm-message ' + css); 
		
		child.innerHTML = `<div>
							<b>${name}</b>
							<p>${str}</p> 
						</div>`; 
		
		let parent = document.getElementById("llm-dialog");	
		
		parent.appendChild(child); 
	};	

	this.send = async () => {
		if (this.state) return;
		
		let llm = $("#chat-model option:selected").text();
		let enquire = $("#enquire").val();
		
		if (llm == "" || enquire == "") {  
			alert("please select a model and input the text");	
			return;
		}
			
		this.state = true;	 
		this.changeState();
		
		//start chat
		let message = enquire;
		
		this.addText('', message, "llm-send");	
		this.addText(llm, '<img src="images/loading.svg" alt="thinking" />', "llm-received"); 
		  
		try { 
			//send message
			await this.stream.Send(llm, message, !this.looping, this.tools); 
		}
		catch(err) { 
			this.showError("Error: " + err.message); 
		}
		
		this.state = false;	 
	};		  
		
	this.list = async () => {
		try {
			let data = await this.stream.GetModels(); 
			
			$('#chat-model').append(
				$('<option>', {	value: -1, text: "" })
			); 
				
			for(var i = 0; i < data.length; i++ ) {			 
				$('#chat-model').append(
					$('<option>', {	value: i, text: data[i] })
				); 
			} 
		}
		catch(err) {
			alert("Error: " + err.message);
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
	
	this.showError = (msg) => {  
		this.stream.chars.innerHTML += "<br />" + msg; 
		
		this.changeState();
	};
};


var chatApp;

addEventListener("DOMContentLoaded", () => {  
	chatApp = new App(client); 

	$('#chat-send').click(function() { 
		chatApp.send();	 
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
