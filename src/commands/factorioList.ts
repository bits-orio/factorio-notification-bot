import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getSubscriptions } from '../subscriptionManager';

export async function handleFactorioList(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({ content: 'You need to be an administrator to use this command.', ephemeral: true });
        return;
    }

    const allSubscriptions = getSubscriptions();
    const guildSubscriptions = allSubscriptions.filter(sub => sub.guildId === interaction.guildId);
    
    if (guildSubscriptions.length === 0) {
        await interaction.reply({ content: 'No active subscriptions for this server.', ephemeral: true });
        return;
    }

    await interaction.deferReply();

    for (const sub of guildSubscriptions) {
        const embed = new EmbedBuilder()
            .setTitle(`Subscription ID: ${sub.id}`)
            .setDescription(`Channel: <#${sub.channelId}>`)
            .addFields(
                { name: 'Tags', value: sub.tags.join(', ') || 'None', inline: true },
                { name: 'Name Keywords', value: sub.nameKeywords.join(', ') || 'None', inline: true },
                { name: 'Description Keywords', value: sub.descriptionKeywords.join(', ') || 'None', inline: true }
            )
            .setColor('#0099ff');

        const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel_${sub.id}`)
            .setLabel('Cancel Subscription')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton);

        await interaction.followUp({ embeds: [embed], components: [row] });
    }

    await interaction.followUp({ content: 'End of subscription list.', ephemeral: true });
}