module.exports = {
  apps : [{
    name: "SBL",
    script: "./app.js",
    watch: true,
    ignore_watch: "node_modules rethinkdb-new",
  }]
};