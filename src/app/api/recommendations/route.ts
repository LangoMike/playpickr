import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/recommendations
 * Fetches recommendations for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's recommendations from database
    const { data: recommendations, error: recommendationsError } = await supabase
      .from('recommendations')
      .select(`
        *,
        games (
          id,
          rawg_id,
          name,
          slug,
          description,
          released,
          background_image,
          rating,
          rating_top,
          metacritic,
          playtime,
          genres,
          tags,
          platforms
        )
      `)
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(20);

    if (recommendationsError) {
      console.error('Error fetching recommendations:', recommendationsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch recommendations' },
        { status: 500 }
      );
    }

    // If no recommendations exist, return empty array (UI will show cold start)
    if (!recommendations || recommendations.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          recommendations: [],
          isColdStart: true,
          message: 'No recommendations yet. Click "Generate Recommendations" to get started!'
        }
      });
    }

    // Transform recommendations to include game data
    const transformed = recommendations
      .filter(rec => rec.games !== null)
      .map(rec => ({
        id: rec.id,
        gameId: rec.game_id,
        score: rec.score,
        reason: rec.reason,
        game: rec.games
      }));

    return NextResponse.json({
      success: true,
      data: {
        recommendations: transformed,
        count: transformed.length,
        isColdStart: false
      }
    });

  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

