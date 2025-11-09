#!/usr/bin/env python3
"""
NEC Output Comparison Tool

Compares numerical outputs from two NEC simulation files with tolerance checking.
Designed for comparing nec2++ (C++) output with WASM port output.

Usage: nec_compare.py file1.out file2.out [--tolerance 1e-5]
"""

import sys
import re
import argparse
from typing import List, Tuple, Dict
import math

class NecValue:
    """Represents a numerical value from NEC output"""
    def __init__(self, value: float, context: str, line_num: int):
        self.value = value
        self.context = context
        self.line_num = line_num

def extract_numbers(filename: str) -> List[NecValue]:
    """Extract all numerical values from a NEC output file"""
    values = []

    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        for line_num, line in enumerate(f, 1):
            # Skip header lines and separators
            if line.strip().startswith(('*', '-', '=', '|')):
                continue

            # Find all floating point numbers (including scientific notation)
            # Pattern matches: 123.456, -123.456, 1.23E+10, 1.23E-10, etc.
            pattern = r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?'
            matches = re.finditer(pattern, line)

            for match in matches:
                try:
                    value = float(match.group())
                    # Skip line numbers and other integers that aren't measurements
                    if abs(value) > 1e-10 or value == 0.0:
                        context = line.strip()[:80]  # First 80 chars for context
                        values.append(NecValue(value, context, line_num))
                except ValueError:
                    pass

    return values

def relative_error(a: float, b: float) -> float:
    """Calculate relative error between two values"""
    if abs(a) < 1e-100 and abs(b) < 1e-100:
        return 0.0

    if abs(a) < 1e-100:
        return abs(b)

    return abs((a - b) / a)

def compare_values(vals1: List[NecValue], vals2: List[NecValue],
                   tolerance: float = 1e-5, verbose: bool = False) -> Tuple[int, int, List[str]]:
    """
    Compare two lists of numerical values

    Returns: (matching_count, total_count, differences)
    """
    differences = []
    matching = 0
    total = min(len(vals1), len(vals2))

    # Simple approach: compare values in order
    # More sophisticated would try to match by context
    for i in range(total):
        v1 = vals1[i]
        v2 = vals2[i]

        rel_err = relative_error(v1.value, v2.value)
        abs_diff = abs(v1.value - v2.value)

        if rel_err <= tolerance or abs_diff <= tolerance:
            matching += 1
            if verbose and rel_err > tolerance * 0.1:
                print(f"  Close match [{i}]: {v1.value:.6e} vs {v2.value:.6e} (rel_err={rel_err:.2e})")
        else:
            diff_msg = (f"Mismatch [{i}]:\n"
                       f"  File1 line {v1.line_num}: {v1.value:.10e}\n"
                       f"  File2 line {v2.line_num}: {v2.value:.10e}\n"
                       f"  Relative error: {rel_err:.6e}\n"
                       f"  Absolute diff: {abs_diff:.6e}\n"
                       f"  Context1: {v1.context}\n"
                       f"  Context2: {v2.context}")
            differences.append(diff_msg)

    return matching, total, differences

def extract_key_results(filename: str) -> Dict[str, float]:
    """Extract key results like gain, impedance from NEC output"""
    results = {}

    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

        # Try to extract common patterns
        patterns = {
            'max_gain': r'MAXIMUM\s+GAIN\s*[:=]?\s*([-+]?\d+\.?\d*(?:[eE][-+]?\d+)?)',
            'min_gain': r'MINIMUM\s+GAIN\s*[:=]?\s*([-+]?\d+\.?\d*(?:[eE][-+]?\d+)?)',
            'mean_gain': r'MEAN\s+GAIN\s*[:=]?\s*([-+]?\d+\.?\d*(?:[eE][-+]?\d+)?)',
            'impedance_real': r'IMPEDANCE\s*[:=]?\s*([-+]?\d+\.?\d*(?:[eE][-+]?\d+)?)\s*\+',
            'impedance_imag': r'\+\s*j\s*([-+]?\d+\.?\d*(?:[eE][-+]?\d+)?)',
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                results[key] = float(match.group(1))

    return results

def main():
    parser = argparse.ArgumentParser(description='Compare NEC simulation outputs')
    parser.add_argument('file1', help='First output file (reference)')
    parser.add_argument('file2', help='Second output file (comparison)')
    parser.add_argument('--tolerance', '-t', type=float, default=1e-5,
                       help='Relative tolerance for comparisons (default: 1e-5)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')
    parser.add_argument('--key-only', '-k', action='store_true',
                       help='Compare only key results (gain, impedance)')

    args = parser.parse_args()

    print(f"Comparing: {args.file1} vs {args.file2}")
    print(f"Tolerance: {args.tolerance}")
    print()

    if args.key_only:
        # Compare only key results
        results1 = extract_key_results(args.file1)
        results2 = extract_key_results(args.file2)

        print("Key Results Comparison:")
        print("-" * 70)

        all_keys = set(results1.keys()) | set(results2.keys())
        passed = 0
        failed = 0

        for key in sorted(all_keys):
            if key in results1 and key in results2:
                v1 = results1[key]
                v2 = results2[key]
                rel_err = relative_error(v1, v2)

                status = "PASS" if rel_err <= args.tolerance else "FAIL"
                if status == "PASS":
                    passed += 1
                else:
                    failed += 1

                print(f"{key:20s}: {v1:12.6e} vs {v2:12.6e}  [{status}]  (err={rel_err:.2e})")
            elif key in results1:
                print(f"{key:20s}: {results1[key]:12.6e} vs [MISSING]  [FAIL]")
                failed += 1
            else:
                print(f"{key:20s}: [MISSING] vs {results2[key]:12.6e}  [FAIL]")
                failed += 1

        print()
        print(f"Summary: {passed} passed, {failed} failed")
        return 0 if failed == 0 else 1

    # Full comparison
    print("Extracting numerical values...")
    vals1 = extract_numbers(args.file1)
    vals2 = extract_numbers(args.file2)

    print(f"File 1: {len(vals1)} numerical values")
    print(f"File 2: {len(vals2)} numerical values")
    print()

    if len(vals1) != len(vals2):
        print(f"WARNING: Different number of values ({len(vals1)} vs {len(vals2)})")
        print()

    matching, total, diffs = compare_values(vals1, vals2, args.tolerance, args.verbose)

    print(f"Comparison Results:")
    print(f"  Total values compared: {total}")
    print(f"  Matching (within tolerance): {matching}")
    print(f"  Differences: {len(diffs)}")

    if total > 0:
        percentage = (matching / total) * 100
        print(f"  Match percentage: {percentage:.2f}%")

    if diffs:
        print()
        print(f"First {min(10, len(diffs))} differences:")
        print("=" * 70)
        for diff in diffs[:10]:
            print(diff)
            print("-" * 70)

    # Return 0 if all match, 1 otherwise
    return 0 if len(diffs) == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
