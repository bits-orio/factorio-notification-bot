import { Client, GatewayIntentBits, Interaction, ChatInputCommandInteraction, ButtonInteraction, TextChannel } from 'discord.js';
import { DISCORD_TOKEN } from './config';
import { handleCancelButton } from './commands/handleCancelButton';
import { registerCommands } from './commands/registerCommands';
import { FactorioGame } from './types';
import { handleFactorioNotify } from './commands/factorioNotify';
import { handleFactorioList } from './commands/factorioList';
import { handleFactorioCancel } from './commands/factorioCancel';

export const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

export function initializeBot() {
    client.once('ready', async () => {
        console.log(`Logged in as ${client.user?.tag}!`);
        await registerCommands();
    });

    client.on('interactionCreate', async (interaction: Interaction) => {
        try {
            if (interaction.isChatInputCommand()) {
                await handleCommand(interaction);
            } else if (interaction.isButton()) {
                await handleButton(interaction);
            }
            // Add more interaction type handlers here if needed
        } catch (error) {
            console.error('Error handling interaction:', error);
            await handleInteractionError(interaction);
        }
    });

    client.login(DISCORD_TOKEN);
}

async function handleCommand(interaction: ChatInputCommandInteraction) {
    const { commandName } = interaction;

    if (commandName === 'factorio-notify') {
        await handleFactorioNotify(interaction);
    } else if (commandName === 'factorio-list') {
        await handleFactorioList(interaction);
    } else if (commandName === 'factorio-cancel') {
        await handleFactorioCancel(interaction);
    }
}

async function handleButton(interaction: ButtonInteraction) {
    if (interaction.customId.startsWith('cancel_')) {
        await handleCancelButton(interaction);
    }
}

async function handleInteractionError(interaction: Interaction) {
    if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    } else {
        console.error('Interaction is not repliable');
    }
}

// Description: ${game.description}
// Players: ${game.max_players === 0 ? 'Unlimited' : game.max_players}
// Version: ${game.application_version.game_version}
// Password Protected: ${game.has_password ? 'Yes' : 'No'}
export function sendDiscordMessage(channelId: string, game: FactorioGame, isNew: boolean, isReset: boolean) {
    const channel = client.channels.cache.get(channelId) as TextChannel;
    if (channel) {
        let statusMessage = '';
        if (isNew) {
            statusMessage = '**New Game Alert!**';
        } else if (isReset) {
            statusMessage = '**Game Reset Alert!**';
        }

        const message = `\`\`\`ansi
${statusMessage}
Game Id: \u001b[0;40m${game.game_id}\u001b[0;0m
Name: \u001b[0;41m${game.name}\u001b[0;0m
Game Time: ${formatGameTime(game.game_time_elapsed)}
Mods: ${game.has_mods ? `Yes (${game.mod_count})` : 'No'}
\`\`\`
`;
        channel.send(message);
    }
}

function formatGameTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}
