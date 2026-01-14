const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * SAFE FANCY FONT (Updated for Stability)
 * Object mapping ensures characters don't break across different platforms.
 */
function fancySafe(text) {
  const map = {
    'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
    'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
  };
  return String(text).split('').map(char => map[char] || char).join('');
}

module.exports = {
  config: {
    name: "owner",
    author: "Tokodori",
    role: 0,
    shortDescription: "Show Owner Info",
    longDescription: "Displays owner info with safe fancy font",
    category: "admin",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    try {
      // ===== OWNER INFO =====
      const ownerInfo = {
        name: "Washik Adnan",
        gender: "Male",
        age: "18+",
        facebookLink: "https://www.facebook.com/61574715983842",
        nick: "Adnan"
      };

      // ===== VIDEO =====
      const videoUrl = "https://files.catbox.moe/1nnr2o.mp4";
      const tmpDir = path.join(__dirname, "cache");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      const videoPath = path.join(tmpDir, `owner_${Date.now()}.mp4`);
      
      const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(videoPath, Buffer.from(response.data, "utf-8"));

      // ===== MESSAGE BODY WITH YOUR PREFERRED BORDER =====
      const msgBody = 
`╔═══════════•°• ✤ •°•═══════════╗
         『 ✦  𝐎𝐖𝐍𝐄𝐑  𝐈𝐍𝐅𝐎 ✦ 』
╚═══════════•°• ✤ •°•═══════════╝

╭─━━━━━━━━━━━━━━━━━━━━─╮
│ ✧ 𝗡𝗔𝗠𝗘     : ${fancySafe(ownerInfo.name)}
│ ✧ 𝗡𝗜𝗖𝗞     : ${fancySafe(ownerInfo.nick)}
│ ✧ 𝗚𝗘𝗡𝗗𝗘𝗥   : ${fancySafe(ownerInfo.gender)}
│ ✧ 𝗔𝗚𝗘      : ${fancySafe(ownerInfo.age)}
│ ✧ 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 : ${ownerInfo.facebookLink}
╰─━━━━━━━━━━━━━━━━━━━━─╯

╔═══════════•°• ✤ •°•═══════════╗
   𝐓𝐇𝐀𝐍𝐊 𝐘𝐎𝐔 𝐅𝐎𝐑 𝐔𝐒𝐈𝐍𝐆 𝐌𝐄
╚═══════════•°• ✤ •°•═══════════╝`;

      // ===== SEND MESSAGE =====
      return api.sendMessage(
        {
          body: msgBody,
          attachment: fs.createReadStream(videoPath)
        },
        event.threadID,
        () => {
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        },
        event.messageID
      );

    } catch (err) {
      console.error("Error in owner command:", err);
      return api.sendMessage(
        "❌ Error occurred while fetching owner info.",
        event.threadID
      );
    }
  }
};
