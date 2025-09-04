// Test to generate the actual dropdown options for shoes level 200 legendary
// Based on the JavaScript addNormalStatOptions() logic

function getPrimeLineValue(itemLevel, desiredTier, type) {
    const levelBonus = itemLevel >= 160 ? 1 : 0;
    const base = type === "allStat" ? 0 : 3;
    return base + (3 * desiredTier) + levelBonus;
}

function get3LAtkOptionAmounts(prime) {
    const ppp = prime * 3;
    const ppn = ppp - 3;
    const pnn = ppp - 6;
    return [pnn, ppn, ppp].filter((x) => x > 0);
}

function get3LStatOptionAmounts(prime) {
    const ppp = prime * 3;
    const pna = ppp - 9;
    const paa = ppp - 12;
    const aaa = ppp - 15;
    const idkman = ppp - 18;
    const nonAllStatOptions = get3LAtkOptionAmounts(prime);
    return [idkman, aaa, paa, pna, ...nonAllStatOptions].filter((x) => x > 0);
}

// Test for shoes level 200 legendary
const itemLevel = 200;
const desiredTier = 3; // legendary
const statType = "normal"; // regular stat (not allStat)

const primeLineValue = getPrimeLineValue(itemLevel, desiredTier, statType);
console.log('Prime line value:', primeLineValue);

const optionAmounts = get3LStatOptionAmounts(primeLineValue);
console.log('Option amounts:', optionAmounts);

console.log('\\n=== Shoes Level 200 Legendary Dropdown Options ===');
console.log('<optgroup id="statGroup" label="Stat">');
optionAmounts.forEach((val, i) => {
    console.log(`  <option id="stat${i}" value="percStat+${val}">${val}%+ Stat</option>`);
});
console.log('</optgroup>');

// Also test for allStat
console.log('\\n=== All Stat Options ===');
const allStatPrime = getPrimeLineValue(itemLevel, desiredTier, "allStat");
console.log('All stat prime:', allStatPrime);

// All stat has special handling in the original code
const needSpecialAmounts = statType === "allStat" && desiredTier === 1;
const allStatAmounts = needSpecialAmounts ? 
    [1, 3, 4, 5, 6, 9] : 
    get3LStatOptionAmounts(allStatPrime);

console.log('All stat amounts:', allStatAmounts);
