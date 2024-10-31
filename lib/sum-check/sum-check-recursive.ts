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

  /**
   * Fixed entries of r to evaluate g at in the final round
   * At round v, this will be a v-dimensional vector
   */
  private r: Field[] = [];

  // point value representation of the multivariate function g: {0,1}^v -> F
  // an array of field elements corresponding to g evaluated at all points in {0,1\}^v
  // todo: Update code to represent g:F^v -> F
  g: Field[];

  /**
   * Creates an instance of the Prover.
   *
   * @param proposedSum - The sum proposed by the Prover.
   * @param g - The point-value representation of the function g
   * @param v - The number of variables in the function g
   */
  constructor(proposedSum: Field, g: Field[], v: number) {
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
    this.proposedSum = proposedSum;
  }

  private proposedSum: Field;

  // sum = the proposed sum being proven for this round
  // g_j = the univariate polynomial supplied by the prover this round
  // returns the evaluation of g_j at r_j
  roundJ(g_j: Field[]): Field {
    // verifier generates random field element r_j
    const r_j = this.getRandomFieldElement();
    this.r.push(r_j);

    // evaluate g_j at r_j
    const g_j_of_r_1 = getUnivariateLDE(g_j, r_j);

    // check that g_j(0) + g_j(1) = C
    const g_j_of_0 = getUnivariateLDE(g_j, Field(0));
    const g_j_of_1 = getUnivariateLDE(g_j, Field(1));
    if (!g_j_of_0.add(g_j_of_1).equals(this.proposedSum).toBoolean()) {
      throw Error(`Rejected sum at round ${this.r.length}\n g_j(0) + g_j(1) was ${g_j_of_0.add(g_j_of_1)}, expected proposedSum ${this.proposedSum}`);
    }

    // run oracle query if all entries in r have been fixed
    if (this.r.length === this.v) {
      const gOfR = getMultilinearLDE(this.g, this.r);
      if (!g_j_of_r_1.equals(gOfR).toBoolean()) {
        throw Error(`Rejected oracle evaluation at round ${this.r.length}`);
      }
      console.log(`Sum check verification ran successfully, g_v(r_v) = ${g_j_of_r_1.toString()} and g(r) = ${gOfR.toString()}`);
    }

    this.proposedSum = g_j_of_r_1;
    // return latest value of r for prover to fix
    return r_j;
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

  let r_j = undefined;

  // prover sends proposed sum C to verifier
  const verifier = new Verifier(sum, g, v);
  for (let j = 1; j <= v; j++) {
    const g_j = prover.getRoundJPolynomial(r_j);
    r_j = verifier.roundJ(g_j);
  }
  console.log(
    `Sum check proof has passed for polynomial g: [${g.map((e) => e.toString())}] and sum ${sum.toString()}`,
  );
  // prover sends g_1 to verifier and claims g_1 = s_1 and
  //   s_1(0) + s_1(1) = C
  // Verifier checks g_1(r_1) = s_1(r_1) for r_1 in F
  //   verifier directly evaluates g_1(r_1)
  //   prover has to propose a value for s_1(r_1) and have verifier sum check it
  //   prover implicitly proposes g_1(r_1)

  // prover sends proposed sum C to verifier
  // prover sends g_1 to verifier and claims g_1 = s_1 and
  //   s_1(0) + s_1(1) = C
  // Verifier checks g_1(r_1) = s_1(r_1) for r_1 in F
  //   verifier directly evaluates g_1(r_1)
  //   prover has to propose a value for s_1(r_1) and have verifier sum check it
  //   prover implicitly proposes g_1(r_1)
  //
  // prover sends g_2 to verifier and claims g_2 = s_2 and
  //   s_2(0) + s_2(1) = s_1(r_1)
  // Verifier checks g_2(r_2) = s_2(r_2) for r_2 in F
  //   verifier directly evaluates g_2(r_2)
  //   prover has to propose a value for s_2(r_2) and have verifier sum check it
  //   prover implicitly proposes g_2(r_2)
  //
  // prover sends g_j to verifier and claims g_j = s_j and
  //   s_j(0) + s_j(1) = s_{j-1}(r_{j-1})
  // Verifier checks g_j(r_j) = s_j(r_j) for r_j in F
  //   verifier directly evaluates g_j(r_j)
  //   prover has to propose a value for s_j(r_j) and have verifier sum check it
  //   prover implicitly proposes g_j(r_j)
  //
  // prover sends g_v to verifier and claims g_v = s_v and
  //   s_v(0) + s_v(1) = s_{v-1}(r_{v-1})
  // Verifier checks g_v(r_v) = s_v(r_v) for r_v in F
  //   verifier directly evaluates g_v(r_v)
  // Verifier detects we're in round v and requests the evaluation for g(r)
  //   verifier checks g_v(r_v) = g(r)
  //
  //
  //   prover has to propose a value for s_j(r_j) and have verifier sum check it
  //   prover implicitly proposes g_j(r_j)

  // verifier checks
})();
