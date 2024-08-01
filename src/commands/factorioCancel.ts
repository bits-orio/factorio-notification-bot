import { ChatInputCommandInteraction } from 'discord.js';
import { removeSubscription } from '../subscriptionManager';

export async function handleFactorioCancel(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({ content: 'You need to be an administrator to use this command.', ephemeral: true });
        return;
    }

    const subscriptionId = interaction.options.getString('id');
    if (!subscriptionId) {
        await interaction.reply({ content: 'Please provide a subscription ID to cancel.', ephemeral: true });
        return;
    }

    const success = removeSubscription(subscriptionId, interaction.guildId!);

    if (success) {
        await interaction.reply(`Subscription with ID ${subscriptionId} has been cancelled.`);
    } else {
        await interaction.reply({ content: 'Subscription not found or not owned by this server.', ephemeral: true });
    }
}