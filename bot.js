const Discord = require('discord.js');
const MCping = require('mc-ping-updated');
const MongoClient = require('mongodb').MongoClient;
const sleep = require('sleep');

const bot = new Discord.Client();

const commandCharacter = process.env.COMMAND_CHAR;
const commandList = process.env.COMMAND_LIST.split(', ');
const token = process.env.DISCORD_TOKEN;

const mcServerIP = process.env.MC_SERVER_ADDRESS;
const mcServerPort = process.env.MC_SERVER_PORT;

const mongoURI = process.env.MONGODB_URI;
const mongoConnectionTimeout = parseInt(process.env.MONGODB_TIMEOUT);

const admins = process.env.ADMIN_LIST.split(', ');

console.log('Allowable commands ' + process.env.COMMAND_LIST);
console.log('Timeout duration: ' + mongoConnectionTimeout);

// Database
var database = null;
MongoClient.connect(mongoURI, (error, db) => {
	if (error) {
		console.log('ERROR ERROR ERROR');
		console.log('Database connection failure');
		throw error;
	}
	console.log('test1');
	database = db;
});

sleep.sleep(mongoConnectionTimeout);
if (database === null) {
	console.log('Database timeout');
	throw 'ERROR';
}

var commandPermissions = null;
database.collection('commandPermissions', null, (error, collection) => {
	if (error) {
		console.log('commandPermissions collection does not exist (presumably that\'s the error)');
		return;
	}
	commandPermissions = collection;
});

if (commandPermissions === null) {
	database.createCollection('commandPermissions', (error, collection) => {
		if (error) {
			console.log('Failed to create new commandPermissions, something bad it happening...');
			throw error;
		}
		commandPermissions = collection;
	});
}
// Database

// Permissions
const permissionControlledCommands = process.env.PERMISSION_COMMANDS.split(', ');

for (var command in permissionControlledCommands) {
	commandPermissions.findOne({'command': command}, null, (error, result) => {
		if (error) {
			console.log('Unable to find permission document for command "' + command + '"');
			console.log('Creating entry...');
			commandPermissions.insert({'command': command, 'enabled': true}, null, (error, item) => {
				if (error) {
					console.log('Error creating new entry');
					throw error;
				}
			});

			console.log('Entry created!');
		}
	});
}

// Permissions

// Helper Functions
// function print (value) {
// 	console.log('test' + value);
// }

function parseArgs (message) {
	return message.content.substring(1, message.content.length).split(' ');
}

function sendMessage (message, contents) {
	message.channel.sendMessage(contents)
		.then(msg => console.log('Sent message: \'' + contents + '\' to channel ' + message.channel.name + ' in server ' + message.guild.name))
		.catch(function () {
			console.error;
			sendMessage(message, 'ERROR ERROR ERROR');
		});
}

function deleteMessage (message) {
	message.delete()
		.then(msg => console.log('Deleted message by ' + msg.author.username + ' in channel ' + message.channel.name + ' in server ' + message.guild.name))
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

	if (message.content[0] === commandCharacter) {
		let args = parseArgs(message);

		if (commandList.includes(args[0])) {
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
	sendMessage(message, 'pong');
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
	MCping(mcServerIP, mcServerPort, function (error, response) {
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

commands.enabled = function (message, args) {
	if (admins.includes(message.author.username)) {
		if (permissionControlledCommands.includes(args[1])) {

		}
	}
};

bot.login(token);
