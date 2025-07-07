# Vote Tallying System MVP

A real-time vote tallying system built with Next.js, React, Tailwind CSS, and Supabase. This system allows manual vote entry and displays election results in a format similar to official election dashboards.

## Features

- 📊 Real-time vote display for Senators and Party-List candidates
- ⚡ Live updates using Supabase real-time subscriptions
- 🔐 Admin panel for manual vote entry
- 📱 Responsive design that works on desktop and mobile
- 🎨 Modern UI with Tailwind CSS
- 🔄 Automatic vote percentage calculations
- 📈 Progress bars for visual vote representation

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Icons**: Lucide React

## Setup Instructions

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to the SQL Editor
3. Run the SQL commands from `database-schema.sql` to create the database schema
4. Copy your project URL and anon key from Settings > API
5. Add them to your `.env.local` file

### 3. Run the Application

```bash
# Install dependencies (if not already done)
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Viewing Results
- The main page displays real-time election results for both Senators and Party-List candidates
- Results are automatically sorted by vote count (highest first)
- Vote percentages and progress bars update automatically

### Admin Panel
- Click the red settings button (⚙️) in the bottom-right corner to open the admin panel
- Enter vote counts manually for each candidate
- Click "Save Changes" to update the database
- Results will update in real-time across all connected clients

### Features

1. **Real-time Updates**: Uses Supabase real-time subscriptions for instant updates
2. **Manual Vote Entry**: Admin interface for updating vote counts
3. **Responsive Design**: Works on desktop, tablet, and mobile devices
4. **Vote Calculations**: Automatic percentage calculations and ranking
5. **Modern UI**: Clean, professional design matching election result dashboards

## Database Schema

The system uses a single `candidates` table with the following structure:

```sql
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  party VARCHAR(255),
  position VARCHAR(100) NOT NULL CHECK (position IN ('senator', 'party-list')),
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Sample Data

The system comes pre-loaded with sample data based on Philippine election results format:

**Senators:**
- GO, BONG GO (PDPLBN)
- AQUINO, BAM (KNP)
- DELA ROSA, BATO (PDPLBN)
- TULFO, ERWIN (LAKAS)
- PANGILINAN, KIKO (LP)

**Party-List:**
- AKBAYAN
- DUTERTE YOUTH
- TINGOG
- 4PS
- ACT-CIS

## Customization

### Adding New Candidates

You can add new candidates through the Supabase dashboard or by running SQL commands:

```sql
INSERT INTO candidates (name, party, position, votes) VALUES
('CANDIDATE NAME', 'PARTY', 'senator', 0);
```

### Styling

The application uses Tailwind CSS for styling. You can customize the appearance by modifying the component classes in:
- `src/components/VoteCard.tsx`
- `src/components/VoteSection.tsx`
- `src/components/AdminPanel.tsx`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js applications:
- Netlify
- Railway
- AWS Amplify
- Google Cloud Platform

## Security Considerations

For production use, consider implementing:

1. **Authentication**: Add user authentication for admin access
2. **Row Level Security**: Configure Supabase RLS policies
3. **Rate Limiting**: Implement rate limiting for vote updates
4. **Input Validation**: Add server-side validation for vote counts
5. **Audit Logging**: Track all vote changes for transparency

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For questions or issues, please open an issue in the GitHub repository.
