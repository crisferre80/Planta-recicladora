/**
 * Script de utilidad para generar contraseñas hasheadas con bcrypt
 * Útil para regenerar las contraseñas del seed o crear nuevos usuarios
 * 
 * Uso:
 * node supabase/utils/hash-passwords.js
 */

const bcrypt = require('bcryptjs');

const passwords = [
  { label: 'admin123', password: 'admin123' },
  { label: 'super123', password: 'super123' },
  { label: 'oper123', password: 'oper123' },
  { label: 'conta123', password: 'conta123' },
];

async function hashPasswords() {
  console.log('🔐 Generando hashes de contraseñas con bcrypt...\n');
  
  for (const { label, password } of passwords) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${label}:`);
    console.log(`  Password: ${password}`);
    console.log(`  Hash:     ${hash}\n`);
  }
  
  console.log('✅ Hashes generados. Copia estos valores al archivo de seed.');
}

hashPasswords().catch(console.error);
