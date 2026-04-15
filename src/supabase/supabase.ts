import { getSupabaseClient } from './supabaseClient';
import { Profile } from 'src/profiles/profiles.types';
import { uuidv7 } from 'uuidv7';

class Supabase {
  private tableName: string = 'profiles';

  async createProfile(profile: Omit<Profile, 'id'>): Promise<Profile> {
    const response = await getSupabaseClient()
      .from(this.tableName)
      .insert({
        ...profile,
        id: uuidv7(),
      })
      .select()
      .single();

    if (response.error) throw response.error;
    if (!response.data) throw new Error('No data returned from insert');
    return response.data as Profile;
  }

  async getProfileByName(name: string): Promise<Profile | null> {
    const response = await getSupabaseClient()
      .from(this.tableName)
      .select('*')
      .eq('name', name)
      .single();

    if (response.error && response.error.code !== 'PGRST116')
      throw response.error;
    return response.data as Profile | null;
  }

  async getProfileById(id: string): Promise<Profile | null> {
    const response = await getSupabaseClient()
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (response.error && response.error.code !== 'PGRST116')
      throw response.error;
    return response.data as Profile | null;
  }

  async getAllProfiles(filters?: {
    gender?: string;
    country_id?: string;
    age_group?: string;
  }): Promise<Profile[]> {
    let query = getSupabaseClient().from(this.tableName).select('*');

    if (filters?.gender) {
      query = query.ilike('gender', filters.gender);
    }
    if (filters?.country_id) {
      query = query.ilike('country_id', filters.country_id);
    }
    if (filters?.age_group) {
      query = query.ilike('age_group', filters.age_group);
    }

    const response = await query;

    if (response.error) throw response.error;
    if (!response.data) throw new Error('No data returned from select');
    return response.data as Profile[];
  }

  async deleteProfile(id: string): Promise<boolean> {
    const response = await getSupabaseClient()
      .from(this.tableName)
      .delete({ count: 'exact' })
      .eq('id', id);

    if (response.error) throw response.error;
    return (response.count ?? 0) > 0;
  }
}

export default Supabase;
