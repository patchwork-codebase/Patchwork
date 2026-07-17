import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL="?(.*?)"?$/m);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY="?(.*?)"?$/m);

const supabase = createClient(urlMatch[1], keyMatch[1]);

function toCamelCase(key: string) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function normalizeRow(row: any): any {
  if (!row || typeof row !== 'object') return row;
  return Object.entries(row).reduce((result: any, [key, value]) => {
    const camelKey = toCamelCase(key);
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item => (typeof item === 'object' && item !== null ? normalizeRow(item) : item));
    } else if (value && typeof value === 'object') {
      result[camelKey] = normalizeRow(value);
    } else {
      result[camelKey] = value;
    }
    return result;
  }, {});
}

async function test() {
  console.log("Testing exact useFeedUpdates logic...");
  
  const from = 0;
  const to = 9;
  
  try {
      const { data, error } = await supabase
        .from('updates')
        .select('*, rooms(title, tags), users!author_id(is_verified_expert, organization_name, organization_logo_url, avatar)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      console.log("standardUpdates count:", data?.length);

      const standardUpdates = (data || []).map(row => {
        const normalized = normalizeRow(row);
        normalized.authorIsVerifiedExpert = !!(row.users?.is_verified_expert);
        return normalized;
      });

      const { data: repliesRaw, error: repliesError } = await supabase
        .from('reactions')
        .select('*')
        .eq('type', 'reply')
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (repliesError) throw repliesError;
      
      console.log("repliesRaw count:", repliesRaw?.length);

      const observerIdsToFetch = new Set<string>();
      (repliesRaw || []).forEach((r: any) => { if (r.observer_id) observerIdsToFetch.add(r.observer_id); });

      const replies = (repliesRaw || []).map(row => normalizeRow(row));

      const parentUpdateIds = [...new Set(replies.map((r: any) => r.updateId).filter(Boolean))];
      console.log("parentUpdateIds:", parentUpdateIds);

      if (parentUpdateIds.length > 0) {
        const { data: parentRows, error: parentError } = await supabase
          .from('updates')
          .select('*, rooms(title, tags)')
          .in('id', parentUpdateIds as string[]);
          
        if (parentError) throw parentError;
        console.log("parentRows count:", parentRows?.length);
      }

      const updateIds = standardUpdates.map((u: any) => u.id);
      if (updateIds.length > 0) {
        const { data: rData, error: rError } = await supabase
          .from('reactions')
          .select('*')
          .in('update_id', updateIds);
          
        if (rError) throw rError;
        console.log("rData count:", rData?.length);
      }

      if (observerIdsToFetch.size > 0) {
        const { data: observerUsers, error: obsError } = await supabase
          .from('users')
          .select('id, avatar')
          .in('id', Array.from(observerIdsToFetch));
          
        if (obsError) throw obsError;
        console.log("observerUsers count:", observerUsers?.length);
      }
      
      console.log("ALL QUERIES SUCCESSFUL!");
      
  } catch(e) {
      console.error("CAUGHT ERROR:", e);
  }
}
test();
