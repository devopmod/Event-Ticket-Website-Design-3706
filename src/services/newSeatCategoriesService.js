import supabase from '../lib/supabase';

const SEAT_CATEGORIES_TABLE = 'seat_categories_fanaticka_7a3x9d';

// Fetch all seat categories
export const fetchSeatCategories = async () => {
  try {
    const { data, error } = await supabase
      .from(SEAT_CATEGORIES_TABLE)
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching seat categories:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchSeatCategories:', error);
    return [];
  }
};

// Create seat category
export const createSeatCategory = async (categoryData) => {
  try {
    const { data, error } = await supabase
      .from(SEAT_CATEGORIES_TABLE)
      .insert([{
        name: categoryData.name,
        color: categoryData.color
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating seat category:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createSeatCategory:', error);
    throw error;
  }
};

// Update seat category
export const updateSeatCategory = async (id, categoryData) => {
  try {
    const { data, error } = await supabase
      .from(SEAT_CATEGORIES_TABLE)
      .update({
        name: categoryData.name,
        color: categoryData.color
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating seat category:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateSeatCategory:', error);
    throw error;
  }
};

// Delete seat category
export const deleteSeatCategory = async (id) => {
  try {
    const { error } = await supabase
      .from(SEAT_CATEGORIES_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting seat category:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSeatCategory:', error);
    return false;
  }
};

// Get category by name
export const getCategoryByName = async (name) => {
  try {
    const { data, error } = await supabase
      .from(SEAT_CATEGORIES_TABLE)
      .select('*')
      .ilike('name', name)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching category by name:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getCategoryByName:', error);
    return null;
  }
};