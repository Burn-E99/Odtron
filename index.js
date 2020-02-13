// Load up the discord.js library
const Discord = require("discord.js");
const readline = require("readline");

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

// Here we load the package.json file containing the version number
const package = require("./package.json");

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

client.on("ready", () => {
	// This event will run if the bot starts, and logs in, successfully.
	log2Discord(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.\nBot version is ${package.version}`);
	// Example of changing the bot's playing game to something useful. `client.user` is what the
	// docs refer to as the "ClientUser".
	client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
	// This event triggers when the bot joins a guild.
	log2Discord(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
	client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
	// this event triggers when the bot is removed from a guild.
	log2Discord(`I have been removed from: ${guild.name} (id: ${guild.id})`);
	client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("error", log2Discord);

client.on("message", async message => {
	// This event will run on every single message received, from any channel or DM.
	
	// It's good practice to ignore other bots. This also makes your bot ignore itself
	// and not get into a spam loop (we call that "botception").
	if(message.author.bot) return;
	
	// Also good practice to ignore any message that does not start with our prefix, 
	// which is set in the configuration file.
	if(message.content.indexOf(config.prefix) !== 0) return;
	
	// Here we separate our "command" name, and our "arguments" for the command. 
	// e.g. if we have the message "+say Is this the real life?" , we'll get the following:
	// command = say
	// args = ["Is", "this", "the", "real", "life?"]
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	
	// Let's go with a few common example commands! Feel free to delete or change those.
	
	if(command === "ping" || command === "") {
		// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
		// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
		const m = await message.channel.send("Ping?");
		m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
	}

	/* o!remind [datetime] [message]
	 * o!r [datetime] [message]
	 *  Sets a reminder for a specific datetime
	 *  Params:
	 *   datetime: 2020/5/17@5:34PM-EST
	 *             If timezone is missing, assume GMT. If AM/PM is missing, assume military time. If time is missing, assume 00:00.
	 *   message: The message the bot should remind the user with.
	 *            If message is missing, assume a generic message of the following:
	 *            "Hi @User, you requested to be reminded at datetime.[  This is the X hour notification.]"
	 */
	if(command === "remind" || command === "r") {
		const dateTimeRegex = /^(\d{4}\/(0[1-9]|[1-9]|1[012])\/(3[01]|[012][1-9]|[1-9]))\b(@(0[1-9]|[1-9]|1[012]):(0[1-9]|[1-5][0-9])([Aa,Pp][Mm])?(-[A-Z]{1,5})?)?$/;
		if(!dateTimeRegex.test(args[0])) {
			await message.channel.send("Please verify the date time argument matches `YYYY/MM/DD@HH:NNXX-TZ`\nWhere `YYYY` is Year, `MM` is is Month, `DD` is Day, `HH` is hour, `NN` is minutes, `XX` is either AM or PM, and `TZ` is your time zone.");
			return;
		}
		await message.channel.send("dateTime good")
	}

	/* o!remind [dowtime] [message]
	 * o!r [datetime] [message]
	 *  Sets a reminder for a specific datetime
	 *  Params:
	 *   dowtime: Thursday@5:34PM-EST
	 *             If timezone is missing, assume GMT. If AM/PM is missing, assume military time. If time is missing, assume 00:00.
	 *   message: The message the bot should remind the user with.
	 *            If message is missing, assume a generic message of the following:
	 *            "Hi @User, you requested to be repeatedly reminded every [dow] at [time]."
	 */
	if(command === "repeatremind" || command === "rr") {
		const dateTimeRegex = /^([a-zA-Z]{1,10})\b(@(0[1-9]|[1-9]|1[012]):(0[1-9]|[1-5][0-9])([Aa,Pp][Mm])?(-[A-Z]{1,5})?)?$/;
		if(!dateTimeRegex.test(args[0])) {
			await message.channel.send("Please verify the dow time argument matches `DOW@HH:NNXX-TZ`\nWhere `DOW` is a day of the week, `NN` is minutes, `XX` is either AM or PM, and `TZ` is your time zone.");
			return;
		}
		await message.channel.send("dowtime good")
	}
});

client.login(config.token);

function split2k(chunk) {
	chunk = chunk.replace(/\\n/g, "\n");
	let bites = [];
	while(chunk.length > 2000) {
		// take 2001 chars to see if word magically ends on char 2000
		let bite = chunk.substr(0, 2001);
		const etib = bite.split("").reverse().join("");
		const lastI = etib.indexOf(" ");
		if(lastI > 0) {
			bite = bite.substr(0, 2000 - lastI);
		} else {
			bite = bite.substr(0, 2000);
		}
		bites.push(bite);
		chunk = chunk.slice(bite.length);
	}
	// Push leftovers into bites
	bites.push(chunk);

	return bites;
}

function log2Discord(message) {
	if(typeof message !== "string") {
		message = JSON.stringify(message);
	}
	console.log(Date());
	console.log(message);
	const messages = split2k(message);
	for(let i=0;i<messages.length;i++) {
		client.channels.get(config.logChannel).send(messages[i]);
	}
}

function cmdPrompt() {
	rl.question("cmd> ", input => {
		const args = input.split(" ");
		command = args.shift().toLowerCase();
		if(command === 'exit') {
			process.exit();
		} else if(command === "m") {
			try {
				const channelID = args.shift();
				const message = args.join(" ");
				const messages = split2k(message);
				for(let i=0;i<messages.length;i++) {
					client.channels.get(channelID).send(messages[i]);
				}
			}
			catch(e) {
				console.error(e);
			}
		}  else if(command === "ml") {
			try {
				const message = args.join(" ");
				const messages = split2k(message);
				for(let i=0;i<messages.length;i++) {
					client.channels.get(config.logChannel).send(messages[i]);
				}
			}
			catch(e) {
				console.error(e);
			}
		} else if(command === 'help') {
			console.log("Odtron CLI Help:\n\nAvailable Commands:\n  exit - closes bot\n  m [ChannelID] [messgae] - sends message to specific ChannelID as the bot\n  ml [message] sends a message to the specified botlog\n  help - this message");
		} else {
			console.log("undefined command");
		}
		cmdPrompt();
	});
}
cmdPrompt();