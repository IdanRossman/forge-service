// Test the simplified client-side approach
// Client sends friendly item type names and display text

const testSimplifiedClientParsing = async () => {
  console.log('Testing simplified client-side approach...\n');
  
  // Client just sends the display text from the dropdown options
  const requestBody = {
    desiredTier: 3, // PotentialTier.LEGENDARY = 3
    itemType: 'ring', // Client-friendly name (tests mapping)
    cubeType: 'red',
    itemLevel: 200,
    currentTier: 3, // PotentialTier.LEGENDARY = 3
    isDMT: false,
    selectedOption: '21%+ Stat', // Client sends display text as-is
  };

  console.log('Request body (client sends display text):');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n');

  try {
    const response = await fetch('http://localhost:3000/potential/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ Simplified client approach test successful!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testSimplifiedClientParsing();
