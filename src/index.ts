import { Observable, of, Subscription, timer } from 'rxjs';
import { retry, share, switchMap, tap } from 'rxjs/operators';
import { CHECK_INTERVAL, FACTORIO_TOKEN, RETRY_DELAY } from './config';
import { initializeBot, sendDiscordMessage } from './discordBot';
import { authenticateFactorio, getFactorioServers } from './factorioApi';
import { getSubscriptions, loadSubscriptions, updateSubscription } from './subscriptionManager';
import { FactorioGame, FactorioNotifySubscription } from './types';

import { TrackedGame } from './types';


global.XMLHttpRequest = require('xhr2');

let factorioToken: string = FACTORIO_TOKEN;

function checkFactorioServers(): Observable<FactorioGame[]> {
    return of(null).pipe(
        switchMap(() => factorioToken ? of(factorioToken) : authenticateFactorio()),
        switchMap(getFactorioServers),
        tap((games: FactorioGame[]) => {
            console.log(`Found ${games.length} Factorio servers`);
            const subscriptions = getSubscriptions();
            subscriptions.forEach(sub => processSubscription(sub, games));
        })
    );
}

function processSubscription(subscription: FactorioNotifySubscription, allGames: FactorioGame[]) {
    const putlicGames = allGames.filter(game => !game.has_password);
    const matchingGames = putlicGames.filter(game => 
        (game.tags && subscription.tags.some(tag => game.tags.includes(tag))) ||
        subscription.nameKeywords.some(keyword => game.name.toLowerCase().includes(keyword.toLowerCase())) ||
        subscription.descriptionKeywords.some(keyword => game.description.toLowerCase().includes(keyword.toLowerCase()))
    );

    const updatedTrackedGames: TrackedGame[] = [];
    const currentGameIds = new Set(matchingGames.map(game => game.game_id));
    
    matchingGames.forEach(game => {
        const trackedGame = subscription.trackedGames.find(tg => tg.game_id === game.game_id);
        const isNew = !trackedGame;
        const isReset = (trackedGame && game.game_time_elapsed < trackedGame.game_time_elapsed) || false;

        if (isNew || isReset) {
            sendDiscordMessage(subscription.channelId, game, isNew, isReset);
        }

        updatedTrackedGames.push({
            game_id: game.game_id,
            game_time_elapsed: game.game_time_elapsed,
            last_posted: Date.now()
        });
    });

    // Remove tracked games that are no longer in the matching games list
    subscription.trackedGames = subscription.trackedGames.filter(tg => currentGameIds.has(tg.game_id));

    // Add new tracked games
    updatedTrackedGames.forEach(utg => {
        if (!subscription.trackedGames.some(tg => tg.game_id === utg.game_id)) {
            subscription.trackedGames.push(utg);
        }
    });

    // Update existing tracked games
    subscription.trackedGames.forEach(tg => {
        const updatedGame = updatedTrackedGames.find(utg => utg.game_id === tg.game_id);
        if (updatedGame) {
            tg.game_time_elapsed = updatedGame.game_time_elapsed;
            tg.last_posted = updatedGame.last_posted;
        }
    });

    // Update the subscription in the storage
    updateSubscription(subscription);
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






// function checkFactorioServers(): Observable<FactorioGame[]> {
//     return of(null).pipe(
//         switchMap(() => factorioToken ? of(factorioToken) : authenticateFactorio()),
//         switchMap(getFactorioServers),
//         tap((games: FactorioGame[]) => {
//             console.log(`Found ${games.length} Factorio servers`);
//             const subscriptions = getSubscriptions();
//             subscriptions.forEach(sub => {
//                 const putlicGames = games.filter(game => !game.has_password);
//                 const matchingGames = putlicGames.filter(game => 
//                     (game.tags && sub.tags.some(tag => game.tags.includes(tag))) ||
//                     sub.descriptionKeywords.some(keyword => game.description.toLowerCase().includes(keyword.toLowerCase()))
//                 );

//                 const updatedTrackedGames: TrackedGame[] = [];
                
//                 matchingGames.forEach(game => {
//                     const trackedGame = sub.trackedGames.find(tg => tg.game_id === game.game_id);
//                     const isNew = !trackedGame;
//                     const isReset = (trackedGame && game.game_time_elapsed < trackedGame.game_time_elapsed) || false;

//                     if (isNew || isReset) {
//                         console.log(`Posting ${isNew ? "new" : ""} on Discord: ${game.game_id} - ${game.name} - ${game.game_time_elapsed}`);
//                         sendDiscordMessage(sub.channelId, game, isNew, isReset);
//                     }

//                     updatedTrackedGames.push({
//                         game_id: game.game_id,
//                         game_time_elapsed: game.game_time_elapsed,
//                         last_posted: Date.now()
//                     });
//                 });

//                 updateTrackedGames(sub.id, updatedTrackedGames);
//             });
//         })
//     );
// }

// function startFactorioCheck() {
//     timer(0, CHECK_INTERVAL).pipe(
//         switchMap(() => checkFactorioServers()),
//         retry({
//             delay: (error, retryCount) => {
//                 console.log(error);
//                 console.log(`Retry attempt ${retryCount}`);
//                 return timer(RETRY_DELAY);
//             }
//         }),
//         share()
//     ).subscribe();
// }

function main() {
    loadSubscriptions();
    initializeBot();
    startFactorioCheck();
}

main();