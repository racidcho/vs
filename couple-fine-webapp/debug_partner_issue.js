// Debug script to test partner information fetching
// Run this in the browser console on the app page

console.log("🔍 Debugging partner information issue...");

// Test the Supabase query directly
const { supabase } = window;

if (!supabase) {
  console.error("❌ Supabase not available");
}

async function testPartnerQuery() {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log("👤 Current user:", user?.id);
    
    if (!user) {
      console.error("❌ No authenticated user");
      return;
    }

    // Get user profile to find couple_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    console.log("👤 User profile:", profile, profileError);
    
    if (!profile?.couple_id) {
      console.error("❌ User has no couple_id");
      return;
    }

    // Test the couple query with relationships
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select(`
        *,
        partner_1:profiles!couples_partner_1_id_fkey(*),
        partner_2:profiles!couples_partner_2_id_fkey(*)
      `)
      .eq('id', profile.couple_id)
      .single();

    console.log("💑 Couple data:", coupleData, coupleError);
    
    if (coupleData) {
      console.log("📊 Partner analysis:", {
        current_user_id: user.id,
        partner_1_id: coupleData.partner_1_id,
        partner_2_id: coupleData.partner_2_id,
        partner_1_data: coupleData.partner_1,
        partner_2_data: coupleData.partner_2,
        user_is_partner_1: coupleData.partner_1_id === user.id,
        user_is_partner_2: coupleData.partner_2_id === user.id
      });
      
      // Determine partner
      const partner = coupleData.partner_1_id === user.id 
        ? coupleData.partner_2 
        : coupleData.partner_1;
        
      console.log("👫 Determined partner:", partner);
    }

  } catch (error) {
    console.error("💥 Test failed:", error);
  }
}

// Run the test
testPartnerQuery();