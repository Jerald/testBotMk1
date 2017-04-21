const fs = require('fs');
const Discord = require('discord.js');
const bot = new Discord.Client();

const path = './';
const tokenFileName = 'token.txt';
const commandsFileName = 'commands.txt';
const commandCharacter = '>';

const token = fs.readFileSync(path + tokenFileName, 'utf8');

var commands = {};

var messageList;
fs.readFile(path + commandsFileName, 'utf8', (error, data) => {
	if (error) throw error;

	messageList = data.split('\r\n');
	console.log('Messages: ');
	console.log(messageList);
	console.log();
});

// Helper Functions
function print (value) {
	console.log('test' + value);
}

function parseArgs (message) {
	return message.content.substring(1, message.content.length).split(' ');
}

function sendMessage (message, contents) {
	message.channel.sendMessage(contents)
		.then(msg => console.log('Sent message: ' + contents + '\n' + 'To: ' + message.guild.name + ' in ' + message.channel.name))

		.catch(function () {
			console.error;
			sendMessage(message, 'ERROR ERROR ERROR');
		});
}

function deleteMessage (message) {
	message.delete()
		.then(msg => console.log('Deleted message from ' + msg.author.username))
		.catch(console.error);
}
// Helper Functions

// Bot Functions
bot.on('ready', () => {
	console.log('I\'m ready!');
});

bot.on('message', (message) => {
	if (message.author.bot === true) {
		return;
	}

	console.log(message.content[0]);
	if (message.content[0] === commandCharacter) {
		let args = parseArgs(message);

		if (messageList.includes(args[0])) {
			commands[args[0]](message, args);
		}
	}
});
// Bot Functions

// Message functions
commands.ping = function (message, args) {
	message.channel.sendMessage('pong');
};

commands.delspeak = function (message, args) {
	let contents = '';
	for (let i = 1; i < args.length - 1; i++) {
		contents += (args[i] + ' ');
	}
	contents += (args[args.length - 1]);

	sendMessage(message, contents);

	deleteMessage(message);
};

commands.del = function (message, args) {
	message.delete();
};

bot.login(token);
