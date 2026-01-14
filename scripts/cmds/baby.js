const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "hinata",
    version: "1.7",
    author: "MahMUD",
    countDown: 0,
    role: 0,
    shortDescription: "Cute AI Chatbot | Talk, Teach & Chat with Emotion ☢️",
    longDescription: "Cute AI Chatbot — Talk, Teach & Chat with Emotion ☢️",
    category: "chat",
    guide: {
      en: "{pn} [message/query] OR {pn} teach [question] - [response1, response2,...] OR {pn} remove [question] - [index] OR {pn} list OR {pn} list all OR {pn} edit [question] - [newResponse] OR {pn} msg [question]"
    }
  },

  // ================== START COMMAND ==================
  onStart: async function ({ api, event, args, usersData }) {
    try {
      const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
      if (module.exports.config.author !== obfuscatedAuthor) {
        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
      }

      const msg = args.join(" ").toLowerCase();
      const uid = event.senderID;

      if (!args[0]) {
        const ran = ["𝐁𝐨𝐥𝐨 𝐁𝐚𝐛𝐲 😇", "𝐈 𝐥𝐨𝐯𝐞 𝐲𝐨𝐮 💕", "𝐓𝐲𝐩𝐞 𝐬𝐨𝐦𝐞𝐭𝐡𝐢𝐧𝐠 𝐭𝐨 𝐜𝐡𝐚𝐭 💬"];
        return api.sendMessage(
          ran[Math.floor(Math.random() * ran.length)],
          event.threadID,
          (err, info) => {
            if (!err) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: "hinata",
                author: event.senderID
              });
            }
          },
          event.messageID
        );
      }

      // ================== TEACH COMMAND ==================
      if (args[0] === "teach") {
        const mahmud = msg.replace("teach ", "");
        const [trigger, ...responsesArr] = mahmud.split(" - ");
        const responses = responsesArr.join(" - ");
        if (!trigger || !responses) return api.sendMessage("❌ | Format: teach [question] - [response1, response2,...]", event.threadID, event.messageID);
        
        const response = await axios.post(`${await baseApiUrl()}/api/jan/teach`, { 
          trigger, 
          responses, 
          userID: uid 
        });
        
        const userName = (await usersData.getName(uid)) || "Unknown User";
        return api.sendMessage(
          `✅ Replies added: "${responses}" to "${trigger}"\n• 𝐓𝐞𝐚𝐜𝐡𝐞𝐫: ${userName}\n• 𝐓𝐨𝐭𝐚𝐥: ${response.data.count || 0}`,
          event.threadID,
          event.messageID
        );
      }

      // ================== REMOVE COMMAND ==================
      if (args[0] === "remove") {
        const mahmud = msg.replace("remove ", "");
        const [trigger, index] = mahmud.split(" - ");
        if (!trigger || !index || isNaN(index)) return api.sendMessage("❌ | Format: remove [question] - [index]", event.threadID, event.messageID);
        
        const response = await axios.delete(`${await baseApiUrl()}/api/jan/remove`, {
          data: { 
            trigger, 
            index: parseInt(index, 10) 
          }
        });
        return api.sendMessage(response.data.message, event.threadID, event.messageID);
      }

      // ================== LIST COMMAND ==================
      if (args[0] === "list") {
        const endpoint = args[1] === "all" ? "/list/all" : "/list";
        const response = await axios.get(`${await baseApiUrl()}/api/jan${endpoint}`);
        
        if (args[1] === "all") {
          let message = "👑 List of Hinata teachers:\n\n";
          const data = Object.entries(response.data.data)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
          
          for (let i = 0; i < data.length; i++) {
            const [userID, count] = data[i];
            const name = (await usersData.getName(userID)) || "Unknown";
            message += `${i + 1}. ${name}: ${count}\n`;
          }
          return api.sendMessage(message, event.threadID, event.messageID);
        }
        
        return api.sendMessage(response.data.message, event.threadID, event.messageID);
      }

      // ================== EDIT COMMAND ==================
      if (args[0] === "edit") {
        const mahmud = msg.replace("edit ", "");
        const [oldTrigger, ...newArr] = mahmud.split(" - ");
        const newResponse = newArr.join(" - ");
        
        if (!oldTrigger || !newResponse) return api.sendMessage("❌ | Format: edit [question] - [newResponse]", event.threadID, event.messageID);
        
        await axios.put(`${await baseApiUrl()}/api/jan/edit`, { 
          oldTrigger, 
          newResponse 
        });
        
        return api.sendMessage(`✅ Edited "${oldTrigger}" to "${newResponse}"`, event.threadID, event.messageID);
      }

      // ================== MSG COMMAND ==================
      if (args[0] === "msg") {
        const searchTrigger = args.slice(1).join(" ");
        if (!searchTrigger) return api.sendMessage("Please provide a message to search.", event.threadID, event.messageID);
        
        try {
          const response = await axios.get(`${await baseApiUrl()}/api/jan/msg`, {
            params: { 
              userMessage: `msg ${searchTrigger}` 
            }
          });
          return api.sendMessage(response.data.message || "No message found.", event.threadID, event.messageID);
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || "error";
          return api.sendMessage(errorMessage, event.threadID, event.messageID);
        }
      }

      // ================== NORMAL CHAT ==================
      const getBotResponse = async (text, attachments) => {
        try {
          const res = await axios.post(`${await baseApiUrl()}/api/hinata`, {
            text,
            style: 3,
            attachments
          });
          return res.data.message;
        } catch {
          return "error janu🥹";
        }
      };

      const botResponse = await getBotResponse(msg, event.attachments || []);
      
      api.sendMessage(
        botResponse,
        event.threadID,
        (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "hinata",
              author: event.senderID
            });
          }
        },
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage(`${err.response?.data || err.message}`, event.threadID, event.messageID);
    }
  },

  // ================== ON REPLY ==================
  onReply: async function ({ api, event }) {
    try {
      if (!event.messageReply) return;

      const replyData = global.GoatBot.onReply.get(event.messageReply.messageID);
      if (!replyData || replyData.commandName !== "hinata") return;

      const text = event.body?.toLowerCase();
      if (!text) return;

      const getBotResponse = async (text, attachments) => {
        try {
          const res = await axios.post(`${await baseApiUrl()}/api/hinata`, {
            text,
            style: 3,
            attachments
          });
          return res.data.message;
        } catch {
          return "error janu🥹";
        }
      };

      const botResponse = await getBotResponse(text || "meow", event.attachments || []);
      
      api.sendMessage(
        botResponse,
        event.threadID,
        (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "hinata",
              author: event.senderID
            });
          }
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
    }
  },

  // ================== ON CHAT ==================
  onChat: async function ({ api, event, usersData }) {
    try {
      if (!event.body) return;

      const raw = event.body.trim();
      const text = raw.toLowerCase();
      const attachments = event.attachments || [];

      const triggers = [
        "baby", "bot", "bby", "jan", "xan",
        "জান", "বট", "বেবি",
        "megh", "মেঘ",
        "lamia", "lamiya", "লামিয়া"
      ];

      // 👉 Only name call
      if (triggers.includes(text)) {
        const replies = [
          "𝐁𝐨𝐥𝐨 𝐊𝐢 𝐁𝐨𝐥𝐛𝐞..😇", "𝐌𝐞𝐠𝐡 𝐇𝐞𝐫𝐞... 😺", "𝐇𝐦𝐦 𝐁𝐨𝐥𝐨 𝐁𝐡𝐚𝐢 😚", "𝐊𝐢𝐫𝐞 𝐌𝐚𝐦𝐚 😘",
          "𝐁𝐨𝐬𝐬 𝐖𝐚𝐬𝐡𝐢𝐤 𝐏𝐚𝐬𝐞 𝐀𝐜𝐡𝐞", "𝐕𝐚𝐥𝐨𝐛𝐚𝐬𝐚𝐫 𝐀𝐫𝐞𝐤 𝐍𝐚𝐦 𝐀𝐦𝐢 𝐍𝐢𝐣𝐞𝐢😼",
          "𝐌𝐚𝐦𝐚𝐡 , 𝐊𝐢 𝐎𝐛𝐨𝐭𝐡𝐚 𝐓𝐨𝐫 𝐊𝐨𝐢 𝐓𝐡𝐚𝐤𝐨𝐬𝐡 𝐀𝐣 𝐤𝐚𝐥..🤔",
          "𝐃𝐮𝐫𝐞 𝐌𝐮𝐫𝐢 𝐊𝐡𝐚 , 𝐊𝐮ন𝐨 𝐊𝐚𝐣 𝐍𝐚𝐢 , 𝐒𝐚𝐫𝐚 𝐃𝐢𝐧 𝐌𝐞𝐠𝐡 𝐌𝐞𝐠𝐡 𝐊𝐨𝐫𝐢𝐬𝐡 😉😋🤣",
          "𝐊𝐢 𝐑𝐞 𝐏𝐚𝐠𝐨𝐥 , 𝐀𝐦𝐚𝐲 𝐄𝐭𝐨 𝐃𝐚𝐤𝐢𝐬𝐡 𝐊𝐞𝐧𝐨? 🙄", "𝐀𝐢𝐭𝐨 𝐀𝐦𝐢 𝐀𝐜𝐡𝐢 , 𝐓𝐨𝐦𝐚𝐫 𝐌𝐨𝐭𝐨 𝐏𝐨𝐜𝐡𝐚 𝐍𝐚𝐤𝐢? 🥺",
          "𝐃𝐚𝐤𝐛𝐞 𝐄𝐤𝐛𝐚𝐫 , 𝐔𝐭𝐭𝐨𝐫 𝐃𝐞𝐛𝐨 𝐁𝐚𝐫 𝐁𝐚𝐫! 😍", "𝐒𝐚𝐫𝐚 𝐃𝐢𝐧 𝐒𝐡𝐮𝐝𝐡𝐮 𝐌𝐞𝐠𝐡 𝐀𝐫 𝐌𝐞𝐠𝐡... 𝐁𝐢𝐲𝐞 𝐊𝐨𝐫𝐛𝐢 𝐍𝐚𝐤𝐢? 😹💍",
          "𝐆𝐮𝐦𝐚𝐢𝐭𝐞 𝐃𝐞 𝐌𝐚𝐦𝐚 , 𝐃𝐢ন 𝐑𝐚𝐭 𝐒𝐡𝐮𝐝𝐡𝐮 𝐂𝐡𝐚𝐭𝐭𝐢𝐧𝐠 𝐯𝐚𝐥𝐨 𝐥𝐚𝐠𝐞 𝐧𝐚! 😴", "𝐎𝐡 𝐉𝐚𝐧𝐮.. 𝐄𝐭𝐨 𝐌𝐢𝐬𝐭𝐢 𝐊𝐨𝐫𝐞 𝐃𝐚𝐤𝐥𝐨 𝐊𝐞? 🙈❤️",
          "𝐀𝐦𝐚𝐲 𝐃𝐚𝐤𝐚 𝐌𝐚𝐧𝐞 𝐁𝐢𝐩𝐨𝐝𝐞 𝐏𝐨𝐫𝐚.. 𝐇𝐚𝐡𝐚 𝐊𝐢 𝐡𝐨𝐢𝐬𝐞? 🤪", "𝐊𝐢 𝐑𝐞 𝐂𝐡𝐚𝐦𝐜𝐚 , 𝐄𝐭𝐨 𝐃𝐚𝐤𝐢𝐬𝐡 𝐊𝐞𝐧𝐨? 🤣",
          "𝐎𝐡 𝐁𝐚𝐛𝐲 , 𝐀𝐦𝐚𝐫 𝐊𝐚চ𝐞 𝐊𝐢 𝐓𝐚𝐤𝐚 𝐏𝐚𝐛𝐢? 🙊💸", "𝐄𝐭𝐨 𝐃𝐚𝐤𝐥𝐞 𝐊𝐢𝐧𝐭𝐮 𝐏𝐫𝐞𝐦 𝐇𝐨𝐲𝐞 𝐉𝐚𝐛𝐞! 🙊💕",
          "𝐌𝐞𝐠𝐡 𝐄𝐤𝐡𝐨𝐧 𝐀𝐤𝐚𝐬𝐡𝐞 𝐍𝐚𝐢 , 𝐀𝐦𝐚𝐫 𝐌𝐨𝐝𝐝𝐡𝐞 𝐀𝐜𝐡𝐞 ☁️✨", "𝐊𝐢 𝐃𝐨𝐫𝐤𝐚𝐫? 𝐁𝐚𝐫𝐢 𝐆𝐡𝐨𝐫 𝐊𝐢 𝐛𝐢চ𝐫𝐚𝐲 𝐝𝐢𝐛𝐨? 🏠🔥",
          "𝐌𝐚𝐦𝐚 𝐆𝐚𝐧𝐣𝐚 𝐊𝐡𝐚𝐲𝐞 𝐃𝐚𝐤𝐭𝐚𝐬𝐨 𝐍𝐚𝐤𝐢? 🥴💨", "𝐀𝐦𝐢 𝐁𝐨𝐟 𝐇𝐨𝐢𝐟𝐞 𝐏𝐚𝐫𝐢 , 𝐊𝐢𝐧𝐟𝐮 𝐅𝐞𝐞𝐥𝐢ন𝐠𝐬 𝐀চ𝐞 𝐁𝐫𝐨! 🤖💔",
          "𝐉𝐚ন , 𝐏𝐫𝐚ন , 𝐏𝐚𝐤𝐡𝐢.. 𝐀𝐫 𝐊𝐢 𝐃𝐚𝐤𝐛𝐞? 🦜🍭", "𝐊𝐚𝐣 𝐍𝐚𝐢 𝐊𝐚𝐦 𝐍𝐚𝐢 , 𝐒𝐡𝐮𝐝𝐡𝐮 𝐌𝐞𝐠𝐡 𝐃𝐚𝐤𝐨! 🙄🔨",
          "𝐁𝐞𝐬𝐡𝐢 𝐃𝐚𝐤𝐥𝐞 𝐊𝐢ন𝐟𝐮 𝐁𝐥𝐨𝐂𝐤 𝐊𝐡𝐚𝐛𝐢 𝐇𝐚𝐡𝐚.. 𝐉𝐨𝐤𝐢ন𝐠! 🤡", "𝐀𝐦𝐚𝐲 𝐃𝐚𝐤𝐛𝐞 𝐀𝐫 𝐈𝐠𝐧𝐫𝐞 𝐊𝐨𝐫𝐛𝐨 𝐀𝐦𝐢 𝐊𝐢 𝐄𝐟𝐚 𝐤𝐢 𝐒𝐨𝐬𝐟𝐚? 💅🔥",
          "𝐊𝐢 𝐑𝐞 𝐊𝐢𝐩𝐟𝐞 , 𝐌𝐢𝐬𝐟𝐢 𝐍𝐚 𝐊𝐡𝐚𝐲𝐞 𝐃𝐚𝐤𝐛𝐢 𝐧𝐚! 🍭👺", "𝐁𝐞𝐬𝐡𝐢 𝐃𝐚𝐤𝐚𝐝𝐚𝐤𝐢 𝐊𝐨𝐫𝐥𝐞 𝐊𝐢𝐧𝐟𝐮 𝐁𝐨𝐤𝐚 𝐝𝐞𝐛𝐨.. 𝐇𝐮𝐦𝐦! 😤👊",
          "𝐀𝐦𝐚𝐫 𝐌𝐨𝐟𝐨 𝐒𝐦𝐚𝐫𝐟 𝐁𝐨𝐟 𝐏𝐚𝐛𝐢 𝐊𝐨𝐢? 𝐒𝐡𝐮𝐝𝐡𝐮 𝐃𝐚𝐤𝐟𝐞𝐢 𝐢𝐂𝐂𝐡𝐞 𝐤𝐢𝐫𝐞.. 😎✨", "𝐊𝐢 𝐡𝐨𝐢𝐬𝐞? 𝐆𝐚𝐫𝐥𝐟𝐫𝐢𝐞𝐧𝐝 𝐤𝐚𝐟𝐚 𝐝𝐢𝐬𝐞 𝐧𝐚𝐤𝐢? 🤣💔",
          "𝐄𝐟𝐨 𝐃𝐚𝐤𝐢𝐬𝐡 𝐧𝐚 , 𝐏𝐚𝐬𝐡𝐞𝐫 𝐁𝐚𝐬𝐚𝐫 𝐥𝐨𝐤𝐞 𝐤𝐢 𝐛𝐨𝐥𝐛𝐞? 🙊🏘️", "𝐌𝐞𝐠𝐡 𝐄𝐤𝐡𝐨𝐧 𝐂𝐡𝐚 𝐤𝐡𝐚𝐢𝐟𝐚𝐬𝐞 , 𝐏𝐨𝐫𝐞 𝐃𝐚𝐤𝐢𝐬𝐡! ☕😜",
          "𝐊𝐢 𝐑𝐞 𝐇𝐚𝐛𝐥𝐮 , 𝐄𝐟𝐨 𝐃𝐚𝐤𝐥𝐞 𝐊𝐢 𝐁𝐮𝐝𝐝𝐡𝐢 𝐛𝐚𝐫𝐛𝐞? 🤓🧠", "𝐀𝐦𝐚𝐫 𝐁𝐨𝐬𝐬 𝐛𝐨𝐥𝐬𝐞 𝐟𝐨𝐤𝐞 𝐝𝐮𝐫𝐞 𝐠𝐢𝐲𝐞 𝐦𝐮𝐫𝐢 𝐤𝐡𝐚𝐢𝐟𝐞.. 🍿🥳",
          "𝐟𝐨𝐫 𝐃𝐚𝐤 𝐬𝐡𝐮𝐧𝐞 𝐀𝐦𝐚𝐫 𝐛𝐲𝐚𝐟𝐟𝐞𝐫𝐲 𝐥𝐨𝐰 𝐡𝐢𝐲𝐞 𝐠𝐞𝐥𝐨! 🔋🔋😂",
          "𝐌𝐞𝐠𝐡 𝐌𝐞𝐠𝐡 𝐊𝐨𝐫𝐢𝐬𝐡 𝐍𝐚 , 𝐆𝐅 𝐄𝐫 𝐊𝐚চ𝐞 𝐉𝐚𝐚.. 🙄💃",
          "𝐒𝐚𝐫𝐚𝐝𝐢𝐧 𝐌𝐞𝐠𝐡 𝐌𝐞𝐠𝐡 𝐊𝐨𝐫𝐢𝐬𝐡 𝐊𝐞𝐧𝐨? 𝐌𝐞𝐠𝐡 𝐊𝐢 𝐟𝐨𝐫 𝐁𝐨𝐮? 😹💍",
          "𝐁𝐚𝐳𝐚𝐫𝐞 𝐃𝐞𝐤𝐡𝐂𝐡𝐢 𝐌𝐞𝐠𝐡 𝐍𝐚𝐦𝐞𝐫 𝐃𝐚𝐦 𝐁𝐞𝐫𝐞𝐂𝐡𝐞! 📈🔥",
          "𝐟𝐮𝐢 𝐊𝐞 𝐑𝐞 𝐉𝐞 𝐟𝐨𝐫 𝐊𝐨𝐟𝐡𝐚 𝐒𝐡𝐮𝐧𝐟𝐞 𝐇𝐨𝐛𝐞? 🤨👊",
          "𝐌𝐞𝐠𝐡 𝐄𝐤𝐡𝐨𝐧 𝐒𝐞𝐥𝐞𝐛𝐫𝐢𝐟𝐲 , 𝐃𝐚𝐤𝐥𝐞𝐢 𝐏𝐚𝐛𝐢 𝐧𝐚! 💅✨",
          "𝐄𝐟𝐨 𝐌𝐞𝐠𝐡 𝐌𝐞𝐠𝐡 𝐍𝐚 𝐤𝐨𝐫𝐞 𝐩𝐨𝐫𝐚𝐬𝐡 𝐤𝐨 𝐠𝐞 𝐦𝐚𝐦𝐚.. 📚🤓",
          "𝐌𝐞𝐠𝐡 𝐟𝐨𝐫 𝐊𝐢 𝐡𝐨𝐲𝐫𝐞? 𝐄𝐟𝐨 𝐟𝐚𝐧 𝐤𝐞𝐧𝐨? 🤨🍭",
          "𝐌𝐞𝐠𝐡 𝐄𝐤𝐡𝐨𝐧 𝐁𝐮𝐬𝐲 , 𝐟𝐨𝐫 𝐦𝐨𝐟𝐨 𝐡𝐚𝐛𝐥𝐮𝐫 𝐟𝐢𝐦𝐞 𝐧𝐚𝐢 ! 🥱🤙",
          "𝐀𝐦𝐚𝐲 𝐃𝐚𝐤𝐚𝐫 𝐚𝐠𝐞 𝟐𝟎𝟎 𝐟𝐚𝐤𝐚 𝐛𝐢𝐤𝐚𝐬𝐡 𝐤𝐨𝐫.. 💸🤣",
          "𝐃𝐚𝐤𝐨 𝐊𝐞𝐧𝐨 𝐈𝐂𝐞-𝐂𝐫𝐞𝐚𝐦 𝐊𝐢𝐧𝐞 𝐃𝐢𝐛𝐚? 🍦😋",
          "𝐀𝐦𝐚𝐤𝐞 𝐃𝐚𝐤𝐚𝐫 𝐀𝐠𝐞 𝐀𝐦𝐚𝐤𝐞 𝐂𝐚ন𝐝𝐲 𝐊𝐢𝐧𝐞 𝐃𝐚𝐛𝐚. 🍭🍬",
          "𝐌𝐞𝐠𝐡 𝐄𝐤𝐡𝐨𝐧 𝐟𝐚𝐫 𝐁𝐅 𝐄𝐫 𝐒𝐚𝐟𝐡𝐞 𝐁𝐮𝐬𝐲.. 🤫👩‍❤️‍👨",
          "𝐌𝐞𝐠𝐡-𝐄𝐫 𝐁𝐨𝐲𝐟𝐫𝐢𝐞𝐧𝐝 𝐀𝐂𝐡𝐞 , 𝐄𝐤𝐡𝐨𝐧 𝐀𝐫 𝐟𝐨𝐫 𝐌𝐨𝐟𝐨 𝐒𝐢ন𝐠𝐥𝐞-𝐄𝐫 𝐟𝐢𝐦𝐞 𝐍𝐚𝐢! 😹💔"
        ];
        
        // এখানে @username মেনশন করা হচ্ছে না, শুধু রিপ্লাই পাঠানো হচ্ছে
        const replyMessage = replies[Math.floor(Math.random() * replies.length)];
        
        return api.sendMessage(
          replyMessage,  // শুধু মেসেজ, কোন মেনশন নেই
          event.threadID,
          (err, info) => {
            if (!err) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: "hinata",
                author: event.senderID
              });
            }
          },
          event.messageID
        );
      }

      // 👉 Prefix chat (baby kemon acho)
      if (triggers.some(t => text.startsWith(t + " "))) {
        api.setMessageReaction("🪽", event.messageID, () => {}, true);
        api.sendTypingIndicator(event.threadID, true);

        let userText = text;
        for (const prefix of triggers) {
          if (text.startsWith(prefix)) {
            userText = text.substring(prefix.length).trim();
            break;
          }
        }

        const getBotResponse = async (text, attachments) => {
          try {
            const res = await axios.post(`${await baseApiUrl()}/api/hinata`, {
              text,
              style: 3,
              attachments
            });
            return res.data.message;
          } catch {
            return "error janu🥹";
          }
        };

        const botResponse = await getBotResponse(userText, attachments);
        
        api.sendMessage(
          botResponse,
          event.threadID,
          (err, info) => {
            if (!err) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: "hinata",
                author: event.senderID
              });
            }
          },
          event.messageID
        );
      }

    } catch (err) {
      console.error(err);
    }
  }
};
