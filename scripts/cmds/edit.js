const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const apiUrl = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";

async function getApiUrl() {
    try {
        const res = await axios.get(apiUrl);
        return res.data.apiv3;
    } catch (e) {
        return null;
    }
}

async function urlToBase64(url) {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(res.data).toString("base64");
}

module.exports = {
    config: {
        name: "edit",
        version: "1.0",
        author: "Zihad Ahmed",
        countDown: 5,
        role: 0,
        description: "Reply to an image with a prompt to edit it",
        category: "ai",
        guide: "{p}edit [prompt] (reply to photo)"
    },

    onStart: async function ({ api, event, args, message }) {
        const repliedImage = event.messageReply?.attachments?.[0];
        const prompt = args.join(" ").trim();

        if (!event.messageReply || !repliedImage || repliedImage.type !== "photo") {
            return message.reply("❌ দয়া করে একটি ছবির রিপ্লাই দিয়ে লিখুন আপনি কি পরিবর্তন করতে চান।");
        }

        if (!prompt) {
            return message.reply("❌ ছবিটির সাথে কি করতে হবে তা লিখে দিন।");
        }

        const processingMsg = await message.reply("🎨 | এডিটিং হচ্ছে, দয়া করে অপেক্ষা করুন...");
        const imgPath = path.join(__dirname, "cache", `${Date.now()}_edited.jpg`);

        try {
            const API_URL = await getApiUrl();
            if (!API_URL) throw new Error("API URL not found");
            
            const base64Img = await urlToBase64(repliedImage.url);

            const payload = {
                prompt: `Edit the given image based on this description: ${prompt}`,
                images: [base64Img],
                format: "jpg"
            };

            const res = await axios.post(API_URL, payload, {
                responseType: "arraybuffer",
                timeout: 180000 
            });

            await fs.ensureDir(path.dirname(imgPath));
            await fs.writeFile(imgPath, Buffer.from(res.data));

            await api.unsendMessage(processingMsg.messageID);

            await message.reply({
                body: "✅ এই নিন আপনার এডিট করা ছবি!",
                attachment: fs.createReadStream(imgPath)
            });

        } catch (error) {
            console.error("EDIT Error:", error.message);
            if (processingMsg) await api.unsendMessage(processingMsg.messageID);
            message.reply("❌ দুঃখিত, ইমেজটি এডিট করা সম্ভব হয়নি।");
        } finally {
            if (fs.existsSync(imgPath)) {
                setTimeout(() => fs.removeSync(imgPath), 2000);
            }
        }
    }
};
