import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard | Geev',
  description: 'Top contributors and community leaders',
};

export default function LeaderboardPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      <p className="text-muted-foreground mb-8">
        See the top contributors in the Geev community
      </p>
      
      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">
          Leaderboard rankings will be implemented here
        </p>
      </div>
    </div>
  );
}
