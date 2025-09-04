// Simple test to load cube rates data
console.log('Testing cube rates loading...');

try {
  // Try to load as a regular file and access the global
  require('./cubeRates.js.broken');
  
  // If cubeRates was declared as a global const, it should be accessible
  if (typeof cubeRates !== 'undefined') {
    console.log('✅ cubeRates loaded as global constant');
    console.log('Keys:', Object.keys(cubeRates));
    console.log('Has lvl120to200:', !!cubeRates.lvl120to200);
    
    // Export it for our use
    module.exports = { cubeRates };
  } else {
    console.log('❌ cubeRates not found as global');
  }
} catch (error) {
  console.log('❌ Error loading cubeRates:', error.message);
}
