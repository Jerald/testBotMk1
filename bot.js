const Discord = require('discord.js');
const mcping = require('mc-ping-updated');

const bot = new Discord.Client();

const commandCharacter = process.env.COMMAND_CHAR;
var messageList = process.env.COMMAND_LIST.split(', ');
var token = process.env.DISCORD_TOKEN;

const mcServerIP = process.env.MC_SERVER_ADDRESS;
const mcServerPort = process.env.MC_SERVER_PORT;

console.log('Permissable messages: ' + process.env.COMMAND_LIST);

// Helper Functions
// function print (value) {
// 	console.log('test' + value);
// }

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
var commands = {};

commands.help = function (message, args) {
	let contents = '';

	contents += 'testBotMk1: A cool discord.js bot for doing cool things\n';
	contents += '\n';
	contents += commandCharacter + 'help - Shows this\n';
	contents += commandCharacter + 'ping - Prints \'pong\'\n';
	contents += commandCharacter + 'delspeak <words> - Prints out <words> and then deletes the original message\n';

	sendMessage(message, contents);
};

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

commands.mcping = function (message, args) {
	mcping(mcServerIP, mcServerPort, function (error, response) {
		if (error) {
			console.error(error);
			sendMessage(message, 'It\'s dead jim.\nGet Oscar to check the logs if the server isn\'t actually dead.');
			return;
		}

		let contents = 'The server has ' + response.players.online + ' players online out of ' + response.players.max + '\n';
		contents += 'The players are: ';

		console.log(typeof response.players.sample);

		for (let i = 0; i < response.players.sample.length - 1; i++) {
			contents += response.players.sample[i].name + ', ';
		}
		contents += response.players.sample[response.players.sample.length - 1].name;

		sendMessage(message, contents);
	}, 3000);
};

bot.login(token);
