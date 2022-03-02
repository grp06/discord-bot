import dotenv from 'dotenv'
import { Client, Intents, RoleManager, Guild, WebhookClient, Webhook } from 'discord.js'
import express from 'express'
import bodyParser from 'body-parser'

dotenv.config()

const { GUILDS, GUILD_MESSAGES, GUILD_MEMBERS, GUILD_WEBHOOKS, DIRECT_MESSAGES } = Intents.FLAGS
const client = new Client({ intents: [GUILDS, GUILD_MESSAGES, GUILD_MEMBERS, GUILD_WEBHOOKS, DIRECT_MESSAGES] });
client.login(process.env.DISCORD_TOKEN)

const app = express()
const port = process.env.PORT || 8000


// Otterspace
// const guildId = '914510353335975956'

// George bot test
// const guildId = '793011929256820746'

app.use(bodyParser.json())

// DAO owner uploads an image
// upload that + object to IPFS
// mint the badge with the tokenURI
// then call the addRoles endpoint


app.get("/get-guilds-roles/:guildId", async (req, res) => {
  const { guildId } = req.params
  
  const guild = await client.guilds.fetch(guildId)

  const roles = guild.roles.cache.filter((role) => role.name !== '@everyone' && role.name !== 'otterspace').map(i => i.name)
  console.log("🚀 ~ app.post ~ roles", roles)
  return res.json({ roles })
  // res.status(200).end()

})

// hit this endpoint from the Bubble app
// pass in discord username and badge name as body
app.post("/add-roles/:guildId", async (req, res) => {
  const { roles, discordUsername } = req.body 
  console.log("🚀 ~ app.post ~ discordUsername", discordUsername)
  console.log("🚀 ~ app.post ~ roles", roles)
  // add error handling
  const { guildId } = req.params
  const guild = await client.guilds.fetch(guildId);
  
  const members = await guild.members.fetch()
  const membersArr = members.map((member) => {
    return { username: member.user.username, id: member.user.id }
  });
  console.log("🚀 ~ membersArr ~ membersArr", membersArr)
  
  const rolesRes = await guild.roles.fetch();
  const rolesArr = rolesRes.map((role) => {
    return { role: role.name, id: role.id }
  });
  console.log("🚀 ~ rolesArr ~ rolesArr", rolesArr)
  
  const memberId = membersArr.find((member) => member.username === discordUsername).id
  console.log("🚀 ~ app.post ~ memberId", memberId)
  const memberObj = await guild.members.fetch(memberId);      
  console.log("🚀 ~ app.post ~ memberObj", memberObj)
  
  const roleIds = []
  rolesArr.forEach(r => {
    if (roles.indexOf(r.role) > -1) {
      roleIds.push(r.id)
    }
  })
  
  roleIds.forEach((id) => memberObj.roles.add(id))
  

  res.status(200).end()
})

app.post("/webhooks/setup-bot/:guildId", async (req, res) => {
  const { guildId } = req.params
  const guild = await client.guilds.fetch(guildId);

  const checkForBotChannel = async (fetch) => {
    let channels = await guild.channels.fetch()
    for (const channel of channels.values()) {
      if (channel.name === 'otterspace-bot') {
        return true
      }
    }
    return false
  }

  const botChannelExists = await checkForBotChannel()
  if (!botChannelExists) {
    const channelRes = await guild.channels.create('otterspace-bot', { 
      type: 'GUILD_TEXT',
      topic: 'Just a channel to get bot messages',
    })
    const channel = client.channels.cache.get(channelRes.id);
    const webhook = await channel.createWebhook('otterspace-webhook', {
      avatar: 'https://i.imgur.com/AfFp7pu.png',
    })
    
    await webhook.send({
      content: 'Channel and webhook successfully created',
      username: 'Otterspace Bot',
      avatarURL: 'https://pbs.twimg.com/profile_images/1480529464719286282/syGBGklg_400x400.jpg',
    });

  } else {
    let channel
    const channels = await guild.channels.fetch()
    
    // because "channels" is a Map
    for (let obj of channels.values()) {
      if (obj.name === 'otterspace-bot') {
        channel = obj
      }
    }

    const webhooks = await channel.fetchWebhooks();
    const webhook = webhooks.find(wh => wh.token);

    if (!webhook) {
      return console.log('No webhook was found that I can use!');
    }

    await webhook.send({
      content: 'Your bot and channel are set up already',
      username: 'Otterspace Bot',
      avatarURL: 'https://pbs.twimg.com/profile_images/1480529464719286282/syGBGklg_400x400.jpg',
    });

  }

  res.status(200).end()
})


app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});
// const permissionsString = `536873984`
// const clientId = `947801948244017204`

// const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissionsString}&scope=bot`
