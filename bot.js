const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const REGISTRATION_FILE = './registrations.json';
const ADMIN_CHANNEL_ID = ''; // ID OF ADMIN CHANNEL
const APPROVAL_CHANNEL_ID = ''; // ID OF APROVATE CHANNEL
const REJECTION_CHANNEL_ID = ''; // IF OF REPROVATE CHANNEL



function loadRegistrations() {
    if (!fs.existsSync(REGISTRATION_FILE)) {
        fs.writeFileSync(REGISTRATION_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(REGISTRATION_FILE));
}

function saveRegistrations(data) {
    fs.writeFileSync(REGISTRATION_FILE, JSON.stringify(data, null, 4));
}

let registrations = loadRegistrations();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.once('ready', async () => {
    console.log(`🤖 Bot está online como ${client.user.tag}!`);
    
    const commands = [
        new SlashCommandBuilder()
            .setName('registro')
            .setDescription('📝 Registre seu nick do Minecraft')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('🔧 Registrando comandos...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ Comandos registrados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('!limpardm')) return;

    if (message.channel.type !== 1) {
        return message.reply('Este comando só pode ser usado na DM.');
    }

    try {
        const messages = await message.channel.messages.fetch();
        const botMessages = messages.filter(msg => msg.author.id === client.user.id);

        if (botMessages.size === 0) {
            return message.reply('Não há mensagens do bot para apagar.');
        }

        botMessages.forEach(async msg => {
            await msg.delete();
        });

        console.log(`Foram apagadas ${botMessages.size} mensagens da DM.`);
    } catch (error) {
        console.error('Erro ao apagar mensagens:', error);
        message.reply('Ocorreu um erro ao tentar limpar as mensagens.');
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'registro') {
        if (registrations[interaction.user.id]) {
            return interaction.reply({ content: '⚠️ Você já realizou seu registro.', flags: 64 });
        }

        const modal = new ModalBuilder()
            .setCustomId('registroForm')
            .setTitle('📜 Registro no Minecraft');

        const nickInput = new TextInputBuilder()
            .setCustomId('nick')
            .setLabel('✍️ Digite seu nick do Minecraft')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const nameInput = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('🧑 Nome do personagem')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const historyInput = new TextInputBuilder()
            .setCustomId('history')
            .setLabel('📜 História do personagem')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const talentInput = new TextInputBuilder()
            .setCustomId('talent')
            .setLabel('✨ Habilidade ou talento especial')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const actionRow1 = new ActionRowBuilder().addComponents(nickInput);
        const actionRow2 = new ActionRowBuilder().addComponents(nameInput);
        const actionRow3 = new ActionRowBuilder().addComponents(historyInput);
        const actionRow4 = new ActionRowBuilder().addComponents(talentInput);

        modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4);

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'registroForm') {
        const nick = interaction.fields.getTextInputValue('nick');
        const name = interaction.fields.getTextInputValue('name');
        const history = interaction.fields.getTextInputValue('history');
        const talent = interaction.fields.getTextInputValue('talent');
        
        registrations[interaction.user.id] = { nick, name, history, talent, status: 'pendente', reviewed: false };
        saveRegistrations(registrations);

        const professionSelect = new StringSelectMenuBuilder()
            .setCustomId(`profissao_${interaction.user.id}`)
            .setPlaceholder('Escolha uma profissão')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions([
                { label: '⚔️ Guerreiro', value: 'guerreiro' },
                { label: '🛡️ Guarda Real', value: 'guarda_real' },
                { label: '🏇 Cavaleiro Real', value: 'cavaleiro_real' },
                { label: '🗺️ Aventureiro', value: 'aventureiro' },
                { label: '🏗️ Construtor', value: 'construtor' },
                { label: '🛒 Mercador', value: 'mercador' },
                { label: '⛏️ Minerador', value: 'minerador' },
                { label: '✨ Mago', value: 'mago' },
                { label: '🌾 Fazendeiro', value: 'fazendeiro' },
                { label: '💰 Caçador de Recompensas', value: 'cacador_recompensas' },
                { label: '🌲 Madeireiro', value: 'madeireiro' },
                { label: '🛠️ Artesão', value: 'artesao' },
                { label: '✝️ Clérigo', value: 'clerigo' },
                { label: '⚗️ Alquimista', value: 'alquimista' },
                { label: '🍞 Padeiro', value: 'padeiro' },
                { label: '🎣 Pescador', value: 'pescador' },
                { label: '⚕️ Médico / Curandeiro', value: 'medico' },
                { label: '🐎 Cocheiro', value: 'cocheiro' },
                { label: '🏚️ Taberneiro', value: 'taberneiro' },
                { label: '🔧 Engenheiro', value: 'engenheiro' },
                { label: '📦 Estalajadeiro', value: 'estalajadeiro' },
                { label: '🏹 Arqueiro', value: 'arqueiro' },
                { label: '⚒️ Ferreiro', value: 'ferreiro' },
                { label: '❓ Outra (Especifique no chat)', value: 'outra' }
            ]);

        const actionRow = new ActionRowBuilder().addComponents(professionSelect);

        await interaction.reply({
            content: '🔹 Selecione sua profissão:',
            components: [actionRow],
            flags: 64
        });
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('profissao_')) {
        const professionValue = interaction.values[0];
        registrations[interaction.user.id].profession = professionValue; 
        registrations[interaction.user.id].origin = null; 
        registrations[interaction.user.id].status = 'pendente'; 

        saveRegistrations(registrations);

        const originSelect = new StringSelectMenuBuilder()
            .setCustomId(`origem_${interaction.user.id}`)
            .setPlaceholder('Escolha sua origem')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions([
                { label: '👑 Esmiriano / Esmiriana', value: 'esmiriano' },
                { label: '🦁 Bromeriano / Bromeriana', value: 'bromeriano' },
                { label: '🏹 Eldoranês / Eldoranesa', value: 'eldoranes' },
                { label: '🛡️ Amarioniano / Amarioniana', value: 'amarioniano' },
                { label: '⚔️ Valdoriano / Valdoriana', value: 'valdoriano' },
                { label: '⚓ Portugalez / Portugalesa', value: 'portugalez' },
                { label: '🔥 Auriano / Auriana', value: 'auriano' },
                { label: '🪓 Vikingue', value: 'vikingue' },
                { label: '🌿 Forasteiro / Forasteira', value: 'forasteiro' }
            ]);

        const actionRow = new ActionRowBuilder().addComponents(originSelect);

        await interaction.update({
            content: '🌍 Escolha sua origem:',
            components: [actionRow],
            flags: 64
        });
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('origem_')) {
        const originValue = interaction.values[0];
        registrations[interaction.user.id].origin = originValue;
        registrations[interaction.user.id].status = 'pendente';

        saveRegistrations(registrations);


        const adminChannel = await client.channels.fetch(ADMIN_CHANNEL_ID);
        if (adminChannel) {
            const approveButton = new ButtonBuilder()
                .setCustomId(`aprovar_${interaction.user.id}`)
                .setLabel('✅ Aprovar')
                .setStyle(ButtonStyle.Success);

            const rejectButton = new ButtonBuilder()
                .setCustomId(`reprovar_${interaction.user.id}`)
                .setLabel('❌ Reprovar')
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(approveButton, rejectButton);

            await adminChannel.send({
                content: `🚨 Novo registro pendente: <@${interaction.user.id}>\nNick: ${registrations[interaction.user.id].nick}\nProfissão: ${registrations[interaction.user.id].profession}\nOrigem: ${originValue}\nAguardando aprovação.`,
                components: [actionRow]
            });
        }

        await interaction.update({
            content: `🌍 Você escolheu a origem: ${originValue}. Seu registro foi concluído e está aguardando aprovação!`,
            components: [],
            flags: 64
        });
    }

    if (interaction.isButton() && interaction.customId.startsWith('aprovar_')) {
        const userId = interaction.customId.split('_')[1];


        if (registrations[userId].reviewed) {
            return interaction.reply({
                content: '⚠️ Este registro já foi aprovado ou reprovado.',
                ephemeral: true
            });
        }

        registrations[userId].status = 'aprovado';
        registrations[userId].reviewed = true; 
        saveRegistrations(registrations);

        const user = await client.users.fetch(userId);
        if (user) {
            await user.send('✅ Seu registro foi aprovado!');
        }

        // Enviar a notificação no canal de aprovação
        const approvalChannel = await client.channels.fetch(APPROVAL_CHANNEL_ID);
        if (approvalChannel) {
            await approvalChannel.send(`✅ Registro de <@${userId}> aprovado!`);
        }

        await interaction.reply({
            content: `✅ Registro de <@${userId}> aprovado!`,
            ephemeral: true
        });
    }

    if (interaction.isButton() && interaction.customId.startsWith('reprovar_')) {
        const userId = interaction.customId.split('_')[1];

        if (registrations[userId].reviewed) {
            return interaction.reply({
                content: '⚠️ Este registro já foi aprovado ou reprovado.',
                ephemeral: true
            });
        }

        registrations[userId].status = 'reprovado'; 
        registrations[userId].reviewed = true; 
        saveRegistrations(registrations);

        const user = await client.users.fetch(userId);
        if (user) {
            await user.send('❌ Seu registro foi reprovado.');
        }

        const rejectionChannel = await client.channels.fetch(REJECTION_CHANNEL_ID);
        if (rejectionChannel) {
            await rejectionChannel.send(`❌ Registro de <@${userId}> reprovado!`);
        }

        await interaction.reply({
            content: `❌ Registro de <@${userId}> reprovado!`,
            ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);
