const { Client } = require('discord.js');
const { r } = require('../ConstantStore');
const { readdir } = require('fs').promises;
const client = module.exports = new Client({ disableEveryone: true });
const config = require('../config.json');
client.config = config;
client.commands = new Map();
var moment = require('moment'); 
const chunk = require('chunk');
const Util = require('../Util');
const Discord = require('discord.js');

client.login(client.config.token);

(async () => {
    try {
        const commands = (await readdir(`${__dirname}/commands`) ).filter(e => e.endsWith('.js')).map(e => e.slice(0, -3));
        for (const c of commands) {
            const lCommand = c.toLowerCase();
            let { help, options, aliases, run } = require(`./commands/${c}`);
            if (typeof help !== 'object') help = {};
            if (typeof help.usage !== 'string' || !help.usage) help.usage = '';
            if (typeof help.description !== 'string' || !help.description) help.description = 'No description';
            if (typeof options !== 'object') options = {};
            if (typeof options.ownerOnly !== 'boolean') options.ownerOnly = false;
            if (!Array.isArray(aliases)) aliases = [];
            aliases = aliases.filter(a => a && typeof a === 'string');
            const commandObject = { name: c, help, options, aliases, run };
            client.commands.set(lCommand, commandObject);
            aliases.forEach(a => client.commands.set(a.toLowerCase(), commandObject));
        }
    } catch (e) {
        console.error('Error while loading events/commands:');
        console.error(e);
        process.exit();
    }
})();

setInterval(async () => {
    if(moment().format() == moment().startOf('Month')) {
        const botdujour = await Promise.all((await r.table('bots').filter({ verified: true }).merge(doc => ({
            random: r.random(1, 100)
        })).orderBy('random').sample(1).limit(1).run()).map(b => Util.attachPropBot(b, client.user)));
        const botdujours = chunk(botdujour, 1)
        const hbot = undefined;
        botdujours.map(chunk => chunk.map(bot => {
            const hbot = bot
            const botimg = client.users.cache.get(hbot.id).avatarURL()
            const Botembed = new Discord.MessageEmbed()
            .setColor("#2f3136")
            .setThumbnail(botimg)
            .setTitle(hbot.name)
            .setDescription(hbot.shortDescription)
            .addField("Liens",`[Voir](https://discbot.xyz/bot/${hbot.id}) | [Inviter](https://discbot.xyz/invite_url/${hbot.id})`)
            .setImage(hbot.background)
            .setFooter('DiscBot.xyz - Bot Random');
            client.channels.cache.get('933695895885721601').send(Botembed)
        }));
    }
}, 20000);

client.on('message', async msg => {
    if (msg.author.bot) return;
    const prefixes = [client.config.botPrefix, `<@${client.user.id}>`, `<@!${client.user.id}>`];
    const prefix = prefixes.filter(p => msg.content.toLowerCase().startsWith(p.toLowerCase()))[0];
    if (!prefix) return;
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const command = client.commands.get(args.shift().toLowerCase());
    if (!command) return;
    const owner = client.config.evalUsers.indexOf(msg.author.id) !== -1;
    if (command.options.ownerOnly && !owner) return;
    try {
       await command.run(client, msg, args, r);
    } catch (e) {
        console.error(`Error while running the ${command.name} command:`);
        console.error(e);
    }
});

client.on('ready', async () => {
    console.log(`[Discord] logged in as ${client.user.tag}`);
    client.user.setActivity('DiscBot.xyz', { type: 'WATCHING' });
});

client.on('guildMemberAdd', async member => {
    if(!member.user.bot) {
        const roleid =  member.guild.roles.cache.find(e => e.id === "933696348862173194");
        member.roles.add(roleid);
        let replies = [`${member} viens de nous rejoindre !`, `${member} à rejoins le côté obscure de la force`, `oh mais qui vois la je , c\'est ${member}` , `On dit bienvenue au roi ${member}`, `On me dit à l\'oreillete que ${member} viens de débarquer` ];
        let random = replies[Math.floor(Math.random() * replies.length)];
        const ch = member.guild.channels.cache.find( channel => channel.id === "928807927186354206");
        ch.send(`[<:online:772461320770551818>] ${random}`)
    }
    if (member.guild.id !== config.ids.mainServer) return;
    const bot = await r.table('bots').get(member.id);
    if (!bot || !bot.verified) return;
    member.roles.add(config.ids.botRole).catch(() => { });  
});

client.on('guildMemberRemove', async member => {
    if (member.guild.id !== config.ids.mainServer) return;
    const staffChannel = client.channels.cache.get(config.ids.staffChannel);
    if (member.user.bot) {
        const bot = await r.table('bots').get(member.user.id);
        if (!bot) return;
        const owner = await client.users.fetch(bot.ownerID);
        staffChannel.send(`**${member.user.tag}** (\`${member.user.id}\`) a quitter le serveur, mais ce bot est toujours sur le site. Le créateur est **${owner.tag}** (\`${owner.id}\`>)\nSupprimer : <${config.baseURL}/dashboard/bot/${member.user.id}/edit>`);
    }
    else {
        const bots = await r.table('bots').filter({ ownerID: member.user.id });
        if (!bots.length) return;
        staffChannel.send(`**${member.user.tag}** (\`${member.user.id}\`) a quitter le serveur, mais il a **${bots.length}** bot${bots.length === 1 ? '' : 's'} sur le site. Lien :\n${bots.map(b => ` - ${b.name} (URL: <${config.baseURL}/dashboard/bot/${b.id}/edit>)`).join('\n')}`);
    }
});