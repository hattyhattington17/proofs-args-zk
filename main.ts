/**
 * Computes the Lagrange basis polynomial for a given set of points.
 * @param x The x-coordinate of the evaluation point.
 * @param xi The x-coordinates of the known points.
 * @param j The index of the basis polynomial to compute.
 * @returns The value of the j-th Lagrange basis polynomial at x.
 */
function lagrangeBasisPolynomial(x: number, xi: number[], j: number): number {
  let result = 1;
  for (let m = 0; m < xi.length; m++) {
    if (m !== j) {
      result *= (x - xi[m]) / (xi[j] - xi[m]);
    }
  }
  return result;
}

/**
 * Computes the Lagrange interpolating polynomial at a given point.
 * @param x The x-coordinate where the polynomial should be evaluated.
 * @param xi The x-coordinates of the known points.
 * @param yi The y-coordinates of the known points (corresponding to xi).
 * @returns The value of the Lagrange interpolating polynomial at x.
 */
export function lagrangeInterpolation(
  x: number,
  xi: number[],
  yi: number[],
): number {
  let result = 0;
  for (let j = 0; j < xi.length; j++) {
    const basisPolynomial = lagrangeBasisPolynomial(x, xi, j);
    result += yi[j] * basisPolynomial;
  }
  return result;
}

// Example usage:
const xi = [0, 1, 2];
const yi = [1, 3, 2];
const x = 1.5;
console.log(lagrangeInterpolation(x, xi, yi)); // Output: 2.375
