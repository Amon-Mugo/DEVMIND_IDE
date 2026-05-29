import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Load all projects for the logged in user
export const loadProjects = async (userId) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Load a single project by id
export const loadProject = async (projectId) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) throw error;
  return data;
};

// Create a new project
export const createProject = async (userId, name, code, tabs) => {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name,
      code,
      tabs,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Save (update) an existing project
export const saveProject = async (projectId, name, code, tabs) => {
  const { data, error } = await supabase
    .from("projects")
    .update({
      name,
      code,
      tabs,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a project
export const deleteProject = async (projectId) => {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw error;
};