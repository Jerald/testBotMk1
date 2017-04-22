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
// TODO: Implement user collection in the database
var userInfoCollection = null;
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
				console.log('Failed to create new commandPermissions, something bad is happening...');
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
	let args = message.content.substring(1, message.content.length).split(' ');

	for (let i = 0; i < args.length; i++) {
		args[i] = args[i].toLowerCase();
	}

	return args;
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

function isNumber (value) {
	return !isNaN(value);
}

function correctNumberOfArgs (message, args, number) {
	if (args.length > number) {
		sendMessage(message, 'Invalid number of arguments. Check out the help function by sending **' + commandCharacter + 'help** to figure out how to use this command.');
		return false;
	}

	return true;
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
			if (permissionControlledCommands.includes(args[0]) && admins.includes(message.author.username) === false) {
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
			sendMessage(message, 'Unknown command. Please use `' + commandCharacter + 'help` for a list of commands');
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
	contents += '`' + commandCharacter + 'help`- Shows this\n';
	contents += '`' + commandCharacter + 'ping`- Prints \'pong\'\n';
	contents += '`' + commandCharacter + 'delspeak <words>` - Prints out `<words>` and then deletes the original message\n';
	contents += '`' + commandCharacter + 'enabled <command> (true|false)` - Sets whether or not `<command>` is usable. Requires bot admin status\n';
	contents += '`' + commandCharacter + 'mcping` - Pings the minecraft server and says what users are online\n';
	contents += '`' + commandCharacter + 'xkcd <number>` - Shows the xkcd comic whose number is `<number>`. If no `<number>` is given, shows the most recent comic\n';
	contents += '`' + commandCharacter + 'delete <number>` - Deletes `<number>` of messages. If no `<number>` is given, deletes the most recent message\n';

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
	MCping(mcServerIP, mcServerPort, (error, response) => {
		if (error || response == null) {
			print(1);
			console.error(error);
			sendMessage(message, 'It\'s dead jim.\nGet Oscar to check the logs if the server isn\'t actually dead.');
			return;
		}

		let contents = '';
		if (response.players.online > 0) {
			contents = 'The server has ' + response.players.online + ' player(s) online out of ' + response.players.max + '\n' + 'The player(s) are: ';

			for (let i = 0; i < response.players.sample.length - 1; i++) {
				contents += response.players.sample[i].name + ', ';
			}
			contents += response.players.sample[response.players.sample.length - 1].name;
		} else {
			contents = 'The server is currently empty.';
		}

		sendMessage(message, contents);
	}, 3000);
};

commands.enabled = function (message, args) {
	if (admins.includes(message.author.username)) {
		if (args[2] !== 'true' && args[2] !== 'false' && args.length > 2) {
			sendMessage(message, 'Invalid command state. Please use \'true\' or \'false\'.');
			return;
		}

		commandPermissions.updateOne({'command': args[1]}, {$set: {'enabled': (args[2] === 'true')}}, {}, (error, result) => {
			if (error) {
				sendMessage(message, 'Error in setting permission. @Oscar please fix me');
				console.log(error);
				return;
			}

			if (result.matchedCount === 0)	{
				sendMessage(message, 'Attempt to change permission failed. Command either does not exist or is not set to be permission controlled.');
			} else if (result.matchedCount === 1)	{
				sendMessage(message, 'Command **' + args[1] + '** is now ' + (args[2] === 'true' ? 'enabled' : 'disabled'));
			} else {
				sendMessage(message, 'Something went bad with setting command permission. @Oscar please fix me');
			}
		});
	} else {
		sendMessage(message, 'You\'re not an admin!');
	}
};

commands.xkcd = function (message, args) {
	if (correctNumberOfArgs(message, args, 2) === false) {
		return;
	}

	let content = 'https://xkcd.com/';

	if (args.length === 1) {
		sendMessage(message, content);
	} else {
		if (isNumber(args[1]) === false) {
			sendMessage(message, 'Please send a number and ONLY a number as the argument.');
		} else {
			sendMessage(message, content + args[1]);
		}
	}
};

commands.delete = function (message, args) {
	if (correctNumberOfArgs(message, args, 2) === false) {
		return;
	}

	if (args.length === 1) {
		message.channel.bulkDelete(2).catch(console.error);
	} else {
		if (isNumber(args[1]) === false) {
			sendMessage(message, 'Please send a number and ONLY a number as the argument.');
		} else {
			if (args[1] < 1 || args[1] > 99) {
				sendMessage(message, 'Please choose a number between 1 and 99 (inclusive).');
				return;
			}

			message.channel.bulkDelete(parseInt(args[1]) + 1).catch(console.error);
		}
	}
};

bot.login(token);
