const express = require('express');
const chunk = require('chunk');
const ejs = require('ejs');
const randomstring = require('randomstring');
const webshot = require('webshot');
const Util = require('../Util');
const { r } = require('../ConstantStore');
const config = require('../config.json');
const app = (module.exports = express.Router());

app.get('/list/premium', async (req, res) => {
    const sortBy = [
        ['Views', 'views', r.row('pageViews')],
        ['Serveurs', 'servers', r.row('servers')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Ascending', 'asc'], ['Descending', 'desc']];
    const defaultOrder = 'desc';
    const rowsPerPage = 3;
    const itemsPerPage = rowsPerPage * 4;
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;
    const items = await r.table('bots') .filter({ certified: true }).count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;
    page--;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const start = page * itemsPerPage;
    const botscheck = await Promise.all(
        (await r.table('bots').filter({ certified: true }).orderBy(r[order[1]](sort[2])).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const bots = await Promise.all(
        (await r.table('bots').filter({ certified: true }).orderBy(r[order[1]](sort[2])).slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('list/premium', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        items,
        page,
        botscheck,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    });
});

app.get('/list/nouveau', async (req, res) => {
    const sortBy = [
        ['Views', 'views', r.row('pageViews')],
        ['Added Date', 'created', r.row('createdAt')],
        ['Serveurs', 'servers', r.row('servers')]
    ];
    const defaultSortBy = 'created';
    const orders = [['Ascending', 'asc'], ['Descending', 'desc']];
    const defaultOrder = 'desc';   
    const rowsPerPage = 3;
    const itemsPerPage = rowsPerPage * 4;
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;
    const items = await r.table('bots').count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;
    page--;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const start = page * itemsPerPage;
    const bots = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order[1]](sort[2])).slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botscheck = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order[1]](sort[2])).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('list/nouveau', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        botscheck,
        items,
        page,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    });
});

app.get('/list/top', async (req, res) => {
    const sortBy = [
        ['Views', 'views', r.row('pageViews')],
        ['Added Date', 'created', r.row('createdAt')],
        ['Serveurs', 'servers', r.row('servers')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Ascending', 'asc'], ['Descending', 'desc']];
    const defaultOrder = 'desc';
    const rowsPerPage = 3;
    const itemsPerPage = rowsPerPage * 4;
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;
    const items = await r.table('bots').count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;
    page--;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const start = page * itemsPerPage;
    const bots = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order[1]](sort[2])).slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botscheck = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order[1]](sort[2])).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('list/top', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        items,
        page,
        botscheck,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    });
});

app.get('/home', async (req, res) => {
    if(!req.user.staff) return res.status(403).json({error: 'not found'})
    const sortBy = [
        ['Views', 'views', r.row('pageViews')],
        ['Serveurs', 'servers', r.row('servers')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Ascending', 'asc'], ['Descending', 'desc']];
    const defaultOrder = 'desc';
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const bots = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order[1]](sort[2])).limit(4 * 2).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botscheck = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order[1]](sort[2])).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botspremium = await Promise.all(
        (await r.table('bots').filter({ certified: true }).orderBy(r[order[1]](sort[2])).limit(4 * 2).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const sortBy2 = [
        ['Added Date', 'created', r.row('createdAt')],
    ];
    const defaultSortBy2 = 'created';
    const orders2 = [['Ascending', 'asc'], ['Descending', 'desc']];
    const defaultOrder2 = 'desc';
    let order2 = orders2.find(o => o[1] === req.query.order2) ? req.query.order2 : defaultOrder2;
    let sort2 = sortBy2.find(s => s[1] === req.query.sort2) ? req.query.sort2 : defaultSortBy2;
    sort2 = sortBy2.find(s => s[1] === sort2);
    order2 = orders2.find(o => o[1] === order2);
    const bots2 = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order2[1]](sort2[2])).limit(4 * 2).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks2 = chunk(bots2, 8);
    const botChunkpremium = chunk(botspremium, 8);
    const botChunk = chunk(bots, 8);
    res.render('index2', { user: req.user ? await Util.attachPropUser(req.user) : undefined, rawBots: bots,rawBotsPremium: botspremium,botChunk,botChunks2,botChunkpremium,botscheck });
});

app.get('/ducktest', async (req, res) => {
    if(!req.user.staff) return res.status(403).json({error: 'not found'})
    const sortBy = [
        ['Views', 'views', r.row('pageViews')],
        ['Serveurs', 'servers', r.row('servers')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Ascending', 'asc'], ['Descending', 'desc']];
    const defaultOrder = 'desc';
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const bots = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order[1]](sort[2])).limit(4 * 2).run()).map(bot => Util.attachPropBot(bot, req.user))
    );

    const botscheck = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order[1]](sort[2])).run()).map(bot => Util.attachPropBot(bot, req.user))
    );

    const botspremium = await Promise.all(
        (await r.table('bots').filter({ certified: true }).orderBy(r[order[1]](sort[2])).limit(4 * 2).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const sortBy2 = [
        ['Added Date', 'created', r.row('createdAt')],
    ];
    const defaultSortBy2 = 'created';
    const orders2 = [['Ascending', 'asc'], ['Descending', 'desc']];
    const defaultOrder2 = 'desc';
    let order2 = orders2.find(o => o[1] === req.query.order2) ? req.query.order2 : defaultOrder2;
    let sort2 = sortBy2.find(s => s[1] === req.query.sort2) ? req.query.sort2 : defaultSortBy2;
    sort2 = sortBy2.find(s => s[1] === sort2);
    order2 = orders2.find(o => o[1] === order2);
    const bots2 = await Promise.all(
       (await r.table('bots').filter({ verified: true }).orderBy(r[order2[1]](sort2[2])).limit(4 * 2).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks2 = chunk(bots2, 8);
    const botChunkpremium = chunk(botspremium, 8);
    const botChunk = chunk(bots, 8);
    res.render('duck', { user: req.user ? await Util.attachPropUser(req.user) : undefined, rawBots: bots,rawBotsPremium: botspremium,botChunk,botChunks2,botChunkpremium,botscheck });
});

app.get('/', async (req, res) => {
    const sortBy = [
        ['Views', 'views', r.row('pageViews')],
        ['Serveurs', 'servers', r.row('servers')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Ascending', 'asc'], ['Descending', 'desc']];
    const defaultOrder = 'desc';
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const bots = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order[1]](sort[2])).limit(4 * 2).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botscheck = await Promise.all(
        (await r.table('bots').filter({ verified: true }).orderBy(r[order[1]](sort[2])).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botspremium = await Promise.all(
        (await r.table('bots').filter({ certified: true }).orderBy(r[order[1]](sort[2])).limit(4 * 2).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const sortBy2 = [
        ['Added Date', 'created', r.row('createdAt')],
    ];
    const defaultSortBy2 = 'created';
    const orders2 = [['Ascending', 'asc'], ['Descending', 'desc']];
    const defaultOrder2 = 'desc';
    let order2 = orders2.find(o => o[1] === req.query.order2) ? req.query.order2 : defaultOrder2;
    let sort2 = sortBy2.find(s => s[1] === req.query.sort2) ? req.query.sort2 : defaultSortBy2;
    sort2 = sortBy2.find(s => s[1] === sort2);
    order2 = orders2.find(o => o[1] === order2);
    const bots2 = await Promise.all(
       (await r.table('bots').filter({ verified: true }).orderBy(r[order2[1]](sort2[2])).limit(4 * 2).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks2 = chunk(bots2, 8);
    const botChunkpremium = chunk(botspremium, 8);
    const botChunk = chunk(bots, 8);
    res.render('index', { user: req.user ? await Util.attachPropUser(req.user) : undefined, rawBots: bots,rawBotsPremium: botspremium,botChunk,botChunks2,botChunkpremium,botscheck });
});

const sortBy = [
    ['Nom', 'name', r.row('name').downcase()],
    ['Serveurs', 'servers', r.row('servers')],
    ['Vues', 'views', r.row('pageViews')],
    ['Invites', 'invites', r.row('inviteClicks')],
    ['Date', 'created', r.row('createdAt')]
];
const defaultSortBy = 'views';
const orders = [['Croissant', 'asc'], ['Décroissant', 'desc']];
const defaultOrder = 'desc';
const rowsPerPage = 5;
const itemsPerPage = rowsPerPage * 4;

app.get('/bot/:id', async (req, res, next) => {
    let botse = await r.table('bots').get(req.params.id).run();
    let rB = await r.table('bots').get(req.params.id).run();
    if (rB && rB.vanityURL) return res.redirect(`/bot/${rB.vanityURL}`);
    if (!rB) {
        rB = (await r.table('bots').filter({ vanityURL: req.params.id }))[0];
        if (!rB) return next();
    }
    const bot = await Util.attachPropBot(rB, req.user);
    if (!bot.verified && !((req.user ? req.user.staff : false) || req.user.owner || req.user.id === rB.ownerID)) return res.sendStatus(404); // pretend it doesnt exist lol
    res.render('botPage', { user: req.user ? await Util.attachPropUser(req.user) : undefined, bot , config});
    await r.table('bots').get(rB.id).update({ pageViews: r.row('pageViews').add(1) }).run();
});

app.get('/bot/:id/key', async (req, res, next) => {
    const rB = await r.table('bots').get(req.params.id).run();
    if (!rB) return next();
    const bot = await Util.attachPropBot(rB, req.user);
    if (bot.verified) {
        if (req.user) {
            if (req.user.id !== bot.ownerID || req.user.owner) res.sendStatus(403);
            else return res.render('botKey', { bot: rB, user: req.user ? await Util.attachPropUser(req.user) : undefined });
        } else return res.sendStatus(401);
    } else return res.sendStatus(403);
});

app.get('/bot/:id/reset', async (req, res, next) => {
    const rB = await r.table('bots').get(req.params.id);
    if (!rB) return next();
    const bot = await Util.attachPropBot(rB, req.user);
    if (!bot.verified) return res.sendStatus(403);
    if (!req.user) return res.sendStatus(401);
    if (req.user.id !== bot.ownerID || req.user.owner) return res.sendStatus(403);
    await r.table('bots').get(req.params.id).update({ apiToken: randomstring.generate(30) });
    res.redirect(`/bot/${req.params.id}/key`);
});

app.get('/user/:id', async (req, res, next) => {
    let user = await r.table('users').get(req.params.id).run();
    if (!user) return next();
    user = await Util.attachPropUser(user);
    res.render('userPage', { user: req.user ? await Util.attachPropUser(req.user) : undefined, profile: user });
});

app.get('/profil/:id', async (req, res, next) => {
    let user = await r.table('users').get(req.params.id).run();
    if (!user) return next();
    user = await Util.attachPropUser(user);
    res.render('userPage', { user: req.user ? await Util.attachPropUser(req.user) : undefined, profile: user });
});

app.get('/search', async (req, res) => {
    if (typeof req.query.q !== 'string') return res.status(403).json({ error: 'expected query q' });
    const text = req.query.q.toLowerCase();
   const bots = await Promise.all((await r.table("bots").filter(bot => {
        return bot("name").downcase().match(text).and(bot("verified"))
    }).orderBy(bot => {
        return bot("name").downcase().split(text).count()
    }).limit(2*4).run()).map(bot => Util.attachPropBot(bot, req.user)));
    const botChunks = chunk(bots, 4);
    res.render('search', { bots, botChunks, user: req.user ? await Util.attachPropUser(req.user) : undefined, searchQuery: text });
});

app.get('/invite_url/:id', async (req, res) => {
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return res.status(404).json({ error: 'bot does not exist' });
    res.redirect(bot.verified ? bot.invite : `https://discordapp.com/api/oauth2/authorize?scope=bot&client_id=${bot.id}&guild_id=${config.ids.verificationServer}`);
    await r.table('bots').get(bot.id).update({ inviteClicks: r.row('inviteClicks').add(1) }).run();
});

app.get('/bot/:id/widget.png', async (req, res) => {
    const hex = /^[a-f0-9]{6}$/i;
    const backgroundColor = hex.test(req.query.background) ? req.query.background : '252525';
    const textColor = hex.test(req.query.text) ? req.query.text : 'ffffff';
    const client = require('../ConstantStore').bot;
    const botRow = await r.table('bots').get(req.params.id);
    if (!botRow) return res.status(404).json({ error: 'bot does not exist' });
    const bot = await Util.attachPropBot(botRow);
    if (!bot) return res.status(404).json({ error: 'bot does not exist' });
    bot.ownerTag = (client.users.cache.get(bot.ownerID) || client.users.fetch(bot.ownerID) || req.user.owner || {}).tag;
    res.set('Content-Type', 'image/png');
    ejs.renderFile('views/botWidget.ejs', { bot, colors: { background: backgroundColor, text: textColor } }, (err, html) => {
        if (err) throw err;
        webshot(html, undefined, { siteType: 'html', windowSize: { width: '400', height: '250' } }).pipe(res);
    });
});

app.get('/tag/fun', async (req, res) => {
    const sortBy = [
        ['Invites', 'invites', r.row('inviteClicks')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Croissant', 'asc'], ['Décroissant', 'desc']];
    const defaultOrder = 'desc';
    const rowsPerPage = 5;
    const itemsPerPage = rowsPerPage * 4;
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;
    const items = await r.table('bots').count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;
    page--;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const start = page * itemsPerPage;
    const bots = await Promise.all(
        (await r.table('bots').filter({ tags: 'Fun', verified: true}).orderBy(r[order[1]](sort[2])).slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('tag/fun', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        items,
        page,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    });
});

app.get('/tag/utile', async (req, res) => {
    const sortBy = [
        ['Invites', 'invites', r.row('inviteClicks')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Croissant', 'asc'], ['Décroissant', 'desc']];
    const defaultOrder = 'desc';
    const rowsPerPage = 5;
    const itemsPerPage = rowsPerPage * 4;
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;
    const items = await r.table('bots').count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;
    page--;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const start = page * itemsPerPage;
    const bots = await Promise.all(
        (await r.table('bots').filter({ tags: 'Utile'}).orderBy(r[order[1]](sort[2])).slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('tag/utile', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        items,
        page,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    });
});

app.get('/tag/jeu', async (req, res) => {
    const sortBy = [
        ['Invites', 'invites', r.row('inviteClicks')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Croissant', 'asc'], ['Décroissant', 'desc']];
    const defaultOrder = 'desc';
    const rowsPerPage = 5;
    const itemsPerPage = rowsPerPage * 4;
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;
    const items = await r.table('bots').count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;
    page--;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const start = page * itemsPerPage;
    const bots = await Promise.all(
        (await r.table('bots').filter({ tags: 'Jeu' }).orderBy(r[order[1]](sort[2])).slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('tag/jeu', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        items,
        page,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    });
});

app.get('/tag/moderation', async (req, res) => {
    const sortBy = [
        ['Invites', 'invites', r.row('inviteClicks')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Croissant', 'asc'], ['Décroissant', 'desc']];
    const defaultOrder = 'desc';
    const rowsPerPage = 5;
    const itemsPerPage = rowsPerPage * 4;
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;
    const items = await r.table('bots').count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;
    page--;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const start = page * itemsPerPage;
    const bots = await Promise.all(
        (await r.table('bots').filter({ tags: 'Modération' }).orderBy(r[order[1]](sort[2])).slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('tag/moderation', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        items,
        page,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    });
});

app.get('/tag/musique', async (req, res) => {
    const sortBy = [
        ['Invites', 'invites', r.row('inviteClicks')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Croissant', 'asc'], ['Décroissant', 'desc']];
    const defaultOrder = 'desc';
    const rowsPerPage = 5;
    const itemsPerPage = rowsPerPage * 4;
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;
    const items = await r.table('bots').count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;
    page--;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const start = page * itemsPerPage;
    const bots = await Promise.all(
        (await r.table('bots').filter({ tags: 'Musique' ,verified: true}).orderBy(r[order[1]](sort[2])).slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('tag/musique', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        items,
        page,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    });  
});

app.get('/tag/economie', async (req, res) => {
    const sortBy = [
        ['Invites', 'invites', r.row('inviteClicks')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Croissant', 'asc'], ['Décroissant', 'desc']];
    const defaultOrder = 'desc';
    const rowsPerPage = 5;
    const itemsPerPage = rowsPerPage * 4;
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;
    const items = await r.table('bots').count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;
    page--;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const start = page * itemsPerPage;
    const bots = await Promise.all(
        (await r.table('bots').filter({ tags: 'Economi' }).orderBy(r[order[1]](sort[2])).slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('tag/economie', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        items,
        page,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    });   
});

app.get('/tag/roleplay', async (req, res) => {
    const sortBy = [
        ['Invites', 'invites', r.row('inviteClicks')],
        ['Votes', 'vote', r.row('vote')]
    ];
    const defaultSortBy = 'vote';
    const orders = [['Croissant', 'asc'], ['Décroissant', 'desc']];
    const defaultOrder = 'desc';
    const rowsPerPage = 5;
    const itemsPerPage = rowsPerPage * 4;
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;
    const items = await r.table('bots').count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;
    page--;
    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;
    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);
    const start = page * itemsPerPage;
    const bots = await Promise.all(
        (await r.table('bots').filter({ tags: 'Rôleplay' }).orderBy(r[order[1]](sort[2])).slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('tag/roleplay', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        items,
        page,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    }); 
});

app.get('/terms', async (req, res) => {
    res.render('terms', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/faq', async (req, res) => {
    res.render('faq', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/privacy', async (req, res) => {
    res.render('privacy', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/staff/queue', async (req, res ) => {
    if(!req.user) return res.status(403).json({ error: 'Offline' });
    if (!(req.user.staff || req.user.admin || req.user.owner)) return res.status(403).json({ error: 'No permission' });
    const bots = await Promise.all(
        (await r.table('bots').filter({ verified: false }).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('staff/queue', { user: req.user ? await Util.attachPropUser(req.user) : undefined, chunks: botChunks, rawBots: bots, config });
});

app.get('/Apis', async (req, res) => {
    res.render('Apis', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/about', async (req, res) => {
    res.render('about', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/ads.txt', async (req, res) => {
    res.render('ads', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/rgpd', async (req, res) => {
    res.render('rgpd', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/mentions-legales', async (req, res) => {
    res.render('mentions', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/cgu', async (req, res) => {
    res.render('cgu', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/cgv', async (req, res) => {
    res.render('cgv', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/arc-sw.js', async (req, res) => {
    res.redirect('https://arc.io/arc-sw.js')
});

app.get('/status', async (req, res) => {
    res.redirect(`https://shadow-bot.comeshstatus.io/`);
});

app.get('/tags', async (req, res) => {
    const botscheck = await Promise.all(
        (await r.table('bots').filter({ verified: true }).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    res.render('tags', { user: req.user ? await Util.attachPropUser(req.user) : undefined, botscheck });
});

app.get('/.well-know/acme-challenge/J5JVvZTQEBwfYQf5_emU6OLLmuqua7RVNvE9of3UBLk', async (req, res) => {
    res.render('.well-know/acme-challenge/J5JVvZTQEBwfYQf5_emU6OLLmuqua7RVNvE9of3UBLk', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/staff', async (req, res) => {
    if (!req.user.staff === true) return res.status(403).json({ error: 'No permission' });
	let staffusers = [];
	let staffusersRaw = await Promise.all(
        (await r.table('users').filter({staff: true}).run()).map(user => Util.StaffattachPropUser(user))
	);
	staffusersRaw.forEach(async function(item, index){
		if(item.staff){
			staffusers.push(item)
		}
	})
    staffusers.sort(function(a, b){
        if(a.username < b.username) { return -1; }
        if(a.username > b.username) { return 1; }
        return 0;
    })
    const staffChunks = chunk(staffusers, 5);
    res.render('staffList', { user: req.user ? await Util.attachPropUser(req.user) : undefined, staff: staffusers, StaffChunk: staffChunks});
});

app.get('/admin', async (req, res) => {
    if(!req.user) return res.status(403).json({ error: 'Offline' });
    const BotQbots = await Promise.all(
        (await r.table('bots').filter({ verified: false }).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const BotQbotChunks = chunk(BotQbots, 4);
    if (!(req.user.admin || req.user.owner)) return res.status(403).json({ error: 'No permission' });
    res.render('admin', { user: req.user ? await Util.attachPropUser(req.user) : undefined, botqueue: {chunks: BotQbotChunks, rawBots: BotQbots},
        config });
});