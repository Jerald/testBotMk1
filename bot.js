const Discord = require('discord.js');
const MCping = require('mc-ping-updated');
const MongoClient = require('mongodb').MongoClient;

const bot = new Discord.Client();

const commandCharacter = process.env.COMMAND_CHAR;
const commandList = process.env.COMMAND_LIST.split(', ');
const token = process.env.DISCORD_TOKEN;

const mcServerIP = process.env.MC_SERVER_ADDRESS;
const mcServerPort = process.env.MC_SERVER_PORT;

const mongoURI = process.env.MONGODB_URI;

const admins = process.env.ADMIN_LIST.split(', ');

console.log('Allowable commands ' + process.env.COMMAND_LIST);

// Database
var database = null;
MongoClient.connect(mongoURI, (error, db) => {
	if (error) {
		console.log('ERROR ERROR ERROR');
		console.log('Database connection failure');
		throw error;
	}
	database = db;

	databaseSetup();
	databasePermissionSetup();
});

var commandPermissions = null;
function databaseSetup () {
	if (database === null) {
		console.log('Database error');
		throw 'ERROR';
	}

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

	console.log('Done with setting up the database!');
}

// Database

// Permissions
const permissionControlledCommands = process.env.PERMISSION_COMMANDS.split(', ');

function databasePermissionSetup () {
	console.log('Permission controlled commands: ' + permissionControlledCommands);

	for (let i = 0; i < permissionControlledCommands.length; i++) {
		let command = permissionControlledCommands[i];

		commandPermissions.findOne({'command': command}, {}, (error, result) => {
			if (error) {
				console.log('Error in finding commandPermission docuement');
				throw error;
			}

			if (result === null) {
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
	console.log('Done with setting up permissions!');
}
// Permissions

// Helper Functions
function print (value) {
	console.log('test' + value);
}

function parseArgs (message) {
	return message.content.substring(1, message.content.length).split(' ');
}

function sendMessage (message, contents) {
	message.channel.sendMessage(contents)
		.then(msg => console.log('Sent message: \'' + contents + '\' to channel ' + message.channel.name + ' in server ' + message.guild.name))
		.catch(function () {
			console.error;
			sendMessage(message, 'ERROR ERROR ERROR\n Message send failure');
		});
}

function deleteMessage (message) {
	message.delete()
		.then(msg => console.log('Deleted message by ' + msg.author.username + ' in channel ' + message.channel.name + ' in server ' + message.guild.name))
		.catch(console.error);
}

function getPermission (message, command, callback) {
	commandPermissions.findOne({'command': command}, {}, (error, item) => {
		if (error || item === null) {
			sendMessage(message, 'Error in locating document. @Oscar please fix me.');
			console.log(error);
		}

		callback(item.enabled);
	});
}
// Helper Functions

// Bot Functions
bot.on('ready', () => {
	console.log('Bot online!');
});

bot.on('message', (message) => {
	if (message.author.bot === true) {
		return;
	}

	if (message.content[0] === commandCharacter) {
		let args = parseArgs(message);

		if (commandList.includes(args[0])) {
			if (permissionControlledCommands.includes(args[0])) {
				console.log('test');

				getPermission(message, args[0], (permission) => {
					if (permission === false) {
						sendMessage(message, 'You\'re not allowed to use that command!');
					} else {
						commands[args[0]](message, args);
					}
				});
			} else {
				commands[args[0]](message, args);
			}
		} else {
			sendMessage(message, 'Unknown command. Please use **' + commandCharacter + 'help** for a list of commands');
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
	contents += '**' + commandCharacter + 'help** - Shows this\n';
	contents += '**' + commandCharacter + 'ping** - Prints \'pong\'\n';
	contents += '**' + commandCharacter + 'delspeak <words>** - Prints out **<words>** and then deletes the original message\n';
	contents += '**' + commandCharacter + 'enabled <command> (**"true"**|**"false"**)** - Sets whether or not **<command>** is usable. Requires bot admin status.';

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

		let contents = 'The server has ' + response.players.online + ' players online out of ' + response.players.max + '\n' + 'The players are: ';

		for (let i = 0; i < response.players.sample.length - 1; i++) {
			contents += response.players.sample[i].name + ', ';
		}
		contents += response.players.sample[response.players.sample.length - 1].name;

		sendMessage(message, contents);
	}, 3000);
};

commands.enabled = function (message, args) {
	if (admins.includes(message.author.username)) {
		commandPermissions.updateOne({'command': args[1]}, {$set: {'enabled': (args[2] === 'true')}}, {}, (error, result) => {
			if (error) {
				sendMessage(message, 'Error in setting permission. @Oscar please fix me');
				console.log(error);
			}
		});

		sendMessage(message, 'Command **' + args[1] + '** is now ' + (args[2] === 'true' ? 'enabled' : 'disabled'));
	}
};

bot.login(token);
