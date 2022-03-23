const express = require('express');
const chunk = require('chunk');
const app = (module.exports = express.Router());
const r = require('../ConstantStore').r;
const Util = require('../Util');
const config = require('../config.json');
const {bot: client } = require('../ConstantStore');

app.get('/', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
    res.render('dashboard/dash', { user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots });
});

app.get('/new', async (req, res) => {
    res.render('dashboard/newBot', { user: req.user ? await Util.attachPropUser(req.user) : undefined, libs: require('./api').libList,tage: require('./api').tagbot,profile: req.user });
});

app.get('/news', async (req, res) => {
    res.render('dashboard/news', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/menu', async (req, res) => {
    res.render('dashboard/menu', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/job', async (req, res) => {
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
        (await r.table('job').filter({ verified: true }).orderBy(r[order2[1]](sort2[2])).limit(4 * 2).run())
    );
    const userschunk = chunk(users, 4);
    res.render('dashboard/job', { user: req.user ? await Util.attachPropUser(req.user) : undefined, userschunk, users,  });
});

app.get('/job/new', async (req, res) => {
    res.render('dashboard/jobnew', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/job/:id/edit', async (req, res) => {
    const annonceget = await r.table('job').filter({id: req.params.id}).run()
    if(!annonceget) return res.status(403).json({ error: 'No valide url' });
    const annoncevalide = await r.table('job').get(req.params.id).run()
    if(!annoncevalide ) return res.status(403).json({ error: 'No valide url' });
    if(!(req.user.id == annoncevalide.id || req.user.staff || req.user.admin || req.user.owner)) return res.status(403).json({error: 'No permission'})
    res.render('dashboard/annonceedit', { user: req.user ? await Util.attachPropUser(req.user) : undefined, annonce: annoncevalide });
});

const marked = require('marked');
app.get('/job/:id', async (req, res) => {
    const annonceget = await r.table('job').filter({id: req.params.id}).run()
    if(!annonceget) return res.status(403).json({ error: 'No valide url' });
    const annoncevalide = await r.table('job').get(req.params.id).run()
    if(!annoncevalide ) return res.status(403).json({ error: 'No valide url' });
    const users_mark = marked(annoncevalide.longDescription, { sanitize:  false });
    res.render('dashboard/pageannonce', { user: req.user ? await Util.attachPropUser(req.user) : undefined, annonce: annoncevalide, markdesc: users_mark });
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
        (await r.table('job').filter({ verified: false }).orderBy(r[order2[1]](sort2[2])).run())
    );
    const userschunk = chunk(users, 4); 
    res.render('dashboard/staff', { user: req.user ? await Util.attachPropUser(req.user) : undefined, bots , botChunks, config, users, userschunk });
});

app.get('/bots', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
    res.render('dashboard/bots', { user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots });
});

app.get('/user/:id/settings', async (req, res, next) => {
    let user = await r.table('users').get(req.params.id).run();
    if (!user) return next();
    user = await Util.attachPropUser(user);
    if(user.id === req.user.id  || req.user.owner){
    res.render('dashboard/settings', { user: req.user ? await Util.attachPropUser(req.user) : undefined, profile: user });
    }else res.status(403).json({ error: "ce n'est pas votre compte" });
});

app.get('/bot/:id/edit', async (req, res, next) => {
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    const botimage = await Util.attachPropBot(bot, req.user);
    if (req.user.id === bot.ownerID || req.user.owner || req.user.admin) {
        res.render('dashboard/editBot', { libs: require('./api').libList,tage: require('./api').tagbot, bot,botimage, user: req.user ? await Util.attachPropUser(req.user) : null });
    } else res.status(403).json({ error: 'you do not own this bot' });
});

app.get('/bot/:id/stats', async (req, res, next) => {
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    const botimage = await Util.attachPropBot(bot, req.user);
    var btlike = await r.table("bots").get(bot.id);
    bot.likeCount = btlike.vote
    if (req.user.id === bot.ownerID || req.user.owner || req.user.admin) {
        res.render('dashboard/stats', { libs: require('./api').libList,tage: require('./api').tagbot, bot,botimage, user: req.user ? await Util.attachPropUser(req.user) : null });
    } else res.status(403).json({ error: 'you do not own this bot' });
});

app.get('/bot/:id/webhook', async (req, res, next) => {
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    const botimage = await Util.attachPropBot(bot, req.user);
    if (req.user.id === bot.ownerID || req.user.owner || req.user.admin) {
        res.render('dashboard/webhook', { libs: require('./api').libList,tage: require('./api').tagbot, bot,botimage, user: req.user ? await Util.attachPropUser(req.user) : null });
    } else res.status(403).json({ error: 'you do not own this bot' });
});

app.get('/bot/:id/manage', async (req, res, next) => {
    let bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    if (req.user.id === bot.ownerID || req.user.owner || req.user.admin) {
        bot = await Util.attachPropBot(bot, req.user);
        res.render('dashboard/botManage', { bot, user: req.user ? await Util.attachPropUser(req.user) : undefined });
    } else res.status(403).json({ error: 'you do not own this bot' });
});

app.get('dashboard/queue', async (req, res) => {
    if (!(req.user.owner || req.user.admin)) return res.status(403).json({ error: 'No permission' });
    const bots = await Promise.all(
        (await r.table('bots').filter({ verified: false }).run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('dashboard/queue', { user: req.user ? await Util.attachPropUser(req.user) : undefined, chunks: botChunks, rawBots: bots, config });
});

const paypal = require('paypal-rest-sdk');
const bodyParser = require('body-parser');
var client_id = 'ID CLIENT PAYPAL';
var secret = 'ID CLIENT SECRET PAYPAL';

app.use(bodyParser.json());

paypal.configure({
    'mode': 'live',
    'client_id': client_id,
    'client_secret': secret
});

app.get('/premium/paiement/:userid/:botid', async (req, res) =>{
    if(req.user) return res.status(403).json({error: 'Premium désactiver'})
    const bot = await r.table('bots').get(req.params.botid).run()
    if(!bot) return res.status(403).json({error: 'Bot not found'});
    const user = await  r.table('users').get(req.params.userid).run()
    if(!user) return res.status(403).json({error: 'User not found'});
    if(!(req.user.id === bot.ownerID || req.user.owner)) return res.status(403).json({error: 'Invalide bot id'});
    if(!(user.id == req.user.id || req.user.owner)) return res.status(403).json({error: 'Invalide user id'});
    if(bot.certified) return res.status(403).json({error: 'Bot already premium'});
    var payReq = JSON.stringify({
        'intent':'authorize',
        'redirect_urls':{
            'return_url':`https://discbot.xyz/dashboard/premium/check/${req.params.userid}/${req.params.botid}`,
            'cancel_url':'https://discbot.xyz'
        },
        'payer':{
            'payment_method':'paypal'
        },
        'transactions':[{
            'amount':{
                'total':'5',
                'currency':'EUR'
            },
            'description':'Paiement pour le premium SBL'
        }]
    });
    paypal.payment.create(payReq, function(error, payment){
        if(error){
            console.error(error);
        } else {
            var links = {};
            payment.links.forEach(function(linkObj){
                links[linkObj.rel] = {
                    'href': linkObj.href,
                    'method': linkObj.method
                };
            })
            if (links.hasOwnProperty('approval_url')){
                res.redirect(links['approval_url'].href);
            } else {
                console.error('no redirect URI present');
            }
        }
    });
});

app.get('/premium/check/:userid/:botid', async (req, res) =>{
    if(req.user) return res.status(403).json({error: 'Premium désactiver'})
    var paymentId = req.query.paymentId;
    var payerId = { 'payer_id': req.query.PayerID };
    paypal.payment.execute(paymentId, payerId, async (error, payment) =>{
        if(error){
            console.error(error);
        } else {
            if (payment.state == 'approved'){ 
                const bot = await r.table('bots').get(req.params.botid).run()
                if(!bot) return res.status(403).json({error: 'Bot not found'});
                const user = await  r.table('users').get(req.params.userid).run()
                if(!user) return res.status(403).json({error: 'User not found'});
                if(bot.certified) return res.status(403).json({error: 'Bot already premium'});
                r.table('bots').get(req.params.botid).update({certified: true}).run()
                r.table('bots').get(req.params.botid).update({certifiedat: Date.now()}).run()
                client.channels.cache.get('928807927186354206').send(`<@${req.params.userid}> prend l\'offre Premium , merci de son soutien.`);
                res.render('dashboard/premiumvalide', { user: req.user ? await Util.attachPropUser(req.user) : undefined});  
            } else {
                res.send('payment not successful');
            }
        }
    });
});

app.get('/premium/select/:id', async (req, res, next) => {
    if(req.user) return res.status(403).json({error: 'Premium désactiver'})
    if(!req.user) return next()
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
    const useri = await r.table('users').get(req.params.id).run()
    if(!useri) return next()
    if(!(req.params.id == req.user.id || req.user.owner)) return res.status(403).json({error: 'No permission'})
    res.render('dashboard/premiumselect', { user: req.user ? await Util.attachPropUser(req.user) : undefined, bots: botChunks, rawBots: myBots, useri });
});

app.get('/premium', async (req, res) => {
    if(req.user) return res.status(403).json({error: 'Premium désactiver'})
    res.render('premium', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/premium/bot/:botid/:userid', async (req, res, next) => {
    if(req.user) return res.status(403).json({error: 'Premium désactiver'})
    const bot = await r.table('bots').get(req.params.botid).run();
    if(!bot) return next()
    const user = await r.table('users').get(req.params.userid).run();          
    if(!user) return next()
    const botimage = await Util.attachPropBot(bot, req.params.botid);
    res.render('dashboard/premiumpaie', { user: req.user ? await Util.attachPropUser(req.user) : undefined, bot ,botimage});
});