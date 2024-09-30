import { Field } from "o1js";
import { getMultilinearLDE } from "./multilinear-lagrange.ts";
import { getUnivariateLDE } from "./univariate-lagrange.ts";

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
   * @param r_prev - The j-1th value of r provided by the Verifier, should be undefined in the first round.
   * @returns The point-value representation of the univariate polynomial g_j at points 0 and 1.
   */
  getRoundJPolynomial(r_prev?: Field) {
    if (this.r.length >= this.v) {
      throw Error(`Round number cannot exceed ${this.v}`);
    }
    // we're in round 1, no r values should be fixed
    if (this.r.length === 0 && r_prev !== undefined) {
      throw Error(
        `Round 1 of the sum-check protocol should not involve fixing an r value for the polynomial g_1. Received unexpected r value ${r_prev}`,
      );
    }
    // we're in round j, j-1 r values should be fixed
    else if (this.r.length !== 0) {
      if (r_prev === undefined)
        throw Error(
          `Round ${this.r.length + 1} requires the ${this.r.length}th variable in g to be fixed. Missing r value.`,
        );

      // fix the value r_prev and append it to the fixed r vector
      this.r.push(r_prev);
    }
    // current round number (number of fixed variables is j-1 at each round)
    const j = this.r.length + 1;

    // Compute 2^(v - j) binary vectors of length v - j
    const binaryVectors = this.getBinaryVectors(this.v - j);

    // Initialize sums for x_j = 0 and x_j = 1
    let sum0 = Field(0),
      sum1 = Field(0);
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

/**
 * Sum check verifier
 *
 * verifies correctness of the proposed sum of all evaluations of g in a
 * v round protocol ending in a single evaluation of g(r)
 */
export class Verifier {
  // number of variables in g
  private v: number;

  // sum proposed by prover
  private proposedSum: Field;

  /**
   * Univariate polynomials g_j sent by the Prover in point value form
   * After round v, this will contain v polynomials.
   */
  private polynomials: Field[][] = [];

  /**
   * Fixed entries of r to evaluate g at in the final round
   * After round v, this will be a v-dimensional vector
   */
  private r: Field[] = [];

  /**
   * Creates an instance of the Verifier.
   *
   * @param proposedSum - The sum proposed by the Prover.
   * @param v - The number of variables in the polynomial g
   */
  constructor(proposedSum: Field, v: number) {
    this.v = v;
    this.proposedSum = proposedSum;
  }

  /**
   * Verifies the univariate polynomial g_j for the current round j
   * Checks that
   *  deg_j(g) = deg(g_j)
   *  g_j(0) + g_j(1) = g_{j-1}(r_{j-1})
   * if g_j passes the checks, generates and stores a random field element r_j for the prover to fix in the j+1th round
   *
   * @param g_j - The point-value representation of the univariate polynomialg_j
   * @returns A random field element r_j for the next round.
   */
  verifyRoundJPolynomial(g_j: Field[]): Field {
    const j = this.r.length + 1;
    if (j > this.v)
      throw Error(
        `Too many rounds (j=${j}). The polynomial g is ${this.v}-variate, so there should only be ${this.v} rounds.`,
      );
    // todo: hardcoded check for 2 elements only makes sense if we're limiting g to multilinear polynomials
    if (g_j.length > 2)
      throw Error(
        `Polynomial sent in round ${j} has length ${g_j.length}. Expected length to be <= 2 for multilinear polynomials.`,
      );

    // Compute g_j(0) + g_j(1)
    const sum = getUnivariateLDE(g_j, Field(0)).add(
      getUnivariateLDE(g_j, Field(1)),
    );
    // round 1 - check against the proposed sum
    if (j === 1) {
      if (!sum.equals(this.proposedSum))
        throw Error(
          `Polynomial g_1 is incorrect, g_1(0) + g_1(1) should equal ${this.proposedSum.toString()} but was actually ${sum.toString()}`,
        );
    }
    // round j>1, check sum against round g_{j-1}(r_{j-1})
    else if (j > 1) {
      const prevPolynomialAtPrevR = getUnivariateLDE(
        this.polynomials[j - 2],
        this.r[j - 2],
      );
      if (!sum.equals(prevPolynomialAtPrevR))
        throw Error(
          `Polynomial g_${j} is incorrect. g_j(0) + g_j(1) should equal ${prevPolynomialAtPrevR.toString()}, but got ${sum.toString()}.`,
        );
    }

    // generate a random field element for the next round, store the polynomial and the field element
    const r_j = this.getRandomFieldElement();
    this.r.push(r_j);
    this.polynomials.push(g_j);
    return r_j;
  }

  /**
   * Verifies the evaluation of g at the point r: g(r) = g_v(r_v)
   * To be run after verifier has already verified g_v is the correct polynomial and generated the vth entry of r
   *
   * @param g - The point-value representation of the polynomial g
   */
  verifyOracleQueryOfG(g: Field[]) {
    // check the full vector r has been generated
    if (this.r.length != this.v || this.polynomials.length != this.v)
      throw Error(
        `${this.v} rounds are required to fix all ${this.v} variables of r.`,
      );

    // evaluate the full multilinear polynomial g at the v-dimensional vector r
    const gOfR = getMultilinearLDE(g, this.r);
    // evaluate the univariate polynomial g_v at the vth entry of r
    const g_vOfR_v = getUnivariateLDE(
      this.polynomials[this.polynomials.length - 1],
      this.r[this.r.length - 1],
    );
    // verify g(r) = g_v(r_v)
    if (!gOfR.equals(g_vOfR_v)) throw Error(`g(r) != g_v(r_v)`);
  }

  getRandomFieldElement(): Field {
    return Field(Math.floor(Math.random() * 100000000000));
  }
}

(function runner() {
  // the polynomial g is v variate
  const v = 3;
  // g: {0,1}^v -> F is a multivariate function mapping v-dimensional vectors to field elements
  // because g is over a boolean domain, the degree of g in each of its v variables is either 1 or 0
  // the domain has size 2^v, we specify g as the ordered list of all evaluations [g(x) : x in {0,1}^v]
  // where x is the binary representation of each index {1...2^v}
  const g = Array.from({ length: 2 ** v }, (_, i) => Field(i + 1));

  const prover = new Prover(g, v);
  const sum = prover.getProposedSum();
  console.log(`proposed sum C = ${sum.toString()}`);
  const verifier = new Verifier(sum, v);

  for (let j = 0; j < v; j++) {
    const g_j = prover.getRoundJPolynomial();
    const sumg_j = getUnivariateLDE(g_j, Field(0)).add(
      getUnivariateLDE(g_j, Field(1)),
    );
    console.log(`g_j(0) + g_j(1) = ${sumg_j.toString()}`);
    const r_j = verifier.verifyRoundJPolynomial(g_j);
    console.log(
      `Verifier verified g_${j} and generated r_${j}: ${r_j.toString()}`,
    );
  }
  verifier.verifyOracleQueryOfG(prover.g);
  console.log(
    `Sum check proof has passed for polynomial g: [${g.map((e) => e.toString())}] and sum ${sum.toString()}`,
  );
})();
