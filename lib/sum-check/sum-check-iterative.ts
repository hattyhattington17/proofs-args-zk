import { Field } from "o1js";
import { getMultilinearLDE } from "./multilinear-lagrange.ts";
import { getUnivariateLDE } from "./univariate-lagrange.ts";
import { Prover } from "./sum-check-prover.ts";


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
      if (!sum.equals(this.proposedSum).toBoolean())
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
      if (!sum.equals(prevPolynomialAtPrevR).toBoolean())
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
    if (!gOfR.equals(g_vOfR_v).toBoolean()) throw Error(`g(r) != g_v(r_v)`);
    
    console.log(`Sum check verification ran successfully, g_v(r_v) = ${g_vOfR_v.toString()} and g(r) = ${gOfR.toString()}`);

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
  let r_j = undefined;
  for (let j = 1; j <= v; j++) {
    const g_j = prover.getRoundJPolynomial(r_j);
    console.log(`g_${j} polynomial: ${g_j.map((e) => e.toString())}`);
      r_j = verifier.verifyRoundJPolynomial(g_j);
    console.log(
      `Verifier verified g_${j} and generated r_${j}: ${r_j.toString()}`,
    );
  }
  verifier.verifyOracleQueryOfG(prover.g);
  console.log(
    `Sum check proof has passed for polynomial g: [${g.map((e) => e.toString())}] and sum ${sum.toString()}`,
  );
})();
