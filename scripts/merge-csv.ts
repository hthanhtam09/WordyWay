#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import Papa from "papaparse";

interface CSVRow {
  word: string;
  translation: string;
  pronunciation: string;
  category?: string;
  example?: string;
  exampleTranslation?: string;
}

const mergeCSVFiles = async (): Promise<void> => {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const outputFile = path.join(dataDir, "french-combined.csv");

    // Get all CSV files except the combined one
    const files = fs
      .readdirSync(dataDir)
      .filter((file) => file.endsWith(".csv") && file !== "french-combined.csv")
      .sort();

    console.log(`📁 Found ${files.length} CSV files to merge:`);
    files.forEach((file) => console.log(`  - ${file}`));

    let allData: CSVRow[] = [];
    let totalRows = 0;
    const errors: string[] = [];

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      console.log(`\n📖 Processing: ${file}`);

      try {
        const csvContent = fs.readFileSync(filePath, "utf-8");
        const { data, errors: parseErrors } = Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
        });

        if (parseErrors.length > 0) {
          console.log(`⚠️  Parsing errors in ${file}:`);
          parseErrors.forEach((error) => {
            const errorMsg = `Row ${error.row}: ${error.message}`;
            console.log(`    ${errorMsg}`);
            errors.push(`${file} - ${errorMsg}`);
          });
        }

        const validData = (data as CSVRow[]).filter(
          (row) => row.word && row.translation && row.pronunciation
        );

        allData = allData.concat(validData);
        totalRows += validData.length;

        console.log(`✅ Added ${validData.length} valid rows from ${file}`);
      } catch (error) {
        const errorMsg = `Error reading ${file}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Keep all data including duplicates
    const finalData = allData;

    // Sort by category and word
    finalData.sort((a, b) => {
      const categoryCompare = (a.category || "").localeCompare(
        b.category || ""
      );
      if (categoryCompare !== 0) return categoryCompare;
      return a.word.localeCompare(b.word);
    });

    // Convert back to CSV with proper quoting
    const csvOutput = Papa.unparse(finalData, {
      quotes: true, // Quote all fields
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ",",
    });

    // Write the combined file
    fs.writeFileSync(outputFile, csvOutput, "utf-8");

    console.log(`\n✅ Successfully merged ${files.length} CSV files`);
    console.log(`📊 Total rows: ${totalRows}`);
    console.log(`📊 Final rows: ${finalData.length}`);
    console.log(`📁 Output file: ${outputFile}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  ${errors.length} errors encountered:`);
      errors.forEach((error) => console.log(`  - ${error}`));
    }

    // Show sample of merged data
    console.log(`\n📋 Sample of merged data:`);
    finalData.slice(0, 5).forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${item.word} → ${item.translation} [${item.category}]`
      );
    });
  } catch (error) {
    console.error("❌ Error merging CSV files:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  mergeCSVFiles().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

export default mergeCSVFiles;
