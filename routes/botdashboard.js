const express = require('express');
const chunk = require('chunk');
const app = (module.exports = express.Router());
const r = require('../ConstantStore').r;
const Util = require('../Util');
const randomstring = require('randomstring');
const ms = require('ms');
const {bot: client } = require('../ConstantStore');

app.get('/', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
    res.render('botdashboard/home', { user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots });
});

app.get('/premium', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
    res.render('botdashboard/premium', { user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots });
});

app.get('/new', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
    res.render('botdashboard/new', { user: req.user ? await Util.attachPropUser(req.user) : undefined,libs: require('./api').libList,tage: require('./api').tagbot,profile: req.user, myBots: botChunks, rawBots: myBots });
});

app.get('/:id/general', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    const botChunks = chunk(myBots, 4);
    if (req.user.id === bot.ownerID || req.user.owner || req.user.admin) {
    res.render('botdashboard/menu/home', {  libs: require('./api').libList,tage: require('./api').tagbot,user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots, bot });
    } else res.status(403).json({ error: "Vous n'êtes pas le créateur de ce bot" });
});

app.get('/:id/webhook', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    const botChunks = chunk(myBots, 4);
    if (req.user.id === bot.ownerID || req.user.owner || req.user.admin) {
    res.render('botdashboard/menu/webhook', {  libs: require('./api').libList,tage: require('./api').tagbot,user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots, bot });
    } else res.status(403).json({ error: "Vous n'êtes pas le créateur de ce bot" });
});

app.get('/:id/widget', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    const botChunks = chunk(myBots, 4);
    if (req.user.id === bot.ownerID || req.user.owner || req.user.admin) {
    res.render('botdashboard/menu/widget', {  libs: require('./api').libList,tage: require('./api').tagbot,user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots, bot });
    } else res.status(403).json({ error: "Vous n'êtes pas le créateur de ce bot" });
});

app.get('/:id/background', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    const botChunks = chunk(myBots, 4);
    const botimage = await Util.attachPropBot(bot, req.user);
    if (req.user.id === bot.ownerID || req.user.owner || req.user.admin) {
    res.render('botdashboard/menu/background', {  libs: require('./api').libList,tage: require('./api').tagbot,botimage,user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots, bot });
    } else res.status(403).json({ error: "Vous n'êtes pas le créateur de ce bot" });
});

app.get('/:id/credit', async (req, res) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    const creditvote = parseFloat(bot.credit).toFixed(2)
    const botChunks = chunk(myBots, 4);
    if (req.user.id === bot.ownerID || req.user.owner || req.user.admin) {
    res.render('botdashboard/menu/credit', {  libs: require('./api').libList,tage: require('./api').tagbot,user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots, bot,creditvote });
    } else res.status(403).json({ error: "Vous n'êtes pas le créateur de ce bot" });
});

app.get('/:id/token', async (req, res, next) => {
    const myBots = await Promise.all(
        (await r.table('bots').filter({ ownerID: req.user.id }).run()).map(Util.attachPropBot)
    );
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    const botChunks = chunk(myBots, 4);
    const botimage = await Util.attachPropBot(bot, req.user);
    if (bot.verified) {
        if (req.user) {
            if (req.user.id !== bot.ownerID || req.user.owner) res.sendStatus(403);
            else return res.render('botdashboard/menu/token', { bot,botimage, user: req.user ? await Util.attachPropUser(req.user) : undefined,myBots: botChunks, rawBots: bot });
        } else return res.sendStatus(401);
    } else return res.sendStatus(403);
});

app.get('/:id/certification', async (req, res, next) => {
    const bot = await r.table('bots').get(req.params.id).run();
    if (!bot) return next();
    const botimage = await Util.attachPropBot(bot, req.user);
    const t8 = new Date() - ms('31 days');
    if (req.user.id === bot.ownerID || req.user.owner || req.user.admin) {
        res.render('botdashboard/menu/certif', { libs: require('./api').libList,tage: require('./api').tagbot, bot,botimage, t8, user: req.user ? await Util.attachPropUser(req.user) : null });
    } else res.status(403).json({ error: 'you do not own this bot' });
});

app.get('/:id/reset', async (req, res, next) => {
    const rB = await r.table('bots').get(req.params.id);
    if (!rB) return next();
    const bot = await Util.attachPropBot(rB, req.user);
    if (!bot.verified) return res.sendStatus(403);
    if (!req.user) return res.sendStatus(401);
    if (req.user.id !== bot.ownerID || req.user.owner) return res.sendStatus(403);
    await r.table('bots').get(req.params.id).update({ apiToken: randomstring.generate(30) });
    res.redirect(`/bot/dashboard/${req.params.id}/token`);
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

app.get('/premium/pay/:userid/:botid', async (req, res) =>{
    const bot = await r.table('bots').get(req.params.botid).run()
    if(!bot) return res.status(403).json({error: 'Bot not found'});
    const user = await  r.table('users').get(req.params.userid).run()
    if(!user) return res.status(403).json({error: 'User not found'});
    if(!(req.user.id === bot.ownerID  || req.user.owner)) return res.status(403).json({error: 'Invalide bot id'});
    if(!(user.id == req.user.id)) return res.status(403).json({error: 'Invalide user id'});
    if(user.invitecount > 49) {
        if(bot.certified) {
            r.table('bots').get(req.params.botid).update({certified: true}).run()
            r.table('bots').get(req.params.botid).update({certifiedend: r.row('certifiedend') + ms('30 days')}).run()
            r.table('users').get(req.params.userid).update({invitecount: 0}).run()
            client.channels.cache.get('928807927186354206').send(`Bravo à <@${req.params.userid}>, qui a obtenu l\'offre **Premium** grâce au système d\'affiliation`);
            res.redirect('/bot/dashboard/'+ req.params.botid)
            } else {
            r.table('bots').get(req.params.botid).update({certified: true}).run()
            r.table('bots').get(req.params.botid).update({certifiedat: Date.now()}).run()
            r.table('bots').get(req.params.botid).update({certifiedend: Date.now() + ms('30 days')}).run()
            r.table('users').get(req.params.userid).update({invitecount: 0}).run()
            client.channels.cache.get('928807927186354206').send(`Bravo à <@${req.params.userid}>, qui a obtenu l\'offre **Premium** grâce au système d\'affiliation`);
            res.redirect('/bot/dashboard/'+ req.params.botid)
        }
    } else {
        var payReq = JSON.stringify({
            'intent':'authorize',
            'redirect_urls':{
                'return_url':`https://discbot.xyz/bot/dashboard/premium/check/${req.params.userid}/${req.params.botid}`,
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
                'description':'Premium DiscBot'
            }]
        });
        paypal.payment.create(payReq, function(error, payment){
            if(error) {
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
    }
});

app.get('/premium/check/:userid/:botid', async (req, res) =>{
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
                if(bot.certified) {
                    r.table('bots').get(req.params.botid).update({certified: true}).run()
                    r.table('bots').get(req.params.botid).update({certifiedend: r.row('certifiedend') + ms('30 days')}).run()
                } else {
                    r.table('bots').get(req.params.botid).update({certified: true}).run()
                    r.table('bots').get(req.params.botid).update({certifiedat: Date.now()}).run()
                    r.table('bots').get(req.params.botid).update({certifiedend: Date.now() + ms('30 days')}).run()
                }
                client.channels.cache.get('928807927186354206').send(`Merci à <@${req.params.userid}>, pour son soutien de **5€** en prenant l\'offre Premium`);
                res.redirect('/bot/dashboard/' + req.params.botid + '/general')
            } else {
                res.send('payment not successful');
            }
        }
    });
});