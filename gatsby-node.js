const Discord = require('discord.js');

exports.sourceNodes = async (
    { actions, createNodeId, createContentDigest },
    { serverId, botToken, fetchMembers, fetchRoles, fetchChannels },
    done
) => {
    const { createNode } = actions

    if (!serverId) {
        throw new Error('serverId config option is not set on gatsby-plugin-discord')
    }
    
    if (!botToken) {
        throw new Error('botToken config option is not set on gatsby-plugin-discord')
    }

    const bot = new Discord.Client()

    bot.on('ready', async () => {
        console.log(`Logged in as ${bot.user.tag}!`);

        bot.guilds.fetch(serverId)
            .then(guild => {
                console.log(`Fetched guild: ${guild.name}`)
                const { id, name, icon, splash, members, roles, channels, ...other } = guild

                let memberNodes = []
                let roleNodes = []
                let channelNodes = []

                try {
                    if (fetchMembers) {
                        members.fetch({force: true})
                            .then(items => {
                                items.forEach(member => {    
                                    const { id, user, ...other } = member

                                    let userNode;
                                    user.fetch({force: true})
                                        .then(user => {
                                                const { id, name, ...other } = user
                                                let nodeMeta = {
                                                    id: createNodeId(id),
                                                    name,
                                                    userId: id,
                                                    internal: {
                                                        type: `DiscordUser`,
                                                        mediaType: `application/json`,
                                                        content: JSON.stringify(user),
                                                        contentDigest: createContentDigest(user)
                                                    },
                                                    ...other
                                                }
                    
                                                userNode = createNode(nodeMeta)
                                                console.log(`Created node for Discord user ${name}: ${nodeMeta.id}`)
                                        })
        
                                    let nodeMeta = {
                                        id: createNodeId(id),
                                        memberId: id,
                                        user: userNode,
                                        internal: {
                                            type: `DiscordGuildMember`,
                                            mediaType: `application/json`,
                                            content: JSON.stringify(member),
                                            contentDigest: createContentDigest(member)
                                        },
                                        ...other
                                    }
        
                                    memberNodes.push(createNode(nodeMeta))
                                    console.log(`Created node for Discord guild member: ${nodeMeta.id}`)
                                })
                            })
                            .catch(console.error)
                    }
                } catch(error) {
                    console.error(`Couldn't fetch members.`)
                }

                try {
                    if (fetchRoles) {
                        roles.cache.forEach(role => {
                            const { id, name, ...other } = role

                            let nodeMeta = {
                                id: createNodeId(id),
                                name,
                                roleId: id,
                                internal: {
                                    type: `DiscordGuildRole`,
                                    mediaType: `application/json`,
                                    content: JSON.stringify(role),
                                    contentDigest: createContentDigest(role)
                                },
                                ...other
                            }

                            roleNodes.push(createNode(nodeMeta))
                            console.log(`Created node for Discord role ${name}: ${nodeMeta.id}`)
                        })
                    }
                } catch(error) {
                    console.error(`Couldn't fetch roles.`)
                }

                try {
                    if (fetchChannels) {
                        channels.cache.forEach(channel => {
                            const { id, name, ...other } = channel

                            let nodeMeta = {
                                id: createNodeId(id),
                                name,
                                channelId: id,
                                internal: {
                                    type: `DiscordGuildChannel`,
                                    mediaType: `application/json`,
                                    content: JSON.stringify(channel),
                                    contentDigest: createContentDigest(channel)
                                },
                                ...other
                            }

                            channelNodes.push(createNode(nodeMeta))
                            console.log(`Created node for Discord channel ${name}: ${nodeMeta.id}`)
                        })
                    }
                } catch(error) {
                    console.error(`Couldn't fetch channels.`)
                }

                try {
                    const discordCDN = 'https://cdn.discordapp.com/'
            
                    const nodeMeta = {
                        id: createNodeId(id),
                        guildId: id,
                        name,
                        icon,
                        iconUrl: `${discordCDN}icons/${serverId}/${icon}.png`,
                        splash,
                        splashUrl: `${discordCDN}splashes/${serverId}/${splash}.png`,
                        members: memberNodes || null,
                        roles: roleNodes || null,
                        channels: channelNodes || null,
                        internal: {
                            type: `DiscordServer`,
                            mediaType: `application/json`,
                            content: JSON.stringify(guild),
                            contentDigest: createContentDigest(guild)
                        },
                        ...other
                    }
            
                    createNode(nodeMeta)
                    console.log(`Created node for Discord server ${name}: ${nodeMeta.id}`)
                    done()
                } catch (error) {
                    console.error(error)
                    process.exit(1)
                }
            })
            .catch(console.error);

    });

    bot.login(botToken)
}