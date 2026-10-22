// Contrato de armazenamento: quem já usa o Kora não pode perder o histórico numa atualização.
// Se este teste quebrar, alguém mudou uma chave, um caminho ou um id de documento: desfaça, ou escreva uma migração
// que leia o formato antigo e só então atualize o teste.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

test("armazenamento: chaves do navegador não mudam entre versões", () => {
  assert.match(app, /const LS="ficha-iniciante";/, "chave do localStorage (dados de quem usa sem conta)");
  assert.match(app, /const DK="ficha-iniciante-rascunho";/, "chave do rascunho");
});

test("armazenamento: caminho e documentos na conta não mudam entre versões", () => {
  assert.match(app, /collection\("data\/users\/"\+this\.uid\)/, "caminho por pessoa na conta");
  for (const doc of ['"perfil"', '"prefs"', '"rascunho"', '"rascunho_bak"', '"analise"', '"s_"\\+', '"ck_"\\+'])
    assert.match(app, new RegExp(doc), "documento " + doc);
});

test("armazenamento: falha ao carregar a conta não abre um app vazio", () => {
  assert.match(app, /if\(o\.failed\)/, "a inicialização trata a falha da conta");
  assert.doesNotMatch(app, /catch\(e\)\{ this\.mode="local"; \}/, "não pode cair para o modo local em silêncio");
});

test("armazenamento: navegador que não guarda nada não finge que salvou", () => {
  assert.match(app, /localStorage\.setItem\(k,"1"\)/, "a inicialização testa se o navegador guarda dados");
  assert.match(app, /if\(!this\.saveLocal\(\)\) throw/, "no modo local, gravação que falhou vira erro na tela");
  assert.match(app, /function noSaveWarn\(\)/, "aviso para quem está num navegador que apaga tudo");
});
