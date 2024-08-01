import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { DISCORD_TOKEN, CLIENT_ID } from '../config';

const commands = [
    new SlashCommandBuilder()
        .setName('factorio-notify')
        .setDescription('Create a new Factorio server notification subscription')
        .addStringOption(option =>
            option.setName('tags')
                .setDescription('Comma-separated list of tags to match')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('name-has')
                .setDescription('Comma-separated list of keywords to match in name (title) of the game')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('description-has')
                .setDescription('Comma-separated list of keywords to match in description')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('factorio-list')
        .setDescription('List all active Factorio server notification subscriptions'),
    new SlashCommandBuilder()
        .setName('factorio-cancel')
        .setDescription('Cancel a Factorio server notification subscription')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The ID of the subscription to cancel')
                .setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

export async function registerCommands() {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands.map(command => command.toJSON()) },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error refreshing application commands:', error);
    }
}
