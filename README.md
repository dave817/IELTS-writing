# IELTS Writing Practice App

A comprehensive web application designed to help students prepare for the IELTS Writing test. This app provides various practice drills, AI-powered feedback, and customizable writing templates.

## Features

### Practice Drills
- **Task 1 Practice**: Academic and General Training Task 1 writing practice
- **Task 2 Practice**: Essay writing practice with various topics
- **Full Practice Mode**: Complete timed writing sessions
- **Opening Practice**: Focus on writing strong introductions
- **Body Paragraph Practice**: Develop well-structured body paragraphs
- **Point Generation**: Learn to generate and organize ideas quickly
- **Template Fill-in**: Practice using writing templates effectively
- **Counter-Argument Practice**: Master opposing viewpoints and rebuttals

### Additional Features
- **AI-Powered Feedback**: Get instant feedback on your writing using OpenAI
- **Custom Templates**: Create and save your own writing templates
- **Vocabulary Builder**: Expand your IELTS vocabulary
- **Progress Tracking**: Monitor your practice history and improvements
- **Question Bank**: Access a wide variety of IELTS writing questions

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: SQLite with Prisma ORM
- **AI Integration**: OpenAI API
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/dave817/IELTS-writing.git
cd IELTS-writing
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL="file:./prisma/dev.db"
```

4. Initialize the database:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. Run the development server:

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The app uses three main models:

- **Question**: Stores IELTS writing questions
- **UserTemplate**: Saves custom user templates
- **PracticeLog**: Tracks practice sessions and progress

## Project Structure

```
ielts-writing-app/
├── app/
│   ├── api/              # API routes
│   ├── drills/           # Practice drill pages
│   ├── templates/        # Template management
│   └── vocabulary/       # Vocabulary builder
├── components/
│   └── ui/               # Reusable UI components
├── lib/
│   ├── openai.ts         # OpenAI integration
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.js           # Seed data
└── public/               # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For questions or support, please contact: david@serenio.ai

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [OpenAI](https://openai.com/)
