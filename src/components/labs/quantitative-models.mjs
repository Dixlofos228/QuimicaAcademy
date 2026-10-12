/** Ideal teaching models. Units are part of each public function's contract. */
export const WATER_C = 4.18;
export const HF_KA = 6.8e-4;
export const KW_25 = 1e-14;
export const FOOD_FACTORS = Object.freeze([17, 37, 17]);
const finite = (n, name) => { if (!Number.isFinite(n)) throw new RangeError(`${name} must be finite`); return n; };
const positive = (n, name) => { finite(n, name); if (n <= 0) throw new RangeError(`${name} must be positive`); return n; };
const nonnegative = (n, name) => { finite(n, name); if (n < 0) throw new RangeError(`${name} must be nonnegative`); return n; };
export function clampProgress(progress) { return Math.max(0, Math.min(1, finite(progress, 'progress'))); }
export function dilution(moles, volumeL) { return nonnegative(moles, 'moles') / positive(volumeL, 'volume'); }
export function foodEnergy(carbohydratesG, lipidG, proteinG) {
 const parts = [carbohydratesG, lipidG, proteinG].map((mass, i) => nonnegative(mass, 'mass') * FOOD_FACTORS[i]);
 const total = parts.reduce((sum, value) => sum + value, 0);
 return {parts, total, kcal: total / 4.184};
}
export function sensibleHeat(massG, deltaTK, specificHeat = WATER_C) {
 return nonnegative(massG, 'mass') * positive(specificHeat, 'specific heat') * finite(deltaTK, 'temperature difference');
}
export function calorimetry(massG, deltaTK, calorimeterCapacity) {
 const capacity = nonnegative(massG, 'mass') * WATER_C + nonnegative(calorimeterCapacity, 'calorimeter capacity');
 const absorbed = capacity * finite(deltaTK, 'temperature difference');
 return {capacity, absorbed, reaction: absorbed === 0 ? 0 : -absorbed};
}
export function firstLaw(qJ, workJ) { return finite(qJ, 'heat') + finite(workJ, 'work'); }
/** Constant external pressure; kPa × L equals J. Chemistry convention. */
export function gasWork(pressureKPa, initialL, finalL) {
 positive(pressureKPa, 'pressure'); positive(initialL, 'initial volume'); positive(finalL, 'final volume');
 const work = -pressureKPa * (finalL - initialL);
 return work === 0 ? 0 : work;
}
export function hess(extent) {
 positive(extent, 'extent');
 return {first: -110.5 * extent, second: -283 * extent, total: -393.5 * extent, extent, oxygenIntermediate: extent / 2};
}
/** x²/(c−x)=Ka; stable quadratic root, water autoionization omitted. */
export function acidState(concentration, weak = false, ka = HF_KA) {
 positive(concentration, 'concentration'); positive(ka, 'Ka');
 const hydrogen = weak ? 2 * ka * concentration / (ka + Math.sqrt(ka * ka + 4 * ka * concentration)) : concentration;
 const ph = -Math.log10(hydrogen);
 return {hydrogen, ph, poh: 14 - ph, ionized: hydrogen / concentration, undissociated: concentration - hydrogen};
}
/** C=[NO2]+2[N2O4], Kc=[N2O4]/[NO2]² in L/mol. */
export function dimerEquilibrium(totalConcentration, kc) {
 positive(totalConcentration, 'total concentration'); positive(kc, 'Kc');
 const monomer = 2 * totalConcentration / (1 + Math.sqrt(1 + 8 * kc * totalConcentration));
 const dimer = kc * monomer * monomer;
 return {monomer, dimer, total: monomer + 2 * dimer, quotient: dimer / (monomer * monomer)};
}
/** [α] is in °·mL/(g·dm); equilibrium aqueous solutions, 20 °C, sodium D. */
export function opticalRotation(concentrationGPerML, lengthDM, fructose = false) {
 nonnegative(concentrationGPerML, 'concentration'); positive(lengthDM, 'length');
 const specific = fructose ? -92.4 : 52.7;
 const angle = specific * lengthDM * concentrationGPerML;
 return {specific, angle: angle === 0 ? 0 : angle};
}
/** Complete combustion: lesson inputs use liquid product water. */
export function fuelState(massG, molarMassG, combustionMagnitudeKJPerMol, carbonAtoms) {
 nonnegative(massG, 'mass'); positive(molarMassG, 'molar mass'); positive(combustionMagnitudeKJPerMol, 'combustion magnitude'); positive(carbonAtoms, 'carbon atoms');
 if(!Number.isInteger(carbonAtoms)) throw new RangeError('carbon atoms must be an integer');
 const moles=massG/molarMassG;
 return {moles,released:moles*combustionMagnitudeKJPerMol,co2:moles*carbonAtoms*44.01,energyPerG:combustionMagnitudeKJPerMol/molarMassG,co2PerMJ:1000*carbonAtoms*44.01/combustionMagnitudeKJPerMol};
}
