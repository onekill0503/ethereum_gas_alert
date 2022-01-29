// Load ENV Configuration
require('dotenv').config();

// Runing backend
require('./backend/index')

// Load Library
// const db = require('./database/index')
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_API)

// load database library and create database connection
const sqlite3 = require(`sqlite3`).verbose()


const db = new sqlite3.Database(process.env.sqlite3_src , sqlite3.OPEN_READWRITE , async err => {
    // Failed to connect database
    if(err) return console.error(err.message);

    // if successfully connected to database
    console.log("Successfully connected to database [FRONTEND]");

    // Creating table if doesn't exists
    try{
        await db_init.generate_table(db)
    }catch(error){
        console.error(err)
    }
})

// init function
function init(){
    db.serialize(() => {
        db.prepare(`CREATE TABLE IF NOT EXISTS alerts (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, gasprice INTEGER)`).run().finalize();
    } , err => console.error(err.message));
    return true
}
// Function saving errors
function error_logs(message){
    
}


// Sending message when user first time using bot
bot.start(async (ctx) => {
    await ctx.reply('Welcome to ETH Gas Alert Bot\n\n This bot will help you to reminder the ethereum gas price by specific value.You can start by set alert by typing \n/alert {specific gas price}')
})

// List Command
bot.command(`alert` , async ctx => {
    const gas_price = ctx.message.text.split(' ')[1]
    // Invalid gas price (no input)
    if(!gas_price) return ctx.reply("Please put spesific gas price !")
    // Invalid data type (not integer / number)
    if(Number(gas_price) == 'NaN') return ctx.reply("Invalid Input\n`Input must be number`")

    // get user telegram id
    const user = ctx.message.from.id

    // function to check user have data
    await db.all(`SELECT * FROM alerts WHERE user='${user}'` , [] , async (err , res) => {
        if(res !== undefined){
            if(err){
                console.log(err.message)
                ctx.reply(`❗️ Failed to get data\n${err.message}`)
                return false
            }
            if(res.length > 0){
                let status = false
                res.map(function(a){
                    if(a.gasprice == gas_price) status = true
                })
                if(status){
                    ctx.reply(`❗️ You same alert data in our records !`)
                    return false
                }
            }
            if(res.length == 2){
                ctx.reply(`❗️ Only 2 alerts per user\nℹ️ Clear the alert to make another!`)
                return false
            }
        }
        
        // Saving Data
        await db.run(`INSERT INTO alerts (user,gasprice) VALUES('${user}' , '${gas_price}')` , (err) => {
            if(err){
                console.log(err.message)
                ctx.reply(`❗️ Failed save data\n${err.message}`)
            }else {
                ctx.reply(`✅ Successfully saved your alert !\nℹ️ we will inform you when gas price same or below ${gas_price}`)
            }
        })
    })

    
})

bot.command(`clear` , async ctx => {
    try {
        const id = ctx.message.from.id
        await db.run(`DELETE FROM alerts WHERE user=${id}` , err => {
            if(err){
                throw new Error(err.message)
            }
            ctx.reply(`✅ Successfully Delete all records !`)
        })
    }catch(err){
        error_logs(err.message , ctx.message.from.id)
        ctx.reply(`❌ Failed to do your command! try again later or contact our dev.`)
    }
})

init()
bot.launch()