import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateRecommendations, getPopularityRecommendations, loadModel } from '@/lib/recommendations';

export async function POST(request: NextRequest) {
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

    // Load model (will cache after first load)
    try {
      await loadModel();
    } catch (error) {
      console.error('Failed to load model:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Recommendation model not available. Please train the model first.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 503 }
      );
    }

    // Get user interactions
    const { data: interactions, error: interactionsError } = await supabase
      .from('user_interactions')
      .select('game_id, action')
      .eq('user_id', user.id);

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user interactions' },
        { status: 500 }
      );
    }

    // Get all games
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .not('genres', 'is', null);

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch games' },
        { status: 500 }
      );
    }

    if (!games || games.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No games available in database' },
        { status: 404 }
      );
    }

    let recommendations: Array<{ gameId: string; score: number; reason: string }> = [];
    let isColdStart = false;

    // Check if user has enough interactions for ML recommendations
    if (!interactions || interactions.length === 0) {
      // Cold start: use popularity-based recommendations
      console.log(`Cold start for user ${user.id}: using popularity-based recommendations`);
      recommendations = await getPopularityRecommendations(games, 20);
      isColdStart = true;
    } else {
      // Generate ML-based recommendations
      try {
        recommendations = await generateRecommendations(
          user.id,
          games,
          interactions
        );

        // Fallback to popularity if ML returns no results
        if (recommendations.length === 0) {
          console.log(`ML returned no results for user ${user.id}, falling back to popularity`);
          recommendations = await getPopularityRecommendations(games, 20);
          isColdStart = true;
        }
      } catch (error) {
        console.error('Error generating ML recommendations:', error);
        // Fallback to popularity-based
        console.log(`Falling back to popularity-based recommendations for user ${user.id}`);
        recommendations = await getPopularityRecommendations(games, 20);
        isColdStart = true;
      }
    }

    // Delete old recommendations for this user
    const { error: deleteError } = await supabase
      .from('recommendations')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting old recommendations:', deleteError);
      // Continue anyway - we'll insert new ones
    }

    // Insert new recommendations
    const recommendationsToInsert = recommendations.map(rec => ({
      user_id: user.id,
      game_id: rec.gameId,
      score: rec.score,
      reason: rec.reason
    }));

    if (recommendationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('recommendations')
        .insert(recommendationsToInsert);

      if (insertError) {
        console.error('Error inserting recommendations:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to save recommendations' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, 20), // Return top 20
        count: recommendations.length,
        isColdStart,
        message: isColdStart
          ? 'Recommendations based on popular games (you have no interactions yet)'
          : 'Personalized recommendations generated successfully'
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

