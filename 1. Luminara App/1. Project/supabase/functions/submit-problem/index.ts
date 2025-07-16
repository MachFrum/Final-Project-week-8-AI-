import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Default user ID that matches the one in constants/user.ts
const DEFAULT_USER_ID = '12345678-1234-5678-1234-567812345678';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProblemSubmissionRequest {
  input_type: 'text' | 'image' | 'voice';
  title: string;
  description?: string;
  text_content?: string;
  image_data?: string;
  voice_url?: string;
  user_id?: string;
}

// Generate a valid UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Submit Problem Function Started ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Validate environment variables
    if (!Deno.env.get('SUPABASE_URL')) {
      throw new Error('SUPABASE_URL environment variable is missing');
    }
    
    if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing');
    }
    const requestBody: ProblemSubmissionRequest = await req.json()
    console.log('Received request body:', requestBody)

    // Validate required fields
    if (!requestBody.input_type || !requestBody.title) {
      throw new Error('Missing required fields: input_type and title are required')
    }

    // Validate content based on input type
    if (requestBody.input_type === 'text' && !requestBody.text_content) {
      throw new Error('text_content is required for text input type')
    }
    if (requestBody.input_type === 'image' && !requestBody.image_data) {
      throw new Error('image_data is required for image input type')
    }
    if (requestBody.input_type === 'voice' && !requestBody.voice_url) {
      throw new Error('voice_url is required for voice input type')
    }

    // Handle user_id - use provided or generate default
    let userId = requestBody.user_id;
    if (!userId) {
      userId = DEFAULT_USER_ID; // Use consistent default user ID
      console.log('No user_id provided, using default:', userId);
    } else if (!isValidUUID(userId)) {
      console.log('Invalid UUID format provided:', userId, 'generating new one');
      userId = generateUUID();
    }

    console.log('Using user_id:', userId);

    // Check if user exists in the database, if not create a default user
    const { data: existingUser, error: userCheckError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist, create a default user record
      console.log('User does not exist, creating default user:', userId);
      
      const { error: createUserError } = await supabaseClient
        .from('users')
        .insert({
          id: userId,
          email: userId === DEFAULT_USER_ID ? 'guest@example.com' : `user-${userId}@example.com`,
          first_name: 'Guest',
          last_name: 'User',
          is_guest: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createUserError) {
        console.error('Failed to create default user:', createUserError);
        // Continue anyway - the problem might still be processable
      } else {
        console.log('Successfully created default user');
      }
    } else if (userCheckError) {
      console.error('Error checking user existence:', userCheckError);
      // Continue anyway - the problem might still be processable
    } else {
      console.log('User exists in database');
    }

    // Create problem submission record
    const problemId = generateUUID();
    console.log('Generated problem ID:', problemId);

    const { data: problemData, error: insertError } = await supabaseClient
      .from('problem_submissions')
      .insert({
        id: problemId,
        user_id: userId,
        title: requestBody.title,
        input_type: requestBody.input_type,
        text_content: requestBody.text_content || null,
        image_url: requestBody.image_data || null,
        voice_url: requestBody.voice_url || null,
        status: 'processing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error(`Failed to create problem submission: ${insertError.message}`)
    }

    console.log('Created problem submission:', problemData)

    // Get Google API key
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY not found in environment variables')
      
      // Update status to error
      await supabaseClient
        .from('problem_submissions')
        .update({
          status: 'error',
          error_message: 'Google API key not configured',
          ai_response: { error: 'Google API key not configured' },
          updated_at: new Date().toISOString(),
        })
        .eq('id', problemId)

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Google API key not configured',
          problemId: problemId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Prepare prompt for Gemini
    let prompt = `You are an AI tutor helping students learn. Please analyze this problem and provide a detailed solution with step-by-step explanation.

Problem Title: ${requestBody.title}
`

    if (requestBody.description) {
      prompt += `Description: ${requestBody.description}\n`
    }

    if (requestBody.text_content) {
      prompt += `Problem Content: ${requestBody.text_content}\n`
    }

    prompt += `
Please provide:
1. A clear, step-by-step solution
2. Educational explanation of concepts involved
3. The subject area (e.g., Mathematics, Science, History, etc.)
4. Difficulty level (easy, medium, or hard)
5. 3-5 relevant tags for categorization

Format your response as a structured explanation that helps the student understand both the solution and the underlying concepts.`

    console.log('Calling Gemini API...')

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      
      // Update status to error
      await supabaseClient
        .from('problem_submissions')
        .update({
          status: 'error',
          error_message: `Gemini API error: ${geminiResponse.status}`,
          ai_response: { error: errorText },
          updated_at: new Date().toISOString(),
        })
        .eq('id', problemId)

      return new Response(
        JSON.stringify({
          success: false,
          error: `Gemini API error: ${geminiResponse.status}`,
          problemId: problemId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const geminiData = await geminiResponse.json()
    console.log('Gemini API response received')

    // Extract the generated solution
    const solution = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No solution generated'

    // Parse the solution to extract structured data (basic implementation)
    const lines = solution.split('\n')
    let subject = 'General'
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    const tags: string[] = []

    // Simple parsing logic
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      if (lowerLine.includes('subject') || lowerLine.includes('area')) {
        if (lowerLine.includes('math')) subject = 'Mathematics'
        else if (lowerLine.includes('science') || lowerLine.includes('physics') || lowerLine.includes('chemistry') || lowerLine.includes('biology')) subject = 'Science'
        else if (lowerLine.includes('history')) subject = 'History'
        else if (lowerLine.includes('english') || lowerLine.includes('literature')) subject = 'English'
      }
      
      if (lowerLine.includes('difficulty')) {
        if (lowerLine.includes('easy')) difficulty = 'easy'
        else if (lowerLine.includes('hard')) difficulty = 'hard'
        else difficulty = 'medium'
      }
      
      if (lowerLine.includes('tags') || lowerLine.includes('tag')) {
        const tagMatches = line.match(/\b\w+\b/g)
        if (tagMatches) {
          tags.push(...tagMatches.slice(-3))
        }
      }
    }

    // Ensure we have some tags
    if (tags.length === 0) {
      tags.push('general', 'learning')
    }

    // Update the problem submission with the solution
    const { error: updateError } = await supabaseClient
      .from('problem_submissions')
      .update({
        solution: solution,
        topic: subject,
        difficulty: difficulty,
        tags: tags,
        status: 'completed',
        ai_response: {
          full_response: geminiData,
          suggested_tags: tags,
          parsed_subject: subject,
          parsed_difficulty: difficulty
        },
        processing_time_ms: Date.now() - new Date(problemData.created_at).getTime(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', problemId)

    if (updateError) {
      console.error('Error updating problem submission:', updateError)
      throw new Error(`Failed to update problem submission: ${updateError.message}`)
    }

    console.log('Successfully processed problem submission')

    return new Response(
      JSON.stringify({
        success: true,
        problemId: problemId,
        status: 'completed',
        solution: solution,
        subject: subject,
        difficulty: difficulty,
        tags: tags
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in submit-problem function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})