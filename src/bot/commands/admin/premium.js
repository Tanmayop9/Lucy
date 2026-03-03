import _ from "lodash";
import { paginator } from "../../../lib/utils/paginator.js";
import { Command } from "../../structures/abstract/command.js";

export default class StaffManage extends Command {
  constructor() {
    super(...arguments);
    this.mod = true;
    this.aliases = ["prem"];
    this.description = "Add / remove bot premium members.";

    this.options = [
      {
        name: "action",
        opType: "string",
        description: "Add / remove premium or list all",
        required: true,
        choices: [
          { name: "add", value: "add" },
          { name: "remove", value: "remove" },
          { name: "list", value: "list" },
        ],
      },
      { name: "user", opType: "user", required: false, description: "User to add/remove" },
      { name: "duration", opType: "integer", required: false, description: "Duration in days" },
    ];

    this.execute = async (client, ctx, args) => {
      const action = args[0]?.toLowerCase();

      if (!["add", "remove", "list"].includes(action)) {
        return ctx.reply({
          embeds: [client.embed().desc("Valid actions: `add`, `remove`, `list`.")],
        });
      }

      if (action === "list") {
        const keys = await client.db.botstaff.keys;
        if (!keys.length)
          return ctx.reply({ embeds: [client.embed().desc("No premium subscribers found.")] });

        const users = (
          await Promise.all(
            keys.map(async (id) => {
              const data = await client.db.botstaff.get(id);
              const user = await client.users.fetch(id).catch(() => {
                client.db.botstaff.delete(id);
                return null;
              });
              return user ? { user, data } : null;
            }),
          )
        ).filter(Boolean);

        const pages = _.chunk(users, 8).map((chunk, i, arr) =>
          client
            .embed()
            .title("Premium Members")
            .desc(
              chunk
                .map(({ user, data }) => {
                  const days = data.permanent
                    ? "Permanent"
                    : data.expiresAt
                    ? `Expires <t:${Math.floor(data.expiresAt / 1000)}:R>`
                    : "Unknown";
                  return `**${user.username}** — \`${user.id}\` — ${days}`;
                })
                .join("\n"),
            )
            .footer({ text: `Page ${i + 1}/${arr.length} · ${users.length} total` }),
        );

        return paginator(ctx, pages);
      }

      const userArg =
        ctx.mentions.users?.first() ||
        (await client.users.fetch(args[1]).catch(() => null));
      if (!userArg)
        return ctx.reply({ embeds: [client.embed().desc("Please mention a valid user.")] });

      const current = await client.db.botstaff.get(userArg.id);

      if (action === "add") {
        if (current)
          return ctx.reply({
            embeds: [client.embed().desc(`\`${userArg.username}\` already has premium.`)],
          });

        const duration = parseInt(args[2]);
        if (isNaN(duration) || duration < 1 || duration > 365)
          return ctx.reply({
            embeds: [client.embed().desc("Provide a valid duration between 1 and 365 days.")],
          });

        await client.db.botstaff.set(userArg.id, {
          expiresAt: Date.now() + duration * 86400000,
          redeemedAt: Date.now(),
          addedBy: ctx.author.id,
        });

        return ctx.reply({
          embeds: [
            client
              .embed()
              .title("Premium Added")
              .desc(
                `**User:** ${userArg.username}\n` +
                `**ID:** \`${userArg.id}\`\n` +
                `**Duration:** ${duration} day${duration !== 1 ? "s" : ""}\n` +
                `**Expires:** <t:${Math.floor((Date.now() + duration * 86400000) / 1000)}:R>\n` +
                `**Added by:** ${ctx.author.username}`,
              ),
          ],
        });
      }

      if (action === "remove") {
        if (!current)
          return ctx.reply({
            embeds: [client.embed().desc(`\`${userArg.username}\` does not have premium.`)],
          });

        await client.db.botstaff.delete(userArg.id);

        return ctx.reply({
          embeds: [
            client
              .embed()
              .title("Premium Removed")
              .desc(
                `**User:** ${userArg.username}\n` +
                `**ID:** \`${userArg.id}\`\n` +
                `**Removed by:** ${ctx.author.username}`,
              ),
          ],
        });
      }
    };
  }
}
