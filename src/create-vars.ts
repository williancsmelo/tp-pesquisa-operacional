import { Input } from './input-validation'
import { LP, GLPK } from 'glpk.js'
import { TEMPO_POR_TURNO, RELACAO_EXPERIENTE } from './config'

type Problem = {
  objective: LP['objective']['vars']
  subjectTo: LP['subjectTo']
  integerVars?: LP['generals']
  binaryVars?: LP['binaries']
}

const pushReturn = <T>(value: T, arr: T[]): T => {
  arr.push(value)
  return value
}

export const createProblem = (data: Input, glpk: GLPK): Problem => {
  // função objetivo
  const objective = data.funcionarios.map((funcionario, id) => ({
    name: `contratado:${id}`,
    coef: -1 * funcionario.salario
  }))

  const subjectTo: Problem['subjectTo'] = []
  const binaryVars: Problem['binaryVars'] = []

  const dias = [...new Array(data.dias).keys()]

  // Mínimo de funcionários por turno
  dias.forEach(dia => {
    data.turnos.forEach((turno, idTurno) => {
      subjectTo.push({
        name: `minimoFuncionarios:${dia}:${idTurno}`,
        vars: data.funcionarios.map((_, idFuncionario) => ({
          name: pushReturn(`alocado:${idFuncionario}:${dia}:${idTurno}`, binaryVars),
          coef: 1
        })),
        bnds: { type: glpk.GLP_LO, lb: turno.minimoFuncionarios, ub: data.funcionarios.length }
      })
    })
  })

  // Máximo de tempo de trabalho por funcionário
  data.funcionarios.forEach((funcionario, idFuncionario) => {
    const vars: Problem['subjectTo'][number]['vars'] = []
    dias.forEach(dia => {
      data.turnos.forEach((_, idTurno) => {
        vars.push({
          name: `alocado:${idFuncionario}:${dia}:${idTurno}`,
          coef: TEMPO_POR_TURNO
        })
      })
    })
    vars.push({
      name: pushReturn(`contratado:${idFuncionario}`, binaryVars),
      coef: -1 * funcionario.tempoMaximo
    })
    subjectTo.push({
      name: `tempoMaximo:${idFuncionario}`,
      bnds: { type: glpk.GLP_UP, ub: 0, lb: -Infinity },
      vars
    })
  })

  //Mínimo de funcionários experientes por turno
  dias.forEach(dia => {
    data.turnos.forEach((turno, idTurno) => {
      subjectTo.push({
        name: `experiencia:${dia}:${idTurno}`,
        vars: data.funcionarios.map((funcionario, idFuncionario) => ({
          name: `alocado:${idFuncionario}:${dia}:${idTurno}`,
          coef: +funcionario.experiente
        })),
        bnds: {
          type: glpk.GLP_LO,
          ub: data.funcionarios.length,
          lb: turno.minimoFuncionarios * (RELACAO_EXPERIENTE / 100)
        }
      })
    })
  })

  return { objective, subjectTo, binaryVars }
}
