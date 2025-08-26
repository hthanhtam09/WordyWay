# Pronounce - Language Learning Website

A modern language learning website built with Next.js, TypeScript, and MongoDB that allows users to learn vocabulary with pronunciation functionality.

## Features

- 🌍 **Multi-language Support**: Support for 10+ languages including English, Spanish, French, German, and more
- 🔊 **Pronunciation**: Click pronunciation buttons to hear words spoken using Web Speech API
- 📊 **CSV Import**: Import vocabulary data from CSV files
- 🎯 **Filtering & Search**: Filter by category, difficulty level, and search terms
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Mobile-first responsive design
- ♿ **Accessibility**: Full keyboard navigation and screen reader support

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS 4
- **Database**: MongoDB with Mongoose
- **CSV Parsing**: PapaParse
- **Text-to-Speech**: Web Speech API

## Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pronounce
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   MONGODB_URI=mongodb://localhost:27017/pronounce
   ```

   For MongoDB Atlas:

   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pronounce?retryWrites=true&w=majority
   ```

4. **Start MongoDB** (if using local MongoDB)

   ```bash
   # macOS with Homebrew
   brew services start mongodb-community

   # Or start manually
   mongod
   ```

5. **Seed the database**

   ```bash
   npm run seed
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## CSV Import

The application supports importing vocabulary from CSV files both through the web interface and command line.

### Command Line Import

Import vocabulary directly from the terminal:

```bash
# Basic import
npm run import-csv data/english-vocab.csv EN

# Preview import without actually importing
npm run import-csv data/english-vocab.csv EN --dry-run

# Verbose mode for detailed information
npm run import-csv data/vietnamese-vocab.csv VI --verbose

# Show help
npm run import-csv --help
```

### Sample Data

Pre-built CSV files are available in the `data/` directory:

- `data/english-vocab.csv` - English vocabulary with Vietnamese translations
- `data/vietnamese-vocab.csv` - Vietnamese vocabulary with English translations
- `data/french-vocab.csv` - French vocabulary with English translations

### CSV Format

The application supports importing vocabulary from CSV files with the following columns:

| Column          | Required | Description                                              |
| --------------- | -------- | -------------------------------------------------------- |
| `word`          | Yes      | The word in the target language                          |
| `translation`   | Yes      | Translation to English                                   |
| `pronunciation` | Yes      | Phonetic pronunciation guide                             |
| `category`      | No       | Word category (e.g., "Greetings", "Food")                |
| `difficulty`    | No       | Difficulty level: "beginner", "intermediate", "advanced" |
| `example`       | No       | Example sentence using the word                          |

### Sample CSV

```csv
word,translation,pronunciation,category,difficulty,example
hello,xin chào,həˈloʊ,Greetings,beginner,Hello, how are you?
goodbye,tạm biệt,ˌɡʊdˈbaɪ,Greetings,beginner,Goodbye, see you later!
water,nước,ˈwɔtər,Basic Needs,beginner,I need a glass of water
```

### Testing Import Setup

Test your CSV import configuration:

```bash
# Test database connection and setup
npm run test-import

# Demo import functionality
npm run demo-import
```

For detailed documentation, see `data/README.md`.

## API Endpoints

### Languages

- `GET /api/languages` - Get all active languages
- `POST /api/languages` - Create a new language

### Vocabulary

- `GET /api/vocabulary` - Get vocabulary with optional filters
  - Query params: `languageCode`, `category`, `difficulty`, `limit`
- `POST /api/vocabulary` - Create new vocabulary item

### CSV Import

- `POST /api/import-csv` - Import vocabulary from CSV file
  - Form data: `file` (CSV), `languageCode`

## Database Schema

### Language Collection

```typescript
interface ILanguage {
  name: string; // Language name (e.g., "Spanish")
  code: string; // Language code (e.g., "es")
  flag: string; // Flag emoji (e.g., "🇪🇸")
  isActive: boolean; // Whether language is active
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### Vocabulary Collection

```typescript
interface IVocabulary {
  word: string; // Word in target language
  translation: string; // English translation
  pronunciation: string; // Phonetic pronunciation
  languageCode: string; // Reference to language
  category: string; // Word category
  difficulty: "beginner" | "intermediate" | "advanced";
  example: string; // Example sentence
  isActive: boolean; // Whether item is active
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

## Usage

1. **Select Language**: Choose a language from the dropdown in the left sidebar
2. **View Vocabulary**: Browse vocabulary items with filtering and search options
3. **Practice Pronunciation**: Click the pronunciation button (🔊) to hear words spoken
4. **Import Data**: Use the CSV import feature to add new vocabulary
5. **Filter & Search**: Use category/difficulty filters and search to find specific words

## Development

### Project Structure

```
pronounce/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # React components
├── lib/                    # Utility functions
├── models/                 # MongoDB models
├── scripts/                # Database scripts
├── types/                  # TypeScript types
└── public/                 # Static assets
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data
- `npm run import-csv` - Import vocabulary from CSV files
- `npm run test-import` - Test CSV import setup
- `npm run demo-import` - Demo CSV import functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
