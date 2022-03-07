import dotenv from "dotenv";
import {
  Client,
  Intents,
  RoleManager,
  Guild,
  WebhookClient,
  Webhook,
} from "discord.js";
import express from "express";
import bodyParser from "body-parser";

dotenv.config();

const {
  GUILDS,
  GUILD_MESSAGES,
  GUILD_MEMBERS,
  GUILD_WEBHOOKS,
  DIRECT_MESSAGES,
} = Intents.FLAGS;
const client = new Client({
  intents: [
    GUILDS,
    GUILD_MESSAGES,
    GUILD_MEMBERS,
    GUILD_WEBHOOKS,
    DIRECT_MESSAGES,
  ],
});
client.login(process.env.DISCORD_TOKEN);

const app = express();
const port = process.env.PORT || 8000;

app.use(bodyParser.json());

app.get("/get-guilds-roles/:guildId", async (req, res) => {
  const { guildId } = req.params;

  const guild = await client.guilds.fetch(guildId);

  const roles = guild.roles.cache
    .filter((role) => role.name !== "@everyone" && role.name !== "otterspace")
    .map((i) => i.name);
  console.log("🚀 ~ app.post ~ roles", roles);
  return res.json({ roles });
});

// hit this endpoint from the Bubble app
// pass in discord username and badge name as body
app.post("/add-roles/:guildId", async (req, res) => {
  const { roles, discordUsername } = req.body;

  // TODO add try/catch
  const { guildId } = req.params;
  const guild = await client.guilds.fetch(guildId);

  const members = await guild.members.fetch();
  const membersArr = members.map((member) => {
    return { username: member.user.username, id: member.user.id };
  });

  const rolesRes = await guild.roles.fetch();
  const rolesArr = rolesRes.map((role) => {
    return { role: role.name, id: role.id };
  });

  const memberId = membersArr.find(
    (member) => member.username === discordUsername
  ).id;
  const memberObj = await guild.members.fetch(memberId);

  const roleIds = [];
  rolesArr.forEach((r) => {
    if (roles.indexOf(r.role) > -1) {
      roleIds.push(r.id);
    }
  });

  roleIds.forEach((id) => memberObj.roles.add(id));

  res.json({
    success: true,
  });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
