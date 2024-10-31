import { Field } from "o1js";
import { getMultilinearLDE } from "./multilinear-lagrange.ts";


/**
 * Sum check prover
 * holds polynomial g in point value form and proves the sum of all boolean evaluations of g
 * */
export class Prover {
  // Number of variables in g
  v: number;

  // point value representation of the multivariate function g: {0,1}^v -> F
  // an array of field elements corresponding to g evaluated at all points in {0,1\}^v
  // todo: Update code to represent g:F^v -> F
  g: Field[];

  // vector of fixed values to be constructed round by round
  // empty at round 1, v-1 dimensional at round v
  r: Field[] = [];

  /**
   * Creates an instance of the Prover.
   *
   * @param g - The point-value representation of the function g
   * @param v - The number of variables in the function g
   */
  constructor(g: Field[], v: number) {
    // validate that the number of evaluations supplied represents a v-variate function
    if (g.length > 2 ** v)
      throw new Error(
        `The function g specified by the evaluations [${g
          .map((e) => e.toString())
          .join(
            ", ",
          )}] should be of size ${2 ** v}, corresponding to a ${v}-variate function.`,
      );

    this.v = v;
    this.g = g;
  }

  // for rounds after round 1, the verifier will supply the j-1th entry of r for the prover to fix
  /**
   * Computes the univariate polynomial g_j for the current round j
   *
   * @param r_prev - The j-1th value of r provided by the Verifier (should be undefined in the first round)
   * @returns The point-value representation of the univariate polynomial g_j at points 0 and 1.
   */
  getRoundJPolynomial(r_prev?: Field) {
    // fix the value r_prev and append it to the fixed r vector
    if (r_prev!==undefined) this.r.push(r_prev);

    // current round number (number of fixed variables is j-1 at each round)
    const j = this.r.length + 1;

    if (this.r.length >= this.v) {
      throw Error(
        `Cannot fix more than ${this.v} values in the ${this.v}-dimensional vector r`,
      );
    }
    // r should be empty during round 1
    if (j === 1 && r_prev !== undefined) {
      throw Error(
        `Prover received unexpected r value ${r_prev} during round 1 of the sum check protocol.`,
      );
    }

    if (j!==1 && r_prev === undefined)
      throw Error(
        `Round ${j} requires the ${j-1} entries in r to be fixed. Expected another entry in r.`,
      );



    // Compute 2^(v - j) binary vectors of length v - j
    const binaryVectors = this.getBinaryVectors(this.v - j);

    // Initialize sums for x_j = 0 and x_j = 1
    let sum0 = Field(0),
      sum1 = Field(0);
    if(binaryVectors.length) {
      // sum over all vectors in {0,1}^(v-j)
      binaryVectors.forEach((vector: Field[]) => {
        // x_j = 0
        sum0 = sum0.add(
          getMultilinearLDE(this.g, [...this.r, Field(0), ...vector]),
        );
        // x_j = 1
        sum1 = sum1.add(
          getMultilinearLDE(this.g, [...this.r, Field(1), ...vector]),
        );
      });
    } else {
      // in round v there will be no binary vectors to sum over
      // x_j = 0
      sum0 = sum0.add(
        getMultilinearLDE(this.g, [...this.r, Field(0)]),
      );
      // x_j = 1
      sum1 = sum1.add(
        getMultilinearLDE(this.g, [...this.r, Field(1)]),
      );
    }

    // Return the point-value representation [(0, sum0), (1, sum1)]
    // todo: what happens if deg_j(g)>1? how do we even know if that's the case?
    return [sum0, sum1];
  }

  /**
   * Computes the proposed sum of g(x) for all x in {0,1}^v
   *
   * @returns The sum of g evaluated over all binary vectors of length v
   */
  getProposedSum(): Field {
    const binaryVectors = this.getBinaryVectors(this.v);
    // accumulator for summation over all v-dimensional binary vectors
    let accumulator = Field(0);

    for (let i = 0; i < binaryVectors.length; i++) {
      accumulator = accumulator.add(
        getMultilinearLDE(this.g, binaryVectors[i]),
      );
    }
    return accumulator;
  }

  /**
   * Generates all binary vectors of a given dimension.
   *
   * @param dimension - The length of the binary vectors to generate.
   * @returns An array of 2^dimension binary vectors (arrays of Field elements).
   */
  private getBinaryVectors(dimension: number): Field[][] {
    if(dimension === 0) return[];
    const result = [];
    for (let i = 0; i < 2 ** dimension; i++) {
      result.push(
        i
          .toString(2)
          .padStart(dimension)
          .split("")
          .map((e) => Field(e)),
      );
    }
    return result;
  }
}
