App = function() { 
	 
	this.state = false;
	this.looping = false;
	this.tools = null;
	
	this.addText = (name, str, css) => {
		var child = document.createElement("div");
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
			
			//start chat
			let message = enquire;
			
			this.addText('', message, "llm-send");	
			this.addText(llm, '<img src="images/loading.svg" alt="thinking" />', "llm-received"); 
			  
			try { 
				//send message
				await client.Send(llm, message, !this.looping, this.tools); 
			}
			catch(err) { 
				alert(err.message);	
			}
			
			this.state = false;	 
	};		  
		
	this.list = async () => {
		try {
			let data = await client.GetModels(); 
				
			for(var i = 0; i < data.length; i++ ) {			 
				$('#chat-model').append(
					$('<option>', {	value: i, text: data[i] })
				);                
			}	 
		}
		catch(err) {
			alert(err.message);
		}							
	}; 
	
	this.clear = () => {
		if (!this.state) {
			client.Reset();
		} 
	};		
};

const chatApp = new App();

addEventListener("DOMContentLoaded", () => { 
	$('#chat-send').click(function() {chatApp.send();});
	$('#chat-pause').click(function() {client.Stop();});
	$('#chat-clear').click(function() {chatApp.clear();});
 
	$('#chat-switch').change(function() {
		chatApp.looping = this.checked; 
	});
	
    chatApp.tools = availableFunc;
	
	chatApp.list();
});
