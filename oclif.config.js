module.exports = {
  bin: "performance-enforcer",
  dirname: "performance-enforcer",
  commands: "./dist/commands",
  topicSeparator: ":",
  plugins: ["./dist/hooks"],
  hooks: {
    init: [
      async function() {
        console.log("Initializing performance-enforcer...");
      },
    ],
  },
};
