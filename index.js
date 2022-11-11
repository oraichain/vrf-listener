const Cosmos = require('@oraichain/cosmosjs').default;
require('dotenv').config();
const https = require("https");

// global
global.cosmos = new Cosmos(process.env.LCD_URL, process.env.CHAIN_ID);

class Telegram {
    constructor(token) {
        this.endpoint = `https://api.telegram.org/bot${token}/sendMessage?chat_id=%chatId&text=%message&parse_mode=Markdown`;
    }

    send(recipient, message, callback) {
        let endpointUrl = this.endpoint
            .replace("%chatId", recipient)
            .replace("%message", message);

        https.get(endpointUrl, res => {
            res.on("data", function (chunk) {
                // console.log("BODY: " + chunk);
                callback && callback(chunk);
            });
        });
    }
}

const telegram = new Telegram(process.env.TELEGRAM_TOKEN);
const pingContract = process.env.PING_CONTRACT;
const countList = {};

const queryWasm = async (contract, input) => {
    let wasmPath = process.env.MAINNET_VERSION === '0.40.4' ? 'wasm/v1beta1' : 'cosmwasm/wasm/v1';
    const url = `/${wasmPath}/contract/${contract}/smart/${Buffer.from(
        JSON.stringify(input)
    ).toString('base64')}`;
    // console.log(`${cosmos.url}${url}`);
    const data = await cosmos.get(url);
    return data.data;
};

const checkRound = (latestHeight, infoHeight, roundJump) => {
    return latestHeight - infoHeight >= roundJump ||
        infoHeight === 0;
}

const checkPing = async () => {
    // collect info about round and round jump, ok to ping => ping
    const latest = await cosmos.get('/blocks/latest');
    const latestHeight = latest.block.header.height;

    const roundInfo = await queryWasm(pingContract, {
        get_state: {}
    });

    const rounds = await queryWasm(pingContract, {
        get_rounds: {
            limit: 30
        }
    });
    for (let round of rounds) {
        if (countList[round.executor] !== undefined && checkRound(latestHeight, round.round_info.height, roundInfo.round_jump)) {
            countList[round.executor] += 1;
        } else {
            countList[round.executor] = 0;
        }
    }
};

async function start() {
    try {
        await checkPing();
        let errorList = Object.keys(countList).filter(element => countList[element] === 2);
        // meaning that the round has not been handled
        const mappedInfo = [
            {
                "address": process.env.YOUR_WALLET_ADDRESS,
                "id": process.env.YOUR_TELEGRAM_ID
            }
        ]

        let missingMembers = mappedInfo.filter(info => errorList.includes(info.address));
        console.log("missing members: ", missingMembers);
        let message = ``;
        for (let mappedUser of missingMembers) {
            message = message.concat(`you with address - ${mappedUser.address} are not submitting the ping request%0A`);
            countList[mappedUser.address] = 0;
        }
        if (message !== ``) {
            // reset those that have been reported to 0
            telegram.send(process.env.YOUR_TELEGRAM_ID, message);
        }
    } catch (error) {
        console.log("error is: ", error);
        telegram.send(process.env.YOUR_TELEGRAM_ID, error); // vrf channel for vrf errors
    }
}

require('node-cron').schedule(`*/${process.env.MINUTES_INTERVAL} * * * * *`, async () => {
    console.log(`running vrf every ${process.env.MINUTES_INTERVAL} minutes`);
    await start();
}).start();