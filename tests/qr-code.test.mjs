import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as QRCodeModule from 'qrcode-generator';

test('gera uma matriz QR local para endereço e código de convite', () => {
  const qrcode = QRCodeModule.qrcode;
  assert.equal(typeof qrcode, 'function');
  for (const payload of [
    'http://192.168.1.20:4174/ameaca-biologica-webapp/?servidor=local',
    'http://192.168.1.20:4174/ameaca-biologica-webapp/?servidor=local&convite=ABCD1234',
  ]) {
    const codigo = qrcode(0, 'M');
    codigo.addData(payload, 'Byte');
    codigo.make();
    assert.ok(codigo.getModuleCount() >= 21);
    assert.equal(typeof codigo.isDark(0, 0), 'boolean');
  }
});
