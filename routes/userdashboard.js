const express = require('express');
const chunk = require('chunk');
const app = (module.exports = express.Router());
const r = require('../ConstantStore').r;
const Util = require('../Util');
const config = require('../config.json');

app.get('/', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
    res.render('userdashboard/dashboard', { user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots });
});

app.get('/affiliate', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
    res.render('userdashboard/affiliate', { user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots });
});

app.get('/premium', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id, certified: true }).run()).map(Util.attachPropBot)
    );
    const botChunk = chunk(myBots, 4);
    res.render('userdashboard/premium/view', { user: req.user ? await Util.attachPropUser(req.user) : undefined, botChunk, rawBots: myBots });
});

app.get('/staff', async (req, res) => {
    if(!(req.user.staff || req.user.admin || req.user.owner)) return res.status(403).json({error: 'No Permission'});
    const bots = await Promise.all(
        (await r.table('bots').filter({ verified: false }).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks = chunk(bots, 4);
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
    const users = await Promise.all(
        (await r.table('job').filter({ verified: false }).orderBy(r[order2[1]](sort2[2])).run()).map(job => Util.attachPropJob(job))
    )
    const userschunk = chunk(users, 10); 
    res.render('userdashboard/staff', { user: req.user ? await Util.attachPropUser(req.user) : undefined, bots , botChunks, config, users, userschunk });
});

app.get('/rules', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
    res.render('userdashboard/rules', { user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots });
});

app.get('/job', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
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
    const users = await Promise.all(
        (await r.table('job').filter({ verified: true }).orderBy(r[order2[1]](sort2[2])).limit(4 * 4).run()).map(job => Util.attachPropJob(job))
    );
    const userschunk = chunk(users, 10);
    res.render('userdashboard/job/list', { user: req.user ? await Util.attachPropUser(req.user) : undefined,userschunk, myBots: botChunks, rawBots: myBots });
});

app.get('/job/new', async (req, res) => {
    res.render('userdashboard/job/add', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

const marked = require('marked');
app.get('/job/:id', async (req, res) => {
    const annonceget = await r.table('job').filter({id: req.params.id}).run()
    if(!annonceget) return res.status(403).json({ error: 'No valide url' });
    const annoncevalide = await r.table('job').get(req.params.id).run()
    if(!annoncevalide ) return res.status(403).json({ error: 'No valide url' });
    const users_mark = marked(annoncevalide.longDescription, { sanitize:  false });
    res.render('userdashboard/job/view', { user: req.user ? await Util.attachPropUser(req.user) : undefined, annonce: annoncevalide, markdesc: users_mark });
});

app.get('/job/:id/edit', async (req, res) => {
    const annonceget = await r.table('job').filter({id: req.params.id}).run()
    if(!annonceget) return res.status(403).json({ error: 'No valide url' });
    const annoncevalide = await r.table('job').get(req.params.id).run()
    if(!annoncevalide ) return res.status(403).json({ error: 'No valide url' });
    if(!(req.user.id == annoncevalide.id || req.user.staff || req.user.admin || req.user.owner)) return res.status(403).json({error: 'No permission'})  
    res.render('userdashboard/job/edit', { user: req.user ? await Util.attachPropUser(req.user) : undefined, annonce: annoncevalide });
});