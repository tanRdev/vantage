#!/usr/bin/env node

import { fileURLToPath } from "url";
import * as path from "path";
import * as fs from "fs";

interface CommandModule {
  id?: string;
  description?: string;
  run: (args: string[]) => Promise<void>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadCommands(): Promise<CommandModule[]> {
  const commandsDir = path.join(__dirname, "commands");

  if (fs.existsSync(commandsDir)) {
    const files = fs.readdirSync(commandsDir);
    const commands: CommandModule[] = [];

    for (const file of files) {
      if (file.endsWith(".js")) {
        const modulePath = path.join(commandsDir, file);
        try {
          const commandModule = await import(modulePath);
          if (commandModule.default) {
            commands.push(commandModule.default);
          }
        } catch (error) {
          console.warn(`Failed to load command ${file}:`, error);
        }
      }
    }

    return commands;
  }

  return [];
}

async function main(): Promise<void> {
  const commands = await loadCommands();

  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log("Performance Enforcer - Performance budget enforcement for Next.js apps\n");
    console.log("\nUsage: performance-enforcer <command> [options]\n");
    console.log("\nCommands:");
    for (const cmd of commands) {
      const desc = cmd.description || cmd.id || "Unknown command";
      const name = cmd.id || desc.split(" ")[0];
      console.log(`  ${name.padEnd(12)} ${desc}`);
    }
    console.log("\nOptions:");
    console.log("  --help, -h       Show this help message");
    return;
  }

  const commandName = args[0];
  const commandArgs = args.slice(1);

  const command = commands.find(
    (cmd) => cmd.id === commandName || cmd.description?.toLowerCase().includes(commandName)
  );

  if (!command) {
    console.log(`Unknown command: ${commandName}`);
    process.exit(1);
  }

  try {
    await command.run(commandArgs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main().catch((error: Error) => {
  console.error(`Failed to initialize: ${error.message}`);
  process.exit(1);
});
