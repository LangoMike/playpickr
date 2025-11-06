# PlayPickr

A modern game discovery and recommendation platform built with Next.js, Supabase, and TensorFlow.js. Discover games, build your library, and get personalized recommendations powered by machine learning.

## Live Demo

https://playpickr.vercel.app/

## Features

- **Game Discovery**: Browse and search games from RAWG API
- **User Library**: Save and organize games you've played, liked, or favorited
- **ML-Powered Recommendations**: Get personalized game recommendations using a hybrid recommendation system
  - Collaborative filtering (user behavior patterns)
  - Content-based filtering (game features: genres, tags, platforms, ratings)
- **Authentication**: Secure user authentication with Supabase Auth
- **Interactive UI**: Modern, responsive interface built with Next.js and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript
- **Database & Auth**: Supabase
- **ML Framework**: TensorFlow.js (Node.js backend)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Game Data**: RAWG API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account and project
- RAWG API key (optional, for game data)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd playpickr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the `playpickr` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RAWG_API_KEY=your_rawg_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Recommendation System

### Overview

PlayPickr uses a hybrid recommendation system that combines:
- **Collaborative Filtering**: Learns from user behavior patterns to find similar users
- **Content-Based Filtering**: Uses game features (genres, tags, platforms, ratings) to recommend similar games

### Training the Model

Before you can generate recommendations, you need to train the recommendation model:

1. **Ensure you have data**:
   - At least 50+ games in your database
   - At least 10+ user interactions (for single-user scenarios)
   - At least 100+ interactions across multiple users (recommended for best results)

2. **Train the model**:
```bash
npm run train:recommendations
```

3. **Monitor training progress**:
   - The script will output training metrics (loss, accuracy) for each epoch
   - Training typically takes a few minutes depending on data size
   - Model files are saved to `models/recommendation-model/`

### Using Recommendations

Once the model is trained:

1. **Generate recommendations**:
   - Navigate to the Recommendations page in the app
   - Click "Generate Recommendations"
   - The system will create personalized recommendations based on your interactions

2. **For new users** (cold start):
   - Users with no interactions will receive popularity-based recommendations
   - As users interact with games, recommendations become more personalized

### Documentation

For detailed information about the recommendation system, see:
- **[TRAINING_GUIDE.md](./TRAINING_GUIDE.md)**: Comprehensive guide covering architecture, training, validation, deployment, and troubleshooting


## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run train:recommendations` - Train the recommendation model

## API Endpoints

### Recommendations

- `GET /api/recommendations` - Get user's recommendations
- `POST /api/recommendations/generate` - Generate new recommendations

### Games

- `GET /api/games/trending` - Get trending games
- `GET /api/games/[slug]` - Get game details by slug

### Interactions

- `POST /api/interactions` - Create or update user interaction (like, favorite, played)

## Database Schema

The application uses Supabase with the following main tables:

- `games` - Game data from RAWG API
- `user_interactions` - User interactions (like, favorite, played)
- `recommendations` - Generated recommendations with scores and reasons

## Development

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit using clear messages
5. Push and create pull request

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture with React


## Troubleshooting

### Recommendation System Issues

See **[TRAINING_GUIDE.md](./TRAINING_GUIDE.md)** for comprehensive troubleshooting guide covering:
- Insufficient data errors
- Low model accuracy
- Missing model files
- Cold start scenarios
- Performance optimization


## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Supabase Documentation](https://supabase.com/docs) - Supabase guides and API reference
- [TensorFlow.js Documentation](https://www.tensorflow.org/js) - ML models in JavaScript
- [RAWG API Documentation](https://rawg.io/apidocs) - Game data API

## Support

For issues, questions, or contributions, please open an issue on GitHub.
