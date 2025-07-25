import supabase from '../lib/supabase';

// Migration service to clean up old venue data structure
const VENUES_TABLE = 'venues_fanaticka_7a3x9d';
const EVENTS_TABLE = 'events_fanaticka_7a3x9d';

export const migrateVenueData = async () => {
  console.log('Starting venue data migration...');
  
  try {
    // Get all venues
    const { data: venues, error: venuesError } = await supabase
      .from(VENUES_TABLE)
      .select('*');
      
    if (venuesError) throw venuesError;
    
    for (const venue of venues) {
      if (!venue.canvas_data) continue;
      
      let canvasData;
      try {
        canvasData = typeof venue.canvas_data === 'string' 
          ? JSON.parse(venue.canvas_data) 
          : venue.canvas_data;
      } catch (e) {
        console.error(`Failed to parse canvas_data for venue ${venue.id}:`, e);
        continue;
      }
      
      let needsUpdate = false;
      
      // Migrate elements - remove price and status
      if (canvasData.elements) {
        const migratedElements = canvasData.elements.map(element => {
          const { price, status, ...cleanElement } = element;
          
          // Add default category if missing and not a stage
          if (!cleanElement.categoryId && element.type !== 'stage') {
            needsUpdate = true;
            if (element.type === 'seat') {
              cleanElement.categoryId = 'GENERAL';
            } else if (element.type === 'section') {
              cleanElement.categoryId = 'SECTION';
            } else if (element.type === 'polygon') {
              cleanElement.categoryId = 'AREA';
            }
          }
          
          if (price !== undefined || status !== undefined) {
            needsUpdate = true;
          }
          
          return cleanElement;
        });
        
        canvasData.elements = migratedElements;
      }
      
      // Add default categories if missing
      if (!canvasData.categories) {
        needsUpdate = true;
        canvasData.categories = {
          'GENERAL': { name: 'General Admission', color: '#3B82F6' },
          'VIP': { name: 'VIP', color: '#8B5CF6' },
          'PREMIUM': { name: 'Premium', color: '#F59E0B' },
          'SECTION': { name: 'Section', color: '#10B981' },
          'AREA': { name: 'Area', color: '#F59E0B' }
        };
      }
      
      if (needsUpdate) {
        console.log(`Migrating venue ${venue.id}...`);
        
        const { error: updateError } = await supabase
          .from(VENUES_TABLE)
          .update({
            canvas_data: canvasData,
            updated_at: new Date().toISOString()
          })
          .eq('id', venue.id);
          
        if (updateError) {
          console.error(`Failed to update venue ${venue.id}:`, updateError);
        } else {
          console.log(`Successfully migrated venue ${venue.id}`);
        }
      }
    }
    
    console.log('Venue data migration completed');
    return true;
    
  } catch (error) {
    console.error('Venue data migration failed:', error);
    return false;
  }
};

export const migrateEventPriceBooks = async () => {
  console.log('Starting event price book migration...');
  
  try {
    // Get all events that don't have priceBook yet
    const { data: events, error: eventsError } = await supabase
      .from(EVENTS_TABLE)
      .select('*')
      .is('price_book', null);
      
    if (eventsError) throw eventsError;
    
    for (const event of events) {
      // Create default price book
      const defaultPriceBook = {
        'GENERAL': 45,
        'VIP': 85,
        'PREMIUM': 120,
        'SECTION': 60,
        'AREA': 50
      };
      
      console.log(`Creating price book for event ${event.id}...`);
      
      const { error: updateError } = await supabase
        .from(EVENTS_TABLE)
        .update({
          price_book: defaultPriceBook,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);
        
      if (updateError) {
        console.error(`Failed to update event ${event.id}:`, updateError);
      } else {
        console.log(`Successfully created price book for event ${event.id}`);
      }
    }
    
    console.log('Event price book migration completed');
    return true;
    
  } catch (error) {
    console.error('Event price book migration failed:', error);
    return false;
  }
};

// Run full migration
export const runFullMigration = async () => {
  console.log('Starting full data migration...');
  
  const venueSuccess = await migrateVenueData();
  const eventSuccess = await migrateEventPriceBooks();
  
  if (venueSuccess && eventSuccess) {
    console.log('Full migration completed successfully!');
    return true;
  } else {
    console.error('Migration completed with errors');
    return false;
  }
};