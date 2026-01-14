const { getTime, drive } = global.utils;
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

// Font registration (async)
(async () => {
  try {
    const fontPath = path.join(__dirname, "cache", "english.ttf");
    if (!fs.existsSync(fontPath)) {
      const fontUrl = "https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/main/english.ttf";
      const { data } = await axios.get(fontUrl, { responseType: "arraybuffer" });
      await fs.outputFile(fontPath, data);
    }
    // Register font
    require("canvas").registerFont(fontPath, { family: "ModernoirBold" });
  } catch (err) {
    console.error("Font loading error:", err);
  }
})();

// Function to create welcome image
async function createWelcomeImage(userName, threadName, memberCount, userID) {
  try {
    const canvas = createCanvas(1000, 500);
    const ctx = canvas.getContext("2d");
    
    // Background images
    const backgrounds = [
      "https://files.catbox.moe/hu38g1.jpg",
      "https://files.catbox.moe/5kb6w8.jpg",
      "https://files.catbox.moe/zbt4bh.jpg",
      "https://files.catbox.moe/s5l6b3.jpg"
    ];
    
    const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    
    // Load background
    const bgResponse = await axios.get(randomBg, { responseType: "arraybuffer" });
    const bg = await loadImage(bgResponse.data);
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    
    // Add overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load user avatar
    const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    let avatar;
    try {
      const response = await axios.get(avatarUrl, { responseType: "arraybuffer" });
      avatar = await loadImage(response.data);
    } catch {
      avatar = await loadImage("https://i.ibb.co/2kR9xgQ/default-avatar.png");
    }
    
    // Draw circular avatar
    const avatarSize = 180;
    const avatarX = canvas.width / 2 - avatarSize / 2;
    const avatarY = 50;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
    
    // Draw avatar border
    ctx.beginPath();
    ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Text styling
    ctx.textAlign = "center";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 5;
    
    // Welcome text
    ctx.font = "bold 40px ModernoirBold";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("✨ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✨", canvas.width / 2, avatarY + avatarSize + 60);
    
    // User name
    ctx.font = "bold 32px ModernoirBold";
    ctx.fillStyle = "#ffcc00";
    const displayName = userName.length > 25 ? userName.substring(0, 22) + "..." : userName;
    ctx.fillText(displayName, canvas.width / 2, avatarY + avatarSize + 100);
    
    // Group name
    ctx.font = "bold 26px ModernoirBold";
    ctx.fillStyle = "#00ccff";
    ctx.fillText(`𝐓𝐎 » ${threadName}`, canvas.width / 2, avatarY + avatarSize + 140);
    
    // Member count
    ctx.font = "bold 22px ModernoirBold";
    ctx.fillStyle = "#ff66cc";
    ctx.fillText(`🎯 𝐌𝐄𝐌𝐁𝐄𝐑 #${memberCount}`, canvas.width / 2, avatarY + avatarSize + 180);
    
    // Footer
    ctx.font = "18px ModernoirBold";
    ctx.fillStyle = "#90ee90";
    ctx.fillText("𝐁𝐎𝐓 𝐁𝐘 » 𝐖𝐀𝐒𝐇𝐈𝐊", canvas.width / 2, avatarY + avatarSize + 220);
    
    // Save image
    const imgPath = path.join(__dirname, "cache", `welcome_${userID}_${Date.now()}.png`);
    await fs.ensureDir(path.dirname(imgPath));
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(imgPath, buffer);
    
    return imgPath;
  } catch (err) {
    console.error("Error creating welcome image:", err);
    return null;
  }
}

module.exports = {
	config: {
		name: "welcome",
		version: "2.0",
		author: "WASHIK",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
			multiple1: "bạn",
			multiple2: "các bạn",
			defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			welcomeMessage: "🤖 Thank you for inviting me to the group!\n🔰 Bot prefix: %1\n📚 Commands: %1help\n👑 Owner: Washik Adnan",
			multiple1: "you",
			multiple2: "you guys",
			defaultWelcomeMessage: `✨ Hello {userName}\n🎉 Welcome to {boxName}\n👥 You are member #{memberCount}\n🌸 Have a nice {session}! 😊`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const hours = getTime("HH");
				const { threadID } = event;
				const { nickNameBot } = global.GoatBot.config;
				const prefix = global.utils.getPrefix(threadID);
				const dataAddedParticipants = event.logMessageData.addedParticipants;
				const botID = api.getCurrentUserID();
				
				// if new member is bot
				if (dataAddedParticipants.some((item) => item.userFbId == botID)) {
					if (nickNameBot)
						api.changeNickname(nickNameBot, threadID, botID);
					return message.send(getLang("welcomeMessage", prefix));
				}
				
				// if new member:
				if (!global.temp.welcomeEvent[threadID])
					global.temp.welcomeEvent[threadID] = {
						joinTimeout: null,
						dataAddedParticipants: []
					};

				// push new member to array
				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
				// if timeout is set, clear it
				clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

				// set new timeout
				global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
					const threadData = await threadsData.get(threadID);
					if (threadData.settings.sendWelcomeMessage == false)
						return;
					
					const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
					const dataBanned = threadData.data.banned_ban || [];
					const threadName = threadData.threadName;
					const threadInfo = await api.getThreadInfo(threadID);
					const memberCount = threadInfo.participantIDs.length;
					
					const userName = [],
						mentions = [];
					let multiple = false;

					if (dataAddedParticipants.length > 1)
						multiple = true;

					for (const user of dataAddedParticipants) {
						if (dataBanned.some((item) => item.id == user.userFbId))
							continue;
						userName.push(user.fullName);
						mentions.push({
							tag: user.fullName,
							id: user.userFbId
						});
					}
					
					if (userName.length == 0) return;
					
					// Get thread welcome message or use default
					let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
					
					// Replace placeholders
					welcomeMessage = welcomeMessage
						.replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
						.replace(/\{boxName\}|\{threadName\}/g, threadName)
						.replace(/\{memberCount\}/g, memberCount)
						.replace(
							/\{multiple\}/g,
							multiple ? getLang("multiple2") : getLang("multiple1")
						)
						.replace(
							/\{session\}/g,
							hours <= 10
								? getLang("session1")
								: hours <= 12
									? getLang("session2")
									: hours <= 18
										? getLang("session3")
										: getLang("session4")
						);

					// Create form object
					const form = {
						body: welcomeMessage,
						mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null
					};

					// Try to create and send welcome image
					try {
						const welcomeImagePath = await createWelcomeImage(
							userName.join(", "),
							threadName,
							memberCount,
							dataAddedParticipants[0].userFbId
						);
						
						if (welcomeImagePath && fs.existsSync(welcomeImagePath)) {
							form.attachment = fs.createReadStream(welcomeImagePath);
							
							// Send message with image
							await message.send(form);
							
							// Cleanup image after sending
							setTimeout(() => {
								try { fs.unlinkSync(welcomeImagePath); } catch (e) {}
							}, 5000);
							
						} else {
							// Fallback to text only
							await message.send(form);
						}
					} catch (imageErr) {
						console.error("Error sending welcome image:", imageErr);
						// Fallback to original method
						await message.send(form);
					}

					delete global.temp.welcomeEvent[threadID];
				}, 1500);
			};
	}
};
