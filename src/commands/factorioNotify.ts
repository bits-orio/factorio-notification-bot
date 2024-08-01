import { ChatInputCommandInteraction } from 'discord.js';
import { FactorioNotifySubscription } from '../types';
import { addSubscription } from '../subscriptionManager';

export async function handleFactorioNotify(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({ content: 'You need to be an administrator to use this command.', ephemeral: true });
        return;
    }

    const tags = interaction.options.getString('tags')?.split(',').map(tag => tag.trim()) || [];
    const nameKeywords = interaction.options.getString('name-has')?.split(',').map(keyword => keyword.trim()) || [];
    const descriptionKeywords = interaction.options.getString('description-has')?.split(',').map(keyword => keyword.trim()) || [];

    if (tags.length === 0 && descriptionKeywords.length === 0 && nameKeywords.length === 0) {
        await interaction.reply({ content: 'Please specify at least one tag or description or name keyword.', ephemeral: true });
        return;
    }

    const subscription: FactorioNotifySubscription = {
        id: Date.now().toString(),
        guildId: interaction.guildId!,
        channelId: interaction.channelId,
        tags,
        nameKeywords,
        descriptionKeywords,
        trackedGames: []
    };

    addSubscription(subscription);

    await interaction.reply(`Notification subscription added with ID: ${subscription.id}`);
}