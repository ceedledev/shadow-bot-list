const express = require('express');
const app = (module.exports = express.Router());
const { r } = require('../ConstantStore');
const Util = require('../Util');

app.use(async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(400).json({ error: 'You need a Authorization header with a valid Bot Token.' });
    const bot = (await r.table('bots').filter({ apiToken: token }).run())[0];
    if (!bot) {
        res.status(403).json({ error: 'not_authenticated' });
    } else {
        req.bot = await Util.attachPropBot(bot);
        if (req.bot.servers === 'N/A') req.bot.servers = null;
        delete req.bot._markedDescription;
        delete req.bot._discordAvatarURL;
        delete req.bot._ownerViewing;
        next();
    }
});

app.get('/', (req, res) => {
    res.json({ ok: 'You found the Public API!' });
});

app.get('/bot/me' , (req, res) => {
    res.json({ ok: 'View data property', data: req.bot });
});

app.get('/bot/me/voted/:id' , async (req, res) => {
    const voted = (await r.table('likes').filter({ botID: req.bot.id, userID: req.params.id }))[0];
    if (!voted) return res.json({ ok: 'View data property', data: false });
    res.json({ ok: 'View data property', data: voted.createdAt });
});

app.get('/bot/:id' , async (req, res) => {
    let bot = await r.table('bots').get(req.params.id).run();
    if (!bot || !bot.verified) return res.status(404).json({ error: 'Bot not found' });
    if (bot) bot = Util.hidePropsBot(await Util.attachPropBot(bot));
    res.status(200).json({ ok: 'View data property', data: bot });
});

app.get('/user/:id' , async (req, res) => {
    let user = await r.table('users').get(req.params.id).run();
    if (!user) return res.status(404).json({ error: 'Users not found' });
    if (user) user = Util.hidePropsUser(await Util.attachPropUser(user), false);
    user._bots = (await Promise.all(user._bots.map(bot => Util.attachPropBot(bot)))).map(bot => Util.hidePropsBot(bot));
    res.status(200).json({ ok: 'View data property', data: user });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Invalid Endpoint' });
});