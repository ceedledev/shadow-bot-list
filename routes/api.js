const { readFileSync } = require('fs');
const express = require('express');
const app = (module.exports = express.Router());
const Joi = require('joi');
const Discord = require("discord.js");
const { r, bot: client } = require('../ConstantStore');
const randomString = require('randomstring');
const Util = require('../Util');
const ms = require('ms');
const multer  = require('multer');
const upload = multer({});

const libList = (module.exports.libList = [
    'discordcr',
    'Nyxx',
    'Discord.Net',
    'DSharpPlus',
    'Nostrum',
    'coxir',
    'DiscordGo',
    'Discord4J',
    'Javacord',
    'JDA',
    'discord.js',
    'Eris',
    'Discordia',
    'RestCord',
    'Yasmin',
    'disco',
    'discord.py',
    'discordrb',
    'serenity',
    'SwiftDiscord',
    'Sword',
    'BDScript'
]);

const tagbot = (module.exports.tagbot = [
    'Musique',
    'Fun',
    'Modération',
    'Jeu',
    'Rôleplay',
    'Economie' ,
    'Utile',
    'Stream',
    'Social',
    'Leveling',
    'Anime'
]);

const config = require('../config.json');

const badBots = readFileSync('./badbots.txt', 'utf-8').split('\n').map(b => b.split(' ')[0]);
console.log(`[api-route] loaded ${badBots.length} bad bots.`);

app.get('/search/autocomplete', async (req, res) => {
    const q = req.query.q;
    if (typeof q !== 'string') return res.sendStatus(400);
    const bots = (await r.table('bots').filter(bot => bot('name').downcase().match('^' + q.toLowerCase()).and(bot('verified'))).pluck('name').limit(5).run()).map(bot => bot.name);
    res.json({ ok: 'View data property', data: bots });
});

app.use((req, res, next) => {
    if (req.isAuthenticated()) next();
    else {
        res.status(401).json({ error: 'not_authenticated' });
    }
});

app.get('/', (req, res) => {
    res.json({ ok: 'you found the api!' });
});

const annonce = Joi.object().required().keys({
    shortDescription: Joi.string()
    .min(50).max(130)
        .required(),
    title: Joi.string()
        .required(),
    longDescription: Joi.string()
        .min(100)
        .max(1200)
        .required(),
    email: Joi.string()
        .max(50)
        .required(),
    budget: Joi.string()
        .required(),
    id: Joi.string()
        .required(),
});

app.post('/bot/annonce', async (req, res) => {
    const client = require('../ConstantStore').bot;
    if (Util.handleJoi(annonce, req, res)) return;
    const data = Util.filterUnexpectedData(
        req.body,
        {   createdAt: +new Date(), verified: false },
        annonce
    );
    const us = await Promise.all(await r.table('job').filter({id: data.id}).run())
    if(us.length > 0 ) return res.status(404).json({error: 'Limit'});
    const user = await client.guilds.cache.get(config.ids.mainServer).members.cache.get(data.id);
    if (!user) return res.status(403).json({ error: 'You have to join the SBL discord server to add an ad' });
    await r.table('job').insert(data).run();	   
    res.status(200).json({ ok: 'ads created' });
    client.channels.cache.get("ID DU SALON DEMANDE D'AIDE").send(`📥 **<@${req.user.id}>** has added an ad **${data.title}** `);
});

const webhook = Joi.object().required().keys({
    likeWebhook: Joi.string().uri({ scheme: ['http', 'https'] }),
    webhookAuth: Joi.string()
});

app.post('/bot/:id/config', async (req, res) => {
    const client = require('../ConstantStore').bot;
    if (Util.handleJoi(webhook, req, res)) return;
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return res.status(404).json({ error: 'unknown bot' });
    if(!(req.user.admin || req.user.owner || req.user.id === bot.ownerID)) return res.status(403).json({ error: 'No permission' });
    const data = Util.filterUnexpectedData(req.body, { editedAt: +new Date() }, webhook);
    await r.table('bots').get(bot.id).update({likeWebhook: `${data.likeWebhook}`, webhookAuth: `${data.webhookAuth}`}).run();     
    res.json({ ok: 'Save' }); 
});

const newBotSchema = Joi.object().required().keys({
    shortDescription: Joi.string()
    .min(50).max(90)
        .required(),
    id: Joi.string()
        .length(18)
        .required(),
    longDescription: Joi.string()
        .min(100)
        .max(1200)
        .required(),
    prefix: Joi.string()
        .max(50)
        .required(),
    invite: Joi.string()
        .uri({ scheme: ['https', 'http'] })
        .required(),
    website: Joi.string().uri({ scheme: ['https', 'http'] }),
    library: Joi.string(),
    tags: Joi.string(),  
    github: Joi.string().uri({ scheme: ['https'] }),
    likeWebhook: Joi.string().uri({ scheme: ['http', 'https'] }),
    webhookAuth: Joi.string()
}).with('likeWebhook', 'webhookAuth');

app.post('/bot/link', async (req, res) => {
    res.json({ ok: 'Ok' });
    const user = await r.table('users').get(req.user.id)
    if(!user.invitecode) {
        client.guilds.cache.get('922505945983102996').channels.cache.get('928807927186354206').createInvite({maxUses: 0, maxAge: 0,unique: true}).then(async function(e) {
            await r.table('users').get(req.user.id).update({invitecode: `${e.code}`, invitecount: e.uses})
        })
    } else {
        res.json({ error: 'You already have a link' });
    }
});

app.post('/bot', async (req, res) => {
    const client = require('../ConstantStore').bot;
    if (Util.handleJoi(newBotSchema, req, res)) return;
    const data = Util.filterUnexpectedData(
        req.body,
        { inviteClicks: 0, pageViews: 0, vote: 0,credit: 0,ratenumber: 0,ratedate: +new Date(), apiToken: randomString.generate(30), ownerID: req.user.id, createdAt: +new Date(), verified: false, background: 'https://cdn.discordapp.com/attachments/708013329603624970/785804711012859914/Sans_titre_-_2020-12-08T104712.505.png' },
        newBotSchema
    );
    if (data.library && !libList.includes(data.library)) return res.status(400).json({ error: 'Invalid library' });
    if (data.tags && !tagbot.includes(data.tags)) return res.status(400).json({ error: 'Invalid tag' });
    if (badBots.includes(data.id)) res.status(403).json({ error: 'Blacklisted bot' });
    const botUser = client.users.cache.get(data.id) || (await client.users.fetch(data.id));
    if (!botUser) return res.status(404).json({ error: 'Invalid id' });
    if (!botUser.bot) return res.status(400).json({ error: 'ID doesn\'t belong to a bot' });
    const user = await client.guilds.cache.get(config.ids.mainServer).members.cache.get(data.ownerID);
    if (!user) return res.status(403).json({ error: 'You have to join the SBL discord server to add a bot' });
    const dbeBot = await r.table('bots').get(data.id).run();
    if (dbeBot) return  res.status(403).json({error: 'The bot is already on the site'});
    await r.table('bots').insert(data).run();		
	await r.table('bots').filter({"id": data.id}).update({"name": botUser.username, "discriminator": botUser.discriminator, "tag": botUser.username + "#" + botUser.discriminator}).run();		
    res.status(200).json({ ok: 'Created bot' });
    client.channels.cache.get(config.ids.logChannel).send(`📥 **<@${req.user.id}>** added **${botUser.username}** (<@&${config.ids.staffRole}>)`);
});

const background = Joi.object().required().keys({
    bg: Joi.string()
});

const editBotSchema = Joi.object().required().keys({
    shortDescription: Joi.string().min(50).max(90),
    longDescription: Joi.string().min(100).max(1200),
    prefix: Joi.string().max(50),
    invite: Joi.string().uri({ scheme: ['https', 'http'] }),
    website: Joi.string().uri({ scheme: ['https', 'http'] }),
    library: Joi.string(),
    tags: Joi.string(),
    github: Joi.string().uri({ scheme: ['https'] }),
    vanityURL: Joi.string().token().min(4).max(12),
    likeWebhook: Joi.string().uri({ scheme: ['http', 'https'] }),
    webhookAuth: Joi.string()
}).with('likeWebhook', 'webhookAuth');

app.patch('/bot/:id/background' , upload.single('image'), async (req, res) => {
    const client = require('../ConstantStore').bot;
    if (Util.handleJoi(background, req, res)) return;
    const bot = await r.table('bots').get(req.params.id).run();
    if(!(req.user.admin || req.user.owner || req.user.id === bot.ownerID)) return res.status(403).json({ error: 'No permission' });
    if (!bot) return res.status(404).json({ error: 'unknown bot' });
    if(!bot.certified)  return res.status(404).json({ error: 'Not premium' });
    const data = Util.filterUnexpectedData(req.body, { editedAt: +new Date() }, background);
    await r.table('bots').get(bot.id).update({background: `${data.bg}`}).run();
    res.json({ ok: 'Background changed' });
});

app.patch('/bot/:id', async (req, res) => {
    const client = require('../ConstantStore').bot;
    if (Util.handleJoi(editBotSchema, req, res)) return;
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return res.status(404).json({ error: 'unknown bot' });
    if (req.user.id === bot.ownerID || req.user.id === "ID D'UN OWNER" || req.user.id === "ID D'UN OWNER" || req.user.owner || req.user.mod) {
        const data = Util.filterUnexpectedData(req.body, { editedAt: +new Date() }, editBotSchema);
        if (data.library && !libList.includes(data.library)) return res.status(400).json({ error: 'Invalid Library' });
        if (data.tags && !tagbot.includes(data.tags)) return res.status(400).json({ error: 'Invalid tag' });
        if (bot.certified) {
            const vanityTaken = (await r.table('bots').filter({ vanityURL: data.vanityURL }))[0];
            if (data.vanityURL && vanityTaken && vanityTaken.id !== bot.id) return res.status(400).json({ error: 'URL Custom already taken' });
            if (!data.vanityURL) data.vanityURL = null;
        } else data.vanityURL = bot.vanityURL || null;
        if (!data.likeWebhook) data.likeWebhook = null;
        if (!data.webhookAuth) data.webhookAuth = null;
        if (!data.website) data.website = null;
        if (!data.github) data.github = null;
        const botUser = client.users.cache.get(bot.id) || (await client.users.fetch(bot.id));
        await r.table('bots').get(bot.id).update(data).run();
        client.channels.cache.get(config.ids.logChannel).send(`✏ **<@${req.user.id}>** edited **${botUser.username}** ${config.baseURL}bot/${botUser.id}`);
        res.json({ ok: 'Edited bot' });
    } else res.status(403).json({ error: 'You do not own this bot' });
});

app.delete('/bot/annonce/:id', async (req, res) => {
    const jon = await r.table('job').get(req.params.id).run();
    if (!jon) return await res.status(404).json({ error: 'Invalid Ads' });
    if (req.user.id === jon.id || req.user.staff || req.user.admin || req.user.owner) {
        await r.table('job').get(req.params.id).delete().run();
        client.channels.cache.get("933695895885721601").send(`🗑 **<@${req.user.id}>** deleted the ad **${jon.title}**`);
        res.status(200).json({ ok: 'Delete ads' });
    } else res.status(403).json({ error: 'You do not own this ad' });
});

app.delete('/bot/:id', async (req, res) => {
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return await res.status(404).json({ error: 'The bot does not exist' });
    if (req.user.id === bot.ownerID || req.user.admin || req.user.owner) {
        await r.table('bots').get(req.params.id).delete().run();
        const botUser = client.users.cache.get(bot.id) || (await client.users.fetch(bot.id));
        client.channels.cache.get(config.ids.logChannel).send(`🗑 **<@${req.user.id}>** deleted **${botUser.username}**`);
        client.guilds.cache.get(config.ids.mainServer).member(botUser.id).kick('Bot deleted').catch(() => {});
        res.status(200).json({ ok: 'bot deleted' });
    } else res.status(403).json({ error: 'You do not own this bot' });
});

app.patch('/bot', async (req, res) => {
    res.sendStatus(501);
});

const newCommentSchema = Joi.object().required().keys({
    content: Joi.string()
        .max(500)
        .required(),
    botID: Joi.string()
        .length(36)
        .required()
});

const editCommentSchema = Joi.object().required().keys({
    content: Joi.string().max(500).required()
});

app.post('/logout', (req, res) => {
    req.logOut();
    res.sendStatus(200);
});

app.get('/me', (req, res) => {
    res.json({
        id: req.user.id,
        discord: {
            username: req.user.username
        },
        warning: 'This API endpoint is a legacy one and does not provide all info about the user.'
    });
});

const modVerifyBotSchema = Joi.object().required().keys({
    verified: Joi.boolean().required(),
    reason: Joi.string(),
    botID: Joi.string().length(18).required()
});


const modVerifyAnnonceSchema = Joi.object().required().keys({
    verified: Joi.boolean().required(),
    reason: Joi.string(),
    annonceID: Joi.string().length(18).required()
});

app.post('/bot/verify/annonce', async (req, res) => {
    const client = require('../ConstantStore').bot;
    if (!(req.user.staff || req.user.admin || req.user.owner)) return res.status(403).json({ error: 'No permission' });
    if (Util.handleJoi(modVerifyAnnonceSchema, req, res)) return;
    const data = Util.filterUnexpectedData(req.body, {}, modVerifyAnnonceSchema);
    const job = await r.table('job').get(data.annonceID).run();
    if (!job) return res.status(404).json({ error: 'Invalid ads' });
    const discordOwner = client.users.cache.get(job.id);
    const staffUser = client.users.cache.get(req.user.id) || client.users.fetch(req.user.id);
    if (data.verified) {
        try {
            await discordOwner.send(`🎉 The ad **${job.title}** has been verified by **${staffUser.tag}** ${config.baseURL}bot/dashboard/job/${job.id}`);
        } catch (e) {}
        client.channels.cache.get(config.ids.logChannel).send(`🎉 The ad **${job.title}** from **<@${job.id}>** has been verified by **${staffUser}** `);
        await r.table('job').get(job.id).update({ verified: true }).run();
    } else {
        if (!data.reason || !data.reason.trim()) return res.status(401).json({ error: 'A reason is required' });
        try {
            await discordOwner.send(`❌ Your ad, **${job.title}**, has been rejected by **${staffUser.tag}**. See <#${config.ids.logChannel}> for more information`);
        } catch (e) {}
        client.channels.cache.get(config.ids.logChannel).send(`❌ The ad **${job.title}** from **<@${job.id}>** has been rejected by **${staffUser}**.\n**Reason**: \`${data.reason}\``);
        await r.table('job').get(job.id).delete().run();
    }
    res.status(200).json({ ok: 'Applied actions' });
});

app.post('/bot/mod/verify', async (req, res) => {
    const client = require('../ConstantStore').bot;
    if (!(req.user.staff || req.user.owner || req.user.id === "ID D'UN OWNER" || req.user.id === "ID D'UN OWNER")) return res.status(403).json({ error: 'No permission' });
    if (Util.handleJoi(modVerifyBotSchema, req, res)) return;
    const data = Util.filterUnexpectedData(req.body, {}, modVerifyBotSchema);
    const bot = await Util.attachPropBot(await r.table('bots').get(data.botID).run());
    const botUser = client.users.cache.get(bot.id) || client.users.fetch(bot.id);
    if (!bot) return res.status(404).json({ error: 'Bot does not exist' }) && console.log(bot.id + " Ce bot n'existe pas");
    const discordOwner = client.users.cache.get(bot.ownerID);
    const staffUser = client.users.cache.get(req.user.id) || client.users.fetch(req.user.id);
    if (data.verified) {
        try {
            await discordOwner.send(`🎉 **"${bot.name}"** has been verified by **${staffUser.tag}** ${config.baseURL}bot/${botUser.id}`);
        } catch (e) {}
        client.channels.cache.get(config.ids.logChannel).send(`🎉 **${botUser.username}** from **<@${bot.ownerID}>** has been verified by **${staffUser}** ${config.baseURL}bot/${botUser.id}`);
        await r.table('bots').get(bot.id).update({ verified: true }).run();
    } else {
        if (!data.reason || !data.reason.trim()) return console.log(" Tu as oublier une raison") && res.status(401).json({ error: 'A reason is required' });
        try {
            await discordOwner.send(`❌ Your bot, **${bot.name}**, has been rejected by **${staffUser.tag}**. See <#${config.ids.logChannel}> for more informations`);
        } catch (e) {}
        client.channels.cache.get(config.ids.logChannel).send(`❌ **${botUser.tag}** from **<@${bot.ownerID}>** has been rejected by **${staffUser}**.\n**Reason**: \`${data.reason}\``);
        await r.table('bots').get(bot.id).delete().run();
    }
    try {
        client.guilds.cache.get(config.ids.verificationServer).members.cache.get(bot.id).kick().catch(() => {});
    } catch (e) {}
    if (data.verified)
        client.guilds.cache.get(config.ids.mainServer).members.cache.get(bot.ownerID).roles.add(config.ids.botDeveloperRole).catch(() => {});
    res.status(200).json({ ok: 'Applied actions' });
});

app.get('/bot/:id/vote', async (req, res) => {
    const bots = (await r.table('bots').get(bot.id).run());
    res.json({ ok: 'View data property', data: bots });
});

app.post('/bot/:id/certif', async (req, res) => {
    const bot = await r.table('bots').get(req.params.id).run();
    if(!(req.user.admin || req.user.owner || req.user.id === bot.ownerID)) return res.status(403).json({ error: 'No permission' });
    if(bot.servers == undefined) return res.json({ error: 'You do not respect the conditions' });
    if(!(bot.vote > 49)) return res.json({ error: 'You do not respect the conditions' });
    if(!(bot.longDescription.length > 499)) return res.json({ error: 'You do not respect the conditions' });
    if(!(bot.createdAt < tp)) return res.json({ error: 'You do not respect the conditions' });
    if(bot.verif) return res.json({ error: 'This bot is already certified' });
    const hook = new Discord.WebhookClient('ID DU WEBHOOK', 'CODE DU WEBHOOK');
    hook.send(`The bot <@${bot.id}> was certified !`);
    await r.table('bots').filter({id: bot.id}).update({verif: true})
    res.json({ ok: 'Certified Bot!' });
});

app.post('/bot/:id/votetest', async (req, res) => {
    let bot = await r.table('bots').get(req.params.id).run();
    if(!(req.user.admin || req.user.id === bot.ownerID || req.user.owner)) return res.status(403).json({ error: 'No permission' });
    const hook = new Discord.WebhookClient('ID DU WEBHOOK', 'CODE DU WEBHOOK');
    hook.send(`Le bot <@${bot.id}> Fait un test de webhook`);
    if (bot.likeWebhook) Util.likeWebhook(bot.likeWebhook, bot.webhookAuth, 'vote', bot.id, req.user.id);
    hook.send(`<@${bot.id}> Test réussi avec succès`);
    res.json({ ok: 'Test carried out' });
});

app.post('/bot/:id/vote', async (req, res) => {
    let mysql = require('mysql');
    var bdd = mysql.createConnection({
        host: 'localhost',
        user: 'USER',
        password: 'PASSWORD',
        database: 'DATABASE'
    });
    bdd.connect(err => {
        if (err) throw err;
        bdd.query('SET NAMES utf8mb4');
    });
    let useru = await r.table('users').get(req.user.id).run();
    if(!(useru.verif == false || useru.verif == true)) return res.status(403).json({ error: "Reconnected you to the site" });
    if(useru.verif == false) return res.status(404).json({ error: "Your account is not verified" });
    let bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return res.status(404).json({ error: 'Bot does not exist' });
    bdd.query(`SELECT * FROM channel`, (err, ch) => {
        bdd.query(`SELECT * FROM channel WHERE botid = '${bot.id}'`, (err, botvote) => {
            var ii = req.user.id;
            var iii = bot.id;
            var iiii = ii + iii;
            bdd.query(`SELECT * FROM channel WHERE idlo = '${iiii}'`, (err, cooldown) => {
                let arevoted =  r.table('likes').filter({ userID: req.user.id, botID: bot.id }).run();
                let cool = cooldown[0];
                let vote = botvote[0];
                if(cooldown[0]) {
                    if ((parseInt(cooldown[0].createdAt) + ms('12h')) > Date.now()) return res.json({ok: 'Cooldown'});
                    bdd.query(`DELETE FROM channel WHERE idlo = '${cooldown[0].idlo}'`);
                    if (bot.likeWebhook) Util.likeWebhook(bot.likeWebhook, bot.webhookAuth, 'vote', bot.id, req.user.id);
                    r.table('bots').get(req.params.id).update({ vote: r.row('vote').add(1) }).run();
                    r.table('bots').get(req.params.id).update({credit: r.row('credit').add(0.01)  }).run();            
                    res.json({ ok: 'Vote' });
                    let sql;
                    sql = `INSERT INTO channel (ownerID, createdAt, botid,idlo) VALUES ('${req.user.id}', '${Date.now()}', '${bot.id}', '${req.user.id + bot.id}')`;
                    bdd.query(sql);
                    const botUser = client.users.cache.get(bot.id);
                    client.channels.cache.get(config.ids.logChannel).send(` **<@${req.user.id}>** voted for the bot **${botUser.username}**  `);
                } else {
                    r.table('bots').get(req.params.id).update({ vote: r.row('vote').add(1), credit: r.row('credit').add(0.01) }).run();
                    r.table('bots').get(req.params.id).update({credit: r.row('credit').add(0.01)  }).run();        
                    if (bot.likeWebhook) Util.likeWebhook(bot.likeWebhook, bot.webhookAuth, 'vote', bot.id, req.user.id);
                    const botUser = client.users.cache.get(bot.id);
                    client.channels.cache.get(config.ids.logChannel).send(` **<@${req.user.id}>** voted for the bot **${botUser.username}**  `);  
                    res.json({ ok: 'Vote' });
                    let sql;
                    sql = `INSERT INTO channel (ownerID, createdAt, botid,idlo) VALUES ('${req.user.id}', '${Date.now()}', '${bot.id}', '${req.user.id + bot.id}')`;
                    bdd.query(sql);
                }
            });
        });
    });
});

const mise = Joi.object().required().keys({
    mise: Joi.string()
});

app.use((req, res) => {
    res.sendStatus(404);
});