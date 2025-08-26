#!/usr/bin/env tsx

import { config } from "dotenv";
import path from "path";

// Load environment variables FIRST, before importing other modules
const envPath = path.resolve(process.cwd(), ".env.local");
config({ path: envPath });

import connectToDatabase from "../lib/mongodb";
import Vocabulary from "../models/Vocabulary";
import Language from "../models/Language";

const checkDatabase = async (): Promise<void> => {
  try {
    console.log("🔌 Connecting to database...");
    await connectToDatabase();
    console.log("✅ Database connected successfully");

    // Check languages
    console.log("\n📚 Languages in database:");
    const languages = await Language.find({});
    if (languages.length === 0) {
      console.log("  ❌ No languages found");
    } else {
      languages.forEach((lang) => {
        console.log(
          `  ✅ ${lang.code}: ${lang.name} (Active: ${lang.isActive})`
        );
      });
    }

    // Check vocabulary
    console.log("\n📖 Vocabulary in database:");
    const allVocabulary = await Vocabulary.find({});
    if (allVocabulary.length === 0) {
      console.log("  ❌ No vocabulary found");
    } else {
      console.log(`  ✅ Total vocabulary items: ${allVocabulary.length}`);

      // Group by language
      const byLanguage = allVocabulary.reduce((acc, vocab) => {
        if (!acc[vocab.languageCode]) {
          acc[vocab.languageCode] = [];
        }
        acc[vocab.languageCode].push(vocab);
        return acc;
      }, {} as Record<string, any[]>);

      Object.entries(byLanguage).forEach(([langCode, items]) => {
        console.log(`\n    🌍 ${langCode}: ${(items as any[]).length} items`);

        // Group by category
        const byCategory = (items as any[]).reduce((acc, vocab) => {
          if (!acc[vocab.category]) {
            acc[vocab.category] = [];
          }
          acc[vocab.category].push(vocab);
          return acc;
        }, {} as Record<string, any[]>);

        Object.entries(byCategory).forEach(([category, categoryItems]) => {
          const items = categoryItems as any[];
          console.log(`      📁 ${category}: ${items.length} items`);
          if (items.length <= 5) {
            items.forEach((item: any, index: number) => {
              console.log(
                `        ${index + 1}. ${item.word} → ${item.translation}`
              );
            });
          } else {
            items.slice(0, 3).forEach((item: any, index: number) => {
              console.log(
                `        ${index + 1}. ${item.word} → ${item.translation}`
              );
            });
            console.log(`        ... and ${items.length - 3} more`);
          }
        });
      });
    }

    // Check for inactive items
    console.log("\n🔍 Checking for inactive items:");
    const inactiveItems = await Vocabulary.find({ isActive: false });
    if (inactiveItems.length === 0) {
      console.log("  ✅ No inactive vocabulary items found");
    } else {
      console.log(`  ⚠️  Found ${inactiveItems.length} inactive items`);
      inactiveItems.slice(0, 5).forEach((item, index) => {
        console.log(`    ${index + 1}. ${item.word} (${item.languageCode})`);
      });
      if (inactiveItems.length > 5) {
        console.log(`    ... and ${inactiveItems.length - 5} more`);
      }
    }

    // Check for duplicates
    console.log("\n🔍 Checking for duplicate words:");
    const duplicates = await Vocabulary.aggregate([
      {
        $group: {
          _id: { word: "$word", languageCode: "$languageCode" },
          count: { $sum: 1 },
          items: { $push: "$_id" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    if (duplicates.length === 0) {
      console.log("  ✅ No duplicate words found");
    } else {
      console.log(`  ⚠️  Found ${duplicates.length} duplicate word groups`);
      duplicates.forEach((dup, index) => {
        console.log(
          `    ${index + 1}. "${dup._id.word}" (${dup._id.languageCode}): ${
            dup.count
          } times`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error checking database:", error);
    process.exit(1);
  }
};

const clearAllData = async (): Promise<void> => {
  try {
    console.log("🔌 Connecting to database...");
    await connectToDatabase();
    console.log("✅ Database connected successfully");

    console.log("🗑️  Clearing all vocabulary data...");
    const result = await Vocabulary.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} vocabulary items`);

    console.log("🗑️  Clearing all language data...");
    const langResult = await Language.deleteMany({});
    console.log(`✅ Deleted ${langResult.deletedCount} language items`);

    console.log("✅ Database cleared successfully");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "clear") {
    console.log("⚠️  WARNING: This will delete ALL data from the database!");
    console.log("Type 'yes' to confirm:");

    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("", (answer: string) => {
      if (answer.toLowerCase() === "yes") {
        clearAllData();
      } else {
        console.log("❌ Operation cancelled");
      }
      rl.close();
    });
  } else {
    await checkDatabase();
  }
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}
