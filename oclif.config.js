module.exports = {
  bin: "vantage",
  dirname: "vantage",
  commands: "./dist/commands",
  topicSeparator: ":",
  plugins: ["./dist/hooks"],
  hooks: {
    init: [
      async function() {
        console.log("Initializing vantage...");
      },
    ],
  },
};
