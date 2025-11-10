/**
 * NEC++ WebAssembly TypeScript Definitions
 *
 * Type definitions for the NEC++ electromagnetic antenna simulation library
 */

export interface NecppModule {
  /**
   * Create a new NEC++ context wrapper
   */
  NecppWrapper: new () => NecppWrapper;
}

/**
 * Main NEC++ wrapper class for antenna simulation
 */
export interface NecppWrapper {
  /**
   * Define a wire in the antenna geometry
   * @param tag Wire tag number
   * @param segments Number of segments
   * @param x1 Starting X coordinate (meters)
   * @param y1 Starting Y coordinate (meters)
   * @param z1 Starting Z coordinate (meters)
   * @param x2 Ending X coordinate (meters)
   * @param y2 Ending Y coordinate (meters)
   * @param z2 Ending Z coordinate (meters)
   * @param radius Wire radius (meters)
   * @param rdel Segment length ratio (usually 1.0)
   * @param rrad Segment radius ratio (usually 1.0)
   */
  wire(
    tag: number,
    segments: number,
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    radius: number,
    rdel: number,
    rrad: number
  ): void;

  /**
   * Finalize the geometry definition
   * @param gpflag Ground plane flag (0 = no ground plane)
   */
  geometryComplete(gpflag: number): void;

  /**
   * Set frequency parameters (FR card)
   * @param ifrq Frequency type (0 = linear, 1 = logarithmic)
   * @param nfrq Number of frequency steps
   * @param freq_mhz Starting frequency in MHz
   * @param del_freq Frequency increment
   */
  frCard(ifrq: number, nfrq: number, freq_mhz: number, del_freq: number): void;

  /**
   * Define an excitation source (EX card)
   * @param extype Excitation type (0 = voltage source)
   * @param tag Wire tag
   * @param segment Segment number
   * @param i4 Unused parameter
   * @param re Voltage real part
   * @param im Voltage imaginary part
   * @param f3 Unused
   * @param f4 Unused
   * @param f5 Unused
   * @param f6 Unused
   */
  exCard(
    extype: number,
    tag: number,
    segment: number,
    i4: number,
    re: number,
    im: number,
    f3: number,
    f4: number,
    f5: number,
    f6: number
  ): void;

  /**
   * Set ground parameters (GN card)
   * @param iperf Ground type (-1 = free space, 0 = finite ground, 1 = perfect ground)
   * @param nradl Number of radials
   * @param epsr Relative permittivity
   * @param sig Conductivity (S/m)
   * @param f3 Unused
   * @param f4 Unused
   * @param f5 Unused
   * @param f6 Unused
   */
  gnCard(
    iperf: number,
    nradl: number,
    epsr: number,
    sig: number,
    f3: number,
    f4: number,
    f5: number,
    f6: number
  ): void;

  /**
   * Calculate radiation pattern (RP card)
   * @param calc_mode Calculation mode (0 = normal)
   * @param n_theta Number of theta angles
   * @param n_phi Number of phi angles
   * @param xnda X, N, D, A parameters packed
   * @param theta0 Starting theta angle (degrees)
   * @param phi0 Starting phi angle (degrees)
   * @param delta_theta Theta increment (degrees)
   * @param delta_phi Phi increment (degrees)
   * @param radial_distance Radial distance (meters)
   * @param gain_norm Gain normalization
   * @param f5 Unused
   * @param f6 Unused
   */
  rpCard(
    calc_mode: number,
    n_theta: number,
    n_phi: number,
    xnda: number,
    theta0: number,
    phi0: number,
    delta_theta: number,
    delta_phi: number,
    radial_distance: number,
    gain_norm: number,
    f5: number,
    f6: number
  ): void;

  /**
   * Execute calculation (XQ card)
   * @param i1 Execution flag
   */
  xqCard(i1: number): void;

  /**
   * Get maximum gain for a frequency
   * @param freq_index Frequency index
   * @returns Maximum gain in dBi
   */
  getGainMax(freq_index: number): number;

  /**
   * Get minimum gain for a frequency
   * @param freq_index Frequency index
   * @returns Minimum gain in dBi
   */
  getGainMin(freq_index: number): number;

  /**
   * Get mean gain for a frequency
   * @param freq_index Frequency index
   * @returns Mean gain in dBi
   */
  getGainMean(freq_index: number): number;

  /**
   * Get gain standard deviation for a frequency
   * @param freq_index Frequency index
   * @returns Gain standard deviation in dB
   */
  getGainSd(freq_index: number): number;

  /**
   * Get real part of input impedance
   * @param freq_index Frequency index
   * @returns Real impedance in Ohms
   */
  getImpedanceReal(freq_index: number): number;

  /**
   * Get imaginary part of input impedance
   * @param freq_index Frequency index
   * @returns Imaginary impedance in Ohms
   */
  getImpedanceImag(freq_index: number): number;

  /**
   * Get number of radiation patterns calculated
   * @returns Number of radiation patterns
   */
  getRadiationPatternCount(): number;

  /**
   * Get number of theta points in radiation pattern
   * @param rp_index Radiation pattern index
   * @returns Number of theta points
   */
  getRadiationPatternThetaCount(rp_index: number): number;

  /**
   * Get number of phi points in radiation pattern
   * @param rp_index Radiation pattern index
   * @returns Number of phi points
   */
  getRadiationPatternPhiCount(rp_index: number): number;

  /**
   * Get radiation pattern data at specific angles
   * @param rp_index Radiation pattern index
   * @param theta_index Theta point index
   * @param phi_index Phi point index
   */
  getRadiationPatternData(
    rp_index: number,
    theta_index: number,
    phi_index: number
  ): RadiationPatternData;

  /**
   * Get segment count
   */
  getSegmentCount(): number;

  /**
   * Get segment data
   * @param index Segment index
   */
  getSegment(index: number): SegmentData;

  /**
   * Get current count for a frequency
   * @param freq_index Frequency index
   */
  getCurrentCount(freq_index: number): number;

  /**
   * Get current data for a segment
   * @param freq_index Frequency index
   * @param segment_index Segment index
   */
  getCurrent(freq_index: number, segment_index: number): CurrentData;

  /**
   * Get error message if any
   */
  getErrorMessage(): string;

  /**
   * Clean up and free memory - MUST be called when done
   */
  delete(): void;

  // Additional card methods
  spCard(i1: number, f1: number, f2: number, f3: number, f4: number, f5: number, f6: number): void;
  gxCard(i1: number, i2: number): void;
  gmCard(i1: number, i2: number, f1: number, f2: number, f3: number, f4: number, f5: number, f6: number, i3: number): void;
  scCard(i1: number, f1: number, f2: number, f3: number, f4: number, f5: number, f6: number): void;
  ldCard(i1: number, i2: number, i3: number, i4: number, f1: number, f2: number, f3: number): void;
  tlCard(i1: number, i2: number, i3: number, i4: number, f1: number, f2: number, f3: number, f4: number, f5: number, f6: number): void;
  ntCard(i1: number, i2: number, i3: number, i4: number, f1: number, f2: number, f3: number, f4: number, f5: number, f6: number): void;
  ekCard(i1: number): void;
  khCard(f1: number): void;
  gdCard(f1: number, f2: number, f3: number, f4: number): void;
  mediumParameters(f1: number, f2: number): void;
  ptCard(i1: number, i2: number, i3: number, i4: number): void;
  pqCard(i1: number, i2: number, i3: number, i4: number): void;
  neCard(i1: number, i2: number, i3: number, i4: number, f1: number, f2: number, f3: number, f4: number, f5: number, f6: number): void;
  nhCard(i1: number, i2: number, i3: number, i4: number, f1: number, f2: number, f3: number, f4: number, f5: number, f6: number): void;
  cpCard(i1: number, i2: number, i3: number, i4: number): void;
}

export interface RadiationPatternData {
  success: boolean;
  theta: number;
  phi: number;
  powerVert: number;
  powerHoriz: number;
  powerTot: number;
  axialRatio: number;
  tilt: number;
  polSense: number;
  eThetaMag: number;
  eThetaPhase: number;
  ePhiMag: number;
  ePhiPhase: number;
}

export interface SegmentData {
  success: boolean;
  x: number;
  y: number;
  z: number;
  length: number;
  alpha: number;
  beta: number;
  radius: number;
}

export interface CurrentData {
  success: boolean;
  segmentNumber: number;
  segmentTag: number;
  x: number;
  y: number;
  z: number;
  length: number;
  currentReal: number;
  currentImag: number;
}

/**
 * Create and initialize the NEC++ WASM module
 * @returns Promise that resolves to the initialized module
 */
declare function createNecppModule(): Promise<NecppModule>;

export default createNecppModule;
