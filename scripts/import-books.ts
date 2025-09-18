import { Book } from "@/models/Book";
import { connectMongoDB } from "@/lib/mongoose";
import Papa from "papaparse";
import fs from "fs";

interface BookCSVRow {
  name: string;
  slug: string;
  bookImageUrl: string;
  pdfUrl: string;
  description: string;
  language: string;
}

const importBooksFromCSV = async (csvFilePath: string): Promise<void> => {
  try {
    await connectMongoDB();

    // Read CSV file
    const csvContent = fs.readFileSync(csvFilePath, "utf-8");

    // Parse CSV
    const parseResult = Papa.parse<BookCSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      console.error("CSV parsing errors:", parseResult.errors);
      return;
    }

    const books = parseResult.data;
    console.log(`Found ${books.length} books to import`);

    // Import each book
    for (const bookData of books) {
      try {
        // Check if book already exists
        const existingBook = await Book.findOne({ slug: bookData.slug });

        if (existingBook) {
          console.log(
            `Book with slug "${bookData.slug}" already exists, skipping...`
          );
          continue;
        }

        // Create new book
        const newBook = new Book({
          name: bookData.name,
          slug: bookData.slug,
          bookImageUrl: bookData.bookImageUrl,
          pdfUrl: bookData.pdfUrl,
          description: bookData.description || "",
          language: bookData.language,
        });

        await newBook.save();
        console.log(`✅ Imported book: ${bookData.name}`);
      } catch (error) {
        console.error(`❌ Error importing book "${bookData.name}":`, error);
      }
    }

    console.log("📚 Book import completed!");
  } catch (error) {
    console.error("❌ Error importing books:", error);
  } finally {
    process.exit(0);
  }
};

// Get CSV file path from command line arguments
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error("❌ Please provide CSV file path as argument");
  console.log("Usage: npm run import:books ./data/books.csv");
  process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ CSV file not found: ${csvFilePath}`);
  process.exit(1);
}

importBooksFromCSV(csvFilePath);
