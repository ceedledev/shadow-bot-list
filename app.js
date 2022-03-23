const express = require('express');
const session = require('express-session');
const passport = require('passport');
const Discord = require('passport-discord');
const logger = require('morgan');
const { ensureLoggedIn } = require('connect-ensure-login');
const compress = require('compression');
const { r, client } = require('./ConstantStore');
const { promisify } = require('util');
const cp = require('child_process');
const exec = promisify(cp.exec);
const config = require('./config');
const minifyHTML = require('express-minify-html');
const RethinkStore = require('session-rethinkdb')(session);
const port = process.env.PORT || require('./config.json').listeningPort || 3000;
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const helmet = require('helmet');

const app = (module.exports = express());

app.use(require('helmet')());
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use((req, res, next) => {
    const { bot } = require('./ConstantStore');
    if (!bot.readyTimestamp) {
        bot.once('ready', () => {
            next();
        });
    } else {
        next();
    }
});

app.use(compress());
app.use(
    minifyHTML({
        override: true,
        exception_url: false,
        htmlMinifier: {
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeEmptyAttributes: true
        }
    })
);

app.use(express.static(__dirname + '/unused'));
app.use('/unused', express.static(__dirname + '/unused'));
app.use(express.static('static'));
app.use(express.json());
app.use('/api/public', require('./routes/botapi'));
app.use('/certify' , require('./routes/certificationRoute'));
app.use(session({ saveUninitialized: true, resave: false, name: 'discordboats_session', secret: require('./ConstantStore').secret, store: new RethinkStore(require('./ConstantStore').r) }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(undefined, user.id));
passport.deserializeUser(async (id, done) => {
    done(
        undefined,
        await r.table('users').get(id).run()
    );
});

const discordScopes = (module.exports.discordScopes = ['identify', 'guilds', 'email']);
passport.use(
    new Discord(
        {
            clientID: config.clientID,
            clientSecret: config.clientSecret,
            scope: discordScopes,
            callbackURL: config.callbackURL,
	        authorizationURL: 'https://discordapp.com/api/oauth2/authorize?prompt=none'
        },
        async (accessToken, refreshToken, profile, done) => {
            let user = await r.table('users').get(profile.id).run();
            if (!user) {
                let guildarray = [];
                profile.guilds.filter(e => e.owner == true).forEach( b => { 
                    guildarray.push(b);
                });
                user = {
                    id: profile.id,
                    discordAT: accessToken,
                    discordRT: refreshToken,
                    createdAt: new Date().getTime(),
                    badges: [],
                    guilds: guildarray,
                    verif: profile.verified
                };
            } 
            await r.table('users').insert(user, { conflict: 'update' }).run();
            done(undefined, profile);
            if(!user.guilds) {
                let guildarray = [];
                profile.guilds.filter(e => e.owner == true).forEach( b => { 
                    guildarray.push(b);
                });
                user = { 
                    id: user.id,
                    discordAT: user.discordAT,
                    discordRT: user.discordRT,
                    createdAt: user.createdAt,
                    badges: [user.badges],
                    guilds: guildarray,
                    verif: profile.verified
                }
            }
            let guildarray = [];
            profile.guilds.filter(e => e.owner == true).forEach( b => { 
                guildarray.push(b);

            })
            user = { 
                id: user.id,
                discordAT: user.discordAT,
                discordRT: user.discordRT,
                createdAt: user.createdAt,
                badges: [user.badges],
                guilds: guildarray,
                verif: profile.verified
            }
            await r.table('users').insert(user, { conflict: 'update' }).run();
            done(undefined, profile);
        }
    )
);

app.use(require('./routes/index'));
app.use('/discord', require('./routes/discord'));
app.use('/dashboard', ensureLoggedIn('/discord/login'), require('./routes/dashboard'));
app.use('/user/dashboard', ensureLoggedIn('/discord/login'), require('./routes/userdashboard'));
app.use('/bot/dashboard', ensureLoggedIn('/discord/login'), require('./routes/botdashboard'));
app.use('/api', require('./routes/api'));

app.use((req, res) => {
    res.status(404).render('404', { user: req.user });
});


app.use((req, res) => {
    res.status(404).render('404', { user: req.user });
});

const httpsServer = https.createServer(app);
httpsServer.listen(443, () => {
	console.log('HTTPS Serveur en marche sur le port 443');
});

http.createServer(app,function (req, res) {
    console.log('HTTPS Serveur en marche sur le port 80');
}).listen(80);