#!/usr/bin/env python3
"""
Compare key engineering results from NEC outputs.
Extracts impedance, current, and power values and compares them.
"""
import sys
import re

def extract_first_impedance_line(filename):
    """Extract the first antenna input parameters line"""
    with open(filename, 'r') as f:
        in_section = False
        for line in f:
            if 'ANTENNA INPUT PARAMETERS' in line:
                in_section = True
                continue
            if in_section and re.match(r'\s+\d+\s+\d+\s+', line):
                return line.strip()
    return None

def parse_impedance_line(line):
    """Parse impedance data from antenna input line"""
    parts = line.split()
    if len(parts) >= 11:
        return {
            'tag': int(parts[0]),
            'seg': int(parts[1]),
            'v_real': float(parts[2]),
            'v_imag': float(parts[3]),
            'i_real': float(parts[4]),
            'i_imag': float(parts[5]),
            'z_real': float(parts[6]),
            'z_imag': float(parts[7]),
            'y_real': float(parts[8]),
            'y_imag': float(parts[9]),
            'power': float(parts[10])
        }
    return None

def compare_values(val1, val2, tolerance):
    """Compare two values with relative tolerance"""
    if abs(val1) < 1e-10 and abs(val2) < 1e-10:
        return True
    if abs(val1) < 1e-10:
        return abs(val2) < tolerance
    rel_error = abs((val1 - val2) / val1)
    return rel_error < tolerance

def main():
    if len(sys.argv) < 3:
        print("Usage: compare_key_results.py file1.out file2.out [tolerance]")
        sys.exit(1)
    
    file1 = sys.argv[1]
    file2 = sys.argv[2]
    tolerance = float(sys.argv[3]) if len(sys.argv) > 3 else 0.01
    
    line1 = extract_first_impedance_line(file1)
    line2 = extract_first_impedance_line(file2)
    
    if not line1 or not line2:
        print("ERROR: Could not extract impedance data from both files")
        sys.exit(1)
    
    data1 = parse_impedance_line(line1)
    data2 = parse_impedance_line(line2)
    
    if not data1 or not data2:
        print("ERROR: Could not parse impedance data")
        sys.exit(1)
    
    print(f"Comparing key results (tolerance: {tolerance*100:.1f}%):")
    print(f"=" * 70)
    
    keys_to_compare = ['z_real', 'z_imag', 'i_real', 'i_imag', 'power']
    failures = []
    
    for key in keys_to_compare:
        val1 = data1[key]
        val2 = data2[key]
        matches = compare_values(val1, val2, tolerance)
        rel_err = abs((val1 - val2) / val1) if abs(val1) > 1e-10 else 0
        
        status = "✓ PASS" if matches else "✗ FAIL"
        print(f"{key:12s}: {val1:12.6e} vs {val2:12.6e}  {status}  (err={rel_err*100:.3f}%)")
        
        if not matches:
            failures.append(key)
    
    print(f"=" * 70)
    
    if failures:
        print(f"FAIL: {len(failures)} value(s) differ: {', '.join(failures)}")
        return 1
    else:
        print("PASS: All key results match within tolerance")
        return 0

if __name__ == '__main__':
    sys.exit(main())
