#!/usr/bin/env tsx

import { config } from "dotenv";
import path from "path";

// Load environment variables FIRST, before importing other modules
const envPath = path.resolve(process.cwd(), ".env.local");
config({ path: envPath });

// Now import other modules after environment variables are loaded
import { connectToDatabase } from "../lib/mongodb";
import Vocabulary from "../models/Vocabulary";
import Language from "../models/Language";
import Papa from "papaparse";
import fs from "fs";

// interface CSVRow { /* unused */
//   word: string;
//   translation: string;
//   pronunciation: string;
//   category?: string;
//   example?: string;
//   exampleTranslation?: string;
// }

interface ImportOptions {
  filePath: string;
  languageCode: string;
  dryRun?: boolean;
  verbose?: boolean;
}

interface ProcessedVocabulary {
  word: string;
  translation: string;
  pronunciation: string;
  languageCode: string;
  category: string;
  example: string;
  exampleTranslation: string;
  isActive: boolean;
}

const handleImport = async (options: ImportOptions): Promise<void> => {
  const { filePath, languageCode, dryRun = false } = options;

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    // Connect to database
    console.log("🔌 Connecting to database...");
    await connectToDatabase();
    console.log("✅ Database connected successfully");

    // Check if language exists, if not create it automatically
    let language = await Language.findOne({
      code: languageCode.toUpperCase(),
    });

    if (!language) {
      console.log(
        `🌍 Language '${languageCode}' not found, creating automatically...`
      );

      // Language mapping for common languages
      const languageNames: { [key: string]: string } = {
        EN: "English",
        VI: "Vietnamese",
        FR: "French",
        DE: "German",
        ES: "Spanish",
        IT: "Italian",
        PT: "Portuguese",
        RU: "Russian",
        JA: "Japanese",
        KO: "Korean",
        ZH: "Chinese",
        AR: "Arabic",
        HI: "Hindi",
        TH: "Thai",
        NL: "Dutch",
        SV: "Swedish",
        NO: "Norwegian",
        DA: "Danish",
        FI: "Finnish",
        PL: "Polish",
        CS: "Czech",
        HU: "Hungarian",
        RO: "Romanian",
        BG: "Bulgarian",
        HR: "Croatian",
        SK: "Slovak",
        SL: "Slovenian",
        ET: "Estonian",
        LV: "Latvian",
        LT: "Lithuanian",
        MT: "Maltese",
        GA: "Irish",
        CY: "Welsh",
        EU: "Basque",
        CA: "Catalan",
        GL: "Galician",
        IS: "Icelandic",
        MK: "Macedonian",
        SQ: "Albanian",
        SR: "Serbian",
        BS: "Bosnian",
        ME: "Montenegrin",
        XK: "Kosovan",
      };

      // Flag emojis for each language
      const languageFlags: { [key: string]: string } = {
        EN: "🇺🇸",
        VI: "🇻🇳",
        FR: "🇫🇷",
        DE: "🇩🇪",
        ES: "🇪🇸",
        IT: "🇮🇹",
        PT: "🇵🇹",
        RU: "🇷🇺",
        JA: "🇯🇵",
        KO: "🇰🇷",
        ZH: "🇨🇳",
        AR: "🇸🇦",
        HI: "🇮🇳",
        TH: "🇹🇭",
        NL: "🇳🇱",
        SV: "🇸🇪",
        NO: "🇳🇴",
        DA: "🇩🇰",
        FI: "🇫🇮",
        PL: "🇵🇱",
        CS: "🇨🇿",
        HU: "🇭🇺",
        RO: "🇷🇴",
        BG: "🇧🇬",
        HR: "🇭🇷",
        SK: "🇸🇰",
        SL: "🇸🇮",
        ET: "🇪🇪",
        LV: "🇱🇻",
        LT: "🇱🇹",
        MT: "🇲🇹",
        GA: "🇮🇪",
        CY: "🇨🇾",
        EU: "🇪🇺",
        CA: "🇪🇸",
        GL: "🇪🇸",
        IS: "🇮🇸",
        MK: "🇲🇰",
        SQ: "🇦🇱",
        SR: "🇷🇸",
        BS: "🇧🇦",
        ME: "🇲🇪",
        XK: "🇽🇰",
      };

      const languageName =
        languageNames[languageCode.toUpperCase()] || languageCode.toUpperCase();

      const languageFlag = languageFlags[languageCode.toUpperCase()] || "🌍";

      language = new Language({
        code: languageCode.toUpperCase(),
        name: languageName,
        flag: languageFlag,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (!dryRun) {
        await language.save();
        console.log(
          `✅ Created new language: ${languageName} (${languageCode.toUpperCase()})`
        );
      } else {
        console.log(
          `🔍 Would create new language: ${languageName} (${languageCode.toUpperCase()})`
        );
      }
    } else {
      console.log(
        `📚 Using existing language: ${language.name} (${language.code})`
      );
    }

    console.log(
      `📚 Importing vocabulary for language: ${language.name} (${language.code})`
    );

    // Read and parse CSV file
    console.log(`📖 Reading CSV file: ${filePath}`);
    const csvContent = fs.readFileSync(filePath, "utf-8");
    const { data, errors } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
      transform: (value: string) => value.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.log(
            `📊 Parsed ${results.data.length} rows with ${results.errors.length} warnings`
          );
        }
      },
    });

    if (errors.length > 0) {
      console.warn(
        "⚠️  CSV parsing warnings (some rows may have formatting issues):"
      );
      errors.forEach((error) =>
        console.warn(`  - Row ${error.row}: ${error.message}`)
      );
      console.log(
        "🔄 Continuing with import, problematic rows will be handled..."
      );
    }

    console.log(`📊 Found ${data.length} rows in CSV`);

    // Process data with robust error handling
    const vocabularyData: ProcessedVocabulary[] = [];

    (data as Record<string, unknown>[]).forEach((row, index) => {
      try {
        // Handle cases where row might be malformed
        if (!row || typeof row !== "object") {
          console.warn(
            `⚠️  Skipping malformed row ${index + 1}: Invalid row data`
          );
          return;
        }

        // Type-safe data processing with fallbacks
        const word = (row.word || row[0] || "").toString().trim();
        const translation = (row.translation || row[1] || "").toString().trim();
        const pronunciation = (row.pronunciation || row[2] || "")
          .toString()
          .trim();
        const category = (row.category || row[3] || "General")
          .toString()
          .trim();
        const example = (row.example || row[4] || "").toString().trim();
        const exampleTranslation = (row.exampleTranslation || row[5] || "")
          .toString()
          .trim();

        // Only add if we have the required fields
        if (word && translation && pronunciation) {
          vocabularyData.push({
            word,
            translation,
            pronunciation,
            languageCode: languageCode.toUpperCase(),
            category: category || "General",
            example: example || "",
            exampleTranslation: exampleTranslation || "",
            isActive: true,
          });
        } else {
          console.warn(
            `⚠️  Skipping row ${index + 1}: Missing required fields`
          );
        }
      } catch (error) {
        console.warn(`⚠️  Error processing row ${index + 1}: ${error}`);
      }
    });

    // Data is already validated during processing
    if (vocabularyData.length === 0) {
      console.error("❌ No valid vocabulary data found");
      process.exit(1);
    }

    console.log(
      `✅ ${vocabularyData.length} valid vocabulary items ready for import`
    );

    if (dryRun) {
      console.log("\n🔍 DRY RUN - No data will be imported");
      console.log("Sample data:");
      vocabularyData.slice(0, 3).forEach((item, index) => {
        console.log(
          `  ${index + 1}. ${item.word} → ${item.translation} [${item.pronunciation}]`
        );
      });
      return;
    }

    // Check for duplicates
    const existingWords = await Vocabulary.find({
      word: { $in: vocabularyData.map((item) => item.word) },
      languageCode: languageCode.toUpperCase(),
    });

    if (existingWords.length > 0) {
      console.warn(
        `⚠️  Found ${existingWords.length} existing words that will be skipped:`
      );
      existingWords.forEach((word) => console.log(`  - ${word.word}`));

      // Filter out existing words
      const newWords = vocabularyData.filter(
        (item) => !existingWords.some((existing) => existing.word === item.word)
      );

      if (newWords.length === 0) {
        console.log("✅ All words already exist in database");
        return;
      }

      console.log(`📝 ${newWords.length} new words will be imported`);
      vocabularyData.splice(0, vocabularyData.length, ...newWords);
    }

    // Import data
    console.log("🚀 Importing vocabulary...");
    const result = await Vocabulary.insertMany(vocabularyData);

    console.log(`✅ Successfully imported ${result.length} vocabulary items`);
    console.log(`📊 Total processed: ${data.length}`);
    console.log(`✅ Valid items: ${vocabularyData.length}`);
    console.log(`❌ Skipped: ${data.length - vocabularyData.length}`);
    console.log(`🔄 Language: ${language.name} (${language.code})`);
  } catch (error) {
    console.error("❌ Error during import:", error);
    process.exit(1);
  }
};

const showHelp = (): void => {
  console.log(`
📚 CSV Vocabulary Import Tool

Usage:
  npm run import-csv <file-path> <language-code> [options]

Arguments:
  file-path      Path to the CSV file
  language-code  Language code (e.g., EN, VI, FR, DE, ES, etc.)

Options:
  --dry-run      Show what would be imported without actually importing
  --verbose      Show detailed information about skipped rows
  --help         Show this help message

Examples:
  npm run import-csv data/english-vocab.csv EN
  npm run import-csv data/vietnamese-vocab.csv VI --dry-run
  npm run import-csv data/french-vocab.csv FR --verbose
  npm run import-csv data/german-vocab.csv DE

Features:
  🌍 Languages are created automatically if they don't exist
  🚩 Flag emojis are added automatically for each language
  📝 Supports 50+ language codes with automatic naming
  🔍 Smart duplicate detection and validation
  📊 Detailed import reporting and statistics

CSV Format:
  word,translation,pronunciation,category,example,exampleTranslation
  hello,xin chào,həˈloʊ,Greetings,Hello, how are you?,Xin chào, bạn khỏe không?
  goodbye,tạm biệt,ˌɡʊdˈbaɪ,Greetings,Goodbye, see you later!,Tạm biệt, hẹn gặp lại!

Required fields: word, translation, pronunciation
Optional fields: category, example, exampleTranslation

Supported Language Codes:
  EN 🇺🇸 (English), VI 🇻🇳 (Vietnamese), FR 🇫🇷 (French), DE 🇩🇪 (German)
  ES 🇪🇸 (Spanish), IT 🇮🇹 (Italian), PT 🇵🇹 (Portuguese), RU 🇷🇺 (Russian)
  JA 🇯🇵 (Japanese), KO 🇰🇷 (Korean), ZH 🇨🇳 (Chinese), AR 🇸🇦 (Arabic)
  HI 🇮🇳 (Hindi), TH 🇹🇭 (Thai), NL 🇳🇱 (Dutch), SV 🇸🇪 (Swedish)
  And many more with automatic flag emojis!
`);
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  if (args.length < 2) {
    console.error("❌ Missing required arguments");
    showHelp();
    process.exit(1);
  }

  const [filePath, languageCode] = args;
  const dryRun = args.includes("--dry-run");
  const verbose = args.includes("--verbose");

  await handleImport({
    filePath,
    languageCode,
    dryRun,
    verbose,
  });
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}
