# Radiation Pattern Data Extraction Guide

## Problem Summary

When using `getRadiationPatternData()`, users may receive sentinel values (-999.99) instead of actual power data. This guide explains why this happens and how to fix it.

## Root Cause

The sentinel value -999.99 is returned in two legitimate cases:

1. **Zero/Near-Zero Power**: When the actual power in a specific polarization or direction is essentially zero (< 1.0e-20), the library returns -999.99 instead of -∞ (which would result from log10(0)).

2. **Incorrect RP Card Parameters**: When `delta_theta` or `delta_phi` are set to 0, all radiation pattern points are calculated at the same angle, which may be a null direction.

## Common Mistake: Incorrect Parameters

### ❌ INCORRECT Usage (from user's example):
```javascript
// This creates a radiation pattern with ALL points at theta=0° (dipole null)
nec.rpCard(
    0,     // calc_mode
    37,    // n_theta
    1,     // n_phi
    1000,  // output_format - WRONG! Should be 0 or 1
    0,     // normalization
    0,     // D
    5,     // A - WRONG! Should be 0, 1, or 2
    0,     // theta0
    0,     // phi0
    0,     // delta_theta - PROBLEM! All angles will be at 0°
    0,     // delta_phi
    0,     // radial_distance
    0      // gain_norm
);

// At theta=0°, a vertical dipole has a NULL (no radiation)
const data = nec.getRadiationPatternData(0, 0, 0);
// Result: powerTot = -999.99 (this is CORRECT for a null direction!)
```

### ✓ CORRECT Usage:
```javascript
// Calculate radiation pattern from 0° to 180° in 5° steps
nec.rpCard(
    0,     // calc_mode: 0 = normal mode
    37,    // n_theta: 37 angles (0° to 180° in 5° steps)
    1,     // n_phi: 1 phi angle
    1,     // output_format: 1 = vertical/horizontal/total gain
    5,     // normalization: 5 = total gain normalized
    0,     // D: 0 = power gain (not directive gain)
    0,     // A: 0 = no averaging
    0.0,   // theta0: start angle (degrees)
    0.0,   // phi0: start angle (degrees)
    5.0,   // delta_theta: 5° steps (MUST BE NON-ZERO!)
    0.0,   // delta_phi: 0 for single phi
    0.0,   // radial_distance: 0 for far-field
    0.0    // gain_norm: 0 for automatic normalization
);

// Now get data at broadside (90°), which is theta_index = 18
const data = nec.getRadiationPatternData(0, 18, 0);
// Result: powerTot ≈ 2.17 dBi (correct for half-wave dipole!)
```

## Understanding Radiation Pattern Indices

The theta angle for a given index is calculated as:
```
theta = theta0 + (theta_index * delta_theta)
```

Examples with `theta0=0`, `delta_theta=5`:
- `theta_index=0` → `theta=0°` (dipole axis, NULL)
- `theta_index=9` → `theta=45°` (some radiation)
- `theta_index=18` → `theta=90°` (maximum radiation, broadside)
- `theta_index=36` → `theta=180°` (opposite dipole axis, NULL)

## Understanding Polarization Components

For a **vertically-oriented dipole** (along z-axis):
- `powerVert`: Vertical polarization (E-theta component) - HAS POWER
- `powerHoriz`: Horizontal polarization (E-phi component) - **ALWAYS -999.99** (zero power)
- `powerTot`: Total power (mostly from vertical component)

This is **CORRECT BEHAVIOR**! A vertical dipole only radiates vertically-polarized waves, so the horizontal component is legitimately zero.

## Complete Working Example

```javascript
// 1. Build geometry: Half-wave dipole
const freq = 299.7925; // MHz
const wavelength = 300.0 / freq; // ~1.0007 m
const length = wavelength / 2.0;
const radius = 0.001; // 1mm

nec.wire(1, 11, 0, 0, -length/2, 0, 0, length/2, radius, 1.0, 1.0);

// 2. Complete geometry
nec.geometryComplete(0);

// 3. Set frequency
nec.frCard(0, 1, freq, 0);

// 4. Set excitation (voltage source at center, segment 6)
nec.exCard(0, 1, 6, 0, 1.0, 0.0, 0, 0, 0, 0);

// 5. Request radiation pattern - CORRECT PARAMETERS!
nec.rpCard(
    0,     // normal mode
    37,    // 37 theta angles
    1,     // 1 phi angle
    1,     // vertical/horizontal format
    5,     // total gain normalized
    0,     // power gain
    0,     // no averaging
    0.0,   // start at 0°
    0.0,   // phi = 0°
    5.0,   // 5° theta steps (CRITICAL!)
    0.0,   // no phi stepping
    0.0,   // far-field
    0.0    // auto normalization
);

// 6. Get number of patterns and dimensions
const patternCount = nec.getRadiationPatternCount();
const thetaCount = nec.getRadiationPatternThetaCount(0);
const phiCount = nec.getRadiationPatternPhiCount(0);

console.log(`Pattern count: ${patternCount}`);
console.log(`Theta angles: ${thetaCount}`);
console.log(`Phi angles: ${phiCount}`);

// 7. Extract data at different angles
for (let i = 0; i < thetaCount; i++) {
    const data = nec.getRadiationPatternData(0, i, 0);

    // Skip null directions
    if (data.powerTot > -900) {
        console.log(`Theta: ${data.theta}° - Total Gain: ${data.powerTot.toFixed(2)} dBi`);
    } else {
        console.log(`Theta: ${data.theta}° - NULL (no radiation)`);
    }
}

// 8. Get maximum gain point (should be around theta=90°)
const maxGainData = nec.getRadiationPatternData(0, 18, 0); // index 18 = 90°
console.log(`Maximum gain at ${maxGainData.theta}°: ${maxGainData.powerTot.toFixed(2)} dBi`);
// Expected: ~2.15 dBi for half-wave dipole
```

## Expected Results for Half-Wave Dipole

| Theta (°) | Index | Power Total (dBi) | Notes |
|-----------|-------|-------------------|-------|
| 0         | 0     | -999.99           | NULL (along dipole axis) |
| 45        | 9     | ~-2.0             | Some radiation |
| 90        | 18    | ~2.15             | MAXIMUM (broadside) |
| 135       | 27    | ~-2.0             | Some radiation |
| 180       | 36    | -999.99           | NULL (along dipole axis) |

**Note**: `powerHoriz` will ALWAYS be -999.99 for a vertical dipole (this is correct!).

## Key Takeaways

1. **Always use non-zero `delta_theta`** to get a range of angles
2. **Sentinel value -999.99 means zero power**, not "invalid data"
3. **For vertical dipoles, `powerHoriz` is always -999.99** (correct behavior)
4. **Check data at broadside angles** (theta ≈ 90°) for maximum gain
5. **Nulls at 0° and 180°** are expected for dipoles

## Parameter Reference

### RP Card Parameters (in order):
1. `calc_mode`: Usually 0 (normal mode)
2. `n_theta`: Number of theta angles
3. `n_phi`: Number of phi angles
4. `output_format`: 0 (major/minor axis) or 1 (vertical/horizontal)
5. `normalization`: 0-5 (5 = total gain normalized)
6. `D`: 0 (power gain) or 1 (directive gain)
7. `A`: 0 (no averaging), 1 or 2 (averaging modes)
8. `theta0`: Starting theta angle (degrees)
9. `phi0`: Starting phi angle (degrees)
10. `delta_theta`: Theta step size (degrees) - **MUST BE NON-ZERO**
11. `delta_phi`: Phi step size (degrees)
12. `radial_distance`: Distance in meters (0 for far-field)
13. `gain_norm`: Normalization factor (0 for automatic)

## Debugging Checklist

If you're getting all -999.99 values:
- [ ] Is `delta_theta` non-zero?
- [ ] Are you checking at the right theta_index? (Try index 18 for dipoles)
- [ ] Is the excitation properly set up?
- [ ] Did you call `geometryComplete()`?
- [ ] Did the RP card execute successfully?

If `powerHoriz` is always -999.99:
- [ ] Is your antenna vertically oriented? (This is normal behavior!)
- [ ] For horizontal antennas, both components should have power
