import util from "util";

const MAX = 3990;

export const raw = (data, depth = 3) => {
  const out = util.inspect(data, { depth, compact: 1, breakLength: 60 });
  return `\`\`\`\n${out.length > MAX ? out.slice(0, MAX) + "\n..." : out}\n\`\`\``;
};
