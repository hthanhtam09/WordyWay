#!/usr/bin/env tsx

import { config } from "dotenv";
import path from "path";

// Load environment variables FIRST, before importing other modules
const envPath = path.resolve(process.cwd(), ".env.local");
config({ path: envPath });

// Now import other modules after environment variables are loaded
import connectToDatabase from "../lib/mongodb";
import Vocabulary from "../models/Vocabulary";
import Language from "../models/Language";
import Papa from "papaparse";
import fs from "fs";

interface CSVRow {
  word: string;
  translation: string;
  pronunciation: string;
  category?: string;
  example?: string;
  exampleTranslation?: string;
}

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
  const { filePath, languageCode, dryRun = false, verbose = false } = options;

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
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      console.error("❌ CSV parsing errors:");
      errors.forEach((error) =>
        console.error(`  - Row ${error.row}: ${error.message}`)
      );
      process.exit(1);
    }

    console.log(`📊 Found ${data.length} rows in CSV`);

    // Process data with strict type checking
    const vocabularyData: ProcessedVocabulary[] = (data as CSVRow[]).map((row, index) => {
      // Type-safe data processing
      const word = row.word?.trim();
      const translation = row.translation?.trim();
      const pronunciation = row.pronunciation?.trim();
      const category = row.category?.trim() || "General";
      const example = row.example?.trim() || "";
      const exampleTranslation = row.exampleTranslation?.trim() || "";

      return {
        word,
        translation,
        pronunciation,
        languageCode: languageCode.toUpperCase(),
        category,
        example,
        exampleTranslation,
        isActive: true,
      };
    });

    // Validate data with strict type checking
    const validData: ProcessedVocabulary[] = vocabularyData.filter((item, index) => {
      if (!item.word || !item.translation || !item.pronunciation) {
        if (verbose) {
          console.warn(
            `⚠️  Row ${index + 2}: Missing required fields (word: ${
              item.word
            }, translation: ${item.translation}, pronunciation: ${
              item.pronunciation
            })`
          );
        }
        return false;
      }
      return true;
    });

    const invalidCount = vocabularyData.length - validData.length;
    if (invalidCount > 0) {
      console.warn(
        `⚠️  ${invalidCount} rows skipped due to missing required fields`
      );
    }

    if (validData.length === 0) {
      console.error("❌ No valid vocabulary data found");
      process.exit(1);
    }

    console.log(
      `✅ ${validData.length} valid vocabulary items ready for import`
    );

    if (dryRun) {
      console.log("\n🔍 DRY RUN - No data will be imported");
      console.log("Sample data:");
      validData.slice(0, 3).forEach((item, index) => {
        console.log(
          `  ${index + 1}. ${item.word} → ${item.translation} [${
            item.pronunciation
          }]`
        );
      });
      return;
    }

    // Check for duplicates
    const existingWords = await Vocabulary.find({
      word: { $in: validData.map((item) => item.word) },
      languageCode: languageCode.toUpperCase(),
    });

    if (existingWords.length > 0) {
      console.warn(
        `⚠️  Found ${existingWords.length} existing words that will be skipped:`
      );
      existingWords.forEach((word) => console.log(`  - ${word.word}`));

      // Filter out existing words
      const newWords = validData.filter(
        (item) => !existingWords.some((existing) => existing.word === item.word)
      );

      if (newWords.length === 0) {
        console.log("✅ All words already exist in database");
        return;
      }

      console.log(`📝 ${newWords.length} new words will be imported`);
      validData.splice(0, validData.length, ...newWords);
    }

    // Import data
    console.log("🚀 Importing vocabulary...");
    const result = await Vocabulary.insertMany(validData);

    console.log(`✅ Successfully imported ${result.length} vocabulary items`);
    console.log(`📊 Total processed: ${data.length}`);
    console.log(`✅ Valid items: ${validData.length}`);
    console.log(`❌ Skipped: ${invalidCount}`);
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
