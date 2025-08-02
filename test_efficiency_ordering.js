const axios = require('axios');

async function testEfficiencyOrdering() {
  try {
    const response = await axios.post('http://localhost:3000/Starforce/optimize', {
      items: [
        {
          itemName: "Arcane Umbra Memorial Staff",
          itemLevel: 200,
          fromStar: 17,
          toStar: 19,
          spareCount: 10
        },
        {
          itemName: "Arcane Umbra Mage Gloves",
          itemLevel: 200,
          fromStar: 17,
          toStar: 19,
          spareCount: 10
        },
        {
          itemName: "Arcane Umbra Mage Shoes",
          itemLevel: 200,
          fromStar: 17,
          toStar: 19,
          spareCount: 10
        },
        {
          itemName: "Arcane Umbra Mage Cape",
          itemLevel: 200,
          fromStar: 17,
          toStar: 19,
          spareCount: 10
        },
        {
          itemName: "Arcane Umbra Mage Shoulder",
          itemLevel: 200,
          fromStar: 17,
          toStar: 19,
          spareCount: 10
        },
        {
          itemName: "Superior Engraved Gollux Belt",
          itemLevel: 150,
          fromStar: 20,
          toStar: 21,
          spareCount: 10
        },
        {
          itemName: "Twilight Mark",
          itemLevel: 140,
          fromStar: 0,
          toStar: 17,
          spareCount: 5
        },
        {
          itemName: "Black Bean Mark",
          itemLevel: 140,
          fromStar: 17,
          toStar: 20,
          spareCount: 10
        }
      ],
      availableMeso: 50000000000, // 50B meso
      isInteractive: false,
      riskTolerance: "balanced"
    });

    console.log('=== EFFICIENCY ORDERING TEST ===');
    console.log('Action Plan (should prioritize high efficiency steps first):');
    response.data.actionPlan.forEach((step, index) => {
      console.log(`Step ${step.step}: ${step.action} (${step.fromStar}★ → ${step.toStar}★)`);
      console.log(`  Cost: ${(step.expectedCost / 1000000).toFixed(0)}M | Risk: ${step.riskLevel} | Efficiency: ${step.efficiency.toExponential(2)}`);
      
      // Highlight the problem steps
      if (step.action.includes('Twilight Mark') || step.action.includes('Black Bean Mark')) {
        console.log(`  ⭐ HIGH EFFICIENCY STEP - Should be prioritized!`);
      }
      console.log('');
    });

    console.log('\nAnalysis:');
    console.log('Total steps:', response.data.actionPlan.length);
    console.log('Budget utilization:', response.data.analysis.budgetMetrics.utilizationRate.toFixed(1) + '%');

    // Find where Twilight Mark appears
    const twilightStep = response.data.actionPlan.find(step => step.action.includes('Twilight Mark'));
    const blackBeanStep = response.data.actionPlan.find(step => step.action.includes('Black Bean Mark'));
    
    console.log('\n=== EFFICIENCY ANALYSIS ===');
    if (twilightStep) {
      console.log(`Twilight Mark appears at step ${twilightStep.step} with efficiency ${twilightStep.efficiency.toExponential(2)}`);
    }
    if (blackBeanStep) {
      console.log(`Black Bean Mark appears at step ${blackBeanStep.step} with efficiency ${blackBeanStep.efficiency.toExponential(2)}`);
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testEfficiencyOrdering();
