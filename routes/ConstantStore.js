const randomstring = require('randomstring');
const fs = require('fs');
let secret;

module.exports = class ConstantStore {
    /**
     * @returns {String}
     */
    static get secret() {
        if (fs.existsSync('secret')) return fs.readFileSync('secret').toString();
        else {
            secret = randomstring.generate(500);
            fs.writeFileSync('secret', secret);
            return secret;
        }
    }
};

const r = module.exports.r = require("rethinkdbdash")({db: "test", port: 28015 });
const bot = module.exports.bot = require("./bot/bot.js");