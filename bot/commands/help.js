const { MessageEmbed } = require("discord.js");

module.exports.run = async (client, msg) => {
    let help = new MessageEmbed()
    .setTitle(`HELP - ${msg.author.tag}`, msg.author.displayAvatarURL)
    .setColor(client.config.embedColor)
    .addField(`Help`, `Liste des commandes du BOT\n**Usage:**\n${client.config.botPrefix}[help|cmds|commands]`, true)
    .setFooter("Help", client.user.displayAvatarURL)
    .setTimestamp();
    msg.channel.send(help);
};

module.exports.help = {
    name: 'help',
    category: 'Help',
    description: "Permet d'avoir la page d'aide.",
    usage: 'help <cmd>'
};