const argon2 = require('argon2');

async function generateHash() {
  try {
    const password = 'Password123';
    const hash = await argon2.hash(password);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Test verification
    const isValid = await argon2.verify(hash, password);
    console.log('Verification test:', isValid);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();