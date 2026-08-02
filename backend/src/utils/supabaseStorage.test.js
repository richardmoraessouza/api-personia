import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoragePath, buildStorageFileName } from './supabaseStorage.js';

test('buildStoragePath retorna a pasta correta para usuário', () => {
  assert.equal(buildStoragePath('usuario'), 'usuarios');
});

test('buildStoragePath retorna a pasta correta para personagem', () => {
  assert.equal(buildStoragePath('personagem'), 'personagens');
});

test('buildStorageFileName preserva a extensão e adiciona identificador único', () => {
  const fileName = buildStorageFileName('avatar.png', 'usuario');
  assert.match(fileName, /^usuarios\//);
  assert.match(fileName, /\.png$/);
});
