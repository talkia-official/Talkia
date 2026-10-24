// Supabase credentials (publishable key is safe in the browser; security comes from RLS)
const SUPABASE_URL = 'https://kqgteeykuflyawbtddyk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RO0xP9_bKNIc2ARIBqDmYA_nPVI-5y5';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.sb = sb;
const BUCKET = 'audio'; // storage bucket used for audio, images, avatars
