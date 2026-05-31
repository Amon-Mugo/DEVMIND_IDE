import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const loadProjects = async (userId) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createProject = async (userId, name, code, tabs) => {
  const { data, error } = await supabase
    .from("projects")
    .insert([{
      user_id: userId,
      name,
      code,
      tabs,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const saveProject = async (id, name, code, tabs, messages = []) => {
  const { data, error } = await supabase
    .from("projects")
    .update({
      name,
      code,
      tabs,
      messages,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteProject = async (id) => {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);
  if (error) throw error;
};