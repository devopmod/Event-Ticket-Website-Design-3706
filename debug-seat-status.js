// Debug script to test seat status updates directly
import supabase from './src/lib/supabase.js';

const EVENT_SEATS_TABLE = 'event_seats_fanaticka_7a3x9d';

async function debugSeatStatus() {
  console.log('🔍 Starting seat status debug...');
  
  // Test 1: Check current ENUM values
  console.log('\n📋 Step 1: Checking ENUM values...');
  try {
    const { data, error } = await supabase.rpc('get_enum_values', { enum_name: 'seat_status' });
    if (error) {
      console.error('❌ Error getting enum values:', error);
    } else {
      console.log('✅ Available seat_status values:', data);
    }
  } catch (e) {
    console.log('⚠️ Could not fetch enum values, trying alternative method...');
    const { data, error } = await supabase
      .from('information_schema.enum_range')
      .select('*');
    console.log('Enum info:', { data, error });
  }

  // Test 2: Try to update a seat with 'held' status
  console.log('\n🎯 Step 2: Testing seat status update with "held"...');
  try {
    const { data, error } = await supabase
      .from(EVENT_SEATS_TABLE)
      .select('event_id, seat_id, status')
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error getting test seat:', error);
      return;
    }

    console.log('📍 Found test seat:', data);

    // Try to update with 'held'
    const { data: updateData, error: updateError } = await supabase
      .from(EVENT_SEATS_TABLE)
      .update({ status: 'held' })
      .eq('event_id', data.event_id)
      .eq('seat_id', data.seat_id)
      .select('*');

    if (updateError) {
      console.error('❌ Error updating seat to "held":', updateError);
    } else {
      console.log('✅ Successfully updated seat to "held":', updateData);

      // Restore original status
      await supabase
        .from(EVENT_SEATS_TABLE)
        .update({ status: data.status })
        .eq('event_id', data.event_id)
        .eq('seat_id', data.seat_id);
      console.log('🔄 Restored original status');
    }
  } catch (e) {
    console.error('💥 Exception during seat update test:', e);
  }

  // Test 3: Try invalid status (should fail)
  console.log('\n❌ Step 3: Testing invalid status "hold" (should fail)...');
  try {
    const { data, error } = await supabase
      .from(EVENT_SEATS_TABLE)
      .select('event_id, seat_id, status')
      .limit(1)
      .single();

    if (!error && data) {
      const { data: failData, error: failError } = await supabase
        .from(EVENT_SEATS_TABLE)
        .update({ status: 'hold' }) // This should fail
        .eq('event_id', data.event_id)
        .eq('seat_id', data.seat_id)
        .select('*');

      if (failError) {
        console.log('✅ Expected error with "hold" status:', failError.message);
      } else {
        console.log('⚠️ Unexpected: "hold" status was accepted:', failData);
      }
    }
  } catch (e) {
    console.error('💥 Exception during invalid status test:', e);
  }

  console.log('\n✅ Debug complete!');
}

// Run the debug
debugSeatStatus().catch(console.error);