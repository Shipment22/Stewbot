process.env=require("./env.json");
const { REST,Routes,PermissionFlagsBits,SlashCommandBuilder,ContextMenuCommandBuilder,ApplicationCommandType,ChannelType} = require('discord.js');
const fs=require("fs");

//Command permissions should be set to the level you would need to do it manually (so if the bot is deleting messages, the permission to set it up would be the permission to delete messages)
//Don't enable anything in DMs that is unusable in DMs (server configurations, multiplayer reliant commands, etc)

//This is a temporary way of specifying what contexts and where the command should appear while we await Discord.js' official implementation
/*
Contexts
0: Normal server usage
1: DMs with the Bot directly
2: User command from anywhere

Integration Types
0: Only as a server command
1: Only as a user command
*/
/*
categories=[//For auto generated help pages
	"General Bot Usage",//0
	"Reference",//1
	"Multiplayer",//2
	"Supporting Command",//3
	"Entertainment",//4
	"Administration",//5
	"Configuration"//6
];*/
const extraInfo={
	//Slash commands
	"help":{"contexts":[0,1,2],"integration_types":[0,1],"cat":0},
	"ping":{"contexts":[0,1,2],"integration_types":[0,1],"cat":0},
	"filter":{"contexts":[0],"integration_types":[0],"cat":6},
	"view_filter":{"contexts":[0],"integration_types":[0],"cat":3},
	"starboard_config":{"contexts":[0],"integration_types":[0],"cat":6},
	"fun":{"contexts":[0,1,2],"integration_types":[0,1],"cat":4},
	"kick":{"contexts":[0],"integration_types":[0],"cat":5},
	"ban":{"contexts":[0],"integration_types":[0],"cat":5},
	"timeout":{"contexts":[0],"integration_types":[0],"cat":5},
	"translate":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1},
	"define":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1},
	"counting":{"contexts":[0],"integration_types":[0],"cat":6},
	"next_counting_number":{"contexts":[0],"integration_types":[0],"cat":3},
	"general_config":{"contexts":[0],"integration_types":[0],"cat":6},
	"personal_config":{"contexts":[0,1,2],"integration_types":[0,1],"cat":6},
	"poll":{"contexts":[0],"integration_types":[0],"cat":2},
	"ticket":{"contexts":[0],"integration_types":[0],"cat":5},
	"auto-join-message":{"contexts":[0],"integration_types":[0],"cat":6},
	"auto-leave-message":{"contexts":[0],"integration_types":[0],"cat":6},
	"auto_roles":{"contexts":[0],"integration_types":[0],"cat":5},
	"report_problem":{"contexts":[0,1,2],"integration_types":[0,1],"cat":0},
	"log_config":{"contexts":[0],"integration_types":[0],"cat":6},
	"admin_message":{"contexts":[0],"integration_types":[0],"cat":5},
	"sticky-roles":{"contexts":[0],"integration_types":[0],"cat":6},
	"random":{"contexts":[0,1,2],"integration_types":[0,1],"cat":4},
	"auto-join-roles":{"contexts":[0],"integration_types":[0],"cat":6},
	"bible":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1},
	"levels_config":{"contexts":[0],"integration_types":[0],"cat":6},
	"leaderboard":{"contexts":[0,1,2],"integration_types":[0,1],"cat":2},
	"rank":{"contexts":[0],"integration_types":[0],"cat":2},
	"links":{"contexts":[0,1,2],"integration_types":[0,1],"cat":0},
	"chat":{"contexts":[0,1,2],"integration_types":[0,1],"cat":4},
	"embed_message":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1},
	"secret":{"contexts":[0,1,2],"integration_types":[0,1]},
	"timestamp":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1},
	"daily-config":{"contexts":[0],"integration_types":[0],"cat":6},
	"captcha":{"contexts":[1],"integration_types":[0,1]},
	"unavailable":{"contexts":[0,1,2],"integration_types":[0,1],"cat":2},
	"user":{"contexts":[0],"integration_types":[0],"cat":1},
	"rss":{"contexts":[0],"integration_types":[0],"cat":6},

	//Context Menu Commands
	"submit_meme":{"contexts":[0,1,2],"integration_types":[0,1],"cat":2,"desc":"Submit a meme to the Kestron moderators for verification to show up in `/fun meme`"},
	"translate_message":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1,"desc":"Attempt to autodetect the language of a message and translate it"},
	"move_message":{"contexts":[0],"integration_types":[0],"cat":5,"desc":"Move a message from one channel into another"},
	//"delete_message":{"contexts":[0,1],"integration_types":[0],"cat":5,"desc":"Delete a message using Stewbot; can be used to delete Stewbot DMs"},
	"remove_embeds":{"contexts":[0],"integration_types":[0],"cat":5,"desc":"Remove embeds from a message"},
	"prime_embed":{"contexts":[0,1,2],"integration_types":[0,1],"cat":1,"desc":"Get a message ready to be embedded using /embed_message"}
};
const commands = [
	new SlashCommandBuilder().setName("help").setDescription("View the help menu").addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		),
	new SlashCommandBuilder().setName('ping').setDescription('Check uptime stats').addBooleanOption(option=>
		option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
	),
	new SlashCommandBuilder().setName("filter").setDescription("Manage the filter for this server").addSubcommand(command=>
		command.setName("config").setDescription("Configure the filter for this server").addBooleanOption(option=>
				option.setName("active").setDescription("Should I remove messages that contain words configured in the blacklist?").setRequired(true)
			).addBooleanOption(option=>
				option.setName("censor").setDescription("Should I remove the filtered words from the message (true), or delete the message entirely (false)?")
			).addBooleanOption(option=>
				option.setName("log").setDescription("Post a summary of filtered messages to a staff channel? (Must set 'channel' on this command if true)")
			).addChannelOption(option=>
				option.setName("channel").setDescription("Which channel should I post summaries of deleted messages to?").addChannelTypes(ChannelType.GuildText)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("add").setDescription('Add a word to the filter').addStringOption(option=>
				option.setName("word").setDescription("The word to blacklist").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("remove").setDescription('Remove a word from the filter').addStringOption(option=>
				option.setName("word").setDescription("The word to remove from the blacklist").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("import").setDescription("Import a CSV wordlist").addAttachmentOption(option=>
				option.setName("file").setDescription("A .csv with comma seperated words you'd like to block").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName("view_filter").setDescription("View the list of blacklisted words for this server").setDMPermission(false).addBooleanOption(option=>
		option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
	),
	new SlashCommandBuilder().setName("starboard_config").setDescription("Configure starboard for this server").addBooleanOption(option=>
			option.setName("active").setDescription("Should I post messages to the configured channel?").setRequired(true)
		).addChannelOption(option=>
			option.setName("channel").setDescription("The channel to post messages to (Required for first config)").addChannelTypes(ChannelType.GuildText)
		).addStringOption(option=>
			option.setName("emoji").setDescription("The emoji to react with to trigger starboard (Default: ⭐)")
		).addIntegerOption(option=>
			option.setName("threshold").setDescription("How many reactions are needed to trigger starboard? (Default: 3)").setMinValue(1)
		).addStringOption(option=>
			option.setName("message_type").setDescription("What should the bot's starboard posts look like?").addChoices(
				{"name":"Make it look like the user posted","value":"0"},
				{"name":"Post an embed with the message and a greeting","value":"1"},
				{"name":"Post an embed with the message","value":"2"}
			)
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName("fun").setDescription("Posts something fun to enjoy").addSubcommand(command=>
			command.setName("meme").setDescription("Posts a meme").addIntegerOption(option=>
				option.setName("number").setDescription("Specific meme # to post (optional)").setMinValue(0)
			)
		).addSubcommand(command=>
			command.setName("joke").setDescription("Posts a joke")
		).addSubcommand(command=>
			command.setName("wyr").setDescription("Posts a Would-You-Rather question")
		).addSubcommand(command=>
			command.setName("dne").setDescription("Posts a picture of a person - who never existed! (AI Person generation)")
		).addSubcommand(command=>
			command.setName("rac").setDescription("Play a game of Rows & Columns").addBooleanOption(option=>
				option.setName("help").setDescription("View the rules instead of playing?")
			).addIntegerOption(option=>
				option.setName("size").setDescription("Set your amount of rows and start playing!").setMinValue(3).setMaxValue(25)
			)
		),
	new SlashCommandBuilder().setName("kick").setDescription("Kick a user").addUserOption(option=>
			option.setName("target").setDescription("Who to kick?").setRequired(true)
		).addStringOption(option=>
			option.setName("reason").setDescription("What is the reason for this kick?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("ban").setDescription("Ban a user").addUserOption(option=>
			option.setName("target").setDescription("Who to ban?").setRequired(true)
		).addStringOption(option=>
			option.setName("reason").setDescription("What is the reason for this ban?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("timeout").setDescription("Timeout a user").addUserOption(option=>
			option.setName("target").setDescription("Who to timeout?").setRequired(true)
		).addIntegerOption(option=>
			option.setName("hours").setDescription("Hours to timeout the user for?")
		).addIntegerOption(option=>
			option.setName("minutes").setDescription("Minutes to timeout the user for?")
		).addIntegerOption(option=>
			option.setName("seconds").setDescription("Seconds to timeout the user for?")
		).addStringOption(option=>
			option.setName("reason").setDescription("What is the reason for this timeout?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("translate").setDescription("Translate a string of text").addStringOption(option=>
			option.setName("what").setDescription("What to translate").setRequired(true)
		).addStringOption(option=>
			option.setName("language_from").setDescription("The language the original text is in (Default: autodetect)")
		).addStringOption(option=>
			option.setName("language_to").setDescription("The language you want the text translated into (Default: en)")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		),
	new SlashCommandBuilder().setName("define").setDescription("Get the definition for a word").addStringOption(option=>
			option.setName("what").setDescription("What to define").setRequired(true)
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		),
	new SlashCommandBuilder().setName("counting").setDescription("Manage counting functions for this server").addSubcommand(command=>
			command.setName("config").setDescription("Configure counting for this server").addBooleanOption(option=>
				option.setName("active").setDescription("Do counting things in this server?").setRequired(true)
			).addChannelOption(option=>
				option.setName("channel").setDescription("Channel to count in").addChannelTypes(ChannelType.GuildText)
			).addBooleanOption(option=>
				option.setName("reset").setDescription("Reset the count if a wrong number is posted (True to be on leaderboard)")
			).addBooleanOption(option=>
				option.setName("public").setDescription("Do you want this server to show up in the counting leaderboard?")
			).addIntegerOption(option=>
				option.setName("posts_between_turns").setDescription("How many posts do you need to wait between turns?").setMinValue(0)
			).addBooleanOption(option=>
				option.setName("apply-a-fail-role").setDescription("Should I apply a role to users who fail the count?")
			).addRoleOption(option=>
				option.setName("fail-role").setDescription("If fail roles are on, which role should be applied?")
			).addBooleanOption(option=>
				option.setName("apply-a-warn-role").setDescription("Should I apply a role to users who are warned?")
			).addRoleOption(option=>
				option.setName("warn-role").setDescription("If warn roles are on, which role should be applied?")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("set_number").setDescription("Set the next number to count at (Disqualifies from leaderboard)").addIntegerOption(option=>
				option.setName("num").setDescription("The number to count at next").setRequired(true).setMinValue(0)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName("next_counting_number").setDescription("View the next number to count at").addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDMPermission(false),
	new SlashCommandBuilder().setName("general_config").setDescription("Configure general behaviors").addBooleanOption(option=>
			option.setName("ai_pings").setDescription("Have the bot post an AI message when pinging it?")
		).addBooleanOption(option=>
			option.setName("embeds").setDescription("If a message link is posted, should I post a preview?")
		).addBooleanOption(option=>
			option.setName("disable_anti_hack").setDescription("Do you want to disable the anti hack/spam account protection for this server?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("personal_config").setDescription("Configure the bot for you personally").addBooleanOption(option=>
			option.setName("ai_pings").setDescription("Respond with an AI message to pings or DMs")
		).addBooleanOption(option=>
			option.setName("dm_infractions").setDescription("If you get filtered, should I DM you?")
		).addBooleanOption(option=>
			option.setName("dm_infraction_content").setDescription("If dm_infractions is true, should I include the content of the filtered message?")
		).addBooleanOption(option=>
			option.setName("embeds").setDescription("If you link a Discord message, should I embed a preview for you?")
		).addBooleanOption(option=>
			option.setName("level_up_messages").setDescription("Do you want to receive a message letting you know you leveled up?")
		).addBooleanOption(option=>
			option.setName("configure_timezone").setDescription("Open up a menu to configure your timezone?")
		),
	new SlashCommandBuilder().setName("poll").setDescription("Make a poll with automatically tracked options").addStringOption(option=>
			option.setName("prompt").setDescription("The prompt (We'll set options in a minute)").setRequired(true)
		).setDMPermission(false),
	new SlashCommandBuilder().setName("ticket").setDescription("Set up a ticket system here for users to contact mods").addChannelOption(option=>
			option.setName("channel").setDescription("The channel for tickets to be opened in on the staff end").addChannelTypes(ChannelType.GuildText).setRequired(true)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).setDMPermission(false),
	new SlashCommandBuilder().setName("auto-join-message").setDescription("Set up a message to be sent automatically when a user joins").addBooleanOption(option=>
			option.setName("active").setDescription("Should I send a message when the user joins?").setRequired(true)
		).addStringOption(option=>
			option.setName("message").setDescription("The message to be sent (Use \"${@USER}\" to mention the user)")
		).addStringOption(option=>
			option.setName("channel_or_dm").setDescription("Should I post this message in a channel or the user's DMs?").addChoices(
				{"name":"Channel","value":"channel"},
				{"name":"DM","value":"dm"}
			)
		).addChannelOption(option=>
			option.setName("channel").setDescription("The channel to post the message to").addChannelTypes(ChannelType.GuildText)
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("auto-leave-message").setDescription("Set up a message to be sent automatically when a user leaves").addBooleanOption(option=>
			option.setName("active").setDescription("Should I send a message when the user leaves?").setRequired(true)
		).addChannelOption(option=>
			option.setName("channel").setDescription("The channel to post the message to").addChannelTypes(ChannelType.GuildText).setRequired(true)
		).addStringOption(option=>
			option.setName("message").setDescription("The message to be sent (Use \"${@USER}\" to use the user's username)")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("auto_roles").setDescription("Setup a message with auto roles").addStringOption(option=>
			option.setName("message").setDescription("The message to be sent with the role options").setRequired(true)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).setDMPermission(false),
	new SlashCommandBuilder().setName("report_problem").setDescription("Report an error to be looked at").addStringOption(option=>
			option.setName("type").setDescription("What kind of problem are you reporting?").addChoices(
				{"name":"Profanity","value":"profanity"},
				{"name":"Controversial","value":"controversy"},
				{"name":"Bug or Error","value":"bug"},
				{"name":"Suggestion","value":"suggestion"},
				{"name":"Exploit","value":"exploit"},
				{"name":"Other","value":"other"}
			).setRequired(true)
		).addStringOption(option=>
			option.setName("details").setDescription("Can you please provide us some details?").setRequired(true)
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		),
	new SlashCommandBuilder().setName("log_config").setDescription("Configure log events").addBooleanOption(option=>
			option.setName("active").setDescription("Log server and user events to the designated channel?").setRequired(true)
		).addChannelOption(option=>
			option.setName("channel").setDescription("Which channel to post events to?").addChannelTypes(ChannelType.GuildText).setRequired(true)
		).addBooleanOption(option=>
			option.setName("channel_events").setDescription("Log channel events?")
		).addBooleanOption(option=>
			option.setName("emoji_events").setDescription("Log emoji and sticker events?")
		).addBooleanOption(option=>
			option.setName("user_change_events").setDescription("Log user changes?")
		).addBooleanOption(option=>
			option.setName("joining_and_leaving").setDescription("Log when a user joins/leaves?")
		).addBooleanOption(option=>
			option.setName("invite_events").setDescription("Log when an invite is made or deleted?")
		).addBooleanOption(option=>
			option.setName("role_events").setDescription("Log role events?")
		).addBooleanOption(option=>
			option.setName("mod_actions").setDescription("Log when a moderator performs an action")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog).setDMPermission(false),
	new SlashCommandBuilder().setName("admin_message").setDescription("Anonymously make a post in the server's name").addStringOption(option=>
			option.setName("what").setDescription("What to say").setMaxLength(2000).setRequired(true)
		).addUserOption(option=>
			option.setName("target").setDescription("The user to message")
		).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).setDMPermission(false),
	new SlashCommandBuilder().setName("sticky-roles").setDescription("Add roles back to a user who left and rejoined").addBooleanOption(option=>
			option.setName("active").setDescription("Should I add roles back to users who left and rejoined?").setRequired(true)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).setDMPermission(false),
	new SlashCommandBuilder().setName("random").setDescription("Get something random").addSubcommand(command=>
			command.setName("rng").setDescription("Generate a random number").addIntegerOption(option=>
				option.setName("low").setDescription("Lower bound of the random number? (Default: 1)")
			).addIntegerOption(option=>
				option.setName("high").setDescription("Upper bound of the random number? (Default: 10)")
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("coin-flip").setDescription("Flip a number of coins").addIntegerOption(option=>
				option.setName("number").setDescription("How many coins should I flip?").setMinValue(1).setMaxValue(10)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("8-ball").setDescription("Ask a question and receive an entirely random response").addStringOption(option=>
				option.setName("question").setDescription("What question are you asking?").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("dice-roll").setDescription("Roll a number of dice").addIntegerOption(option=>
				option.setName("number").setDescription("How many dice to roll?").setMinValue(1).setMaxValue(10)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		),
	new SlashCommandBuilder().setName("auto-join-roles").setDescription("Automatically add roles to a user when they join the server").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).setDMPermission(false),
	new SlashCommandBuilder().setName("bible").setDescription("Look up a verse or verses in the King James version of the Bible").addStringOption(option=>
			option.setName("book").setDescription("What book of the Bible do you wish to look up?").setRequired(true)
		).addIntegerOption(option=>
			option.setName("chapter").setDescription("Which chapter do you want to look up?").setRequired(true)
		).addStringOption(option=>
			option.setName("verse").setDescription("What verse or verses do you want to look up? (Proper format for multiple verses is '1-3')").setRequired(true)
		),
	new SlashCommandBuilder().setName("levels_config").setDescription("Configure level ups").addBooleanOption(option=>
			option.setName("active").setDescription("Should level ups be active?").setRequired(true)
		).addChannelOption(option=>
			option.setName("channel").setDescription("Which channel should level ups go to, if set to a specific channel?")
		).addStringOption(option=>
			option.setName("message").setDescription("What gets sent at a new level. Use ${USER} for ping, ${USERNAME} for username, ${LVL} for level.").setMinLength(1)
		).addStringOption(option=>
			option.addChoices(
				{"name":"Specific Channel",value:"channel"},
				{"name":"DM",value:"DM"},
				{"name":"Inline","value":"inline"}
			).setName("location").setDescription("Where should level up messages be sent?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName("leaderboard").setDescription("View a leaderboard").addStringOption(option=>
			option.setName("which").setDescription("Which leaderboard do you want to see?").setChoices(
				{name:"Counting",value:"counting"},
				{name:"Starboard",value:"starboard"},
				{name:"Cleanliness",value:"cleanliness"},
				{name:"Level-Ups",value:"levels"}
			).setRequired(true)
		).addUserOption(option=>
			option.setName("who").setDescription("If applicable, who's spot on the leaderboard do you wish to highlight?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDMPermission(false),
	new SlashCommandBuilder().setName("rank").setDescription("Your rank for this server's level ups").addUserOption(option=>
			option.setName("target").setDescription("Who's rank are you trying to view?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDMPermission(false),
	new SlashCommandBuilder().setName("links").setDescription("Get a list of links relevant for the bot").addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		),
	new SlashCommandBuilder().setName("chat").setDescription("Chat with the bot").addStringOption(option=>
			option.setName("what").setDescription("What to say").setRequired(true)
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		),
	new SlashCommandBuilder().setName("embed_message").setDescription("Embed a message link from another channel or server").addStringOption(option=>
			option.setName("link").setDescription("The message link, or PRIMED if you used the /prime_embed context menu command").setRequired(true)
		),

	new SlashCommandBuilder().setName("secret").setDescription("It's a secret to everybody").addStringOption(option=>
			option.setName("code").setDescription("Do you have something for me?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		),
	new SlashCommandBuilder().setName("timestamp").setDescription("Generate a timestamp for use in your message"),
	new SlashCommandBuilder().setName("daily-config").setDescription("Configure daily devos (More types to come!)").addBooleanOption(option=>
			option.setName("active").setDescription("Should I run this daily type?").setRequired(true)
		).addChannelOption(option=>
			option.setName("channel").setDescription("The channel for me to post this daily type in").addChannelTypes(ChannelType.GuildText).setRequired(true)
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new SlashCommandBuilder().setName("captcha").setDescription("Use this command if I've timed you out for spam").setDMPermission(true),
	/*new SlashCommandBuilder().setName("unavailable").setDescription("Use this to automatically tell users who ping you that you're unavailable").addBooleanOption(option=>
			option.setName("active").setDescription("Are you unavailable?").setRequired(true)
		).addBooleanOption(option=>
			option.setName("globally").setDescription("Unavailable in every server you're pinged in, or just this one? (Default: global)")
		).addStringOption(option=>
			option.setName("message").setDescription("Message to send when you get pinged (Use `\\n` for a line break)").setMinLength(5)
		).addStringOption(option=>
			option.setName("how_long").setDescription("How long will you be unavailable for? (Paste a Discord timestamp, use /timestamp to make one!)")
		).addBooleanOption(option=>
			option.setName("auto_deactivate").setDescription("Deactivate automatically the next time you send a message?")
		).setDMPermission(true),*/
	new SlashCommandBuilder().setName("user").setDescription("Display a user's profile").addBooleanOption(option=>
			option.setName("large-pfp").setDescription("Display the PFP in large mode?")
		).addUserOption(option=>
			option.setName("who").setDescription("Who do you want to display?")
		).addBooleanOption(option=>
			option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
		).setDMPermission(false),
	new SlashCommandBuilder().setName("rss").setDescription("Commands relating to RSS feeds").addSubcommand(command=>
			command.setName("follow").setDescription("Follow an RSS feed").addChannelOption(option=>
				option.setName("channel").setDescription("The channel to follow this RSS feed in").setRequired(true)
			).addStringOption(option=>
				option.setName("feed").setDescription("The feed to follow").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("unfollow").setDescription("Unfollow an RSS feed").addChannelOption(option=>
				option.setName("channel").setDescription("The channel to unfollow this RSS feed from").setRequired(true)
			).addStringOption(option=>
				option.setName("feed").setDescription("The feed to unfollow (Type 'all' to unfollow all)").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).addSubcommand(command=>
			command.setName("check").setDescription("Check the RSS feeds a channel follows").addChannelOption(option=>
				option.setName("channel").setDescription("The channel to check RSS feeds for").setRequired(true)
			).addBooleanOption(option=>
				option.setName("private").setDescription("Make the response ephemeral?").setRequired(false)
			)
		).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	new ContextMenuCommandBuilder().setName("submit_meme").setType(ApplicationCommandType.Message),
	//new ContextMenuCommandBuilder().setName("delete_message").setType(ApplicationCommandType.Message).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),//Leaving this in DMs to delete undesirable bot DMs
	new ContextMenuCommandBuilder().setName("translate_message").setType(ApplicationCommandType.Message),
	new ContextMenuCommandBuilder().setName("move_message").setType(ApplicationCommandType.Message).setDMPermission(false),
	new ContextMenuCommandBuilder().setName("remove_embeds").setType(ApplicationCommandType.Message).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false),
	new ContextMenuCommandBuilder().setName("prime_embed").setType(ApplicationCommandType.Message)
]
.map(command => Object.assign(command.toJSON(),extraInfo[command.toJSON().name]));
const rest = new REST({ version: '9' }).setToken(process.env.token);
var comms={};
rest.put(Routes.applicationCommands(process.env.clientId),{body:commands}).then(d=>{
	d.forEach(c=>{
		comms[c.name]={
			mention:`</${c.name}:${c.id}>`,
			id:c.id,
			name:c.name,
			description:c.description,
			contexts:c.contexts,
			integration_types:c.integration_types,
			type:c.type,
			default_member_permissions:c.default_member_permissions
		};
		if(c.hasOwnProperty("options")){
			c.options.forEach(o=>{
				if(o.type===1){
					comms[c.name][o.name]={
						mention:`</${c.name} ${o.name}:${c.id}>`,
						id:c.id,
						name:o.name,
						description:o.description,
						contexts:c.contexts,
						integration_types:c.integration_types,
						type:o.type,
						default_member_permissions:c.default_member_permissions
					};
				}
			});
		}
	});
	fs.writeFileSync("./commands.json",JSON.stringify(comms));
	console.log("Updated commands on Discord and wrote commands to ./commands.json");
}).catch(console.error);