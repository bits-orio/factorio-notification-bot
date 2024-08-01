import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { Observable, of, timer, throwError } from 'rxjs';
import { map, switchMap, catchError, retry, tap, share } from 'rxjs/operators';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import dotenv from 'dotenv';

// Configure XMLHttpRequest for Node.js environment
global.XMLHttpRequest = require('xhr2');

// Load environment variables
dotenv.config();

// Types
interface ApplicationVersion {
    game_version: string;
    build_version: number;
    build_mode: string;
    platform: string;
}

interface FactorioGame {
    game_id: number;
    name: string;
    description: string;
    max_players: number;
    application_version: ApplicationVersion;
    game_time_elapsed: number;
    has_password: boolean;
    server_id: string;
    tags: string[];
    host_address: string;
    headless_server: boolean;
    has_mods: boolean;
    mod_count: number;
}

// Constants
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const FACTORIO_TAG = process.env.FACTORIO_TAG;
const FACTORIO_USERNAME = process.env.FACTORIO_USERNAME;
const FACTORIO_PASSWORD = process.env.FACTORIO_PASSWORD;
const CHECK_INTERVAL = 10000; // 10 seconds
const RETRY_DELAY = 5000; // 5 seconds

// Global variables
let factorioToken: string | null = null;

// Discord client setup
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Factorio API functions
function authenticateFactorio(): Observable<string> {
    if (!FACTORIO_USERNAME || !FACTORIO_PASSWORD) {
        return throwError(() => new Error('FACTORIO_USERNAME or FACTORIO_PASSWORD not specified'));
    }

    return ajax({
        url: 'https://auth.factorio.com/api-login',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: FACTORIO_USERNAME, password: FACTORIO_PASSWORD }).toString()
    }).pipe(
        map(response => {
            if (Array.isArray(response.response) && response.response.length > 0) {
                return response.response[0];
            }
            throw new Error('Authentication failed');
        }),
        tap(token => {
            factorioToken = token;
            console.log('Successfully authenticated with Factorio');
        }),
        catchError(error => {
            console.error('Error authenticating with Factorio:', error);
            return throwError(() => error);
        })
    );
}

function getFactorioServers(token: string): Observable<FactorioGame[]> {
    return ajax({
        url: `https://multiplayer.factorio.com/get-games?username=${FACTORIO_USERNAME}&token=${token}`,
        method: 'GET'
    }).pipe(
        map((response: AjaxResponse<any>) => response.response as FactorioGame[]),
        catchError(error => {
            console.error('Error fetching Factorio servers:', error);
            return throwError(() => error);
        })
    );
}

// Discord functions
function sendDiscordMessage(game: FactorioGame) {
    const channel = client.channels.cache.get(CHANNEL_ID!) as TextChannel;
    if (channel) {
        const message = `
New Factorio server found with tag "${FACTORIO_TAG}":
Name: ${game.name}
Description: ${game.description}
Players: ${game.max_players === 0 ? 'Unlimited' : game.max_players}
Version: ${game.application_version.game_version}
Password Protected: ${game.has_password ? 'Yes' : 'No'}
Mods: ${game.has_mods ? `Yes (${game.mod_count})` : 'No'}
Game Time: ${formatGameTime(game.game_time_elapsed)}
`;
        channel.send(message);
    }
}

function formatGameTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

// Main logic
function checkFactorioServers(): Observable<FactorioGame[]> {
    if (!FACTORIO_USERNAME || !CHANNEL_ID) {
        return throwError(() => new Error('FACTORIO_USERNAME or CHANNEL_ID not specified'));
    }

    return of(null).pipe(
        switchMap(() => factorioToken ? of(factorioToken) : authenticateFactorio()),
        switchMap(getFactorioServers),
        tap((games: FactorioGame[]) => {
            console.log(`Found ${games.length} Factorio servers`);
            games
                .filter(game => game.tags && game.tags.includes(FACTORIO_TAG!))
                .forEach(sendDiscordMessage);
        }),
        catchError(error => {
            if (error.status === 401) {
                console.log('Authentication token expired. Reauthenticating...');
                factorioToken = null;
                return authenticateFactorio().pipe(switchMap(() => checkFactorioServers()));
            }
            console.log(error);
            return throwError(() => error);
        })
    );
}

function startFactorioCheck() {
    timer(0, CHECK_INTERVAL).pipe(
        switchMap(() => checkFactorioServers()),
        retry({
            delay: (error, retryCount) => {
                console.log(`Retry attempt ${retryCount}`);
                return timer(RETRY_DELAY);
            }
        }),
        share()
    ).subscribe();
}

// Discord client event handlers
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    startFactorioCheck();
});

// Start the bot
client.login(DISCORD_TOKEN);