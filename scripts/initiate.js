import { ChatClient } from './ollama/chatclient.js';
import { tools, func_list } from './tools.js';
 
let options = { host: "http://localhost:11434", alive: "1h", context: 8192, random: 0.7 };
   
const client = new ChatClient(options);  

client.Tools = tools; 

window.client = client;
