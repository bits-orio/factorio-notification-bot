import fs from 'fs';
import { FactorioNotifySubscription } from './types';
import { SUBSCRIPTIONS_FILE } from './config';

let subscriptions: FactorioNotifySubscription[] = [];

export function loadSubscriptions() {
    try {
        if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
            const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
            subscriptions = JSON.parse(data);
            console.log(`Loaded ${subscriptions.length} subscriptions from file.`);
        } else {
            console.log('No existing subscriptions file found. Starting with empty subscriptions.');
            subscriptions = [];
        }
    } catch (error) {
        console.error('Error loading subscriptions:', error);
        subscriptions = [];
    }
}

export function saveSubscriptions() {
    try {
        fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
        console.log(`Saved ${subscriptions.length} subscriptions to file.`);
    } catch (error) {
        console.error('Error saving subscriptions:', error);
    }
}

export function addSubscription(subscription: FactorioNotifySubscription) {
    subscriptions.push(subscription);
    saveSubscriptions();
}

export function removeSubscription(id: string, guildId: string) {
    const index = subscriptions.findIndex(sub => sub.id === id && sub.guildId === guildId);
    if (index !== -1) {
        subscriptions.splice(index, 1);
        saveSubscriptions();
        return true;
    }
    return false;
}

export function getSubscriptions() {
    return subscriptions;
}

export function updateSubscription(updatedSubscription: FactorioNotifySubscription) {
    const index = subscriptions.findIndex(sub => sub.id === updatedSubscription.id);
    if (index !== -1) {
        subscriptions[index] = updatedSubscription;
        saveSubscriptions();
    }
}

// import fs from 'fs';
// import { SUBSCRIPTIONS_FILE } from './config';
// import { FactorioNotifySubscription, TrackedGame } from './types';


// let subscriptions: FactorioNotifySubscription[] = [];

// export function loadSubscriptions() {
//     try {
//         if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
//             const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
//             subscriptions = JSON.parse(data);
//             console.log(`Loaded ${subscriptions.length} subscriptions from file.`);
//         } else {
//             console.log('No existing subscriptions file found. Starting with empty subscriptions.');
//             subscriptions = [];
//         }
//     } catch (error) {
//         console.error('Error loading subscriptions:', error);
//         subscriptions = [];
//     }
// }

// export function saveSubscriptions() {
//     try {
//         fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
//         console.log(`Saved ${subscriptions.length} subscriptions to file.`);
//     } catch (error) {
//         console.error('Error saving subscriptions:', error);
//     }
// }

// export function removeSubscription(id: string, guildId: string) {
//     const index = subscriptions.findIndex(sub => sub.id === id && sub.guildId === guildId);
//     if (index !== -1) {
//         subscriptions.splice(index, 1);
//         saveSubscriptions();
//         return true;
//     }
//     return false;
// }

// export function addSubscription(subscription: FactorioNotifySubscription) {
//     subscription.trackedGames = [];
//     subscriptions.push(subscription);
//     saveSubscriptions();
// }

// export function updateTrackedGames(subscriptionId: string, games: TrackedGame[]) {
//     const subscription = subscriptions.find(sub => sub.id === subscriptionId);
//     if (subscription) {
//         subscription.trackedGames = games;
//         saveSubscriptions();
//     }
// }

// export function getSubscriptions() {
//     return subscriptions;
// }
