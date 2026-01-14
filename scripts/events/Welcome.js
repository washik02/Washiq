const { getTime, drive } = global.utils;
const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

if (!global.temp.welcomeEvent)
  global.temp.welcomeEvent = {};

// ফন্ট এবং ক্যাশ সেটআপ
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

module.exports = {
  config: {
    name: "welcome",
    version: "2.2.0",
    author: "Washiq & MAHBUB ULLASH",
    category: "events"
  },

  langs: {
    en: {
      session1: "morning", session2: "noon", session3: "afternoon", session4: "evening",
      welcomeBot: "Assalamu Alaikum! Thank you for adding me to {threadName}.\nPrefix: {prefix}\nType {prefix}help to see commands.",
      welcomeMember: "Hello {userName} 👋\nWelcome to {threadName} 🎉\nYou're the {memberCount}th member of this group 🎊\nHave a great {session}!"
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const prefix = global.utils.getPrefix(threadID);
    const addedParticipants = event.logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    // সময় অনুযায়ী সেশন বের করা
    const hour = require("moment-timezone").tz("Asia/Dhaka").format("HH");
    const session = hour >= 5 && hour < 12 ? getLang("session1") : 
                  hour >= 12 && hour < 17 ? getLang("session2") : 
                  hour >= 17 && hour < 21 ? getLang("session3") : getLang("session4");

    // যদি বট নিজে জয়েন করে
    if (addedParticipants.some(item => item.userFbId == botID)) {
      const threadData = await threadsData.get(threadID);
      const threadName = threadData.threadName || "this group";
      
      const body = getLang("welcomeBot", { threadName, prefix });
      
      try {
        const gifPath = path.join(__dirname, "cache", "welcome_bot.gif");
        if (!fs.existsSync(gifPath)) {
          const { data } = await axios.get(WELCOME_GIF_URL, { responseType: "arraybuffer" });
          await fs.outputFile(gifPath, data);
        }
        return message.send({ body, attachment: fs.createReadStream(gifPath) });
      } catch {
        return message.send(body);
      }
    }

    // নতুন মেম্বার জয়েন করলে
    try {
      const threadData = await threadsData.get(threadID);
      if (threadData?.settings?.sendWelcomeMessage === false) return;

      const threadName = threadData.threadName || "Group Chat";
      const threadInfo = await api.getThreadInfo(threadID);
      const memberCount = threadInfo.participantIDs.length;

      for (const user of addedParticipants) {
        const { fullName: userName, userFbId: userID } = user;

        const avatarUrl = `https://graph.facebook.com/${userID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const backgrounds = [
          "https://files.catbox.moe/hu38g1.jpg",
          "https://files.catbox.moe/5kb6w8.jpg",
          "https://files.catbox.moe/zbt4bh.jpg",
          "https://files.catbox.moe/s5l6b3.jpg"
        ];
        const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];

        const canvas = createCanvas(1000, 500);
        const ctx = canvas.getContext("2d");

        // ক্যানভাস ড্রয়িং
        const bgImg = await loadImage(randomBg);
        ctx.drawImage(bgImg, 0, 0, 1000, 500);

        // এভার্টার ড্রয়িং
        ctx.save();
        ctx.beginPath();
        ctx.arc(500, 130, 90, 0, Math.PI * 2);
        ctx.lineWidth = 10;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.clip();
        try {
          const avatarImg = await loadImage(avatarUrl);
          ctx.drawImage(avatarImg, 410, 40, 180, 180);
        } catch {
          const defaultAvatar = await loadImage("https://i.ibb.co/2kR9xgQ/default-avatar.png");
          ctx.drawImage(defaultAvatar, 410, 40, 180, 180);
        }
        ctx.restore();

        // টেক্সট এরিয়া বক্স
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(50, 250, 900, 220);

        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 45px ModernoirBold";
        ctx.fillText("ASSALAMUALAIKUM", 500, 310);

        ctx.fillStyle = "#ffea00";
        ctx.font = "bold 35px ModernoirBold";
        ctx.fillText(userName.toUpperCase(), 500, 360);

        ctx.fillStyle = "#ffffff";
        ctx.font = "30px ModernoirBold";
        wrapText(ctx, `Welcome to ${threadName}`, 500, 405, 800, 35);

        ctx.fillStyle = "#00ffcc";
        ctx.font = "25px ModernoirBold";
        ctx.fillText(`Member #${memberCount}`, 500, 450);

        const imgPath = path.join(__dirname, "cache", `welcome_${userID}.png`);
        const buffer = canvas.toBuffer("image/png");
        await fs.outputFile(imgPath, buffer);

        const msg = getLang("welcomeMember", { 
          userName: userName, 
          threadName: threadName, 
          memberCount: memberCount, 
          session: session 
        });

        message.send({
          body: msg,
          mentions: [{ tag: userName, id: userID }],
          attachment: fs.createReadStream(imgPath)
        }, () => fs.unlinkSync(imgPath));
      }
    } catch (err) {
      console.error("Welcome Error:", err);
    }
  }
};
        
