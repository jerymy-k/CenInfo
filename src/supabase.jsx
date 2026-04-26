import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oqfqbwkadtvkrbzqyvjy.supabase.co";
const SUPABASE_KEY = "sb_publishable_EwsqKXajunv_jXnB9D8ang_AuNN_YuZ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);