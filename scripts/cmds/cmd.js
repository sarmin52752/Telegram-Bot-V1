const axios = require('axios');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

module.exports = {
  config: {
    name: "cmd",
    version: "1.0.0",
    role: 2,
    author: "dipto",
    description: "Create a new file with code from a link or provided code",
    category: "utility",
    guide: "{p}cmd [file name] [link/code]",
    countDown: 5
  },

  onStart: async function ({ message, args }) {
    try {
      const fileName = args[0];
      let input = args.slice(1).join(' ');

      if (!fileName || !input) {
        return message.reply("Please provide both a file name and code or a valid link!");
      }

      let code;
      const linkPattern = /^(http|https):\/\/[^ "]+$/;

      if (linkPattern.test(input)) {
        const response = await axios.get(input);
        code = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data;
      } else {
        // যদি ইনপুট এর শুরুতে /cmd install বা এই জাতীয় কিছু থাকে সেটা বাদ দেওয়ার জন্য
        code = input.replace(/^\/cmd\s+install\s+[^\s]+\s+/, '').trim();
      }

      // সিনট্যাক্স চেক করার আগে অদরকারি ক্যারেক্টার ক্লিন করা
      try {
        new vm.Script(code);
      } catch (syntaxError) {
        return message.reply(`❌ Syntax error in the provided code: ${syntaxError.message}`);
      }

      const filePath = path.join(__dirname, fileName);
      fs.writeFileSync(filePath, code, 'utf-8');

      return message.reply(`✅ File created successfully: ${fileName}`);
    } catch (error) {
      console.error("Error:", error);
      return message.reply("An error occurred while creating the file.");
    }
  }
};
