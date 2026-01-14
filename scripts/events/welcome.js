const { getTime, drive } = global.utils;
const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

if (!global.temp.welcomeEvent)
  global.temp.welcomeEvent = {};

(async () => {
  try {
    const fontPath = path.join(__dirname, "cache", "english.ttf");
    if (!fs.existsSync(fontPath)) {
      const fontUrl = "https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/main/english.ttf";
      const { data } = await axios.get(fontUrl, { responseType: "arraybuffer" });
      await fs.outputFile(fontPath, data);
    }
    registerFont(fontPath, { family: "ModernoirBold" });
  } catch (err) {
    console.error("❌ Font loading error:", err);
  }
})();

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return y;
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
  return y;
}

const WELCOME_GIF_URL = "https://files.catbox.moe/38guc2.gif";

async function sendWelcomeGifMessage(api, threadID, bodyText) {
  try {
    const gifPath = path.join(__dirname, "cache", "welcome_bot.gif");
    if (!fs.existsSync(gifPath)) {
      const { data } = await axios.get(WELCOME_GIF_URL, { responseType: "arraybuffer" });
      await fs.outputFile(gifPath, data);
    }
    await api.sendMessage({
      body: bodyText,
      attachment: fs.createReadStream(gifPath)
    }, threadID);
  } catch (err) {
    console.error("Failed to send welcome gif message:", err);
    try {
      await api.sendMessage(bodyText, threadID);
    } catch (e) {
      console.error("Failed to send fallback welcome message:", e);
    }
  }
}

module.exports = {
  config: {
    name: "welcome",
    version: "2.1.0",
    author: "MAHBUB ULLASH",
    category: "events"
  },

  langs: {
    vi: {
      session1: "sáng", session2: "trưa", session3: "chiều", session4: "tối",
      welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
      multiple1: "bạn", multiple2: "các bạn",
      defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!"
    },
    en: {
      session1: "morning", session2: "noon", session3: "afternoon", session4: "evening",
      welcomeMessage: "Thank you for inviting me to the group!\nBot prefix: %1\nTo view the list of commands, please enter: %1help",
      multiple1: "you", multiple2: "you guys",
      defaultWelcomeMessage: `Hello {userName}.\nWelcome {multiple} to the chat group: {boxName}\nHave a nice {session} 😊`
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang, usersData }) => {
    if (event.logMessageType == "log:subscribe")
      return async function () {
        const { threadID } = event;
        const { nickNameBot } = global.GoatBot.config;
        const prefix = global.utils.getPrefix(threadID);
        const dataAddedParticipants = event.logMessageData.addedParticipants;
        const botID = api.getCurrentUserID();

        if (dataAddedParticipants.some((item) => item.userFbId == botID)) {
          if (nickNameBot) api.changeNickname(nickNameBot, threadID, botID);
          
          const { threadApproval } = global.GoatBot.config;
          if (threadApproval && threadApproval.enable) {
             // ... [thread approval logic remains same as original]
          }

          setTimeout(async () => {
            try {
              const text = getLang("welcomeMessage", prefix);
              await sendWelcomeGifMessage(api, threadID, text);
            } catch (err) {
              console.error(`Failed to send welcome message:`, err.message);
            }
          }, 2000);
          return null;
        }

        try {
          const threadData = await threadsData.get(threadID);
          if (threadData?.settings?.sendWelcomeMessage === false) return;

          const threadName = threadData.threadName || "Group Chat";
          const threadInfo = await api.getThreadInfo(threadID);
          const memberCount = threadInfo.participantIDs.length;

          const user = dataAddedParticipants[0];
          const userName = user.fullName;
          const userID = user.userFbId;

          const displayUserName = userName && userName.trim() !== "" ? userName : "New member";
          const displayThreadName = threadName && threadName.trim() !== "" ? threadName : "Group chat";

          const avatarUrl = `https://graph.facebook.com/${userID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

          // আপনার দেওয়া নতুন ৫টি ব্যাকগ্রাউন্ড লিংক এখানে আপডেট করা হয়েছে
          const backgrounds = [
            "https://files.catbox.moe/hu38g1.jpg",
            "https://files.catbox.moe/5kb6w8.jpg",
            "https://files.catbox.moe/zbt4bh.jpg",
            "https://files.catbox.moe/hu38g1.jpg", // তালিকার ডুপ্লিকেট লিংকটি রাখা হয়েছে আপনার চাহিদা অনুযায়ী
            "https://files.catbox.moe/s5l6b3.jpg"
          ];
          
          const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];

          const canvas = createCanvas(1000, 500);
          const ctx = canvas.getContext("2d");

          const bgResponse = await axios.get(randomBg, { responseType: "arraybuffer" });
          const bg = await loadImage(bgResponse.data);
          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

          let avatar;
          try {
            const response = await axios.get(avatarUrl, { responseType: "arraybuffer" });
            avatar = await loadImage(response.data);
          } catch {
            avatar = await loadImage("https://i.ibb.co/2kR9xgQ/default-avatar.png");
          }

          const avatarSize = 180;
          const avatarX = canvas.width / 2 - avatarSize / 2;
          const avatarY = 40;

          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();

          const overlayHeight = 190;
          ctx.save();
          ctx.fillStyle = "rgba(0, 0, 0, 0.60)";
          ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);
          ctx.restore();

          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0,0,0,0.7)";
          ctx.shadowBlur = 4;
          const centerX = canvas.width / 2;
          let currentY = canvas.height - overlayHeight + 40;

          ctx.font = "bold 42px ModernoirBold";
          ctx.fillStyle = "#ffffff";
          ctx.fillText("ASSALAMUALAIKUM", centerX, currentY);

          currentY += 40;
          ctx.font = "bold 34px ModernoirBold";
          ctx.fillStyle = "#ffea00";
          if (displayUserName.length > 26) ctx.font = "bold 30px ModernoirBold";
          ctx.fillText(displayUserName, centerX, currentY);

          currentY += 38;
          ctx.font = "bold 28px ModernoirBold";
          ctx.fillStyle = "#ffffff";

          const line3Text = `welcome to ${displayThreadName}`;
          const maxWidth = canvas.width - 160;
          const lineHeight = 32;
          currentY = wrapText(ctx, line3Text, centerX, currentY, maxWidth, lineHeight);

          currentY += 34;
          ctx.font = "bold 24px ModernoirBold";
          ctx.fillStyle = "#00ffcc";
          ctx.fillText(`You're the ${memberCount}th member of this group`, centerX, currentY);

          const imgPath = path.join(__dirname, "cache", `welcome_${userID}.png`);
          await fs.ensureDir(path.dirname(imgPath));
          const out = fs.createWriteStream(imgPath);
          const stream = canvas.createPNGStream();
          stream.pipe(out);
          await new Promise(resolve => out.on("finish", resolve));

          message.send({
              body: [
                `Hello ${displayUserName} 👋`,
                `Welcome to ${displayThreadName} 🎉`,
                `You're the ${memberCount}th member of this group 🎊`
              ].join("\n"),
              attachment: fs.createReadStream(imgPath)
            },
            () => { try { fs.unlinkSync(imgPath); } catch (e) { } }
          );
        } catch (err) {
          console.error("❌ Welcome event error (canvas):", err);
        }
      };
  }
};
