import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'eikonBase';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis SUPABASE_URL e SUPABASE_ANON_KEY devem estar definidas no ambiente.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const buildStoragePath = (tipo) => {
  if (tipo === 'usuario') return 'usuarios';
  if (tipo === 'personagem') return 'personagens';
  return 'outros';
};

export const buildStorageFileName = (originalName, tipo) => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const extension = (originalName?.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const baseName = (originalName?.replace(/\.[^.]+$/, '') || 'arquivo')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'arquivo';
  const safeName = `${baseName}-${timestamp}-${randomSuffix}`;
  return `${buildStoragePath(tipo)}/${safeName}.${extension || 'bin'}`;
};

export const removeMidia = async (pathToRemove) => {
  if (!pathToRemove) return null;

  const { error } = await supabase.storage.from(supabaseBucket).remove([pathToRemove]);
  if (error) {
    console.warn('[SupabaseStorage] Falha ao remover mídia antiga:', error.message);
  }

  return null;
};

export const uploadMidia = async (file, tipo = 'usuario') => {
  if (!file) {
    throw new Error('Arquivo inválido.');
  }

  const path = buildStorageFileName(file.name, tipo);
  const { data, error } = await supabase.storage.from(supabaseBucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  });

  if (error) {
    throw new Error(`Falha no upload para o Supabase Storage: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(supabaseBucket).getPublicUrl(path);
  return {
    path,
    publicUrl: publicUrlData.publicUrl,
  };
};
