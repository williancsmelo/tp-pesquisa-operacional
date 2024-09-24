import Glpk from 'glpk.js'
import { readInput, writeOutput } from './file-handler'
import { createProblem } from './create-vars'
import { transformResult } from './transform-result'
import minimist from 'minimist'

const main = async () => {
  const args = minimist(process.argv.slice(2), {
    alias: {
      i: ['in', 'input'],
      o: ['out', 'output']
    }
  })
  const data = readInput(args.i || args._?.[0])
  const glpk = Glpk()
  const problem = createProblem(data, glpk)
  console.log(`Solver logs ${'='.repeat(50)}\n`)
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
        call: console.log,
        each: 1
      },
      tmlim: args.t ? Number(args.t) : undefined
    }
  )
  console.log(`\nSolver finalizado ${'='.repeat(50)}`)
  console.log(`Tempo gasto: ${res.time}ms`)
  if (![glpk.GLP_OPT, glpk.GLP_FEAS].includes(res.result.status)) return 'Não foi possível encontrar uma solução viável'
  const result = transformResult(res.result, data)
  writeOutput(args.out || args._?.[1], result)
}

main().then(res => res !== undefined && console.log(res))
