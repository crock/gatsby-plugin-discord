const Discord = require('discord.js');

const discordCDN = 'https://cdn.discordapp.com/'

const bot = new Discord.Client();

exports.sourceNodes = async ({ actions, reporter, createNodeId, createContentDigest }, { serverId, botToken }) => {
    const { createNode } = actions

    if (!serverId) {
        let error = 'serverId config option is not set on gatsby-plugin-discord'
        reporter.error(error, new Error(error))
        process.exit(1)
    }
    
    if (!botToken) {
        let error = 'botToken config option is not set on gatsby-plugin-discord'
        reporter.error(error, new Error(error))
        process.exit(1)
    }

    await bot.login(botToken)
    bot.once('ready', async () => {
        console.log(`Logged in as ${bot.user.tag}!`);

        const guild = await bot.guilds.fetch(serverId, false, true)
            .catch(console.error);

            reporter.info(`Fetched guild: ${guild.name}`)
            const { id, ...other } = guild

            createNode({
                id: createNodeId(id),
                guildId: id,
                iconUrl: `${discordCDN}icons/${serverId}/${guild.icon}.png`,
                splashUrl: `${discordCDN}splashes/${serverId}/${guild.splash}.png`,
                parent: null,
                children: [],
                internal: {
                    type: `DiscordGuild`,
                    mediaType: `application/json`,
                    content: JSON.stringify({guild}),
                    contentDigest: createContentDigest(guild)
                },
                ...other
            })

            reporter.info(`Created node for Discord server ${guild.name}`)
    })

}

exports.onCreateNode = ({ node, actions, reporter }, { shouldFetchMembers, shouldFetchUserDetails }) => {
    const { createNodeField, createNodeId, createContentDigest } = actions
        
    if (node.internal.type === 'DiscordGuild') {

        if (shouldFetchMembers) {
            const { guild } = node.content
            guild.members.fetch({force: true})
                .then(members => {
                    return createNodeField({
                        node,
                        name: 'members',
                        value: members.map(member => {    
                            const { id, ...other } = member
                
                            reporter.info(`Created node for Discord guild member ${id}`)
                            return createNode({
                                id: createNodeId(id),
                                memberId: id,
                                parent: node,
                                children: [],
                                internal: {
                                    type: `DiscordGuildMember`,
                                    mediaType: `application/json`,
                                    content: JSON.stringify({member}),
                                    contentDigest: createContentDigest(member)
                                },
                                ...other
                            })
                        })
                    })
                })
                .catch(console.error)
        }
    }

    if (node.internal.type === 'DiscordGuildMember') {
        if (shouldFetchUserDetails) {
            const { member: { memberId, parent: guild } } = node.content
            const member = guild.members.cache.get(memberId)
            member.user.fetch({force: true})
                .then(user => {
                    const { id, ...other } = user
                    reporter.info(`Created node for Discord user ${user.username}`)
                    return createNodeField({
                        node,
                        name: 'user',
                        value: createNode({
                            id: createNodeId(id),
                            userId: id,
                            parent: node,
                            children: [],
                            internal: {
                                type: `DiscordUser`,
                                mediaType: `application/json`,
                                content: JSON.stringify({user}),
                                contentDigest: createContentDigest(user)
                            },
                            ...other
                        })
                    })
                })
                .catch(console.error)
        }
    }

}
