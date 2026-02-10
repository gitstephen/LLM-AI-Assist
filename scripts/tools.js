export const tools = [
{
	type: 'function',
	function: {
		name: 'getTemperature',
		description: 'Get the current temperature for a city',
		parameters: {
			type: 'object', 
			properties: {
				city: { type: 'string', description: 'City name' } 
			},
			required: ['city']
		} 
	} 
},
{
	type: 'function',
	function: {
		name: 'getCurrentDate',
		description: 'Get the current date time',
		parameters: {
			type: 'object', 
			properties: {},
			required: []
		}
	}
},
{
	type: 'function',
	function: {
		name: 'getWeekDay',
		description: 'Get the day of the week',
		parameters: {
			type: 'object', 
			properties: {},
			required: []
		}
	} 
},
{
	type: 'function',
	function: {
		name: 'getLocation',
		description: 'find the place location of map',
		parameters: {
			type: 'object', 
			properties: {
				name: { type: 'string', description: 'place name' } 
			},
			required: ['name']
		}		
	}
}];

export const func_list = {
    addTwoNumbers: (args) => {
		return args.a + args.b; 
	},
	getTemperature: (args) => {
		return args.city + " 90"; 
	},
	getCurrentDate: (args) => {
		const date = new Date();
 
		let year = date.getFullYear();
		let month = date.getMonth() + 1;
		let strDate = date.getDate();
		
		if (month >= 1 && month <= 9) {
			month = "0" + month;
		}
		
		if (strDate >= 0 && strDate <= 9) {
			strDate = "0" + strDate;
		}
		
		let dt = year + "-" + month + "-" + strDate
				+ " " + date.getHours() + ":" + date.getMinutes()
				+ ":" + date.getSeconds();
				
		return dt;		 
	},
	getWeekDay: (args) => {
		const dt = new Date();
		const day = dt.getDay();
		
		const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		
		return dayNames[day];
	},
	getLocation: (args) => {
		const url = "https://www.google.com/maps/search/" + args.name;
		
		window.open(url, "Ollama");
		
		return "fidn " + args.name + " on google map";
	}
};
