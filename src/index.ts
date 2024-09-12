import Glpk from 'glpk.js'
import { readInput } from './read-input'
import { createProblem } from './create-vars'

const main = async () => {
  const data = readInput(process.argv[2])
  const glpk = Glpk()
  const problem = createProblem(data, glpk)
  const res = glpk.solve(
    {
      name: 'LP',
      objective: {
        direction: glpk.GLP_MAX,
        name: 'lucro',
        vars: problem.objective
      },
      subjectTo: problem.subjectTo,
      generals: problem.integerVars,
      binaries: problem.binaryVars
    },
    {
      msglev: glpk.GLP_MSG_ALL,
      presol: true,
      cb: {
        call: progress => console.log(progress),
        each: 1
      }
    }
  )
  return res
}

main().then(res => res !== undefined && console.log(res))
