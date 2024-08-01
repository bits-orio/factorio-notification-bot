import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const FACTORIO_TAG = process.env.FACTORIO_TAG;
const FACTORIO_USERNAME = process.env.FACTORIO_USERNAME;
const FACTORIO_PASSWORD = process.env.FACTORIO_PASSWORD;

let factorioToken: string | null = null;

client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    authenticateFactorio().then(() => {
        checkFactorioServers();
    });
});

async function authenticateFactorio(): Promise<void> {
    try {
        const response = await axios.post('https://auth.factorio.com/api-login', null, {
            params: {
                username: FACTORIO_USERNAME,
                password: FACTORIO_PASSWORD,
            }
        });
        if (response.data && response.data.length > 0) {
            factorioToken = response.data[0];
            console.log('Successfully authenticated with Factorio');
        } else {
            throw new Error('Authentication failed');
        }
    } catch (error) {
        console.error('Error authenticating with Factorio:', error);
        throw error;
    }
}

async function checkFactorioServers() {
    if (!CHANNEL_ID) {
        throw Error("Missing Channel Id");
    }

    if (!factorioToken) {
        console.log('No Factorio token available. Attempting to authenticate...');
        await authenticateFactorio();
    }

    try {
        const response = await axios.get('https://multiplayer.factorio.com/get-games', {
            params: {
                username: FACTORIO_USERNAME,
                token: factorioToken,
            }
        });
        const games = response.data;
        // console.log(JSON.stringify(games));
        for (const game of games) {
            if (!game.tags || game.has_password ) {
                continue;
            }
            if (game.tags.includes(FACTORIO_TAG)) {
                console.log("foind tag");
                const channel = client.channels.cache.get(CHANNEL_ID) as TextChannel;
                if (channel) {
                    console.log(`New Factorio server found with tag "${FACTORIO_TAG}":\nName: ${game.name}\nDescription: ${game.description}`);
                    await channel.send(`New Factorio server found with tag "${FACTORIO_TAG}":\nName: ${game.name}\nDescription: ${game.description}`);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching Factorio servers:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            console.log('Authentication token expired. Reauthenticating...');
            await authenticateFactorio();
        }
    }

    // Check again after 10 seconds
    setTimeout(checkFactorioServers, 10000);
}

client.login(DISCORD_TOKEN);