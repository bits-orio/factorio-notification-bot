import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { removeSubscription } from '../subscriptionManager';

export async function handleCancelButton(interaction: ButtonInteraction) {
    if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({ content: 'You need to be an administrator to cancel subscriptions.', ephemeral: true });
        return;
    }

    const subscriptionId = interaction.customId.split('_')[1];
    const success = removeSubscription(subscriptionId, interaction.guildId!);

    if (success) {
        console.log(`Cancelled subscription id: ${subscriptionId}`);

        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
            .setColor('#FF0000')
            .setTitle(`Subscription Cancelled: ${subscriptionId}`)
            .addFields({ name: 'Status', value: 'This subscription has been cancelled.', inline: false });

        await interaction.update({ embeds: [updatedEmbed], components: [] });
    } else {
        await interaction.reply({ content: 'Subscription not found or not owned by this server.', ephemeral: true });
    }
}