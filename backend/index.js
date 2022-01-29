const axios = require('axios')

const { Telegram } = require('telegraf')
const bot = new Telegram(process.env.BOT_API)

// Load ENV Configuration
require('dotenv').config();


// load database library and create database connection
const sqlite3 = require(`sqlite3`).verbose()

const db = new sqlite3.Database(`./database/alert.sqlite` , sqlite3.OPEN_READWRITE , async err => {
    // Failed to connect database
    if(err) return console.error(err.message);

    // if successfully connected to database
    console.log("Successfully connected to database [BACKEND]");

    // Creating table if doesn't exists
    try{
        await db_init.generate_table(db)
    }catch(error){
        console.error(err)
    }
})

const getAlert = async (gas_price , callback) => {
    db.all(`SELECT * FROM alerts WHERE gasprice >= ${gas_price}` , [] , (err,res) => {
        if(err) {
            console.log(err.message)
            callback({status: false,messsage: err.message})
        }
        callback({status: true,data: res || [] })
    })
}

const makePlaceholder = (data) => {
    var placeHolder = "("
    for(i=1;i<=data.length;i++){
        placeHolder += data[i-1].id + (i == data.length ? "" : "," )
    }
    placeHolder += ")"
    return placeHolder
}

const run = () => {
    setInterval(async () => {
        const getGas = await axios.get(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API}`)
        
        console.log(`Current Gas Price : ${getGas.data.result.SafeGasPrice}`)

        await getAlert(getGas.data.result.SafeGasPrice , res => {
            if(res.status){
                
                // Sending Alerts to users
                res.data.map(alert => {
                    bot.sendMessage(alert.user , `ℹ️ The Gas Price now is ${alert.gasprice} or less`)
                })

                // Delete Records
                const listData = [...res.data.map(v => {return v.id})]
                if(listData.length >= 1){
                    db.run(`DELETE FROM alerts WHERE id IN ${makePlaceholder(res.data) || []}`)
                }
            }
        })
    } , 10000)
}

run()